/**
 * Shared WebSocket manager for Genesys line status and duty messages.
 */

import {notify} from '@src/utils/notify';
import {extractSessionId, getOKCSessionId} from './session';

const WS_URL = 'wss://okc.ertelecom.ru/ts-line-genesys-okcdb-ws/?EIO=4&transport=websocket';
const NAMESPACE = 'ts-line-genesys-okcdb-ws';
const MAX_RECONNECT_ATTEMPTS = 5;

export interface SocketMessage {
    waitingChats?: Record<string, number>;
    chatCapacity?: Record<string, { available: number; max: number }>;
    daySl?: string | number;
    serviceScheme?: number;
}

type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'reconnecting';
type MessageHandler = (data: SocketMessage) => void;
type StatusHandler = (status: ConnectionStatus) => void;

class WebSocketManager {
    private static instance: WebSocketManager | null = null;
    private socket: WebSocket | null = null;
    private state = {
        connected: false,
        reconnecting: false,
        handshakeComplete: false,
        idSent: false,
        identified: false
    };
    private reconnectAttempts = 0;
    private phpSessionId = '';
    private successNotified = false;
    private manualReconnect = false;
    private connectionPromise: Promise<void> | null = null;
    private readonly messageHandlers = new Set<MessageHandler>();
    private readonly statusHandlers = new Set<StatusHandler>();

    private constructor() {
    }

    static getInstance(): WebSocketManager {
        return WebSocketManager.instance ??= new WebSocketManager();
    }

    async connect(): Promise<void> {
        if (this.state.connected) return;
        if (this.connectionPromise) return this.connectionPromise;

        this.connectionPromise = (async () => {
            const sessionId = await getOKCSessionId();
            if (!sessionId) throw new Error('OKC Session ID not found');

            this.phpSessionId = sessionId;
            this.resetConnectionState();
            this.socketConnect();
        })();

        return this.connectionPromise;
    }

    subscribe(handler: MessageHandler): () => void {
        this.messageHandlers.add(handler);
        return () => this.messageHandlers.delete(handler);
    }

    subscribeToStatus(handler: StatusHandler): () => void {
        this.statusHandlers.add(handler);
        handler(this.getStatus());
        return () => this.statusHandlers.delete(handler);
    }

    getStatus(): ConnectionStatus {
        if (this.state.reconnecting) return 'reconnecting';
        if (this.state.connected && this.state.identified) return 'connected';
        if (this.socket) return 'connecting';
        return 'disconnected';
    }

    disconnect(): void {
        this.socket?.close();
        this.socket = null;
        this.state.connected = false;
        this.connectionPromise = null;
        this.messageHandlers.clear();
        this.resetConnectionState();
    }

    reconnect(): void {
        this.manualReconnect = true;
        this.socket?.close();
        this.reconnectAttempts = 0;
        this.resetConnectionState();
        this.notifyStatus('reconnecting');
        if (this.phpSessionId) this.socketConnect();
    }

    private resetConnectionState(): void {
        this.state.handshakeComplete = false;
        this.state.idSent = false;
        this.state.identified = false;
    }

    private socketConnect(): void {
        this.socket = new WebSocket(WS_URL);
        this.notifyStatus('connecting');

        this.socket.onopen = () => console.info('[Генезис] WebSocket opened');
        this.socket.onmessage = (e) => this.handleMessage(e.data);
        this.socket.onclose = (e) => this.handleClose(e);
        this.socket.onerror = () => notify('Ошибка линии', 'Ошибка соединения с линией', 'error');
    }

    private handleClose(event: CloseEvent): void {
        this.state.connected = false;
        this.resetConnectionState();
        console.warn(`[Генезис] WebSocket closed. Code: ${event.code}`);
        this.notifyStatus('disconnected');

        if (!event.wasClean && this.reconnectAttempts < MAX_RECONNECT_ATTEMPTS && !this.manualReconnect) {
            this.scheduleReconnect();
        } else if (!this.manualReconnect) {
            notify('Соединение потеряно', 'Не удалось восстановить соединение', 'error');
        }

        this.manualReconnect = false;
    }

    private handleMessage(data: string): void {
        if (data === '2') return this.socket?.send('3'); // Ping/pong
        if (data.startsWith('0{')) return this.sendNamespaceConnect(); // Handshake

        const msg = data.match(new RegExp(`42/${NAMESPACE},(.+)`))?.[1];
        if (!msg) return;

        try {
            const payload = JSON.parse(msg);
            const [event, eventData] = payload as [string, unknown];

            switch (event) {
                case 'connected':
                    this.handleConnected();
                    break;
                case 'notAuthorized':
                    this.handleNotAuthorized();
                    break;
                case 'authData':
                    this.handleAuthData();
                    break;
                default:
                    this.handleDataMessage(eventData);
            }
        } catch {
            // Ignore parse errors
        }
    }

    private sendNamespaceConnect(): void {
        this.socket?.send(`40/${NAMESPACE},`);
        this.state.handshakeComplete = true;
    }

    private sendIdentification(): void {
        console.info('[Генезис] Namespace connected, sending identification...');
        this.socket?.send(`42/${NAMESPACE},["id","${this.phpSessionId}"]`);
        this.state.idSent = true;
    }

    private handleConnected(): void {
        if (this.state.handshakeComplete && !this.state.idSent) {
            this.sendIdentification();
        }
    }

    private handleNotAuthorized(): void {
        console.error('[Генезис] Authorization failed, attempting to refresh session...');
        this.socket?.close();
        this.state.connected = false;
        this.resetConnectionState();

        (async () => {
            const freshSessionId = await extractSessionId();
            if (freshSessionId && freshSessionId !== this.phpSessionId) {
                console.info('[Генезис] Got fresh session ID, reconnecting...');
                this.phpSessionId = freshSessionId;
                this.socketConnect();
            } else {
                console.error('[Генезис] Could not get fresh session');
                notify('Ошибка авторизации', 'Обновите страницу', 'error');
            }
        })();
    }

    private handleAuthData(): void {
        if (!this.state.identified) {
            console.info('[Генезис] Authorized and connected');
            this.state.identified = true;
            this.state.connected = true;
            this.reconnectAttempts = 0;
            this.connectionPromise = null;
            this.notifyStatus('connected');

            if (!this.successNotified) {
                notify('Успешное подключение', 'Соединение с линией установлено', 'success');
                this.successNotified = true;
            }
        }
    }

    private handleDataMessage(data: unknown): void {
        const messageData = data as SocketMessage;
        this.messageHandlers.forEach((h) => h(messageData));
    }

    private async scheduleReconnect(): Promise<void> {
        if (this.state.reconnecting) return;

        this.state.reconnecting = true;
        this.reconnectAttempts++;
        this.notifyStatus('reconnecting');

        const delay = 1000 * Math.pow(2, this.reconnectAttempts);
        console.info(`[Генезис] Reconnecting in ${delay / 1000}s...`);

        await new Promise((r) => setTimeout(r, delay));

        const sessionId = await getOKCSessionId();
        if (sessionId) {
            this.reconnectAttempts = 0;
            this.phpSessionId = sessionId;
            this.socketConnect();
        }

        this.state.reconnecting = false;
    }

    private notifyStatus(status: ConnectionStatus): void {
        this.statusHandlers.forEach((h) => h(status));
    }
}

export const websocketManager = WebSocketManager.getInstance();
