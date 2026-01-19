/**
 * Shared WebSocket manager for Genesys line status and duty messages.
 * Ensures only one WebSocket connection is used for both features.
 */

import {notify} from '@src/utils/notify';
import {getOKCSessionId} from './session';

export interface SocketMessage {
    waitingChats?: Record<string, number>;
    chatCapacity?: Record<string, { available: number; max: number }>;
    daySl?: string | number;
    serviceScheme?: number;
    lastMessage?: {
        author?: string;
        message: string;
    };
}

type MessageHandler = (data: SocketMessage) => void;
type ConnectionStatusHandler = (status: 'connected' | 'disconnected' | 'connecting' | 'reconnecting') => void;

class WebSocketManager {
    private static instance: WebSocketManager | null = null;
    private socket: WebSocket | null = null;
    private isConnected = false;
    private reconnectAttempts = 0;
    private readonly maxReconnectAttempts = 5;
    private reconnecting = false;
    private manualReconnect = false;
    private messageHandlers: Set<MessageHandler> = new Set();
    private connectionStatusHandlers: Set<ConnectionStatusHandler> = new Set();
    private phpSessionId = '';
    private successNotificationShown = false;
    private handshakeComplete = false;
    private identified = false;
    private connectionPromise: Promise<void> | null = null;

    private constructor() {
    }

    static getInstance(): WebSocketManager {
        if (!WebSocketManager.instance) {
            WebSocketManager.instance = new WebSocketManager();
        }
        return WebSocketManager.instance;
    }

    async connect(): Promise<void> {
        // If already connected, return immediately
        if (this.isConnected) return;

        // If a connection is already in progress, wait for it
        if (this.connectionPromise) {
            return this.connectionPromise;
        }

        // Create a new connection promise
        this.connectionPromise = (async () => {
            try {
                const sessionId = await getOKCSessionId();
                if (!sessionId) {
                    throw new Error('OKC Session ID not found');
                }

                this.phpSessionId = sessionId;
                this.handshakeComplete = false;
                this.identified = false;
                this.socketConnect();
            } finally {
                // Clear the connection promise when done (whether success or failure)
                // We keep it until connection is actually established (isConnected = true)
                // which happens in the message handler
                if (!this.isConnected) {
                    this.connectionPromise = null;
                }
            }
        })();

        return this.connectionPromise;
    }

    subscribe(handler: MessageHandler): () => void {
        this.messageHandlers.add(handler);
        return () => this.messageHandlers.delete(handler);
    }

    subscribeToConnectionStatus(handler: ConnectionStatusHandler): () => void {
        this.connectionStatusHandlers.add(handler);
        // Immediately call with current status
        handler(this.getConnectionStatus());
        return () => this.connectionStatusHandlers.delete(handler);
    }

    getConnectionStatus(): 'connected' | 'disconnected' | 'connecting' | 'reconnecting' {
        if (this.reconnecting) return 'reconnecting';
        if (this.isConnected && this.identified) return 'connected';
        if (this.socket) return 'connecting';
        return 'disconnected';
    }

    disconnect(): void {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
        this.isConnected = false;
        this.connectionPromise = null; // Clear connection promise on disconnect
        this.messageHandlers.clear();
        this.handshakeComplete = false;
        this.identified = false;
    }

    reconnect(): void {
        this.manualReconnect = true;
        this.socket?.close();
        this.reconnectAttempts = 0;
        this.isConnected = false;
        this.handshakeComplete = false;
        this.identified = false;
        this.notifyConnectionStatus('reconnecting');
        if (this.phpSessionId) {
            this.socketConnect();
        }
    }

    private socketConnect(): void {
        const url = 'wss://okc.ertelecom.ru/ts-line-genesys-okcdb-ws/?EIO=4&transport=websocket';
        this.socket = new WebSocket(url);

        this.notifyConnectionStatus('connecting');
        this.socket.onopen = () => {
            console.info('[Генезис] WebSocket opened, waiting for handshake...');
            this.notifyConnectionStatus('connecting');
        };
        this.socket.onmessage = (event) => this.handleMessage(event.data);
        this.socket.onclose = (event) => this.handleClose(event);
        this.socket.onerror = () => notify('Ошибка линии', 'Ошибка соединения с линией', 'error');
    }

    private handleClose(event: CloseEvent): void {
        this.isConnected = false;
        this.handshakeComplete = false;
        this.identified = false;
        console.warn(`[Генезис] WebSocket closed. Code: ${event.code}`);
        this.notifyConnectionStatus('disconnected');

        if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts && !this.manualReconnect) {
            this.attemptReconnect();
        } else if (!this.manualReconnect) {
            notify('Соединение потеряно', 'Не удалось восстановить соединение', 'error');
        }

        this.manualReconnect = false;
    }

    private handleMessage(data: string): void {
        if (data === '2') return this.socket?.send('3');
        if (data.startsWith('0{')) {
            this.socket?.send('40/ts-line-genesys-okcdb-ws,');
            this.handshakeComplete = true;
            return;
        }

        if (this.handshakeComplete && !this.identified) {
            this.socket?.send(`42/ts-line-genesys-okcdb-ws,["id","${this.phpSessionId}"]`);
            this.identified = true;
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.connectionPromise = null; // Clear the connection promise since we're now connected
            this.notifyConnectionStatus('connected');

            if (!this.successNotificationShown) {
                notify('Успешное подключение', 'Соединение с линией установлено', 'success');
                this.successNotificationShown = true;
            }
            return;
        }

        if (data.startsWith('42/ts-line-genesys-okcdb-ws,["notAuthorized"]')) {
            notify('Ошибка авторизации', 'Обновите страницу', 'error');
            this.disconnect();
            return;
        }

        if (data.startsWith('42/ts-line-genesys-okcdb-ws,["connected"]')) {
            console.info('[Генезис] Authorized and connected');
            return;
        }

        try {
            const match = data.match(/,\s*(.+)/);
            if (!match) return;

            const messageData = JSON.parse(match[1])[1] as SocketMessage;
            this.messageHandlers.forEach((handler) => handler(messageData));
        } catch {
            // Ignore parse errors for non-JSON messages
        }
    }

    private async attemptReconnect(): Promise<void> {
        if (this.reconnecting) return;

        this.reconnecting = true;
        this.reconnectAttempts++;
        this.notifyConnectionStatus('reconnecting');

        const delay = 1000 * Math.pow(2, this.reconnectAttempts);
        console.info(`[Генезис] Reconnecting in ${delay / 1000}s...`);

        await new Promise((resolve) => setTimeout(resolve, delay));

        const sessionId = await getOKCSessionId();
        if (sessionId) {
            this.reconnectAttempts = 0;
            this.phpSessionId = sessionId;
            this.socketConnect();
        }

        this.reconnecting = false;
    }

    private notifyConnectionStatus(status: 'connected' | 'disconnected' | 'connecting' | 'reconnecting'): void {
        this.connectionStatusHandlers.forEach((handler) => handler(status));
    }
}

export const websocketManager = WebSocketManager.getInstance();
