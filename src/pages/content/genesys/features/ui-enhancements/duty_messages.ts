/**
 * Duty messages notification feature for Genesys.
 * Shows notifications for new duty messages via WebSocket.
 */

import {notify} from '@src/utils/notify';
import {websocketManager} from './websocket-manager';

let lastMessage: string | null = null;

export async function showDutyMessages(): Promise<void> {
    await websocketManager.connect();
    websocketManager.subscribe(handleMessage);
}

function handleMessage(data: { lastMessage?: { author?: string; message: string } }): void {
    const lastMsg = data.lastMessage;
    if (!lastMsg?.message || lastMsg.message === lastMessage) return;

    const author = lastMsg.author || 'Unknown';
    const stripped = lastMsg.message.replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n').replace(/<p>/gi, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

    notify({title: `👮‍♂️ ${author}`, message: stripped, type: 'info', duration: 10000, position: 'bottom-right'});
    lastMessage = lastMsg.message;
}