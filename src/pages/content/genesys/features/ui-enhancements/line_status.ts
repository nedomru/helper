/**
 * Line status display feature for Genesys.
 * Shows real-time chat capacity and queue information via WebSocket.
 */

import {type SocketMessage, websocketManager} from './websocket-manager';

const LEVELS = [1, 2, 3];
const ANIMATION_DURATION = 500;

// Singleton flag to prevent multiple initializations
let isInitialized = false;

// Store previous values for smooth transitions
const previousValues = new Map<string, number>();

// Store current connection status
let currentConnectionStatus: 'connected' | 'disconnected' | 'connecting' | 'reconnecting' = 'connecting';

export async function showLineStatus(): Promise<void> {
    // Prevent multiple initializations
    if (isInitialized) return;
    isInitialized = true;
    await addLineStatusDiv();
    await websocketManager.connect();
    websocketManager.subscribe(updateLineStatus);
    websocketManager.subscribeToConnectionStatus(updateConnectionStatus);
}

function updateConnectionStatus(status: 'connected' | 'disconnected' | 'connecting' | 'reconnecting'): void {
    currentConnectionStatus = status;

    const indicator = document.querySelector<HTMLSpanElement>(`#connection-status-indicator`);
    if (!indicator) return;

    const statusConfig = {
        connected: {color: '#51cf66', icon: '●'},
        disconnected: {color: '#ff6b6b', icon: '●'},
        connecting: {color: '#ffd43b', icon: '◐'},
        reconnecting: {color: '#ffa94d', icon: '↻'}
    };

    const config = statusConfig[status];
    indicator.innerHTML = `<span style="color:${config.color};animation:pulse 2s infinite;">${config.icon}</span>`;
}

function updateLineStatus(data: SocketMessage): void {
    const lineStatusDiv = document.querySelector<HTMLDivElement>(`#line-status`);
    if (!lineStatusDiv || !data.waitingChats || !data.chatCapacity) return;

    const {waitingChats, chatCapacity, daySl, serviceScheme} = data;

    const statusParts = LEVELS.map((level) => {
        const levelKey = `lvl${level}`;
        const waiting = waitingChats[levelKey] ?? 0;
        const capacity = chatCapacity[levelKey];
        if (!capacity) return null;

        const color = waiting > 0 ? '#ff6b6b' : '#51cf66';
        const prevWaiting = previousValues.get(levelKey) ?? 0;
        const waitingChanged = waiting !== prevWaiting;

        // Animate waiting number if it changed
        if (waitingChanged) {
            animateValue(lineStatusDiv, levelKey, prevWaiting, waiting);
            previousValues.set(levelKey, waiting);
        }

        const icon = `<span style="display:inline-flex;justify-content:center;align-items:center;width:22px;height:22px;background:${color};border-radius:50%;margin-right:8px;font-size:11px;font-weight:bold;color:white;transition:all 0.3s ease;">${level}</span>`;

        const queueDisplay = waiting > 0
            ? ` <span class="waiting-chats" data-level="${levelKey}" style="color:#ff6b6b;font-weight:bold;${waitingChanged ? 'animation:highlight 0.5s ease;' : ''}">⏳ ${waiting}</span>`
            : '';

        return {
            html: `${icon}<span class="capacity-text">${capacity.available}/${capacity.max}</span>${queueDisplay}`,
            waiting
        };
    }).filter(Boolean);

    const sl = daySl ?? 'N/A';
    const slColor = sl === 'N/A' ? '#868e96' : (typeof sl === 'number' ? sl : parseFloat(sl)) >= 80 ? '#51cf66' : '#ff6b6b';
    const hasQueue = statusParts.some((p) => p && p.waiting > 0);

    const container = lineStatusDiv.parentElement;
    if (container) {
        container.style.backgroundColor = hasQueue ? 'rgba(108, 46, 46, 0.95)' : 'rgba(52, 64, 75, 0.95)';
        container.style.borderColor = hasQueue ? 'rgba(255, 107, 107, 0.8)' : 'rgba(148, 148, 148, 0.6)';
        container.style.background = hasQueue
            ? 'linear-gradient(135deg, rgba(108, 46, 46, 0.95) 0%, rgba(75, 32, 32, 0.95) 100%)'
            : 'linear-gradient(135deg, rgba(52, 64, 75, 0.95) 0%, rgba(40, 48, 58, 0.95) 100%)';
    }

    const statusConfig = {
        connected: {color: '#51cf66', icon: '●'},
        disconnected: {color: '#ff6b6b', icon: '●'},
        connecting: {color: '#ffd43b', icon: '◐'},
        reconnecting: {color: '#ffa94d', icon: '↻'}
    };
    const connectionConfig = statusConfig[currentConnectionStatus];

    lineStatusDiv.innerHTML = `
        <div class="line-content" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <span id="connection-status-indicator" style="font-size:12px;"><span style="color:${connectionConfig.color};animation:pulse 2s infinite;">${connectionConfig.icon}</span></span>
            ${statusParts.map((p) => p?.html).join('<span style="color:#868e96;margin:0 5px;">|</span>')}
            <span style="color:#868e96;margin:0 5px;">|</span>
            <span style="color:${slColor};font-weight:bold;">SL: ${sl}%</span>
            <span style="font-size:16px;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.3));">${serviceScheme === 1 ? '⛱️' : '🔥'}</span>
        </div>
    `;
}

function animateValue(container: HTMLElement, key: string, from: number, to: number): void {
    const startTime = performance.now();
    const duration = ANIMATION_DURATION;

    function animate(currentTime: number): void {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // Ease out cubic
        const current = Math.round(from + (to - from) * eased);

        const element = container.querySelector(`[data-level="${key}"]`);
        if (element) {
            element.textContent = `⏳ ${current}`;
        }

        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    }

    requestAnimationFrame(animate);
}

async function addLineStatusDiv(): Promise<void> {
    if (document.querySelector(`#line-status`)) return;

    const observer = new MutationObserver(() => {
        const title = document.querySelector('.title');
        if (!title) return;

        const container = document.createElement('div');
        Object.assign(container.style, {
            padding: '3px',
            margin: '5px',
            fontSize: '14px',
            fontFamily: 'system-ui,-apple-system,sans-serif',
            border: '2px solid rgba(148, 148, 148, 0.6)',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(52, 64, 75, 0.95) 0%, rgba(40, 48, 58, 0.95) 100%)',
            color: 'white',
            cursor: 'pointer',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            position: 'relative',
            overflow: 'hidden'
        });

        container.classList.add('helper-line-status');

        // Add CSS animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }
            @keyframes highlight {
                0% { transform: scale(1); }
                50% { transform: scale(1.1); }
                100% { transform: scale(1); }
            }
            @keyframes fadeInOut {
                0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                20% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
            }
            .helper-line-status::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
                transition: left 0.5s;
            }
            .helper-line-status:hover::before {
                left: 100%;
            }
        `;
        document.head.appendChild(style);

        const statusDiv = document.createElement('div');
        statusDiv.id = "line-status";
        statusDiv.style.cssText = 'pointer-events:none;line-height:1.4;';

        const statusConfig = {
            connected: {color: '#51cf66', icon: '●'},
            disconnected: {color: '#ff6b6b', icon: '●'},
            connecting: {color: '#ffd43b', icon: '◐'},
            reconnecting: {color: '#ffa94d', icon: '↻'}
        };
        const connectionConfig = statusConfig[currentConnectionStatus];

        statusDiv.innerHTML = `<div style="display:flex;align-items:center;gap:10px;"><span id="connection-status-indicator" style="font-size:12px;"><span style="color:${connectionConfig.color};animation:pulse 2s infinite;">${connectionConfig.icon}</span></span><span style="color:#868e96;">🔄 Загрузка статуса...</span></div>`;

        container.appendChild(statusDiv);

        container.onmouseover = () => {
            container.style.transform = 'translateY(-2px) scale(1.01)';
            container.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15)';
            container.style.borderColor = 'rgba(108, 123, 127, 0.8)';
        };

        container.onmouseout = () => {
            container.style.transform = 'translateY(0) scale(1)';
            container.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
            container.style.borderColor = 'rgba(148, 148, 148, 0.6)';
        };

        container.onclick = () => {
            container.style.transform = 'scale(0.95)';
            container.style.opacity = '0.8';

            // Show visual feedback
            const feedback = document.createElement('div');
            feedback.textContent = '⟳ Переподключение...';
            feedback.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 0, 0, 0.9);
                color: white;
                padding: 8px 16px;
                border-radius: 6px;
                font-size: 12px;
                z-index: 1000;
                animation: fadeInOut 1s ease forwards;
            `;
            container.appendChild(feedback);

            setTimeout(() => {
                container.style.transform = '';
                container.style.opacity = '1';
                feedback.remove();
            }, 500);

            websocketManager.reconnect();
        };

        title.parentNode?.insertBefore(container, title.nextSibling);
        observer.disconnect();
    });

    observer.observe(document.body, {childList: true, subtree: true});
}