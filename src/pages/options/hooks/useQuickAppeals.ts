import {useEffect, useState} from 'react';
import type {QuickAppealsPreset, QuickAppealsPresetCategory} from '@src/shared/user-settings';
import {
    getQuickAppealsPresetCategories,
    getQuickAppealsPresets,
    saveQuickAppealsPresetCategories,
    saveQuickAppealsPresets,
} from '@src/shared/user-settings';
import {notify} from '@src/utils/notify';
import {loadAppealsCategories} from '../utils/arm-api';

export function useQuickAppeals() {
    const [quickAppealsPresets, setQuickAppealsPresets] = useState<QuickAppealsPreset[]>([]);
    const [presetCategories, setPresetCategories] = useState<QuickAppealsPresetCategory[]>([]);
    const [appealsCategories, setAppealsCategories] = useState<
        Array<{ value: string; label: string; title: string }>
    >([]);
    const [isLoadingCategories, setIsLoadingCategories] = useState(false);

    useEffect(() => {
        const loadPresets = async () => {
            const presets = await getQuickAppealsPresets();
            setQuickAppealsPresets(presets);
        };
        loadPresets();
    }, []);

    useEffect(() => {
        const loadCategories = async () => {
            const categories = await getQuickAppealsPresetCategories();
            if (categories.length > 0) {
                setPresetCategories(categories);
            } else {
                const defaultCategories = [
                    {id: 'internet-70', name: 'Интернет'},
                    {id: 'tv-101', name: 'Цифровое TV'},
                ];
                setPresetCategories(defaultCategories);
                await saveQuickAppealsPresetCategories(defaultCategories);
            }
        };
        loadCategories();
    }, []);

    const loadCategoriesFromArm = async (productId: number, processingGroupId: string) => {
        setIsLoadingCategories(true);
        setAppealsCategories([]);
        const categories = await loadAppealsCategories(productId, processingGroupId);
        setAppealsCategories(categories);
        setIsLoadingCategories(false);
    };

    const duplicateCategory = async (categoryId: string) => {
        const category = presetCategories.find((cat) => cat.id === categoryId);
        if (!category) return;

        const newCategory = {
            id: Date.now().toString(),
            name: `${category.name} (копия)`,
        };

        const updatedCategories = [...presetCategories, newCategory];
        setPresetCategories(updatedCategories);

        const success = await saveQuickAppealsPresetCategories(updatedCategories);
        if (success) {
            notify('Категории', `Категория "${category.name}" дублирована!`, 'success');
        } else {
            notify('Категории', 'Не удалось дублировать категорию', 'error');
        }
    };

    const duplicatePreset = async (presetId: string) => {
        const preset = quickAppealsPresets.find((p) => p.id === presetId);
        if (!preset) return;

        const newPreset = {
            ...preset,
            id: Date.now().toString(),
            name: `${preset.name} (копия)`,
        };

        const updatedPresets = [...quickAppealsPresets, newPreset];
        setQuickAppealsPresets(updatedPresets);

        const success = await saveQuickAppealsPresets(updatedPresets);
        if (success) {
            notify('Быстрые обращения', `Пресет "${preset.name}" дублирован!`, 'success');
        } else {
            notify('Быстрые обращения', 'Не удалось дублировать пресет', 'error');
        }
    };

    const removePreset = async (presetId: string) => {
        const updatedPresets = quickAppealsPresets.filter((preset) => preset.id !== presetId);
        setQuickAppealsPresets(updatedPresets);

        const success = await saveQuickAppealsPresets(updatedPresets);
        if (success) {
            notify('Быстрые обращения', 'Пресет удалён', 'success');
        } else {
            notify('Быстрые обращения', 'Не удалось удалить пресет', 'error');
        }
    };

    const createNewCategory = async (name: string) => {
        if (!name.trim()) {
            notify('Категории', 'Введите название категории', 'error');
            return;
        }

        const newCategory = {
            id: Date.now().toString(),
            name: name.trim(),
        };

        const updatedCategories = [...presetCategories, newCategory];
        setPresetCategories(updatedCategories);

        const success = await saveQuickAppealsPresetCategories(updatedCategories);
        if (success) {
            notify('Категории', `Категория "${newCategory.name}" создана!`, 'success');
        } else {
            notify('Категории', 'Не удалось создать категорию', 'error');
        }

        return newCategory;
    };

    const deleteCategory = async (categoryId: string) => {
        const updatedCategories = presetCategories.filter((cat) => cat.id !== categoryId);
        setPresetCategories(updatedCategories);

        const updatedPresets = quickAppealsPresets.map((preset) => {
            if (preset.categoryId === categoryId) {
                return {...preset, categoryId: null};
            }
            return preset;
        });
        setQuickAppealsPresets(updatedPresets);

        const success1 = await saveQuickAppealsPresetCategories(updatedCategories);
        const success2 = await saveQuickAppealsPresets(updatedPresets);
        if (success1 && success2) {
            notify('Категории', 'Категория удалена', 'success');
        } else {
            notify('Категории', 'Не удалось удалить категорию', 'error');
        }
    };

    const saveEditCategory = async (categoryId: string, name: string) => {
        if (!categoryId || !name.trim()) {
            notify('Категории', 'Введите название категории', 'error');
            return;
        }

        const updatedCategories = presetCategories.map((cat) => {
            if (cat.id === categoryId) {
                return {...cat, name: name.trim()};
            }
            return cat;
        });
        setPresetCategories(updatedCategories);

        await saveQuickAppealsPresetCategories(updatedCategories);
    };

    const savePreset = async (preset: QuickAppealsPreset, isEditing: boolean) => {
        let updatedPresets: QuickAppealsPreset[];

        if (isEditing) {
            updatedPresets = quickAppealsPresets.map((p) => (p.id === preset.id ? preset : p));
        } else {
            updatedPresets = [...quickAppealsPresets, preset];
        }

        setQuickAppealsPresets(updatedPresets);

        const success = await saveQuickAppealsPresets(updatedPresets);
        if (success) {
            notify('Быстрые обращения', `Пресет "${preset.name}" ${isEditing ? 'обновлён' : 'сохранён'}!`, 'success');
        } else {
            notify('Быстрые обращения', 'Не удалось сохранить пресет', 'error');
        }

        return success;
    };

    const mergeImportedData = async (
        newPresets: QuickAppealsPreset[],
        newCategories: QuickAppealsPresetCategory[]
    ) => {
        const mergedPresets = [...quickAppealsPresets, ...newPresets];
        const mergedCategories = [...presetCategories, ...newCategories];

        setQuickAppealsPresets(mergedPresets);
        setPresetCategories(mergedCategories);

        await saveQuickAppealsPresets(mergedPresets);
        await saveQuickAppealsPresetCategories(mergedCategories);

        return {mergedPresets, mergedCategories};
    };

    return {
        quickAppealsPresets,
        setQuickAppealsPresets,
        presetCategories,
        setPresetCategories,
        appealsCategories,
        setAppealsCategories,
        isLoadingCategories,
        loadCategoriesFromArm,
        duplicateCategory,
        duplicatePreset,
        removePreset,
        createNewCategory,
        deleteCategory,
        saveEditCategory,
        savePreset,
        mergeImportedData,
    };
}
