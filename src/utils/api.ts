import type {MeResponse} from '@src/shared/types/auth';

const API_BASE_URL = 'https://helper.chrsnv.ru';

interface MNAProvider {
    name: string;
    link: string;
    authorization: string;
    connection: string;
}

interface MNAData {
    mna: MNAProvider[];
}

interface Router {
    Name: string;
    PPPoE: string | string[];
    DHCP: string | string[];
    IPoE: string | string[];
    Channels: string | string[];
    Settings: string;
    KnowledgeBase: string | string[];
    Emulator: string | string[];
}

interface RoutersData {
    routers: Router[];
}

export type {MNAProvider, MNAData, Router, RoutersData};

interface SendMessageRequest {
    encryptedMessage: string;  // RSA-encrypted, base64-encoded
    parseMode?: 'Markdown' | 'MarkdownV2' | 'HTML';
}

interface SendMessageResponse {
    success: boolean;
    error?: string;
    data?: unknown;
}

export type {SendMessageRequest, SendMessageResponse};

export async function fetchFromAPI<T>(url: string): Promise<T> {
    try {
        const response = await fetch(url, {
            method: "GET",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`Error fetching from ${url}:`, error);
        throw error;
    }
}

export async function fetchMNAData(): Promise<MNAData> {
    return fetchFromAPI<MNAData>("https://helper.chrsnv.ru/api/mna.json");
}

export async function fetchRoutersData(): Promise<RoutersData> {
    return fetchFromAPI<RoutersData>("https://helper.chrsnv.ru/api/routers.json");
}

/**
 * Gets the access token from chrome.storage.local
 */
async function getAccessToken(): Promise<string | null> {
    return new Promise((resolve) => {
        chrome.storage.local.get(['auth_state'], (result) => {
            const state = result.auth_state as { accessToken?: string } | undefined;
            resolve(state?.accessToken ?? null);
        });
    });
}

/**
 * Fetches user settings from the /me endpoint
 * @returns The user settings or null if not authenticated/error
 */
export async function fetchUserSettings(): Promise<Record<string, unknown> | null> {
    try {
        const token = await getAccessToken();
        if (!token) {
            console.debug('[API] No access token found');
            return null;
        }

        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
            headers: {Authorization: `Bearer ${token}`},
        });

        if (!response.ok) {
            if (response.status === 401) {
                console.debug('[API] Token expired or invalid');
                await clearAuthState();
            }
            return null;
        }

        const result: MeResponse = await response.json();

        if (!result.success || !result.data?.user.access) {
            console.debug('[API] User does not have access');
            return null;
        }

        const settings = result.data.user.settings ?? {};
        console.log('[API] Loaded user settings:', settings);

        return settings;
    } catch (error) {
        console.error('[API] Error fetching settings:', error);
        return null;
    }
}

/**
 * Updates user settings on the backend
 * @param settings - The settings object to update
 * @returns true if successful, false otherwise
 */
export async function updateUserSettingsAPI(settings: Record<string, unknown>): Promise<boolean> {
    try {
        const token = await getAccessToken();
        if (!token) {
            console.error('[API] No access token found');
            return false;
        }

        const response = await fetch(`${API_BASE_URL}/api/auth/settings`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({settings}),
        });

        if (!response.ok) {
            console.error('[API] Failed to update settings:', response.status, response.statusText);
            return false;
        }

        console.log('[API] Settings updated successfully');
        return true;
    } catch (error) {
        console.error('[API] Error updating settings:', error);
        return false;
    }
}

let cachedPublicKey: string | null = null;
let cachedCryptoKey: CryptoKey | null = null;

async function getPublicKey(): Promise<string> {
    if (cachedPublicKey) return cachedPublicKey;

    const response = await fetch(`${API_BASE_URL}/api/public-key.json`);
    const data = await response.json() as { publicKey: string };

    if (!data.publicKey) throw new Error('Failed to fetch public key');

    cachedPublicKey = data.publicKey.replace(/\\n/g, '\n');
    return cachedPublicKey;
}

async function importPublicKey(pem: string): Promise<CryptoKey> {
    if (cachedCryptoKey) return cachedCryptoKey;

    const pemContents = pem
        .replace('-----BEGIN PUBLIC KEY-----', '')
        .replace('-----END PUBLIC KEY-----', '')
        .replace(/\s/g, '');

    const binaryDerString = atob(pemContents);
    const binaryDer = new Uint8Array(binaryDerString.length);
    for (let i = 0; i < binaryDerString.length; i++) {
        binaryDer[i] = binaryDerString.charCodeAt(i);
    }

    cachedCryptoKey = await window.crypto.subtle.importKey(
        'spki',
        binaryDer,
        {name: 'RSA-OAEP', hash: 'SHA-256'},
        false,
        ['encrypt']
    );

    return cachedCryptoKey;
}

async function encryptWithRSA(message: string): Promise<string> {
    const pem = await getPublicKey();
    const key = await importPublicKey(pem);

    const encrypted = await window.crypto.subtle.encrypt(
        {name: 'RSA-OAEP'},
        key,
        new TextEncoder().encode(message)
    );

    const encryptedArray = Array.from(new Uint8Array(encrypted));
    return btoa(String.fromCharCode.apply(null, encryptedArray));
}

/**
 * Send a message to the authenticated user's Telegram
 * @param params - The message parameters
 * @returns Promise with the response data
 */
export async function sendTelegramMessage(
    params: { message: string; parseMode?: 'Markdown' | 'MarkdownV2' | 'HTML' }
): Promise<SendMessageResponse> {
    try {
        const accessToken = await getAccessToken();
        if (!accessToken) {
            return {success: false, error: 'Not authenticated'};
        }

        // Encrypt the message with RSA
        const encryptedMessage = await encryptWithRSA(params.message);

        const body: Record<string, string> = {
            encryptedMessage,
        };

        if (params.parseMode) {
            body.parseMode = params.parseMode;
        }

        const response = await fetch(`${API_BASE_URL}/api/send.json`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            return {success: false, error: `HTTP error! status: ${response.status}`};
        }

        return await response.json();
    } catch (error) {
        console.error('[API] Error sending Telegram message:', error);
        return {success: false, error: error instanceof Error ? error.message : 'Unknown error'};
    }
}

/**
 * Clears the auth state from storage
 */
async function clearAuthState(): Promise<void> {
    return new Promise((resolve) => {
        chrome.storage.local.remove(['auth_state'], resolve);
    });
}
