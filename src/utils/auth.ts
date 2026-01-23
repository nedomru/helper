/**
 * Authentication utility functions
 * Handles session creation, status polling, and token management
 */

import type {
    AuthSession,
    AuthState,
    CompleteResponse,
    MeResponse,
    SessionResponse,
    SessionStatus,
    StatusResponse,
    TelegramUser,
} from '@src/shared/types/auth';

const API_BASE_URL = 'https://helper.chrsnv.ru';
const STORAGE_KEY = 'auth_state';
const POLL_INTERVAL = 5000;

export async function getAuthState(): Promise<AuthState | null> {
    return new Promise((resolve) => {
        chrome.storage.local.get([STORAGE_KEY], (result) => {
            resolve((result[STORAGE_KEY] as AuthState) || null);
        });
    });
}

export async function saveAuthState(state: Partial<AuthState>): Promise<void> {
    return new Promise((resolve) => {
        chrome.storage.local.set({[STORAGE_KEY]: state}, () => resolve());
    });
}

export async function clearAuthState(): Promise<void> {
    return new Promise((resolve) => {
        chrome.storage.local.remove([STORAGE_KEY], resolve);
    });
}

export async function isAuthenticated(): Promise<boolean> {
    const state = await getAuthState();
    if (!(state?.accessToken && state?.user)) {
        return false;
    }

    // Verify user still has access
    try {
        const meData = await getMe();
        console.log('[Auth] User access check:', meData.data?.user);

        if (!meData.data?.user.access) {
            console.log('[Auth] Access denied, clearing session');
            await clearAuthState();
            throw new Error('ACCESS_DENIED');
        }

        console.log('[Auth] Access granted, updating settings:', meData.data.user.settings);

        // Update state with latest settings
        await saveAuthState({
            ...state,
            user: {
                ...state.user,
                access: meData.data.user.access,
                settings: meData.data.user.settings,
            },
        });
        return true;
    } catch (err) {
        if (err instanceof Error && err.message === 'ACCESS_DENIED') {
            throw err; // Re-throw ACCESS_DENIED to be caught by UI
        }
        console.error('[Auth] Error checking access:', err);
        await clearAuthState();
        return false;
    }
}

export async function getAccessToken(): Promise<string | null> {
    const state = await getAuthState();
    return state?.accessToken || null;
}

export async function createSession(): Promise<AuthSession> {
    const response = await fetch(`${API_BASE_URL}/api/auth/session`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({}),
    });

    const result: SessionResponse = await response.json();

    if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to create session');
    }

    const session: AuthSession = {
        sessionId: result.data.sessionId,
        status: 'pending',
        botLink: result.data.botLink,
        createdAt: Date.now(),
        expiresAt: Date.now() + result.data.expiresIn * 1000,
    };

    await saveAuthState(session);
    return session;
}

export function pollSessionStatus(
    sessionId: string,
    onStatusChange: (status: SessionStatus, user?: TelegramUser) => void,
    onComplete?: () => void
): () => void {
    const intervalId = setInterval(async () => {
        try {
            const status = await getSessionStatus(sessionId);

            if (status.status === 'authorized') {
                onStatusChange('authorized', status.user);
                clearInterval(intervalId);
                onComplete?.();
            } else if (status.status === 'expired' || status.status === 'consumed') {
                onStatusChange(status.status);
                clearInterval(intervalId);
                onComplete?.();
            } else {
                onStatusChange(status.status);
            }
        } catch (error) {
            console.error('Error polling session status:', error);
        }
    }, POLL_INTERVAL);

    return () => clearInterval(intervalId);
}

async function getSessionStatus(sessionId: string): Promise<{
    status: SessionStatus;
    user?: TelegramUser;
}> {
    const response = await fetch(`${API_BASE_URL}/api/auth/status?sessionId=${sessionId}`);
    const result: StatusResponse = await response.json();

    if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to get session status');
    }

    return {status: result.data.status, user: result.data.user};
}

export {getSessionStatus};

export async function completeAuthentication(sessionId: string): Promise<AuthState> {
    const response = await fetch(`${API_BASE_URL}/api/auth/complete`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({sessionId}),
    });

    const result: CompleteResponse = await response.json();

    if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to complete authentication');
    }

    const authState: AuthState = {
        sessionId,
        status: 'authorized',
        accessToken: result.data.accessToken,
        refreshToken: result.data.refreshToken,
        expiresIn: result.data.expiresIn,
        user: result.data.user,
        createdAt: Date.now(),
        expiresAt: Date.now() + result.data.expiresIn * 1000,
    };

    await saveAuthState(authState);

    // Fetch user profile to check access and get settings
    console.log('[Auth] Checking access after login...');
    const meData = await getMe();
    console.log('[Auth] User data from /me:', meData.data?.user);

    if (!meData.data?.user.access) {
        console.log('[Auth] Access denied after login');
        await clearAuthState();
        throw new Error('ACCESS_DENIED');
    }

    console.log('[Auth] Access granted, settings:', meData.data.user.settings);

    // Update auth state with user settings
    const updatedState: AuthState = {
        ...authState,
        user: {
            ...result.data.user,
            access: meData.data.user.access,
            settings: meData.data.user.settings,
        },
    };

    await saveAuthState(updatedState);
    return updatedState;
}

export async function getMe(): Promise<MeResponse> {
    const token = await getAccessToken();

    if (!token) {
        throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: {Authorization: `Bearer ${token}`},
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch user profile: ${response.status}`);
    }

    return response.json();
}

export async function logout(): Promise<void> {
    await clearAuthState();
}

export async function authenticatedFetch<T>(url: string, options?: RequestInit): Promise<T> {
    const token = await getAccessToken();

    if (!token) {
        throw new Error('Not authenticated');
    }

    const response = await fetch(url, {
        ...options,
        headers: {...options?.headers, Authorization: `Bearer ${token}`},
    });

    if (response.status === 401) {
        await logout();
        throw new Error('Token expired');
    }

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
}

function isSessionExpired(expiresAt: number | undefined): boolean {
    if (!expiresAt) return true;
    // 30 second buffer for network delays
    return Date.now() > expiresAt - 30000;
}

async function getExistingSession(): Promise<AuthSession | null> {
    const state = await getAuthState();

    if (state?.accessToken && state.user && !isSessionExpired(state.expiresAt)) {
        return state;
    }

    if (state?.accessToken && state.user) {
        await clearAuthState();
    }

    if (state?.status === 'pending' && !isSessionExpired(state.expiresAt)) {
        return state;
    }

    if (state?.status === 'pending') {
        await clearAuthState();
    }

    return null;
}

export async function initializeAuth(): Promise<AuthSession | null> {
    return getExistingSession();
}
