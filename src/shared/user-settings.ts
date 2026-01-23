/**
 * User settings utilities for content scripts
 * Handles fetching user settings from the /me endpoint
 */

import type {MeResponse} from '@src/shared/types/auth';

const API_BASE_URL = 'https://helper.chrsnv.ru';
const SETTINGS_CACHE_KEY = 'user_settings_cache';
const SETTINGS_CACHE_TTL = 60 * 1000; // 1 minute
const AUTH_STATE_KEY = 'auth_state';

interface CachedSettings {
    data: Record<string, unknown>;
    timestamp: number;
}

/**
 * Gets the access token from chrome.storage.local
 */
async function getAccessToken(): Promise<string | null> {
    return new Promise((resolve) => {
        chrome.storage.local.get([AUTH_STATE_KEY], (result) => {
            const state = result[AUTH_STATE_KEY] as { accessToken?: string } | undefined;
            resolve(state?.accessToken ?? null);
        });
    });
}

/**
 * Fetches user settings from the /me endpoint
 */
export async function getUserSettings(): Promise<Record<string, unknown> | null> {
    try {
        const token = await getAccessToken();
        if (!token) {
            console.debug('[UserSettings] No access token found');
            return null;
        }

        // Check cache first
        const cached = await getCachedSettings();
        if (cached) {
            console.debug('[UserSettings] Using cached settings');
            return cached;
        }

        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
            headers: {Authorization: `Bearer ${token}`},
        });

        if (!response.ok) {
            if (response.status === 401) {
                console.debug('[UserSettings] Token expired or invalid');
                await clearAuthState();
            }
            return null;
        }

        const result: MeResponse = await response.json();

        if (!result.success || !result.data?.user.access) {
            console.debug('[UserSettings] User does not have access');
            return null;
        }

        const settings = result.data.user.settings ?? {};
        console.log('[UserSettings] Loaded user settings:', settings);

        await cacheSettings(settings);
        return settings;
    } catch (error) {
        console.error('[UserSettings] Error fetching settings:', error);
        return null;
    }
}

/**
 * Gets cached settings if they're still valid
 */
async function getCachedSettings(): Promise<Record<string, unknown> | null> {
    return new Promise((resolve) => {
        chrome.storage.local.get([SETTINGS_CACHE_KEY], (result) => {
            const cached = result[SETTINGS_CACHE_KEY] as CachedSettings | undefined;

            if (!cached) {
                resolve(null);
                return;
            }

            const now = Date.now();
            if (now - cached.timestamp > SETTINGS_CACHE_TTL) {
                chrome.storage.local.remove([SETTINGS_CACHE_KEY]);
                resolve(null);
                return;
            }

            resolve(cached.data);
        });
    });
}

/**
 * Caches user settings with a timestamp
 */
async function cacheSettings(settings: Record<string, unknown>): Promise<void> {
    return new Promise((resolve) => {
        const cached: CachedSettings = {
            data: settings,
            timestamp: Date.now(),
        };
        chrome.storage.local.set({[SETTINGS_CACHE_KEY]: cached}, () => resolve());
    });
}

/**
 * Clears cached settings
 */
export async function clearSettingsCache(): Promise<void> {
    return new Promise((resolve) => {
        chrome.storage.local.remove([SETTINGS_CACHE_KEY], resolve);
    });
}

/**
 * Clears the auth state
 */
async function clearAuthState(): Promise<void> {
    return new Promise((resolve) => {
        chrome.storage.local.remove([AUTH_STATE_KEY], resolve);
    });
}

/**
 * Checks if a feature is enabled based on user settings
 * @param featureKey - The key of the feature (e.g., 'foldSpas', 'allowPaste', or 'arm_foldSpas')
 * @param settings - The user settings object
 * @returns true if the feature is enabled, false otherwise
 */
export function isFeatureEnabled(featureKey: string, settings: Record<string, unknown> | null): boolean {
    if (!settings) {
        return true; // Default to enabled for backward compatibility
    }

    const baseKey = featureKey.replace(/^(arm|genesys|line)_/, '');
    const moduleMatch = featureKey.match(/^(arm|genesys|line)_(.+)/);
    const moduleName = moduleMatch ? moduleMatch[1] : null;

    // Check nested module settings first (e.g., settings.arm.foldSpas, settings.genesys.allowPaste)
    if (moduleName) {
        const moduleSettings = settings[moduleName] as Record<string, unknown> | undefined;
        if (moduleSettings && typeof moduleSettings === 'object' && moduleSettings[baseKey] === true) {
            return true;
        }
    } else {
        // No module prefix, check all modules
        for (const mod of ['arm', 'genesys', 'line']) {
            const moduleSettings = settings[mod] as Record<string, unknown> | undefined;
            if (moduleSettings && typeof moduleSettings === 'object' && moduleSettings[baseKey] === true) {
                return true;
            }
        }
    }

    // Fallback to direct keys (backward compatibility)
    return settings[baseKey] === true || settings[featureKey] === true;
}

/**
 * Gets settings for a specific module (e.g., 'arm')
 * @param module - The module name
 * @param settings - The user settings object
 * @returns The module-specific settings or null
 */
export function getModuleSettings(
    module: string,
    settings: Record<string, unknown> | null
): Record<string, boolean> | null {
    if (!settings) {
        return null;
    }

    const moduleSettings = settings[module];
    if (moduleSettings && typeof moduleSettings === 'object' && !Array.isArray(moduleSettings)) {
        return moduleSettings as Record<string, boolean>;
    }

    return null;
}
