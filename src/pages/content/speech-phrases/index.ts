/**
 * Speech Phrases - Browser-wide Text Replacement Feature
 *
 * Enables text expansion shortcuts in all input fields across all websites.
 * For example, typing "пр" will automatically replace it with "Привет, хеллоу!"
 *
 * Also handles direct text insertion from context menu.
 */

import {applyPlaceholders} from '@src/shared/placeholders';

type InsertPhraseMessage = {
    action: 'insertSpeechPhrase';
    text: string;
};

type Phrase = {
    trigger: string;
    replacement: string;
};

let phrases: Phrase[] = [];

/**
 * Load phrases from chrome.storage.local
 */
async function loadPhrases(): Promise<void> {
    const data = await chrome.storage.local.get({speechPhrases: []});
    const storedPhrases = data.speechPhrases as Array<{
        shortcut: string;
        text: string;
    }> | undefined;

    if (Array.isArray(storedPhrases)) {
        phrases = storedPhrases.map((p) => ({
            trigger: p.shortcut,
            replacement: p.text,
        }));
    }
}

/**
 * Check if text ends with any trigger and replace it
 */
function checkExpand(el: HTMLElement): void {
    let text = '';

    // INPUT or TEXTAREA
    if ((el as HTMLInputElement | HTMLTextAreaElement).selectionStart !== undefined) {
        const inputEl = el as HTMLInputElement | HTMLTextAreaElement;
        const pos = inputEl.selectionStart ?? 0;
        text = inputEl.value.substring(0, pos);
    }
    // contenteditable
    else {
        const sel = window.getSelection();
        if (!sel || !sel.rangeCount) return;

        const range = sel.getRangeAt(0);
        const offset = range.startOffset;

        if (offset !== null) {
            const container = range.startContainer;
            if (container.nodeType === Node.TEXT_NODE) {
                text = container.textContent?.substring(0, offset) ?? '';
            }
        }
    }

    for (const p of phrases) {
        if (text.endsWith(p.trigger)) {
            void applyPlaceholders(p.replacement).then((expanded) => {
                replaceTrigger(el, p.trigger, expanded);
            });
            return;
        }
    }
}

/**
 * Replace trigger with replacement text
 */
function replaceTrigger(el: HTMLElement, trigger: string, replacement: string): void {
    // INPUT or TEXTAREA
    if ((el as HTMLInputElement | HTMLTextAreaElement).selectionStart !== undefined) {
        const inputEl = el as HTMLInputElement | HTMLTextAreaElement;
        const start = inputEl.selectionStart ?? 0;
        const before = inputEl.value.substring(0, Math.max(0, start - trigger.length));
        const after = inputEl.value.substring(start);

        inputEl.value = before + replacement + after;
        const newPos = before.length + replacement.length;
        inputEl.selectionStart = inputEl.selectionEnd = newPos;

        // Trigger input event so the page recognizes the change
        inputEl.dispatchEvent(new Event('input', {bubbles: true}));
    }
    // contenteditable
    else if (el.isContentEditable) {
        const sel = window.getSelection();
        if (!sel || !sel.rangeCount) return;

        const range = sel.getRangeAt(0);
        const node = range.startContainer;
        const offset = range.startOffset;

        if (node.nodeType !== Node.TEXT_NODE || offset === null) return;

        const textNode = node as Text;
        const triggerStart = Math.max(0, offset - trigger.length);

        // Select the trigger text
        range.setStart(textNode, triggerStart);
        range.setEnd(textNode, offset);
        sel.removeAllRanges();
        sel.addRange(range);

        // Delete and insert using execCommand (most reliable for contenteditable)
        // Note: deprecated but still the recommended approach for text replacement
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        document.execCommand('delete', false);
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        document.execCommand('insertText', false, replacement);
    }
}

/**
 * Handle input events
 */
function handleInput(e: Event): void {
    const el = e.target as HTMLElement;

    if (
        el.tagName === 'INPUT' ||
        el.tagName === 'TEXTAREA' ||
        el.isContentEditable
    ) {
        setTimeout(() => checkExpand(el), 0);
    }
}

/**
 * Handle keyup events for contenteditable (some don't fire input events properly)
 */
function handleKeyup(e: KeyboardEvent): void {
    const el = e.target as HTMLElement;

    if (el.isContentEditable) {
        setTimeout(() => checkExpand(el), 10);
    }
}

// Initialize
loadPhrases().catch(console.error);

// Track last focused element for context menu
let lastFocusedElement: HTMLElement | null = null;

document.addEventListener('focusin', (e) => {
    const target = e.target as HTMLElement;
    if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
    ) {
        lastFocusedElement = target;
    }
}, true);

/**
 * Insert text at cursor position
 */
function insertTextAtCursor(text: string): void {
    // Try last focused element first (context menu steals focus)
    let target = lastFocusedElement || document.activeElement as HTMLElement;

    // Fallback to any editable element
    if (!target || target.tagName === 'BODY' || target.tagName === 'HTML') {
        const editables = document.querySelectorAll(
            'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="checkbox"]):not([type="radio"]), textarea, [contenteditable="true"]'
        ) as NodeListOf<HTMLElement>;
        if (editables.length > 0) target = editables[0];
        else return;
    }

    target.focus();

    // INPUT or TEXTAREA
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        const inputEl = target as HTMLInputElement | HTMLTextAreaElement;
        const start = inputEl.selectionStart ?? 0;
        const before = inputEl.value.substring(0, start);
        const after = inputEl.value.substring(inputEl.selectionEnd ?? 0);

        inputEl.value = before + text + after;
        inputEl.selectionStart = inputEl.selectionEnd = before.length + text.length;
        inputEl.dispatchEvent(new Event('input', {bubbles: true}));
        inputEl.dispatchEvent(new Event('change', {bubbles: true}));
        return;
    }

    // contenteditable
    if (target.isContentEditable) {
        const sel = window.getSelection();
        const textNode = document.createTextNode(text);

        if (sel && sel.rangeCount > 0 && target.contains(sel.getRangeAt(0).commonAncestorContainer)) {
            const range = sel.getRangeAt(0);
            range.deleteContents();
            range.insertNode(textNode);
            range.setStart(textNode, text.length);
            range.collapse(false);
            sel.removeAllRanges();
            sel.addRange(range);
        } else {
            target.appendChild(textNode);
            const range = document.createRange();
            range.setStart(textNode, text.length);
            range.collapse(false);
            sel.removeAllRanges();
            sel.addRange(range);
        }

        target.dispatchEvent(new InputEvent('input', {
            bubbles: true,
            cancelable: true,
            data: text,
            inputType: 'insertText'
        }));
    }
}

/**
 * Handle messages from background script
 */
chrome.runtime.onMessage.addListener((message: InsertPhraseMessage, _sender, sendResponse) => {
    if (message.action === 'insertSpeechPhrase') {
        applyPlaceholders(message.text)
            .then((expanded) => {
                insertTextAtCursor(expanded);
                sendResponse({ok: true});
            })
            .catch(() => {
                insertTextAtCursor(message.text);
                sendResponse({ok: true});
            });
        return true; // async response
    }
    return false;
});

// Reload if storage changes
chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes.speechPhrases) {
        loadPhrases().catch(console.error);
    }
});

// Set up event listeners
document.addEventListener('input', handleInput, true);
document.addEventListener('keyup', handleKeyup, true);

/**
 * Initializes the speech phrases feature
 */
export async function speechPhrases(): Promise<void> {
    // Module initialization happens at load time
}
