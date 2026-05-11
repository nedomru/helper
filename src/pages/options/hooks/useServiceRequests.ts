import {useEffect, useState} from 'react';
import type {
    ServiceRequestPreset,
    ServiceRequestPresetCategory,
} from '@src/shared/user-settings';
import {
    getServiceRequestPresetCategories,
    getServiceRequestPresets,
    saveServiceRequestPresetCategories,
    saveServiceRequestPresets,
} from '@src/shared/user-settings';
import {notify} from '@src/utils/notify';

const TITLE = 'Быстрые сервисные заявки';

export function useServiceRequests() {
    const [presets, setPresets] = useState<ServiceRequestPreset[]>([]);
    const [categories, setCategories] = useState<ServiceRequestPresetCategory[]>([]);

    useEffect(() => {
        (async () => {
            const list = await getServiceRequestPresets();
            setPresets(list);
        })();
    }, []);

    useEffect(() => {
        (async () => {
            const list = await getServiceRequestPresetCategories();
            const normalized = list
                .map((c, i) => ({...c, order: c.order ?? i}))
                .sort((a, b) => a.order - b.order);
            setCategories(normalized);
        })();
    }, []);

    const savePreset = async (preset: ServiceRequestPreset) => {
        const updated = presets.some((p) => p.id === preset.id)
            ? presets.map((p) => (p.id === preset.id ? preset : p))
            : [...presets, preset];
        setPresets(updated);
        const ok = await saveServiceRequestPresets(updated);
        notify(TITLE, ok ? `Пресет "${preset.name}" сохранён` : 'Не удалось сохранить', ok ? 'success' : 'error');
        return ok;
    };

    const removePreset = async (id: string) => {
        const updated = presets.filter((p) => p.id !== id);
        setPresets(updated);
        const ok = await saveServiceRequestPresets(updated);
        notify(TITLE, ok ? 'Пресет удалён' : 'Не удалось удалить пресет', ok ? 'success' : 'error');
    };

    const duplicatePreset = async (id: string) => {
        const src = presets.find((p) => p.id === id);
        if (!src) return;
        const copy: ServiceRequestPreset = {
            ...src,
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            name: `${src.name} (копия)`,
        };
        const updated = [...presets, copy];
        setPresets(updated);
        const ok = await saveServiceRequestPresets(updated);
        notify(TITLE, ok ? `Пресет дублирован` : 'Не удалось дублировать', ok ? 'success' : 'error');
    };

    const createCategory = async (name: string) => {
        const trimmed = name.trim();
        if (!trimmed) {
            notify(TITLE, 'Введите название категории', 'error');
            return null;
        }
        const cat: ServiceRequestPresetCategory = {
            id: Date.now().toString(),
            name: trimmed,
            order: categories.length,
        };
        const updated = [...categories, cat];
        setCategories(updated);
        await saveServiceRequestPresetCategories(updated);
        return cat;
    };

    const renameCategory = async (id: string, name: string) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        const updated = categories.map((c) => (c.id === id ? {...c, name: trimmed} : c));
        setCategories(updated);
        await saveServiceRequestPresetCategories(updated);
    };

    const deleteCategory = async (id: string) => {
        const updatedCats = categories.filter((c) => c.id !== id);
        setCategories(updatedCats);
        const updatedPresets = presets.map((p) => (p.categoryId === id ? {...p, categoryId: null} : p));
        setPresets(updatedPresets);
        await saveServiceRequestPresetCategories(updatedCats);
        await saveServiceRequestPresets(updatedPresets);
        notify(TITLE, 'Категория удалена', 'success');
    };

    const moveCategory = async (id: string, direction: -1 | 1) => {
        const idx = categories.findIndex((c) => c.id === id);
        if (idx < 0) return;
        const next = idx + direction;
        if (next < 0 || next >= categories.length) return;
        const updated = [...categories];
        [updated[idx], updated[next]] = [updated[next], updated[idx]];
        updated.forEach((c, i) => (c.order = i));
        setCategories(updated);
        await saveServiceRequestPresetCategories(updated);
    };

    const exportAll = () => {
        const data = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            categories,
            presets,
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `service-request-presets-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
        notify(TITLE, `Экспортировано ${presets.length} пресетов`, 'success');
    };

    const importFromJson = async (raw: string) => {
        try {
            const data = JSON.parse(raw);
            const inPresets: ServiceRequestPreset[] = Array.isArray(data?.presets)
                ? data.presets
                : Array.isArray(data)
                  ? data
                  : [];
            const inCats: ServiceRequestPresetCategory[] = Array.isArray(data?.categories) ? data.categories : [];

            const existingIds = new Set(presets.map((p) => p.id));
            const existingCatIds = new Set(categories.map((c) => c.id));

            const newPresets = inPresets
                .filter((p) => p && p.id && Array.isArray(p.reasonChain))
                .map((p) =>
                    existingIds.has(p.id)
                        ? {...p, id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`}
                        : p,
                );
            const newCats = inCats
                .filter((c) => c && c.id && c.name)
                .map((c, i) =>
                    existingCatIds.has(c.id)
                        ? {...c, id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, order: categories.length + i}
                        : {...c, order: c.order ?? categories.length + i},
                );

            if (newPresets.length === 0 && newCats.length === 0) {
                notify(TITLE, 'Нечего импортировать', 'error');
                return;
            }

            const mergedPresets = [...presets, ...newPresets];
            const mergedCats = [...categories, ...newCats];
            setPresets(mergedPresets);
            setCategories(mergedCats);
            await saveServiceRequestPresets(mergedPresets);
            await saveServiceRequestPresetCategories(mergedCats);
            notify(TITLE, `Импортировано ${newPresets.length} пресетов`, 'success');
        } catch {
            notify(TITLE, 'Ошибка импорта: некорректный JSON', 'error');
        }
    };

    return {
        presets,
        categories,
        savePreset,
        removePreset,
        duplicatePreset,
        createCategory,
        renameCategory,
        deleteCategory,
        moveCategory,
        exportAll,
        importFromJson,
    };
}
