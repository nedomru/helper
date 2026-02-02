import {useEffect, useState} from 'react';
import type {CategoryTreeNode, SpeechPhrase, SpeechPhraseCategory} from '@src/shared/speech-phrases';
import {
    buildCategoryTree,
    getCategoryPathString,
    getSpeechPhraseCategories,
    getSpeechPhrases,
    saveSpeechPhraseCategories,
    saveSpeechPhrases,
    validateCategoryMove,
} from '@src/shared/speech-phrases';
import {notify} from '@src/utils/notify';
import {validateAndParseClippings} from '@src/pages/options/utils/clippingsParser';
import {importGenesysPhrases, isGenesysPhrases} from '@src/pages/options/utils/genesysParser';
import {importQuickTextPaste, isQuickTextPasteContent} from '@src/pages/options/utils/quickTextPasteParser';

export function useSpeechPhrases() {
    const [phrases, setPhrases] = useState<SpeechPhrase[]>([]);
    const [categories, setCategories] = useState<SpeechPhraseCategory[]>([]);
    const [isCreatingPhrase, setIsCreatingPhrase] = useState(false);
    const [isCreatingCategory, setIsCreatingCategory] = useState(false);
    const [editingPhraseId, setEditingPhraseId] = useState<string | null>(null);
    const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);

    // New phrase form state
    const [newPhraseShortcut, setNewPhraseShortcut] = useState('');
    const [newPhraseName, setNewPhraseName] = useState('');
    const [newPhraseText, setNewPhraseText] = useState('');
    const [newPhraseCategoryId, setNewPhraseCategoryId] = useState<string | null>(null);

    // New category form state
    const [newCategoryName, setNewCategoryName] = useState('');

    // Edit phrase form state
    const [editPhraseShortcut, setEditPhraseShortcut] = useState('');
    const [editPhraseName, setEditPhraseName] = useState('');
    const [editPhraseText, setEditPhraseText] = useState('');
    const [editPhraseCategoryId, setEditPhraseCategoryId] = useState<string | null>(null);

    // Edit category form state
    const [editCategoryName, setEditCategoryName] = useState('');

    useEffect(() => {
        const loadPhrases = async () => {
            const loadedPhrases = await getSpeechPhrases();
            setPhrases(loadedPhrases);
        };
        loadPhrases();
    }, []);

    useEffect(() => {
        const loadCategories = async () => {
            const loadedCategories = await getSpeechPhraseCategories();
            if (loadedCategories.length > 0) {
                setCategories(loadedCategories);
            } else {
                const defaultCategories = [
                    {id: 'greetings', name: 'Приветствия'},
                    {id: 'farewells', name: 'Прощания'},
                    {id: 'technical', name: 'Технические фразы'},
                    {id: 'common', name: 'Общие фразы'},
                ];
                setCategories(defaultCategories);
                await saveSpeechPhraseCategories(defaultCategories);
            }
        };
        loadCategories();
    }, []);

    const startCreatePhrase = () => {
        setIsCreatingPhrase(true);
        setNewPhraseShortcut('');
        setNewPhraseName('');
        setNewPhraseText('');
        setNewPhraseCategoryId(null);
    };

    const cancelCreatePhrase = () => {
        setIsCreatingPhrase(false);
        setNewPhraseShortcut('');
        setNewPhraseName('');
        setNewPhraseText('');
        setNewPhraseCategoryId(null);
    };

    const savePhrase = async () => {
        if (!newPhraseName.trim() || !newPhraseText.trim()) {
            notify('Речевые модули', 'Заполните название и текст фразы', 'error');
            return;
        }

        const shortcut = newPhraseShortcut.trim();

        // Check if shortcut already exists (only if shortcut is provided)
        if (shortcut && phrases.some(p => p.shortcut === shortcut)) {
            notify('Речевые модули', 'Такое сокращение уже существует', 'error');
            return;
        }

        const newPhrase: SpeechPhrase = {
            id: Date.now().toString(),
            shortcut: shortcut || null,
            name: newPhraseName.trim(),
            text: newPhraseText.trim(),
            categoryId: newPhraseCategoryId,
        };

        const updatedPhrases = [...phrases, newPhrase];
        setPhrases(updatedPhrases);

        const success = await saveSpeechPhrases(updatedPhrases);
        if (success) {
            notify('Речевые модули', `Фраза "${newPhrase.name}" создана!`, 'success');
            cancelCreatePhrase();
        } else {
            notify('Речевые модули', 'Не удалось создать фразу', 'error');
        }
    };

    const startEditPhrase = (phraseId: string) => {
        const phrase = phrases.find(p => p.id === phraseId);
        if (!phrase) return;

        setEditingPhraseId(phraseId);
        setEditPhraseShortcut(phrase.shortcut || '');
        setEditPhraseName(phrase.name);
        setEditPhraseText(phrase.text);
        setEditPhraseCategoryId(phrase.categoryId || null);
    };

    const cancelEditPhrase = () => {
        setEditingPhraseId(null);
        setEditPhraseShortcut('');
        setEditPhraseName('');
        setEditPhraseText('');
        setEditPhraseCategoryId(null);
    };

    const updatePhrase = async () => {
        if (!editingPhraseId || !editPhraseName?.trim() || !editPhraseText?.trim()) {
            notify('Речевые модули', 'Заполните название и текст фразы', 'error');
            return;
        }

        const shortcut = editPhraseShortcut?.trim() || null;

        // Check if shortcut already exists (excluding current phrase, only if shortcut is provided)
        if (shortcut && phrases.some(p => p.shortcut === shortcut && p.id !== editingPhraseId)) {
            notify('Речевые модули', 'Такое сокращение уже существует', 'error');
            return;
        }

        const updatedPhrases = phrases.map(p => {
            if (p.id === editingPhraseId) {
                return {
                    ...p,
                    shortcut: shortcut,
                    name: editPhraseName.trim(),
                    text: editPhraseText.trim(),
                    categoryId: editPhraseCategoryId,
                };
            }
            return p;
        });

        setPhrases(updatedPhrases);

        const success = await saveSpeechPhrases(updatedPhrases);
        if (success) {
            notify('Речевые модули', 'Фраза обновлена!', 'success');
            cancelEditPhrase();
        } else {
            notify('Речевые модули', 'Не удалось обновить фразу', 'error');
        }
    };

    const deletePhrase = async (phraseId: string) => {
        const phrase = phrases.find(p => p.id === phraseId);
        if (!phrase) return;

        if (!confirm(`Удалить фразу "${phrase.name}"?`)) {
            return;
        }

        const updatedPhrases = phrases.filter(p => p.id !== phraseId);
        setPhrases(updatedPhrases);

        const success = await saveSpeechPhrases(updatedPhrases);
        if (success) {
            notify('Речевые модули', 'Фраза удалена', 'success');
        } else {
            notify('Речевые модули', 'Не удалось удалить фразу', 'error');
        }
    };

    const duplicatePhrase = async (phraseId: string) => {
        const phrase = phrases.find(p => p.id === phraseId);
        if (!phrase) return;

        const newPhrase: SpeechPhrase = {
            id: Date.now().toString(),
            shortcut: phrase.shortcut ? `${phrase.shortcut}-copy` : null,
            name: `${phrase.name} (копия)`,
            text: phrase.text,
            categoryId: phrase.categoryId,
        };

        const updatedPhrases = [...phrases, newPhrase];
        setPhrases(updatedPhrases);

        const success = await saveSpeechPhrases(updatedPhrases);
        if (success) {
            notify('Речевые модули', `Фраза "${phrase.name}" дублирована!`, 'success');
        } else {
            notify('Речевые модули', 'Не удалось дублировать фразу', 'error');
        }
    };

    const startCreateCategory = () => {
        setIsCreatingCategory(true);
        setNewCategoryName('');
    };

    const cancelCreateCategory = () => {
        setIsCreatingCategory(false);
        setNewCategoryName('');
    };

    const startEditCategory = (categoryId: string) => {
        const category = categories.find(c => c.id === categoryId);
        if (!category) return;

        setEditingCategoryId(categoryId);
        setEditCategoryName(category.name);
    };

    const cancelEditCategory = () => {
        setEditingCategoryId(null);
        setEditCategoryName('');
    };

    const duplicateCategory = async (categoryId: string) => {
        const category = categories.find(c => c.id === categoryId);
        if (!category) return;

        const newCategory: SpeechPhraseCategory = {
            id: Date.now().toString(),
            name: `${category.name} (копия)`,
        };

        const updatedCategories = [...categories, newCategory];
        setCategories(updatedCategories);

        const success = await saveSpeechPhraseCategories(updatedCategories);
        if (success) {
            notify('Речевые модули', `Категория "${category.name}" дублирована!`, 'success');
        } else {
            notify('Речевые модули', 'Не удалось дублировать категорию', 'error');
        }
    };

    // Tree management functions
    const getCategoryTree = (): CategoryTreeNode[] => {
        return buildCategoryTree(categories);
    };

    const moveCategory = async (categoryId: string, newParentId: string | null) => {
        const category = categories.find(c => c.id === categoryId);
        if (!category) {
            notify('Речевые модули', 'Категория не найдена', 'error');
            return;
        }

        // Validate move (prevent circular references)
        if (!validateCategoryMove(categoryId, newParentId, categories)) {
            notify('Речевые модули', 'Нельзя переместить категорию в себя или в её дочернюю категорию', 'error');
            return;
        }

        const updatedCategories = categories.map(c => {
            if (c.id === categoryId) {
                return {...c, parentId: newParentId};
            }
            return c;
        });

        setCategories(updatedCategories);

        const success = await saveSpeechPhraseCategories(updatedCategories);
        if (success) {
            const parentName = newParentId
                ? getCategoryPathString(newParentId, updatedCategories)
                : 'корень';
            notify('Речевые модули', `Категория "${category.name}" перемещена в "${parentName}"`, 'success');
        } else {
            notify('Речевые модули', 'Не удалось переместить категорию', 'error');
        }
    };

    // Add parent selection for new categories
    const [newCategoryParentId, setNewCategoryParentId] = useState<string | null>(null);
    const [editingCategoryParentId, setEditingCategoryParentId] = useState<string | null>(null);

    // Update saveCategory to support parent
    const saveCategoryWithParent = async () => {
        if (!newCategoryName.trim()) {
            notify('Речевые модули', 'Введите название категории', 'error');
            return;
        }

        const newCategory: SpeechPhraseCategory = {
            id: Date.now().toString(),
            name: newCategoryName.trim(),
            parentId: newCategoryParentId,
        };

        const updatedCategories = [...categories, newCategory];
        setCategories(updatedCategories);

        const success = await saveSpeechPhraseCategories(updatedCategories);
        if (success) {
            notify('Речевые модули', `Категория "${newCategory.name}" создана!`, 'success');
            setNewCategoryParentId(null);
            cancelCreateCategory();
        } else {
            notify('Речевые модули', 'Не удалось создать категорию', 'error');
        }
    };

    // Update updateCategory to support parent changes
    const updateCategoryWithParent = async () => {
        if (!editingCategoryId || !editCategoryName.trim()) {
            notify('Речевые модули', 'Введите название категории', 'error');
            return;
        }

        const currentCategory = categories.find(c => c.id === editingCategoryId);
        if (!currentCategory) return;

        // Check if parent is changing
        const newParentId = editingCategoryParentId !== undefined ? editingCategoryParentId : currentCategory.parentId;

        // Validate move if parent is changing
        if (newParentId !== currentCategory.parentId && !validateCategoryMove(editingCategoryId, newParentId, categories)) {
            notify('Речевые модули', 'Нельзя переместить категорию в себя или в её дочернюю категорию', 'error');
            return;
        }

        const updatedCategories = categories.map(c => {
            if (c.id === editingCategoryId) {
                return {
                    ...c,
                    name: editCategoryName.trim(),
                    parentId: editingCategoryParentId !== undefined ? editingCategoryParentId : c.parentId,
                };
            }
            return c;
        });

        setCategories(updatedCategories);

        const success = await saveSpeechPhraseCategories(updatedCategories);
        if (success) {
            notify('Речевые модули', 'Категория обновлена!', 'success');
            setEditingCategoryParentId(null);
            cancelEditCategory();
        } else {
            notify('Речевые модули', 'Не удалось обновить категорию', 'error');
        }
    };

    // Update deleteCategory to handle children properly
    const deleteCategoryWithChildren = async (categoryId: string, moveChildrenToParent: boolean = false) => {
        const category = categories.find(c => c.id === categoryId);
        if (!category) return;

        const childCategories = categories.filter(c => c.parentId === categoryId);
        const categoryPhrasesCount = phrases.filter(p => p.categoryId === categoryId).length;

        let confirmMessage = `Удалить категорию "${category.name}"?`;
        if (categoryPhrasesCount > 0) {
            confirmMessage += ` ${categoryPhrasesCount} фраз(ы) в этой категории станут без категории.`;
        }
        if (childCategories.length > 0 && !moveChildrenToParent) {
            confirmMessage += ` ${childCategories.length} дочерних категорий также будут удалены.`;
        }

        if (!confirm(confirmMessage)) {
            return;
        }

        let updatedCategories = categories;

        if (childCategories.length > 0 && moveChildrenToParent) {
            // Move children to the deleted category's parent
            const newParentId = category.parentId || null;
            updatedCategories = categories.map(c => {
                if (c.parentId === categoryId) {
                    return {...c, parentId: newParentId};
                }
                return c;
            });
        }

        // Remove the category (and its children if not moving)
        updatedCategories = updatedCategories.filter(c => {
            if (c.id === categoryId) return false;
            if (!moveChildrenToParent) {
                // Check if this category is a descendant
                let currentId = c.parentId;
                while (currentId) {
                    if (currentId === categoryId) return false;
                    const parent = categories.find(cat => cat.id === currentId);
                    currentId = parent?.parentId || '';
                }
            }
            return true;
        });

        setCategories(updatedCategories);

        // Update phrases to remove category reference
        const updatedPhrases = phrases.map(p => {
            if (p.categoryId === categoryId) {
                return {...p, categoryId: null};
            }
            return p;
        });
        setPhrases(updatedPhrases);

        const success1 = await saveSpeechPhraseCategories(updatedCategories);
        const success2 = await saveSpeechPhrases(updatedPhrases);
        if (success1 && success2) {
            notify('Речевые модули', 'Категория удалена', 'success');
        } else {
            notify('Речевые модули', 'Не удалось удалить категорию', 'error');
        }
    };

    const movePhrase = async (phraseId: string, categoryId: string | null) => {
        const updatedPhrases = phrases.map(p => {
            if (p.id === phraseId) {
                return {...p, categoryId};
            }
            return p;
        });

        setPhrases(updatedPhrases);

        const success = await saveSpeechPhrases(updatedPhrases);
        if (success) {
            const categoryName = categoryId
                ? getCategoryPathString(categoryId, updatedPhrases
                    .filter(p => p.categoryId === categoryId)
                    .map(p => p.name)
                    .join(', '))
                : 'корень';
            notify('Речевые модули', 'Фраза перемещена', 'success');
        } else {
            notify('Речевые модули', 'Не удалось переместить фразу', 'error');
        }
    };

    const importClippings = async (file: File): Promise<boolean> => {
        try {
            const jsonString = await file.text();
            const parseResult = validateAndParseClippings(jsonString, categories, phrases);

            if (!parseResult.success) {
                notify(
                    'Импорт Clippings',
                    `Ошибка: ${parseResult.error.message}${parseResult.error.details ? ` (${parseResult.error.details})` : ''}`,
                    'error'
                );
                return false;
            }

            const {categories: newCategories, phrases: newPhrases, statistics} = parseResult.result;

            if (newCategories.length === 0 && newPhrases.length === 0) {
                notify('Импорт Clippings', 'Все элементы уже существуют (нет новых данных для импорта)', 'error');
                return false;
            }

            // Merge with existing data
            const mergedCategories = [...categories, ...newCategories];
            const mergedPhrases = [...phrases, ...newPhrases];

            // Save categories
            const categoriesSaved = await saveSpeechPhraseCategories(mergedCategories);
            if (!categoriesSaved) {
                notify('Импорт Clippings', 'Не удалось сохранить категории', 'error');
                return false;
            }

            // Save phrases
            const phrasesSaved = await saveSpeechPhrases(mergedPhrases);
            if (!phrasesSaved) {
                notify('Импорт Clippings', 'Не удалось сохранить фразы', 'error');
                return false;
            }

            // Update state
            setCategories(mergedCategories);
            setPhrases(mergedPhrases);

            // Calculate skipped items
            const skippedCategories = statistics.foldersProcessed - statistics.categoriesImported;
            const skippedPhrases = statistics.clippingsProcessed - statistics.phrasesImported;

            // Show success message
            const messages: string[] = [];
            if (statistics.categoriesImported > 0) {
                messages.push(`${statistics.categoriesImported} категорий`);
            }
            if (statistics.phrasesImported > 0) {
                messages.push(`${statistics.phrasesImported} фраз`);
            }

            let message = `Импортировано: ${messages.join(', ')}`;
            if (skippedCategories > 0 || skippedPhrases > 0) {
                const skipped: string[] = [];
                if (skippedCategories > 0) {
                    skipped.push(`${skippedCategories} категорий`);
                }
                if (skippedPhrases > 0) {
                    skipped.push(`${skippedPhrases} фраз`);
                }
                message += ` (пропущено: ${skipped.join(', ')})`;
            }

            notify(
                'Импорт Clippings',
                message,
                'success'
            );

            return true;
        } catch (error) {
            notify(
                'Импорт Clippings',
                `Ошибка чтения файла: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`,
                'error'
            );
            return false;
        }
    };

    const importGenesys = async (file: File): Promise<boolean> => {
        try {
            const {categories: newCategories, phrases: newPhrases} = await importGenesysPhrases(
                file,
                categories,
                phrases
            );

            if (newCategories.length === 0 && newPhrases.length === 0) {
                return false;
            }

            // Merge with existing data
            const mergedCategories = [...categories, ...newCategories];
            const mergedPhrases = [...phrases, ...newPhrases];

            // Save categories
            const categoriesSaved = await saveSpeechPhraseCategories(mergedCategories);
            if (!categoriesSaved) {
                notify('Импорт Genesys', 'Не удалось сохранить категории', 'error');
                return false;
            }

            // Save phrases
            const phrasesSaved = await saveSpeechPhrases(mergedPhrases);
            if (!phrasesSaved) {
                notify('Импорт Genesys', 'Не удалось сохранить фразы', 'error');
                return false;
            }

            // Update state
            setCategories(mergedCategories);
            setPhrases(mergedPhrases);

            // Show success message
            const messages: string[] = [];
            if (newCategories.length > 0) {
                messages.push(`${newCategories.length} категорий`);
            }
            if (newPhrases.length > 0) {
                messages.push(`${newPhrases.length} фраз`);
            }

            notify(
                'Импорт Genesys',
                `Импортировано: ${messages.join(', ')}`,
                'success'
            );

            return true;
        } catch (error) {
            notify(
                'Импорт Genesys',
                `Ошибка чтения файла: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`,
                'error'
            );
            return false;
        }
    };

    const importQuickTextPasteFile = async (fileOrText: File | string): Promise<boolean> => {
        try {
            const {categories: newCategories, phrases: newPhrases} = await importQuickTextPaste(
                fileOrText,
                categories,
                phrases
            );

            if (newCategories.length === 0 && newPhrases.length === 0) {
                return false;
            }

            // Merge with existing data
            const mergedCategories = [...categories, ...newCategories];
            const mergedPhrases = [...phrases, ...newPhrases];

            // Save categories
            const categoriesSaved = await saveSpeechPhraseCategories(mergedCategories);
            if (!categoriesSaved) {
                notify('Импорт QuickTextPaste', 'Не удалось сохранить категории', 'error');
                return false;
            }

            // Save phrases
            const phrasesSaved = await saveSpeechPhrases(mergedPhrases);
            if (!phrasesSaved) {
                notify('Импорт QuickTextPaste', 'Не удалось сохранить фразы', 'error');
                return false;
            }

            // Update state
            setCategories(mergedCategories);
            setPhrases(mergedPhrases);

            // Show success message
            const messages: string[] = [];
            if (newCategories.length > 0) {
                messages.push(`${newCategories.length} категорий`);
            }
            if (newPhrases.length > 0) {
                messages.push(`${newPhrases.length} фраз`);
            }

            notify(
                'Импорт QuickTextPaste',
                `Импортировано: ${messages.join(', ')}`,
                'success'
            );

            return true;
        } catch (error) {
            notify(
                'Импорт QuickTextPaste',
                `Ошибка чтения файла: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`,
                'error'
            );
            return false;
        }
    };

    const importPhrases = async (file: File): Promise<boolean> => {
        try {
            let text = await file.text();

            // Handle UTF-16LE encoding (common for QuickTextPaste on Windows)
            let decodedText = text;
            if (!text.includes('[list_text]')) {
                try {
                    const buffer = await file.arrayBuffer();
                    const decoder = new TextDecoder('utf-16le');
                    const decoded = decoder.decode(buffer);

                    // Remove BOM if present
                    decodedText = decoded.charCodeAt(0) === 0xFEFF ? decoded.slice(1) : decoded;

                    // Check if decoding was successful
                    if (decodedText.includes('[list_text]')) {
                        text = decodedText;
                    }
                } catch {
                    // If UTF-16LE fails, continue with original text
                }
            }

            // Check for QuickTextPaste INI format
            if (isQuickTextPasteContent(text)) {
                return importQuickTextPasteFile(text);
            }

            // Try to parse as JSON
            let data;
            try {
                data = JSON.parse(text);
            } catch {
                notify('Импорт фраз', 'Неизвестный формат файла. Поддерживаются Clippings, Genesys и QuickTextPaste форматы.', 'error');
                return false;
            }

            // Detect format: Clippings or Genesys
            if (isGenesysPhrases(data)) {
                return importGenesys(file);
            } else if (data.version && data.userClippingsRoot) {
                return importClippings(file);
            } else {
                notify('Импорт фраз', 'Неизвестный формат файла. Поддерживаются Clippings, Genesys и QuickTextPaste форматы.', 'error');
                return false;
            }
        } catch (error) {
            notify('Импорт фраз', `Ошибка чтения файла: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`, 'error');
            return false;
        }
    };

    const clearAll = async (): Promise<boolean> => {
        if (phrases.length === 0 && categories.length === 0) {
            notify('Речевые модули', 'Нет данных для очистки', 'error');
            return false;
        }

        const categoryCount = categories.length;
        const phraseCount = phrases.length;

        if (!confirm(
            `Вы уверены, что хотите удалить ВСЕ данные?\n\nЭто действие удалит:\n- ${categoryCount} категорий\n- ${phraseCount} фраз\n\nЭто действие нельзя отменить.`
        )) {
            return false;
        }

        // Double confirmation for safety
        if (!confirm(
            `ПОДТВЕРДИТЕ УДАЛЕНИЕ ВСЕХ ДАННЫХ\n\nЭто окончательное удаление всех категорий и фраз.\n\nВведите "ОК" для подтверждения.`
        )) {
            return false;
        }

        // Clear all data
        const categoriesCleared = await saveSpeechPhraseCategories([]);
        const phrasesCleared = await saveSpeechPhrases([]);

        if (!categoriesCleared || !phrasesCleared) {
            notify('Речевые модули', 'Не удалось очистить данные', 'error');
            return false;
        }

        // Update state
        setCategories([]);
        setPhrases([]);

        notify('Речевые модули', 'Все данные удалены', 'success');
        return true;
    };

    return {
        phrases,
        categories,
        isCreatingPhrase,
        isCreatingCategory,
        editingPhraseId,
        editingCategoryId,
        newPhraseShortcut,
        newPhraseName,
        newPhraseText,
        newPhraseCategoryId,
        newCategoryName,
        editPhraseShortcut,
        editPhraseName,
        editPhraseText,
        editPhraseCategoryId,
        editCategoryName,
        setNewPhraseShortcut,
        setNewPhraseName,
        setNewPhraseText,
        setNewPhraseCategoryId,
        setNewCategoryName,
        setEditPhraseShortcut,
        setEditPhraseName,
        setEditPhraseText,
        setEditPhraseCategoryId,
        setEditCategoryName,
        startCreatePhrase,
        cancelCreatePhrase,
        savePhrase,
        startEditPhrase,
        cancelEditPhrase,
        updatePhrase,
        deletePhrase,
        duplicatePhrase,
        startCreateCategory,
        cancelCreateCategory,
        saveCategory: saveCategoryWithParent,
        startEditCategory,
        cancelEditCategory,
        updateCategory: updateCategoryWithParent,
        deleteCategory: deleteCategoryWithChildren,
        duplicateCategory,
        // Tree management
        getCategoryTree,
        moveCategory,
        movePhrase,
        getCategoryPath: (id: string) => getCategoryPathString(id, categories),
        newCategoryParentId,
        setNewCategoryParentId,
        editingCategoryParentId,
        setEditingCategoryParentId,
        // Import
        importClippings,
        importPhrases,
        // Clear all
        clearAll,
    };
}
