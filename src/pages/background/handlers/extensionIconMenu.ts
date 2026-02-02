/**
 * Extension Icon Context Menu Handler
 *
 * Manages the right-click context menu for the extension icon itself.
 * Provides quick access to edit speech phrases.
 */

import browser from 'webextension-polyfill';

const MENU_EDIT_SPEECH_PHRASES = 'edit-speech-phrases';

/**
 * Create the extension icon context menu
 */
export async function createExtensionIconMenu(): Promise<void> {
    // Remove any existing menu first
    await removeExtensionIconMenu();

    try {
        browser.contextMenus.create({
            id: MENU_EDIT_SPEECH_PHRASES,
            title: 'Редактировать РМы',
            contexts: ['action'], // Only show when right-clicking the extension icon
        });
    } catch (error) {
        console.error('[ExtensionIconMenu] Error creating menu:', error);
    }
}

/**
 * Remove the extension icon context menu
 */
export async function removeExtensionIconMenu(): Promise<void> {
    try {
        await browser.contextMenus.remove(MENU_EDIT_SPEECH_PHRASES);
    } catch {
        // Menu doesn't exist, which is fine
    }
}

/**
 * Handle extension icon context menu click
 * Opens the speech phrases manager in a new popup window
 */
export async function handleExtensionIconClick(): Promise<void> {
    // Create a popup window with the speech phrases manager
    const width = 900;
    const height = 700;

    try {
        // Try to get the current window to center the popup
        const currentWindow = await browser.windows.getCurrent();
        const left = currentWindow.left ? Math.round(currentWindow.left + (currentWindow.width! - width) / 2) : 100;
        const top = currentWindow.top ? Math.round(currentWindow.top + (currentWindow.height! - height) / 2) : 100;

        await browser.windows.create({
            url: browser.runtime.getURL('src/pages/speech-phrases/index.html'),
            type: 'popup',
            width,
            height,
            left,
            top,
        });
    } catch (error) {
        console.error('[ExtensionIconMenu] Error opening manager window:', error);
        // Fallback: open window with default position
        try {
            await browser.windows.create({
                url: browser.runtime.getURL('src/pages/speech-phrases/index.html'),
                type: 'popup',
                width,
                height,
            });
        } catch (fallbackError) {
            console.error('[ExtensionIconMenu] Fallback also failed:', fallbackError);
        }
    }
}
