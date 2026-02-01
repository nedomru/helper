import type {SpeechPhrase, SpeechPhraseCategory} from '@src/shared/speech-phrases';
import type {GenesysPhrases} from '@src/pages/options/types/genesysPhrases';
import {isGenesysPhrases} from '@src/pages/options/types/genesysPhrases';
import {notify} from '@src/utils/notify';

export {isGenesysPhrases} from '@src/pages/options/types/genesysPhrases';

export async function parseGenesysPhrases(
    data: GenesysPhrases,
    existingCategories: SpeechPhraseCategory[],
    existingPhrases: SpeechPhrase[]
): Promise<{ categories: SpeechPhraseCategory[]; phrases: SpeechPhrase[] }> {
    const categories: SpeechPhraseCategory[] = [];
    const phrases: SpeechPhrase[] = [];

    // Generate IDs
    const maxCategoryId = Math.max(0, ...existingCategories.map(c => parseInt(c.id, 10) || 0)) + 1;
    const maxPhraseId = Math.max(0, ...existingPhrases.map(p => parseInt(p.id, 10) || 0)) + 1;
    let categoryCounter = maxCategoryId;
    let phraseCounter = maxPhraseId;

    const categoryMap = new Map<string, string>();

    for (const folder of data) {
        if (!folder.items?.length) continue;

        // Find or create category
        const existingCat = existingCategories.find(c => c.name === folder.folderName);
        let categoryId = existingCat?.id || categoryMap.get(folder.folderName);

        if (!categoryId) {
            categoryId = String(categoryCounter++);
            categories.push({
                id: categoryId,
                name: folder.folderName,
                parentId: null,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
            categoryMap.set(folder.folderName, categoryId);
        }

        // Import phrases
        for (const item of folder.items) {
            if (!item.itemName || !item.value) continue;

            phrases.push({
                id: String(phraseCounter++),
                name: item.itemName,
                text: item.value,
                shortcut: item.hotkey1 || item.hotkey2 || null,
                categoryId,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
        }
    }

    if (categories.length === 0 && phrases.length === 0) {
        notify('Импорт Genesys', 'Не найдено фраз для импорта', 'warn');
    }

    return {categories, phrases};
}

export async function importGenesysPhrases(
    file: File,
    existingCategories: SpeechPhraseCategory[],
    existingPhrases: SpeechPhrase[]
): Promise<{ categories: SpeechPhraseCategory[]; phrases: SpeechPhrase[] }> {
    try {
        const text = await file.text();
        const data = JSON.parse(text) as GenesysPhrases;

        if (!Array.isArray(data)) {
            throw new Error('Некорректный формат файла');
        }

        return parseGenesysPhrases(data, existingCategories, existingPhrases);
    } catch (error) {
        notify('Импорт Genesys', `Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`, 'error');
        return {categories: [], phrases: []};
    }
}
