import type {QuickAppealsPreset, QuickAppealsPresetCategory} from '@src/shared/user-settings';
import {notify} from '@src/utils/notify';

export function exportPresets(
    presetCategories: QuickAppealsPresetCategory[],
    quickAppealsPresets: QuickAppealsPreset[]
): void {
    const data = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        categories: presetCategories,
        presets: quickAppealsPresets,
    };

    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `quick-appeals-presets-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);

    notify('Быстрые обращения', `Экспортировано ${quickAppealsPresets.length} пресетов!`, 'success');
}

export async function copySinglePreset(preset: QuickAppealsPreset): Promise<void> {
    const presetData = JSON.stringify(preset, null, 2);

    try {
        await navigator.clipboard.writeText(presetData);
        notify('Быстрые обращения', `Пресет "${preset.name}" скопирован в буфер обмена!`, 'success');
    } catch {
        notify('Быстрые обращения', 'Не удалось скопировать пресет', 'error');
    }
}

export async function importPresets(
    event: React.ChangeEvent<HTMLInputElement>,
    presetCategories: QuickAppealsPresetCategory[],
    quickAppealsPresets: QuickAppealsPreset[]
): Promise<{
    newPresets: QuickAppealsPreset[];
    newCategories: QuickAppealsPresetCategory[];
}> {
    const file = event.target.files?.[0];
    if (!file) {
        return {newPresets: [], newCategories: []};
    }

    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const importedData = JSON.parse(e.target?.result as string);
                const result = await processImportedData(importedData, presetCategories, quickAppealsPresets);
                resolve(result);
            } catch {
                notify('Быстрые обращения', 'Ошибка при импорте. Проверьте формат файла.', 'error');
                resolve({newPresets: [], newCategories: []});
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    });
}

export async function importPresetsFromClipboard(
    presetCategories: QuickAppealsPresetCategory[],
    quickAppealsPresets: QuickAppealsPreset[]
): Promise<{
    newPresets: QuickAppealsPreset[];
    newCategories: QuickAppealsPresetCategory[];
}> {
    try {
        const clipboardText = await navigator.clipboard.readText();
        if (!clipboardText.trim()) {
            notify('Быстрые обращения', 'Буфер обмена пуст', 'error');
            return {newPresets: [], newCategories: []};
        }

        const importedData = JSON.parse(clipboardText);
        return await processImportedData(importedData, presetCategories, quickAppealsPresets);
    } catch {
        notify('Быстрые обращения', 'Ошибка при импорте из буфера обмена. Проверьте формат данных.', 'error');
        return {newPresets: [], newCategories: []};
    }
}

async function processImportedData(
    importedData: any,
    presetCategories: QuickAppealsPresetCategory[],
    quickAppealsPresets: QuickAppealsPreset[]
): Promise<{
    newPresets: QuickAppealsPreset[];
    newCategories: QuickAppealsPresetCategory[];
}> {
    let presetsToAdd: QuickAppealsPreset[] = [];
    let categoriesToAdd: QuickAppealsPresetCategory[] = [];

    if (importedData.presets && Array.isArray(importedData.presets)) {
        presetsToAdd = importedData.presets;
        categoriesToAdd = importedData.categories || [];
    } else if (importedData.id && importedData.name) {
        presetsToAdd = [importedData];
    }

    const categoryIdMap = new Map<string, string | null>();
    const newCategories: QuickAppealsPresetCategory[] = [];

    categoriesToAdd.forEach((importedCategory) => {
        const existingCategory = presetCategories.find((cat) => cat.name === importedCategory.name);
        if (existingCategory) {
            categoryIdMap.set(importedCategory.id, existingCategory.id);
        } else {
            const newCategoryId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
            const newCategory: QuickAppealsPresetCategory = {
                ...importedCategory,
                id: newCategoryId,
            };
            newCategories.push(newCategory);
            categoryIdMap.set(importedCategory.id, newCategoryId);
        }
    });

    const newPresets: QuickAppealsPreset[] = [];
    let skippedPresets = 0;

    presetsToAdd.forEach((importedPreset) => {
        const targetCategoryId = importedPreset.categoryId
            ? categoryIdMap.get(importedPreset.categoryId) ?? null
            : null;

        const existingPreset = quickAppealsPresets.find(
            (preset) =>
                preset.name === importedPreset.name && preset.categoryId === targetCategoryId
        );

        if (existingPreset) {
            skippedPresets++;
        } else {
            const newPreset: QuickAppealsPreset = {
                ...importedPreset,
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                categoryId: targetCategoryId,
            };
            newPresets.push(newPreset);
        }
    });

    const messageParts = [];
    if (newPresets.length > 0) {
        messageParts.push(`${newPresets.length} новых пресетов`);
    }
    if (newCategories.length > 0) {
        messageParts.push(`${newCategories.length} новых категорий`);
    }
    if (skippedPresets > 0) {
        messageParts.push(`${skippedPresets} пропущено (дубликаты)`);
    }

    notify(
        'Быстрые обращения',
        `Импортировано: ${messageParts.join(', ')}`,
        'success'
    );

    return {newPresets, newCategories};
}

export function exportSettings(settings: Record<string, Record<string, boolean>>): void {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `helper-settings-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
}

export async function importSettings(
    event: React.ChangeEvent<HTMLInputElement>
): Promise<Record<string, Record<string, boolean>> | null> {
    const file = event.target.files?.[0];
    if (!file) return null;

    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const importedSettings = JSON.parse(e.target?.result as string);
                notify('Настройки', 'Настройки успешно импортированы!', 'success');
                resolve(importedSettings);
            } catch {
                notify('Настройки', 'Ошибка при импорте настроек. Проверьте файл.', 'error');
                resolve(null);
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    });
}
