/**
 * Parser to convert Clippings export format to Speech Phrase format
 */

import type {SpeechPhrase, SpeechPhraseCategory} from '@src/shared/speech-phrases';
import type {ClippingFolder, ClippingItem, ClippingsExport} from '@src/pages/options/types/clippings';

/**
 * Map to track category paths and their IDs
 */
interface CategoryPathMap {
    [path: string]: string; // path -> categoryId
}

/**
 * Get the path key for a category (name + parent path)
 */
function getCategoryPathKey(name: string, parentPath: string): string {
    return parentPath ? `${parentPath}/${name}` : name;
}

export interface ClippingsImportResult {
    categories: SpeechPhraseCategory[];
    phrases: SpeechPhrase[];
    statistics: {
        categoriesImported: number;
        phrasesImported: number;
        foldersProcessed: number;
        clippingsProcessed: number;
    };
}

export interface ClippingsImportError {
    message: string;
    details?: string;
}

/**
 * Generate a unique ID for a category or phrase
 */
function generateId(prefix: string, name: string, existingIds: Set<string>): string {
    const baseName = name
        .toLowerCase()
        .replace(/[^a-z0-9а-яё0-9]/gi, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

    let id = `${prefix}-${baseName}`;
    let counter = 1;

    while (existingIds.has(id)) {
        id = `${prefix}-${baseName}-${counter}`;
        counter++;
    }

    return id;
}

/**
 * Check if a category name already exists at a specific level
 */
function categoryNameExists(name: string, parentId: string | null, categories: SpeechPhraseCategory[]): boolean {
    return categories.some(c => c.name === name && c.parentId === parentId);
}

/**
 * Get a unique category name by appending suffix if needed
 */
function getUniqueCategoryName(name: string, parentId: string | null, categories: SpeechPhraseCategory[]): string {
    if (!categoryNameExists(name, parentId, categories)) {
        return name;
    }

    let counter = 2;
    let newName: string;
    do {
        newName = `${name} (${counter})`;
        counter++;
    } while (categoryNameExists(newName, parentId, categories));

    return newName;
}

/**
 * Check if a shortcut already exists
 */
function shortcutExists(shortcut: string, phrases: SpeechPhrase[]): boolean {
    return phrases.some(p => p.shortcut === shortcut);
}

/**
 * Get a unique shortcut by appending suffix if needed
 */
function getUniqueShortcut(shortcut: string, phrases: SpeechPhrase[]): string {
    if (!shortcutExists(shortcut, phrases)) {
        return shortcut;
    }

    let counter = 2;
    let newShortcut: string;
    do {
        newShortcut = `${shortcut}-${counter}`;
        counter++;
    } while (shortcutExists(newShortcut, phrases));

    return newShortcut;
}

/**
 * Build a map of category paths to their IDs from existing categories
 */
function buildCategoryPathMap(categories: SpeechPhraseCategory[]): CategoryPathMap {
    const map: CategoryPathMap = {};

    for (const category of categories) {
        // Build the path by traversing up to parent
        const pathParts: string[] = [];
        let currentId = category.id;

        while (currentId) {
            const cat = categories.find(c => c.id === currentId);
            if (!cat) break;
            pathParts.unshift(cat.name);
            currentId = cat.parentId || '';
        }

        const path = pathParts.join('/');
        map[path] = category.id;
    }

    return map;
}

/**
 * Process a Clippings folder recursively
 */
function processFolder(
    folder: ClippingFolder,
    parentPath: string,
    parentId: string | null,
    existingCategories: SpeechPhraseCategory[],
    existingPhrases: SpeechPhrase[],
    existingIds: Set<string>,
    categoryPathMap: CategoryPathMap,
    modifiedPhrases: Set<SpeechPhrase>
): { categories: SpeechPhraseCategory[]; phrases: SpeechPhrase[] } {
    const categories: SpeechPhraseCategory[] = [];
    const phrases: SpeechPhrase[] = [];

    // Check if this category already exists
    const categoryPath = getCategoryPathKey(folder.name, parentPath);
    const existingCategoryId = categoryPathMap[categoryPath];

    let categoryId: string;

    if (existingCategoryId) {
        // Category already exists, reuse its ID
        categoryId = existingCategoryId;
    } else {
        // Create new category
        categoryId = generateId('cat', folder.name, existingIds);

        const newCategory: SpeechPhraseCategory = {
            id: categoryId,
            name: folder.name,
            parentId,
        };

        categories.push(newCategory);
        existingCategories.push(newCategory);
        existingIds.add(categoryId);
        categoryPathMap[categoryPath] = categoryId;
    }

    // Process children
    for (const child of folder.children) {
        if ('children' in child) {
            // It's a folder
            const childResult = processFolder(
                child,
                categoryPath,
                categoryId,
                existingCategories,
                existingPhrases,
                existingIds,
                categoryPathMap,
                modifiedPhrases
            );
            categories.push(...childResult.categories);
            phrases.push(...childResult.phrases);
        } else {
            // It's a clipping item
            const phraseResult = processClippingItem(
                child,
                categoryId,
                existingPhrases,
                existingIds,
                modifiedPhrases
            );
            if (phraseResult) {
                phrases.push(phraseResult);
            }
        }
    }

    return {categories, phrases};
}

/**
 * Process a single clipping item
 * Returns null if the phrase already exists
 * Reuses orphaned phrases (categoryId: null) with the same name instead of creating duplicates
 */
function processClippingItem(
    item: ClippingItem,
    categoryId: string,
    existingPhrases: SpeechPhrase[],
    existingIds: Set<string>,
    modifiedPhrases: Set<SpeechPhrase>
): SpeechPhrase | null {
    // Check if phrase with same name and category already exists
    const existingPhrase = existingPhrases.find(
        p => p.name === item.name && p.categoryId === categoryId
    );

    if (existingPhrase) {
        // Phrase already exists in this category, skip it
        return null;
    }

    // Check if there's an orphaned phrase (categoryId: null) with the same name
    // This happens when a folder is deleted but phrases are kept as root-level items
    const orphanedPhrase = existingPhrases.find(
        p => p.name === item.name && p.categoryId === null
    );

    if (orphanedPhrase) {
        // Reuse the orphaned phrase by moving it to the correct category
        orphanedPhrase.categoryId = categoryId;
        // Update shortcut if needed
        if (item.shortcutKey?.trim()) {
            const shortcut = item.shortcutKey.trim();
            orphanedPhrase.shortcut = getUniqueShortcut(shortcut, existingPhrases);
        }
        // Update text if it was empty
        if (!orphanedPhrase.text && item.content) {
            orphanedPhrase.text = item.content;
        }
        // Track that this phrase was modified so it gets saved
        modifiedPhrases.add(orphanedPhrase);
        // Return null to indicate no NEW phrase was created
        return null;
    }

    const phraseId = generateId('phrase', item.name, existingIds);

    // Handle shortcut - convert empty string to null
    let shortcut: string | null = item.shortcutKey?.trim() || null;
    if (shortcut) {
        shortcut = getUniqueShortcut(shortcut, existingPhrases);
    }

    const newPhrase: SpeechPhrase = {
        id: phraseId,
        name: item.name,
        text: item.content || '',
        shortcut,
        categoryId,
    };

    existingPhrases.push(newPhrase);
    existingIds.add(phraseId);

    return newPhrase;
}

/**
 * Parse Clippings export and convert to Speech Phrase format
 */
export function parseClippingsExport(
    exportData: ClippingsExport,
    existingCategories: SpeechPhraseCategory[] = [],
    existingPhrases: SpeechPhrase[] = []
): ClippingsImportResult {
    // Track all existing IDs to avoid conflicts
    const existingIds = new Set<string>();
    existingCategories.forEach(c => existingIds.add(c.id));
    existingPhrases.forEach(p => existingIds.add(p.id));

    // Build a map of existing category paths to IDs for duplicate detection
    const categoryPathMap = buildCategoryPathMap(existingCategories);

    // Track modified phrases (orphaned phrases that were moved to a category)
    const modifiedPhrases = new Set<SpeechPhrase>();

    const categories: SpeechPhraseCategory[] = [];
    const phrases: SpeechPhrase[] = [];

    // Process root level folders
    for (const folder of exportData.userClippingsRoot) {
        const result = processFolder(
            folder,
            '', // root level has empty parent path
            null, // root level has no parent ID
            [...existingCategories, ...categories],
            [...existingPhrases, ...phrases],
            existingIds,
            categoryPathMap,
            modifiedPhrases
        );
        categories.push(...result.categories);
        phrases.push(...result.phrases);
    }

    // Include modified phrases in the result so they get saved
    for (const phrase of modifiedPhrases) {
        phrases.push(phrase);
    }

    // Count folders and clippings in the export
    const countItems = (items: Array<ClippingFolder | ClippingItem>): { folders: number; clippings: number } => {
        let folders = 0;
        let clippings = 0;

        for (const item of items) {
            if ('children' in item) {
                folders++;
                const childCounts = countItems(item.children);
                folders += childCounts.folders;
                clippings += childCounts.clippings;
            } else {
                clippings++;
            }
        }

        return {folders, clippings};
    };

    const counts = countItems(exportData.userClippingsRoot);

    return {
        categories,
        phrases,
        statistics: {
            categoriesImported: categories.length,
            phrasesImported: phrases.length,
            foldersProcessed: counts.folders,
            clippingsProcessed: counts.clippings,
        },
    };
}

/**
 * Validate and parse Clippings JSON export
 */
export function validateAndParseClippings(
    jsonString: string,
    existingCategories: SpeechPhraseCategory[] = [],
    existingPhrases: SpeechPhrase[] = []
): { success: true; result: ClippingsImportResult } | { success: false; error: ClippingsImportError } {
    try {
        const exportData = JSON.parse(jsonString) as ClippingsExport;

        // Basic validation
        if (!exportData.version) {
            return {
                success: false,
                error: {
                    message: 'Invalid Clippings export format',
                    details: 'Missing version field',
                },
            };
        }

        if (!exportData.userClippingsRoot || !Array.isArray(exportData.userClippingsRoot)) {
            return {
                success: false,
                error: {
                    message: 'Invalid Clippings export format',
                    details: 'Missing or invalid userClippingsRoot field',
                },
            };
        }

        // Parse the export
        const result = parseClippingsExport(exportData, existingCategories, existingPhrases);

        return {success: true, result};
    } catch (error) {
        return {
            success: false,
            error: {
                message: 'Failed to parse JSON',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
        };
    }
}
