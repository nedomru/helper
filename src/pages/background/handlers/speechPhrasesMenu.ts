/**
 * Speech Phrases Context Menu Handler
 *
 * Manages the right-click context menu for speech phrases with nested category support.
 * Handles Chrome's 2-level nesting limitation using smart flattening.
 */

import type {SpeechPhrase, SpeechPhraseCategory} from '@src/shared/speech-phrases';
import {flattenCategoriesForMenu} from '@src/shared/speech-phrases';
import browser from 'webextension-polyfill';

const MENU_ROOT_ID = 'speech-phrases-root';
const MENU_ITEM_PREFIX = 'speech-phrase-';

// Store phrase data keyed by menu item ID for click handling
const phraseDataStore = new Map<string, { text: string; name: string }>();

/**
 * Create the speech phrases context menu
 * Builds a nested menu structure respecting Chrome's 2-level limit
 */
export async function createSpeechPhrasesMenu(): Promise<void> {
    // Remove any existing menu first
    await removeSpeechPhrasesMenu();

    // Load phrases and categories from storage
    const data = await browser.storage.local.get(['speechPhrases', 'speechPhraseCategories']);
    const phrases = (data.speechPhrases as SpeechPhrase[]) || [];
    const categories = (data.speechPhraseCategories as SpeechPhraseCategory[]) || [];

    // Clear the phrase data store
    phraseDataStore.clear();

    // Create the root menu item
    try {
        browser.contextMenus.create({
            id: MENU_ROOT_ID,
            title: 'РМы',
            contexts: ['all'], // Show in all contexts
        });
    } catch (error) {
        console.error('[SpeechPhrasesMenu] Error creating root menu:', error);
        return;
    }

    // If no phrases, just show a placeholder
    if (phrases.length === 0) {
        try {
            browser.contextMenus.create({
                id: `${MENU_ROOT_ID}-empty`,
                parentId: MENU_ROOT_ID,
                title: 'Нет доступных фраз',
                contexts: ['all'],
                enabled: false,
            });
        } catch (error) {
            console.error('[SpeechPhrasesMenu] Error creating empty placeholder:', error);
        }
        return;
    }

    // Group phrases by category
    const phrasesByCategory = new Map<string | null, SpeechPhrase[]>();
    const uncategorizedPhrases: SpeechPhrase[] = [];

    for (const phrase of phrases) {
        if (phrase.categoryId) {
            if (!phrasesByCategory.has(phrase.categoryId)) {
                phrasesByCategory.set(phrase.categoryId, []);
            }
            phrasesByCategory.get(phrase.categoryId)!.push(phrase);
        } else {
            uncategorizedPhrases.push(phrase);
        }
    }

    // Build the menu structure
    // Chrome context menus only support 2 levels of nesting
    // Level 0: Root menu (already created)
    // Level 1: Categories or direct phrases
    // Level 2: Subcategories or phrases

    const flattenedCategories = flattenCategoriesForMenu(categories);

    // Create menus for categories with their phrases
    for (const flatCategory of flattenedCategories) {
        const categoryPhrases = phrasesByCategory.get(flatCategory.id) || [];

        if (categoryPhrases.length === 0) {
            continue; // Skip empty categories
        }

        // Create category menu item at level 1
        const categoryId = `${MENU_ROOT_ID}-cat-${flatCategory.id}`;
        try {
            browser.contextMenus.create({
                id: categoryId,
                parentId: MENU_ROOT_ID,
                title: `📁 ${flatCategory.menuLabel}`,
                contexts: ['all'],
            });
        } catch (error) {
            console.error(`[SpeechPhrasesMenu] Error creating category menu for ${flatCategory.name}:`, error);
            continue;
        }

        // Add phrases to this category menu at level 2
        for (const phrase of categoryPhrases) {
            const phraseId = `${MENU_ITEM_PREFIX}${phrase.id}`;
            try {
                browser.contextMenus.create({
                    id: phraseId,
                    parentId: categoryId,
                    title: phrase.name,
                    contexts: ['all'],
                });

                // Store phrase data for click handling
                phraseDataStore.set(phraseId, {
                    text: phrase.text,
                    name: phrase.name,
                });
            } catch (error) {
                console.error(`[SpeechPhrasesMenu] Error creating phrase menu for ${phrase.name}:`, error);
            }
        }
    }

    // Add uncategorized phrases directly to root
    if (uncategorizedPhrases.length > 0) {
        // Create a separator if there are categorized phrases
        if (flattenedCategories.length > 0) {
            try {
                browser.contextMenus.create({
                    type: 'separator',
                    contexts: ['all'],
                    parentId: MENU_ROOT_ID,
                });
            } catch (error) {
                console.error('[SpeechPhrasesMenu] Error creating separator:', error);
            }
        }

        for (const phrase of uncategorizedPhrases) {
            const phraseId = `${MENU_ITEM_PREFIX}${phrase.id}`;
            try {
                browser.contextMenus.create({
                    id: phraseId,
                    parentId: MENU_ROOT_ID,
                    title: phrase.name,
                    contexts: ['all'],
                });

                // Store phrase data for click handling
                phraseDataStore.set(phraseId, {
                    text: phrase.text,
                    name: phrase.name,
                });
            } catch (error) {
                console.error(`[SpeechPhrasesMenu] Error creating phrase menu for ${phrase.name}:`, error);
            }
        }
    }
}

/**
 * Remove the speech phrases context menu
 */
export async function removeSpeechPhrasesMenu(): Promise<void> {
    try {
        await browser.contextMenus.remove(MENU_ROOT_ID);
    } catch (error) {
        // Menu doesn't exist, which is fine
    }
    phraseDataStore.clear();
}

/**
 * Handle context menu click to insert text
 */
export async function handleSpeechPhraseClick(info: any, tab: any): Promise<void> {
    if (!tab?.id) return;

    const menuItemId = info.menuItemId?.toString();
    if (!menuItemId?.startsWith(MENU_ITEM_PREFIX)) return;

    const phraseData = phraseDataStore.get(menuItemId);
    if (!phraseData) return;

    // Copy to clipboard
    await navigator.clipboard.writeText(phraseData.text).catch(() => {
    });

    // Insert at cursor
    try {
        await browser.tabs.sendMessage(tab.id, {
            action: 'insertSpeechPhrase',
            text: phraseData.text,
        });
    } catch {
        // Show notification that text is in clipboard
        browser.notifications?.create({
            type: 'basic',
            iconUrl: browser.runtime.getURL('icon-128.png'),
            title: 'РМы',
            message: `"${phraseData.name}" скопировано`,
            priority: 2,
        });
    }
}

/**
 * Rebuild the speech phrases menu
 * Called when phrases or categories change
 */
export async function rebuildSpeechPhrasesMenu(): Promise<void> {
    await createSpeechPhrasesMenu();
}
