import {pushClipboardEntry} from "@src/shared/clipboard-history";

/**
 * Copies text to clipboard using the best available method
 * Tries navigator.clipboard first, falls back to document.execCommand.
 * Also pushes the value into local clipboard history.
 *
 * @param text - Text to copy
 * @returns Promise that resolves when copy is complete
 * @throws Error if both methods fail
 */
export async function copyText(text: string): Promise<void> {
    // Try modern Clipboard API first
    if (navigator.clipboard && window.isSecureContext) {
        try {
            await navigator.clipboard.writeText(text);
            void pushClipboardEntry(text);
            return;
        } catch (err) {
            console.warn("[Хелпер] - navigator.clipboard failed, trying fallback:", err);
            // Fall through to fallback method
        }
    }

    // Fallback to document.execCommand for content scripts
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.left = "-999999px";
    textarea.style.top = "-999999px";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    try {
        const successful = document.execCommand("copy");
        if (!successful) {
            throw new Error("execCommand returned false");
        }
        void pushClipboardEntry(text);
    } catch (err) {
        console.error("[Хелпер] - [Копирование текста] Не удалось скопировать текст, ошибка:", err);
        throw err;
    } finally {
        document.body.removeChild(textarea);
    }
}
