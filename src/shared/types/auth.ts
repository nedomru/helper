/**
 * Authentication types for extension authorization system
 */

export interface TelegramUser {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    language_code?: string;
}

export type SessionStatus = 'pending' | 'authorized' | 'expired' | 'consumed';

export interface AuthSession {
    sessionId: string;
    status: SessionStatus;
    botLink?: string;
    createdAt?: number;
    expiresAt?: number;
    user?: TelegramUser;
}

export interface AuthorizedAuthSession extends AuthSession {
    status: 'authorized';
    user: TelegramUser;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    user: TelegramUser;
}

export type AuthState = AuthSession & AuthTokens;

export interface SessionResponse {
    success: boolean;
    data?: {
        sessionId: string;
        botLink: string;
        expiresIn: number;
    };
    error?: string;
}

export interface StatusResponse {
    success: boolean;
    data?: {
        status: SessionStatus;
        createdAt: number;
        expiresAt: number;
        user?: TelegramUser;
    };
    error?: string;
}

export interface CompleteResponse {
    success: boolean;
    data?: AuthTokens;
    error?: string;
}

export interface MeResponse {
    success: boolean;
    data?: {
        telegramId: string;
        sessionId: string;
        issuedAt: string;
        expiresAt: string;
    };
    error?: string;
}
