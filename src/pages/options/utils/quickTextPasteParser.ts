import type {SpeechPhrase, SpeechPhraseCategory} from '@src/shared/speech-phrases';
import {notify} from '@src/utils/notify';

interface ParsedEntry {
    id: string;
    shortcut: string;
    text: string;
    label?: string;
}

/**
 * Parse a single QuickTextPaste entry
 * Format: "Ctrl+0=Text content<E<N<D|"
 */
function parseEntry(id: string, value: string): ParsedEntry | null {
    const firstEquals = value.indexOf('=');
    if (firstEquals === -1) return null;

    const shortcut = value.substring(0, firstEquals).trim();
    const text = value.substring(firstEquals + 1)
        .replace(/<E<N<D\|?$/g, '')
        .replace(/\\n/g, '\n')
        .trim();

    if (!text) return null;

    return {id, shortcut, text};
}

/**
 * Create a readable name from the text or label
 */
function createNameFromEntry(entry: ParsedEntry, index: number): string {
    if (entry.label?.trim()) return entry.label.trim();

    const firstLine = entry.text.split('\n')[0].trim();
    if (firstLine) return firstLine.length > 50 ? firstLine.substring(0, 47) + '...' : firstLine;

    return `Фраза ${index + 1}`;
}

/**
 * Parse QuickTextPaste INI format and convert to Speech Phrase format
 */
export async function parseQuickTextPaste(
    content: string,
    existingCategories: SpeechPhraseCategory[],
    existingPhrases: SpeechPhrase[]
): Promise<{ categories: SpeechPhraseCategory[]; phrases: SpeechPhrase[] }> {
    const categories: SpeechPhraseCategory[] = [];
    const phrases: SpeechPhrase[] = [];

    // Parse INI format
    const lines = content.split(/\r?\n/);
    const data: Record<string, Record<string, string>> = {};
    let currentSection: string | null = null;

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(';') || trimmed.startsWith('#')) continue;

        const sectionMatch = trimmed.match(/^\[([^\]]+)\]$/);
        if (sectionMatch) {
            currentSection = sectionMatch[1];
            data[currentSection] = {};
            continue;
        }

        if (currentSection && trimmed.includes('=')) {
            const eqIndex = trimmed.indexOf('=');
            const key = trimmed.substring(0, eqIndex).trim();
            const value = trimmed.substring(eqIndex + 1).trim();
            if (key && value) data[currentSection][key] = value;
        }
    }

    if (!data.list_text) {
        throw new Error('Отсутствует секция [list_text]');
    }

    // Parse entries
    const entries: ParsedEntry[] = [];
    for (const [key, value] of Object.entries(data.list_text)) {
        if (!key.startsWith('text_')) continue;
        const parsed = parseEntry(key, value);
        if (parsed) {
            if (data.list_label?.[key]) parsed.label = data.list_label[key];
            entries.push(parsed);
        }
    }

    if (entries.length === 0) {
        notify('Импорт QuickTextPaste', 'Не найдено фраз для импорта', 'warn');
        return {categories: [], phrases: []};
    }

    // Group entries by shortcut (folder names)
    const entriesByShortcut = new Map<string, ParsedEntry[]>();
    for (const entry of entries) {
        const key = entry.shortcut || 'Без ярлыка';
        if (!entriesByShortcut.has(key)) entriesByShortcut.set(key, []);
        entriesByShortcut.get(key)!.push(entry);
    }

    // Generate IDs
    const maxCategoryId = Math.max(0, ...existingCategories.map(c => parseInt(c.id, 10) || 0)) + 1;
    const maxPhraseId = Math.max(0, ...existingPhrases.map(p => parseInt(p.id, 10) || 0)) + 1;
    let categoryCounter = maxCategoryId;
    let phraseCounter = maxPhraseId;

    const categoryIdMap = new Map<string, string>();

    // Process each shortcut group as a category
    for (const [shortcut, entriesInGroup] of entriesByShortcut) {
        const validEntries = entriesInGroup.filter(e => e.text?.length > 0);
        if (validEntries.length === 0) continue;

        // Find or create category
        let categoryId = existingCategories.find(c => c.name === shortcut)?.id;
        if (!categoryId) categoryId = categoryIdMap.get(shortcut);

        if (!categoryId) {
            categoryId = String(categoryCounter++);
            categories.push({
                id: categoryId,
                name: shortcut,
                parentId: null,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
            categoryIdMap.set(shortcut, categoryId);
        }

        // Import phrases
        for (let i = 0; i < validEntries.length; i++) {
            const entry = validEntries[i];

            // Skip duplicates
            if (existingPhrases.some(p => p.text === entry.text && p.categoryId === categoryId)) continue;

            phrases.push({
                id: String(phraseCounter++),
                name: createNameFromEntry(entry, i),
                text: entry.text,
                shortcut: null,
                categoryId,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
        }
    }

    return {categories, phrases};
}

/**
 * Import QuickTextPaste file
 */
export async function importQuickTextPaste(
    file: File,
    existingCategories: SpeechPhraseCategory[],
    existingPhrases: SpeechPhrase[]
): Promise<{ categories: SpeechPhraseCategory[]; phrases: SpeechPhrase[] }> {
    try {
        const content = await file.text();
        if (!content.includes('[list_text]')) {
            throw new Error('Некорректный формат QuickTextPaste');
        }
        return parseQuickTextPaste(content, existingCategories, existingPhrases);
    } catch (error) {
        notify('Импорт QuickTextPaste', `Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`, 'error');
        return {categories: [], phrases: []};
    }
}

/**
 * Check if content is QuickTextPaste format
 */
export function isQuickTextPasteContent(content: string): boolean {
    const trimmed = content.trim();
    return /\[list_text\]/i.test(trimmed) || (/text_\d+\s*=/i.test(trimmed) && trimmed.includes('='));
}
