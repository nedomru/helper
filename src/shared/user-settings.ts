/**
 * User settings utilities for content scripts
 * Handles caching, utilities, and feature checking
 */

import {fetchUserSettings, updateUserSettingsAPI} from '@src/utils/api';

const SETTINGS_CACHE_KEY = 'user_settings_cache';
const SETTINGS_CACHE_TTL = 60 * 1000; // 1 minute
const PENDING_QUEUE_KEY = 'helper_pending_settings_queue';
const MAX_QUEUE_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 дней

interface CachedSettings {
    data: Record<string, unknown>;
    timestamp: number;
}

interface PendingUpdate {
    id: string;
    settings: Record<string, unknown>;
    queuedAt: number;
    attempts: number;
}

function deepMerge(
    target: Record<string, unknown>,
    source: Record<string, unknown>,
): Record<string, unknown> {
    const result: Record<string, unknown> = {...target};
    for (const [key, value] of Object.entries(source)) {
        const existing = result[key];
        const isPlainObject = (v: unknown): v is Record<string, unknown> =>
            !!v && typeof v === 'object' && !Array.isArray(v);
        if (isPlainObject(existing) && isPlainObject(value)) {
            result[key] = deepMerge(existing, value);
        } else {
            result[key] = value;
        }
    }
    return result;
}

async function readPendingQueue(): Promise<PendingUpdate[]> {
    const stored = await chrome.storage.local.get(PENDING_QUEUE_KEY);
    const queue = stored[PENDING_QUEUE_KEY] as PendingUpdate[] | undefined;
    if (!Array.isArray(queue)) return [];
    const cutoff = Date.now() - MAX_QUEUE_AGE_MS;
    return queue.filter((u) => u.queuedAt >= cutoff);
}

async function writePendingQueue(queue: PendingUpdate[]): Promise<void> {
    if (queue.length === 0) {
        await chrome.storage.local.remove(PENDING_QUEUE_KEY);
    } else {
        await chrome.storage.local.set({[PENDING_QUEUE_KEY]: queue});
    }
}

async function enqueueUpdate(settings: Record<string, unknown>): Promise<void> {
    const queue = await readPendingQueue();
    queue.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        settings,
        queuedAt: Date.now(),
        attempts: 0,
    });
    await writePendingQueue(queue);
}

function mergePending(queue: PendingUpdate[]): Record<string, unknown> {
    return queue.reduce(
        (acc, update) => deepMerge(acc, update.settings),
        {} as Record<string, unknown>,
    );
}

/**
 * Attempts to push any pending settings updates to the backend.
 * Safe to call repeatedly; no-ops if queue is empty.
 */
export async function drainPendingSettings(): Promise<boolean> {
    const queue = await readPendingQueue();
    if (queue.length === 0) return true;

    const merged = mergePending(queue);
    const success = await updateUserSettingsAPI(merged);
    if (success) {
        await writePendingQueue([]);
        await clearSettingsCache();
        return true;
    }

    const updated = queue.map((u) => ({...u, attempts: u.attempts + 1}));
    await writePendingQueue(updated);
    return false;
}

export async function getPendingSettingsCount(): Promise<number> {
    const queue = await readPendingQueue();
    return queue.length;
}

/** Keys that have been removed and should be cleaned from saved settings */
const DEPRECATED_KEYS: Record<string, string[]> = {
    genesys: ['showDutyMessages'],
};

/**
 * Removes deprecated keys from settings and persists the cleanup
 */
async function migrateDeprecatedKeys(settings: Record<string, unknown>): Promise<Record<string, unknown>> {
    let changed = false;

    for (const [module, keys] of Object.entries(DEPRECATED_KEYS)) {
        const moduleSettings = settings[module] as Record<string, unknown> | undefined;
        if (!moduleSettings || typeof moduleSettings !== 'object') continue;

        for (const key of keys) {
            if (key in moduleSettings) {
                delete moduleSettings[key];
                changed = true;
            }
        }
    }

    if (changed) {
        await updateUserSettingsAPI(settings);
    }

    return settings;
}

/**
 * Fetches user settings with caching
 * @returns The user settings or null if not authenticated/error
 */
export async function getUserSettings(): Promise<Record<string, unknown> | null> {
    // Check cache first
    const cached = await getCachedSettings();
    if (cached) {
        console.debug('[UserSettings] Using cached settings');
        return cached;
    }

    // Fetch from API
    const settings = await fetchUserSettings();
    if (settings) {
        await migrateDeprecatedKeys(settings);
        await cacheSettings(settings);
    }
    return settings;
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
 * Updates user settings.
 *
 * Write-through: applies changes to the local cache immediately so the UI
 * reflects them, then attempts to persist on the backend. If the backend
 * call fails (offline or transient error), queues the update for later
 * retry via drainPendingSettings(). Always returns true to keep the UI
 * optimistic; callers can inspect getPendingSettingsCount() to surface
 * sync state.
 */
export async function updateUserSettings(settings: Record<string, unknown>): Promise<boolean> {
    // Optimistically merge into the local cache so consumers see the new
    // values even before the network round-trip resolves.
    const stored = await new Promise<CachedSettings | null>((resolve) => {
        chrome.storage.local.get([SETTINGS_CACHE_KEY], (result) => {
            resolve((result[SETTINGS_CACHE_KEY] as CachedSettings | undefined) ?? null);
        });
    });
    const baseline = stored?.data ?? {};
    const optimistic = deepMerge(baseline, settings);
    await cacheSettings(optimistic);

    // Try to flush any prior pending updates together with the new payload.
    const pending = await readPendingQueue();
    const payload = pending.length > 0 ? deepMerge(mergePending(pending), settings) : settings;

    const success = await updateUserSettingsAPI(payload);
    if (success) {
        await writePendingQueue([]);
        // Keep the optimistic cache; next read will refresh after TTL.
        return true;
    }

    await enqueueUpdate(settings);
    return true;
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

/**
 * Types for quick appeals presets and categories
 */
export interface QuickAppealsPreset {
    id: string;
    name: string;
    product: number;
    processing: string;
    processingLabel: string;
    category: string;
    categoryLabel: string;
    subcategory?: string;
    subcategoryLabel?: string;
    childReason?: string;
    childReasonLabel?: string;
    categoryId?: string | null;
    comment?: string;
}

export interface QuickAppealsPresetCategory {
    id: string;
    name: string;
    order: number;
}

/**
 * Gets quick appeals presets from user settings
 * @returns Array of presets or empty array
 */
export async function getQuickAppealsPresets(): Promise<QuickAppealsPreset[]> {
    const settings = await getUserSettings();
    if (!settings) {
        return [];
    }
    const presets = settings.quickAppealsPresets as QuickAppealsPreset[] | undefined;
    return Array.isArray(presets) ? presets : [];
}

/**
 * Saves quick appeals presets to user settings
 * @param presets - Array of presets to save
 * @returns true if successful, false otherwise
 */
export async function saveQuickAppealsPresets(presets: QuickAppealsPreset[]): Promise<boolean> {
    return updateUserSettings({quickAppealsPresets: presets});
}

/**
 * Gets quick appeals preset categories from user settings
 * @returns Array of categories or default categories
 */
export async function getQuickAppealsPresetCategories(): Promise<QuickAppealsPresetCategory[]> {
    const settings = await getUserSettings();
    if (!settings) {
        return [];
    }
    const categories = settings.quickAppealsPresetCategories as QuickAppealsPresetCategory[] | undefined;
    return Array.isArray(categories) ? categories : [];
}

/**
 * Saves quick appeals preset categories to user settings
 * @param categories - Array of categories to save
 * @returns true if successful, false otherwise
 */
export async function saveQuickAppealsPresetCategories(categories: QuickAppealsPresetCategory[]): Promise<boolean> {
    return updateUserSettings({quickAppealsPresetCategories: categories});
}
