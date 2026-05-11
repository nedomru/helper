import {getAuthState} from '@src/utils/auth';

export interface ClientContext {
    agreement?: string;
    phone?: string;
    fio?: string;
    ip?: string;
    mac?: string;
    updatedAt?: number;
}

const CONTEXT_KEY = 'helper_client_context';
const CONTEXT_TTL_MS = 15 * 60 * 1000;

export const SUPPORTED_PLACEHOLDERS: {key: string; description: string}[] = [
    {key: 'дата', description: 'Текущая дата (DD.MM.YYYY)'},
    {key: 'время', description: 'Текущее время (HH:MM)'},
    {key: 'оператор', description: 'Имя оператора (из профиля)'},
    {key: 'договор', description: 'Номер договора открытого клиента'},
    {key: 'телефон', description: 'Номер телефона клиента'},
    {key: 'фио', description: 'ФИО клиента'},
    {key: 'ip', description: 'IP-адрес активной сессии'},
    {key: 'mac', description: 'MAC-адрес активной сессии'},
];

export async function saveClientContext(partial: Partial<ClientContext>): Promise<void> {
    const stored = await chrome.storage.local.get(CONTEXT_KEY);
    const existing = (stored[CONTEXT_KEY] as ClientContext | undefined) ?? {};
    const merged: ClientContext = {...existing, ...partial, updatedAt: Date.now()};
    await chrome.storage.local.set({[CONTEXT_KEY]: merged});
}

export async function clearClientContext(): Promise<void> {
    await chrome.storage.local.remove(CONTEXT_KEY);
}

export async function getClientContext(): Promise<ClientContext | null> {
    const stored = await chrome.storage.local.get(CONTEXT_KEY);
    const ctx = stored[CONTEXT_KEY] as ClientContext | undefined;
    if (!ctx) return null;
    if (ctx.updatedAt && Date.now() - ctx.updatedAt > CONTEXT_TTL_MS) return null;
    return ctx;
}

function pad2(n: number): string {
    return n.toString().padStart(2, '0');
}

interface PlaceholderValueContext {
    client: ClientContext | null;
    operatorFirstName?: string;
    operatorLastName?: string;
    now: Date;
}

function buildValues(ctx: PlaceholderValueContext): Record<string, string> {
    const {now, client, operatorFirstName, operatorLastName} = ctx;
    return {
        'дата': `${pad2(now.getDate())}.${pad2(now.getMonth() + 1)}.${now.getFullYear()}`,
        'время': `${pad2(now.getHours())}:${pad2(now.getMinutes())}`,
        'оператор': [operatorFirstName, operatorLastName].filter(Boolean).join(' '),
        'договор': client?.agreement ?? '',
        'телефон': client?.phone ?? '',
        'фио': client?.fio ?? '',
        'ip': client?.ip ?? '',
        'mac': client?.mac ?? '',
    };
}

const PLACEHOLDER_REGEX = /\{([а-яА-Яa-zA-Z_]+)\}/g;

export function applyPlaceholderValues(text: string, values: Record<string, string>): string {
    if (!text.includes('{')) return text;
    return text.replace(PLACEHOLDER_REGEX, (match, key: string) => {
        const lowered = key.toLowerCase();
        const value = values[lowered];
        return value && value.length > 0 ? value : match;
    });
}

export async function applyPlaceholders(text: string): Promise<string> {
    if (!text.includes('{')) return text;
    const [client, authState] = await Promise.all([getClientContext(), getAuthState()]);
    return applyPlaceholderValues(
        text,
        buildValues({
            now: new Date(),
            client,
            operatorFirstName: authState?.user?.first_name,
            operatorLastName: authState?.user?.last_name,
        }),
    );
}
