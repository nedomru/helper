export type ClipboardEntryType =
    | "ip"
    | "mac"
    | "agreement"
    | "phone"
    | "email"
    | "text";

export interface ClipboardEntry {
    value: string;
    type: ClipboardEntryType;
    copiedAt: number;
}

const STORAGE_KEY = "helper_clipboard_history";
const MAX_ENTRIES = 50;
const MAX_VALUE_LENGTH = 1000;

const IP_REGEX = /^(?:\d{1,3}\.){3}\d{1,3}$/;
const MAC_REGEX = /^[0-9a-f]{2}([-:][0-9a-f]{2}){5}$/i;
const PHONE_REGEX = /^\+?[\d\s\-()]{6,20}$/;
const AGREEMENT_REGEX = /^\d{8,12}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function detectClipboardType(value: string): ClipboardEntryType {
    const trimmed = value.trim();
    if (IP_REGEX.test(trimmed)) return "ip";
    if (MAC_REGEX.test(trimmed)) return "mac";
    if (EMAIL_REGEX.test(trimmed)) return "email";
    if (AGREEMENT_REGEX.test(trimmed)) return "agreement";
    if (PHONE_REGEX.test(trimmed) && /\d{6,}/.test(trimmed)) return "phone";
    return "text";
}

export const CLIPBOARD_TYPE_LABELS: Record<ClipboardEntryType, string> = {
    ip: "IP",
    mac: "MAC",
    agreement: "Договор",
    phone: "Телефон",
    email: "Email",
    text: "Текст",
};

export async function pushClipboardEntry(value: string): Promise<void> {
    if (!value || value.length > MAX_VALUE_LENGTH) return;
    try {
        const stored = await chrome.storage.local.get(STORAGE_KEY);
        const history = (stored[STORAGE_KEY] as ClipboardEntry[] | undefined) ?? [];

        const filtered = history.filter((e) => e.value !== value);
        const entry: ClipboardEntry = {
            value,
            type: detectClipboardType(value),
            copiedAt: Date.now(),
        };
        const next = [entry, ...filtered].slice(0, MAX_ENTRIES);
        await chrome.storage.local.set({[STORAGE_KEY]: next});
    } catch (err) {
        console.debug("[ClipboardHistory] push failed:", err);
    }
}

export async function getClipboardHistory(): Promise<ClipboardEntry[]> {
    const stored = await chrome.storage.local.get(STORAGE_KEY);
    const history = stored[STORAGE_KEY] as ClipboardEntry[] | undefined;
    return Array.isArray(history) ? history : [];
}

export async function clearClipboardHistory(): Promise<void> {
    await chrome.storage.local.remove(STORAGE_KEY);
}

export async function removeClipboardEntry(value: string): Promise<void> {
    const stored = await chrome.storage.local.get(STORAGE_KEY);
    const history = (stored[STORAGE_KEY] as ClipboardEntry[] | undefined) ?? [];
    const next = history.filter((e) => e.value !== value);
    await chrome.storage.local.set({[STORAGE_KEY]: next});
}
