/** Speech Phrases Module - Manages text expansion shortcuts */

import {getUserSettings, updateUserSettings} from './user-settings';

const PHRASES_SETTINGS_KEY = 'speechPhrases';
const CATEGORIES_SETTINGS_KEY = 'speechPhraseCategories';

export interface SpeechPhrase {
    id: string;
    shortcut: string | null;
    name: string;
    text: string;
    categoryId?: string | null;
}

export interface SpeechPhraseCategory {
    id: string;
    name: string;
    parentId?: string | null;
    icon?: string;
}

export async function getSpeechPhrases(): Promise<SpeechPhrase[]> {
    const settings = await getUserSettings();
    if (!settings) return [];
    const phrases = settings[PHRASES_SETTINGS_KEY] as SpeechPhrase[] | undefined;
    return Array.isArray(phrases) ? phrases : [];
}

export async function saveSpeechPhrases(phrases: SpeechPhrase[]): Promise<boolean> {
    const apiResult = await updateUserSettings({[PHRASES_SETTINGS_KEY]: phrases});
    try {
        await chrome.storage.local.set({speechPhrases: phrases});
    } catch {
    }
    return apiResult;
}

export async function getSpeechPhraseCategories(): Promise<SpeechPhraseCategory[]> {
    const settings = await getUserSettings();
    if (!settings) return [];
    const categories = settings[CATEGORIES_SETTINGS_KEY] as SpeechPhraseCategory[] | undefined;
    return Array.isArray(categories) ? categories : [];
}

export async function saveSpeechPhraseCategories(categories: SpeechPhraseCategory[]): Promise<boolean> {
    const apiResult = await updateUserSettings({[CATEGORIES_SETTINGS_KEY]: categories});
    try {
        await chrome.storage.local.set({speechPhraseCategories: categories});
    } catch {
    }
    return apiResult;
}

export async function getPhrasesMap(): Promise<Map<string, string>> {
    const phrases = await getSpeechPhrases();
    const map = new Map<string, string>();
    for (const phrase of phrases) {
        if (phrase.shortcut) {
            map.set(phrase.shortcut, phrase.text);
        }
    }
    return map;
}

export interface CategoryTreeNode {
    category: SpeechPhraseCategory;
    children: CategoryTreeNode[];
    depth: number;
    path: string[];
}

export function buildCategoryTree(categories: SpeechPhraseCategory[]): CategoryTreeNode[] {
    const map = new Map<string, CategoryTreeNode>();
    const roots: CategoryTreeNode[] = [];

    for (const category of categories) {
        map.set(category.id, {category, children: [], depth: 0, path: []});
    }

    for (const category of categories) {
        const node = map.get(category.id)!;
        if (!category.parentId) {
            node.depth = 0;
            node.path = [category.name];
            roots.push(node);
        } else {
            const parent = map.get(category.parentId);
            if (parent) {
                node.depth = parent.depth + 1;
                node.path = [...parent.path, category.name];
                parent.children.push(node);
            } else {
                node.depth = 0;
                node.path = [category.name];
                roots.push(node);
            }
        }
    }

    return roots;
}


export function getCategoryPath(categoryId: string, categories: SpeechPhraseCategory[]): string[] {
    const path: string[] = [];
    let currentId = categoryId;

    while (currentId) {
        const category = categories.find(c => c.id === currentId);
        if (!category) break;
        path.unshift(category.name);
        currentId = category.parentId || '';
    }

    return path;
}

export function getCategoryPathString(categoryId: string, categories: SpeechPhraseCategory[], separator = ' / '): string {
    return getCategoryPath(categoryId, categories).join(separator);
}

export function validateCategoryMove(categoryId: string, newParentId: string | null, categories: SpeechPhraseCategory[]): boolean {
    if (!newParentId) return true;
    if (categoryId === newParentId) return false;

    let currentId = newParentId;
    const visited = new Set<string>();

    while (currentId) {
        if (currentId === categoryId) return false;
        if (visited.has(currentId)) return false;
        visited.add(currentId);
        const category = categories.find(c => c.id === currentId);
        currentId = category?.parentId || '';
    }

    return true;
}

export interface FlattenedCategoryMenuItem {
    id: string;
    name: string;
    menuLabel: string;
    originalDepth: number;
}

export function flattenCategoriesForMenu(categories: SpeechPhraseCategory[]): FlattenedCategoryMenuItem[] {
    const tree = buildCategoryTree(categories);
    const result: FlattenedCategoryMenuItem[] = [];

    function traverse(nodes: CategoryTreeNode[]) {
        for (const node of nodes) {
            result.push({
                id: node.category.id,
                name: node.category.name,
                menuLabel: node.path.join(' / '),
                originalDepth: node.depth,
            });
            if (node.children.length > 0) {
                traverse(node.children);
            }
        }
    }

    traverse(tree);
    return result;
}
