import React, {useCallback, useEffect, useState} from 'react';
import {getAuthState, isAuthenticated, logout} from '@src/utils/auth';
import {
    getModuleSettings,
    getQuickAppealsPresetCategories,
    getQuickAppealsPresets,
    getUserSettings,
    type QuickAppealsPreset,
    type QuickAppealsPresetCategory,
    saveQuickAppealsPresetCategories,
    saveQuickAppealsPresets,
    updateUserSettings
} from '@src/shared/user-settings';
import {notify} from '@src/utils/notify';
import Auth from '@src/components/Auth';
import type {TelegramUser} from '@src/shared/types/auth';
import './Options.css';

interface Settings {
    arm?: Record<string, boolean>;
    genesys?: Record<string, boolean>;
    line?: Record<string, boolean>;
}

export default function Options() {
    const [isAuthenticatedState, setIsAuthenticatedState] = useState<boolean | null>(null);
    const [currentUser, setCurrentUser] = useState<TelegramUser | null>(null);
    const [settings, setSettings] = useState<Settings>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    const [activeSection, setActiveSection] = useState<'arm' | 'genesys' | 'line'>('arm');
    const [searchQuery, setSearchQuery] = useState('');
    const [isMac, setIsMac] = useState(false);
    const [version, setVersion] = useState<string>('');
    const [updateStatus, setUpdateStatus] = useState<{
        checking: boolean;
        hasUpdate: boolean | null;
        latestVersion: string | null;
    }>({
        checking: false,
        hasUpdate: null,
        latestVersion: null,
    });
    const [isLoadingCategories, setIsLoadingCategories] = useState(false);
    const [appealsCategories, setAppealsCategories] = useState<Array<{
        value: string;
        label: string;
        title: string
    }>>([]);
    const [quickAppealsPresets, setQuickAppealsPresets] = useState<QuickAppealsPreset[]>([]);

    // Wizard state
    const [wizardOpen, setWizardOpen] = useState(false);
    const [wizardStep, setWizardStep] = useState<'product' | 'processing' | 'comment' | 'category' | 'subcategory' | 'childreason' | 'name'>('product');
    const [editingPresetId, setEditingPresetId] = useState<string | null>(null);
    const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
    const [selectedProcessing, setSelectedProcessing] = useState<{ value: string; label: string } | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<{ value: string; label: string } | null>(null);
    const [selectedSubcategory, setSelectedSubcategory] = useState<{ value: string; label: string } | null>(null);
    const [subcategories, setSubcategories] = useState<Array<{ value: string; label: string }>>([]);
    const [isLoadingSubcategories, setIsLoadingSubcategories] = useState(false);
    const [presetName, setPresetName] = useState('');

    // Category management state
    const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
    const [editingCategoryName, setEditingCategoryName] = useState('');

    // Preset categories and search
    const [presetCategories, setPresetCategories] = useState<QuickAppealsPresetCategory[]>([]);
    const [selectedPresetCategory, setSelectedPresetCategory] = useState<string | null>(null);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [processingSearchQuery, setProcessingSearchQuery] = useState('');
    const [categorySearchQuery, setCategorySearchQuery] = useState('');
    const [subcategorySearchQuery, setSubcategorySearchQuery] = useState('');
    const [presetSearchQuery, setPresetSearchQuery] = useState('');
    const [childReasons, setChildReasons] = useState<Array<{ value: string; label: string }>>([]);
    const [isLoadingChildReasons, setIsLoadingChildReasons] = useState(false);
    const [selectedChildReason, setSelectedChildReason] = useState<{ value: string; label: string } | null>(null);
    const [childReasonSearchQuery, setChildReasonSearchQuery] = useState('');
    const [presetComment, setPresetComment] = useState('');

    // Function to duplicate a category
    const duplicateCategory = async (categoryId: string) => {
        const category = presetCategories.find(cat => cat.id === categoryId);
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

    // Function to duplicate a preset
    const duplicatePreset = async (presetId: string) => {
        const preset = quickAppealsPresets.find(p => p.id === presetId);
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

    // Function to copy a single preset to clipboard
    const copySinglePreset = async (presetId: string) => {
        const preset = quickAppealsPresets.find(p => p.id === presetId);
        if (!preset) return;

        const presetData = JSON.stringify(preset, null, 2);

        try {
            await navigator.clipboard.writeText(presetData);
            notify('Быстрые обращения', `Пресет "${preset.name}" скопирован в буфер обмена!`, 'success');
        } catch {
            notify('Быстрые обращения', 'Не удалось скопировать пресет', 'error');
        }
    };

    // Function to export all presets to JSON file
    const exportPresets = () => {
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
    };

    // Function to import presets from JSON file
    const importPresets = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const importedData = JSON.parse(e.target?.result as string);

                // Handle both single preset and full export format
                let presetsToAdd: QuickAppealsPreset[] = [];
                let categoriesToAdd: QuickAppealsPresetCategory[] = [];

                if (importedData.presets && Array.isArray(importedData.presets)) {
                    // Full export format with categories and presets
                    presetsToAdd = importedData.presets;
                    categoriesToAdd = importedData.categories || [];
                } else if (importedData.id && importedData.name) {
                    // Single preset format
                    presetsToAdd = [importedData];
                }

                // Generate new IDs for imported items to avoid conflicts
                const processedPresets = presetsToAdd.map(preset => ({
                    ...preset,
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                    name: preset.name.endsWith(' (импорт)') ? preset.name : `${preset.name} (импорт)`,
                }));

                const processedCategories = categoriesToAdd.map(category => ({
                    ...category,
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                }));

                // Create category ID mapping for old IDs to new IDs
                const categoryIdMap = new Map<string, string>();
                processedCategories.forEach(cat => {
                    const originalCategory = categoriesToAdd.find(c => c.name === cat.name.replace(' (импорт)', ''));
                    if (originalCategory) {
                        categoryIdMap.set(originalCategory.id, cat.id);
                    }
                });

                // Update preset category IDs to use new category IDs
                const updatedPresets = processedPresets.map(preset => {
                    if (preset.categoryId && categoryIdMap.has(preset.categoryId)) {
                        return {...preset, categoryId: categoryIdMap.get(preset.categoryId)!};
                    }
                    return preset;
                });

                // Merge with existing data
                const mergedPresets = [...quickAppealsPresets, ...updatedPresets];
                const mergedCategories = [...presetCategories, ...processedCategories];

                setQuickAppealsPresets(mergedPresets);
                setPresetCategories(mergedCategories);

                const presetsSuccess = await saveQuickAppealsPresets(mergedPresets);
                const categoriesSuccess = await saveQuickAppealsPresetCategories(mergedCategories);

                if (presetsSuccess && categoriesSuccess) {
                    notify(
                        'Быстрые обращения',
                        `Импортировано ${updatedPresets.length} пресетов и ${processedCategories.length} категорий!`,
                        'success'
                    );
                } else {
                    notify('Быстрые обращения', 'Ошибка при импорте пресетов', 'error');
                }
            } catch {
                notify('Быстрые обращения', 'Ошибка при импорте. Проверьте формат файла.', 'error');
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    };

    // Products available
    const products = [
        {id: 70, name: 'Интернет'},
        {id: 101, name: 'Цифровое TV'},
        {id: 71, name: 'Кабельное TV'},
        {id: 1451, name: 'Домофония'},
        {id: 72, name: 'Телефония'},
    ];

    // Processing groups (Обработка)
    const processingGroups = [
        {value: '378', label: 'Группа обработки договоров'},
        {value: '380', label: 'Клиентская группа'},
        {value: '2286', label: 'НПК - Входящая связь'},
        {value: '2268', label: 'НТП первая линия - Входящая связь'},
        {value: '2277', label: 'НТП первая линия - Исходящая связь'},
        {value: '1195', label: 'Направление сохранения Клиентов - Входящая связь'},
        {value: '1521', label: 'Направление сохранения Клиентов - Исходящая связь'},
        {value: '616', label: 'ОКЦ - Исходящая связь'},
        {value: '1005', label: 'ОЦТП - Входящая связь'},
        {value: '1520', label: 'ОЦТП - Исходящая связь'},
        {value: '2296', label: 'Онлайн - Входящая связь'},
        {value: '2322', label: 'Онлайн - Исходящая связь'},
        {value: '1031', label: 'Отдел согласования'},
        {value: '2270', label: 'Передано ТТК (БП FVNO)'},
        {value: '2330', label: 'Поставщик агентского IPTV'},
        {value: '382', label: 'Служба по подключениям'},
        {value: '383', label: 'Служба эксплуатации сети'},
        {value: '2086', label: 'ТП MnA - Входящая связь'},
        {value: '2087', label: 'ТП MnA - Исходящая связь'},
        {value: '-1', label: 'Не требует дальнейшей обработки'},
    ];

    // Load presets from backend on mount
    useEffect(() => {
        const loadPresets = async () => {
            const presets = await getQuickAppealsPresets();
            setQuickAppealsPresets(presets);
        };
        loadPresets();
    }, []);

    // Load preset categories from backend on mount
    useEffect(() => {
        const loadCategories = async () => {
            const categories = await getQuickAppealsPresetCategories();
            if (categories.length > 0) {
                setPresetCategories(categories);
            } else {
                // Initialize with default categories matching products
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

    // Function to load categories based on product ID and processing group
    const loadCategories = async (productId: number, processingGroupId: string) => {
        setIsLoadingCategories(true);
        setAppealsCategories([]);
        try {
            // Get cookies
            const cookieUrl = 'https://perm.db.ertelecom.ru/cgi-bin/ppo/excells';
            const cookieResponse = await new Promise<{
                ok: boolean;
                data?: Record<string, string | null>;
                err?: string;
            }>((resolve) => {
                chrome.runtime.sendMessage(
                    {
                        action: 'getMultipleCookies',
                        url: cookieUrl,
                        names: ['wccUsrName', 'wccSsnName'],
                    },
                    (response) => resolve(response as {
                        ok: boolean;
                        data?: Record<string, string | null>;
                        err?: string
                    })
                );
            });

            if (!cookieResponse.ok || !cookieResponse.data?.wccUsrName || !cookieResponse.data?.wccSsnName) {
                throw new Error('Not authorized');
            }

            const {wccUsrName, wccSsnName} = cookieResponse.data;

            console.log('[Хелпер] - [Быстрые обращения] - Загрузка категорий:', {
                product: productId,
                processingGroup: processingGroupId,
                ssn: wccSsnName,
                usr: wccUsrName,
            });

            // Load categories with step_id=processing group and prod_id=selected product
            // Note: Need to use literal $ in parameter names, not URL-encoded %24
            const agrId = productId === 69 ? 0 : 2453379;
            const formData = `ssn$c=${encodeURIComponent(wccSsnName)}&usr$i=${encodeURIComponent(wccUsrName)}&prod_id$i=${productId}&step_id$i=${processingGroupId}&agr_id$i=${agrId}`;

            console.log('[Хелпер] - [Быстрые обращения] - Request data:', formData);

            const response = await fetch(
                'https://perm.db.ertelecom.ru/cgi-bin/ppo/excells/wcc_unified_classifier_reasons.ajax_get_uni_obj_reasons',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    body: formData,
                }
            );

            if (!response.ok) {
                throw new Error('Failed to load categories');
            }

            // Decode Windows-1251
            const buffer = await response.arrayBuffer();
            const decoder = new TextDecoder('windows-1251');
            const htmlText = decoder.decode(buffer);

            console.log('[Хелпер] - [Быстрые обращения] - Response HTML (first 200 chars):', htmlText.substring(0, 200));

            // Parse HTML
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlText, 'text/html');
            const selectElement = doc.querySelector('.uni_load_obj_reason');

            if (!selectElement) {
                throw new Error('Invalid response format: select element not found');
            }

            const options = selectElement.querySelectorAll('option');
            const cats: Array<{ value: string; label: string; title: string }> = [];

            options.forEach((option) => {
                const value = option.getAttribute('value');
                const label = option.textContent?.trim() || '';
                const title = option.getAttribute('title') || '';

                if (value && value !== '-1' && label) {
                    cats.push({value, label, title});
                }
            });

            console.log('[Хелпер] - [Быстрые обращения] - Загружено категорий:', cats);

            setAppealsCategories(cats);
        } catch (error) {
            console.error('[Хелпер] - [Быстрые обращения] - Ошибка при загрузке категорий:', error);
            notify('Быстрые обращения', 'Не удалось загрузить категории', 'error');
        } finally {
            setIsLoadingCategories(false);
        }
    };

    // Function to load subcategories based on selected category
    const loadSubcategories = async (categoryId: string): Promise<Array<{ value: string; label: string }>> => {
        if (selectedProduct === null || !selectedProcessing) return [];

        setIsLoadingSubcategories(true);
        try {
            // Get cookies
            const cookieUrl = 'https://perm.db.ertelecom.ru/cgi-bin/ppo/excells';
            const cookieResponse = await new Promise<{
                ok: boolean;
                data?: Record<string, string | null>;
                err?: string;
            }>((resolve) => {
                chrome.runtime.sendMessage(
                    {
                        action: 'getMultipleCookies',
                        url: cookieUrl,
                        names: ['wccUsrName', 'wccSsnName'],
                    },
                    (response) => resolve(response as {
                        ok: boolean;
                        data?: Record<string, string | null>;
                        err?: string
                    })
                );
            });

            if (!cookieResponse.ok || !cookieResponse.data?.wccUsrName || !cookieResponse.data?.wccSsnName) {
                throw new Error('Not authorized');
            }

            const {wccUsrName, wccSsnName} = cookieResponse.data;

            console.log('[Хелпер] - [Быстрые обращения] - Загрузка подкатегорий:', {
                product: selectedProduct,
                processingGroup: selectedProcessing.value,
                category: categoryId,
                ssn: wccSsnName,
                usr: wccUsrName,
            });

            // Load subcategories with step_id=processing group AND object_id=category
            // Note: Use different endpoint: .ajax_get_uni_main_reasons
            // Note: Need to use literal $ in parameter names, not URL-encoded %24
            const agrId = selectedProduct === 69 ? 0 : 2453379;
            const formData = `ssn$c=${encodeURIComponent(wccSsnName)}&usr$i=${encodeURIComponent(wccUsrName)}&prod_id$i=${selectedProduct}&step_id$i=${selectedProcessing.value}&object_id$i=${categoryId}&agr_id$i=${agrId}`;

            console.log('[Хелпер] - [Быстрые обращения] - Request data:', formData);

            const response = await fetch(
                'https://perm.db.ertelecom.ru/cgi-bin/ppo/excells/wcc_unified_classifier_reasons.ajax_get_uni_main_reasons',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    body: formData,
                }
            );

            if (!response.ok) {
                throw new Error('Failed to load subcategories');
            }

            // Decode Windows-1251
            const buffer = await response.arrayBuffer();
            const decoder = new TextDecoder('windows-1251');
            const htmlText = decoder.decode(buffer);

            console.log('[Хелпер] - [Быстрые обращения] - Response HTML (first 200 chars):', htmlText.substring(0, 200));

            // Parse HTML
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlText, 'text/html');
            const selectElement = doc.querySelector('.uni_load_main_reason');

            if (!selectElement) {
                // No more subcategories, this is the final selection
                setSubcategories([]);
                return [];
            }

            const options = selectElement.querySelectorAll('option');
            const subs: Array<{ value: string; label: string }> = [];

            options.forEach((option) => {
                const value = option.getAttribute('value');
                const label = option.textContent?.trim() || '';

                if (value && value !== '-1' && label) {
                    subs.push({value, label});
                }
            });

            console.log('[Хелпер] - [Быстрые обращения] - Загружено подкатегорий:', subs);

            setSubcategories(subs);
            return subs;
        } catch (error) {
            console.error('[Хелпер] - [Быстрые обращения] - Ошибка при загрузке подкатегорий:', error);
            notify('Быстрые обращения', 'Не удалось загрузить подкатегории', 'error');
            return [];
        } finally {
            setIsLoadingSubcategories(false);
        }
    };

    // Function to check if child reasons exist for a subcategory
    const hasChildReasons = async (subcategoryId: string): Promise<boolean> => {
        if (selectedProduct === null || !selectedProcessing) return false;

        try {
            const cookieUrl = 'https://perm.db.ertelecom.ru/cgi-bin/ppo/excells';
            const cookieResponse = await new Promise<{
                ok: boolean;
                data?: Record<string, string | null>;
                err?: string;
            }>((resolve) => {
                chrome.runtime.sendMessage(
                    {
                        action: 'getMultipleCookies',
                        url: cookieUrl,
                        names: ['wccUsrName', 'wccSsnName'],
                    },
                    (response) => resolve(response as {
                        ok: boolean;
                        data?: Record<string, string | null>;
                        err?: string
                    })
                );
            });

            if (!cookieResponse.ok || !cookieResponse.data?.wccUsrName || !cookieResponse.data?.wccSsnName) {
                return false;
            }

            const {wccUsrName, wccSsnName} = cookieResponse.data;
            const agrId = selectedProduct === 69 ? 0 : 2453379;
            const formData = `ssn$c=${encodeURIComponent(wccSsnName)}&usr$i=${encodeURIComponent(wccUsrName)}&step_id$i=${selectedProcessing.value}&prob_class_id$i=${subcategoryId}&agr_id$i=${agrId}`;

            const response = await fetch(
                'https://perm.db.ertelecom.ru/cgi-bin/ppo/excells/wcc_unified_classifier_reasons.ajax_get_uni_child_reasons',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    body: formData,
                }
            );

            if (!response.ok) return false;

            const buffer = await response.arrayBuffer();
            const decoder = new TextDecoder('windows-1251');
            const htmlText = decoder.decode(buffer);

            // Check if response contains a select element (has child reasons) or hidden input (no child reasons)
            return htmlText.includes('<select') && htmlText.includes('uni_load_child_reason');
        } catch {
            return false;
        }
    };

    // Function to load child reasons based on selected subcategory
    const loadChildReasons = async (subcategoryId: string) => {
        if (selectedProduct === null || !selectedProcessing) return;

        setIsLoadingChildReasons(true);
        try {
            const cookieUrl = 'https://perm.db.ertelecom.ru/cgi-bin/ppo/excells';
            const cookieResponse = await new Promise<{
                ok: boolean;
                data?: Record<string, string | null>;
                err?: string;
            }>((resolve) => {
                chrome.runtime.sendMessage(
                    {
                        action: 'getMultipleCookies',
                        url: cookieUrl,
                        names: ['wccUsrName', 'wccSsnName'],
                    },
                    (response) => resolve(response as {
                        ok: boolean;
                        data?: Record<string, string | null>;
                        err?: string
                    })
                );
            });

            if (!cookieResponse.ok || !cookieResponse.data?.wccUsrName || !cookieResponse.data?.wccSsnName) {
                throw new Error('Not authorized');
            }

            const {wccUsrName, wccSsnName} = cookieResponse.data;

            console.log('[Хелпер] - [Быстрые обращения] - Загрузка причин-детей:', {
                product: selectedProduct,
                processingGroup: selectedProcessing.value,
                subcategory: subcategoryId,
                ssn: wccSsnName,
                usr: wccUsrName,
            });

            const agrId = selectedProduct === 69 ? 0 : 2453379;
            const formData = `ssn$c=${encodeURIComponent(wccSsnName)}&usr$i=${encodeURIComponent(wccUsrName)}&step_id$i=${selectedProcessing.value}&prob_class_id$i=${subcategoryId}&agr_id$i=${agrId}`;

            console.log('[Хелпер] - [Быстрые обращения] - Request data:', formData);

            const response = await fetch(
                'https://perm.db.ertelecom.ru/cgi-bin/ppo/excells/wcc_unified_classifier_reasons.ajax_get_uni_child_reasons',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    body: formData,
                }
            );

            if (!response.ok) {
                throw new Error('Failed to load child reasons');
            }

            const buffer = await response.arrayBuffer();
            const decoder = new TextDecoder('windows-1251');
            const htmlText = decoder.decode(buffer);

            console.log('[Хелпер] - [Быстрые обращения] - Response HTML (first 200 chars):', htmlText.substring(0, 200));

            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlText, 'text/html');
            const selectElement = doc.querySelector('.uni_load_child_reason');

            if (!selectElement) {
                setChildReasons([]);
                return;
            }

            const options = selectElement.querySelectorAll('option');
            const childReas: Array<{ value: string; label: string }> = [];

            options.forEach((option) => {
                const value = option.getAttribute('value');
                const label = option.textContent?.trim() || '';

                if (value && value !== '-1' && label) {
                    childReas.push({value, label});
                }
            });

            console.log('[Хелпер] - [Быстрые обращения] - Загружено причин-детей:', childReas);

            setChildReasons(childReas);
        } catch (error) {
            console.error('[Хелпер] - [Быстрые обращения] - Ошибка при загрузке причин-детей:', error);
            notify('Быстрые обращения', 'Не удалось загрузить причины-дети', 'error');
        } finally {
            setIsLoadingChildReasons(false);
        }
    };

    // Function to start creating a new preset
    const startWizard = () => {
        setEditingPresetId(null);
        setWizardStep('product');
        setSelectedProduct(null);
        setSelectedProcessing(null);
        setSelectedCategory(null);
        setSelectedSubcategory(null);
        setSubcategories([]);
        setAppealsCategories([]);
        setPresetName('');
        setSelectedPresetCategory(null);
        setNewCategoryName('');
        setProcessingSearchQuery('');
        setCategorySearchQuery('');
        setSubcategorySearchQuery('');
        setChildReasons([]);
        setSelectedChildReason(null);
        setChildReasonSearchQuery('');
        setPresetComment('');
        setWizardOpen(true);
    };

    // Function to edit an existing preset
    const editPreset = async (presetId: string) => {
        const preset = quickAppealsPresets.find(p => p.id === presetId);
        if (!preset) return;

        setEditingPresetId(presetId);
        setPresetName(preset.name);
        setSelectedPresetCategory(preset.categoryId || null);
        setSelectedProduct(preset.product);
        setSelectedProcessing({value: preset.processing, label: preset.processingLabel});
        setSelectedCategory({value: preset.category, label: preset.categoryLabel});
        if (preset.subcategory && preset.subcategoryLabel) {
            setSelectedSubcategory({value: preset.subcategory, label: preset.subcategoryLabel});
        } else {
            setSelectedSubcategory(null);
        }
        if (preset.childReason && preset.childReasonLabel) {
            setSelectedChildReason({value: preset.childReason, label: preset.childReasonLabel});
        } else {
            setSelectedChildReason(null);
        }
        setPresetComment(preset.comment || '');

        // Load categories and subcategories based on preset data
        await loadCategories(preset.product, preset.processing);
        if (preset.subcategory) {
            await loadSubcategories(preset.category);
        }
        if (preset.childReason) {
            await loadChildReasons(preset.subcategory);
        }

        setWizardStep('name');
        setWizardOpen(true);
    };

    // Function to select product
    const selectProduct = (productId: number) => {
        setSelectedProduct(productId);
        setWizardStep('processing');
    };

    // Function to select processing group and load categories
    const selectProcessing = async (processing: { value: string; label: string }) => {
        setSelectedProcessing(processing);
        if (selectedProduct === null) return;
        await loadCategories(selectedProduct, processing.value);
        setWizardStep('category');
    };

    // Function to select category
    const selectCategory = async (category: { value: string; label: string }) => {
        setSelectedCategory(category);
        // Load subcategories for this category
        const loadedSubcategories = await loadSubcategories(category.value);
        // Move to next step after loading
        if (loadedSubcategories.length === 0) {
            // No subcategories, skip to comment
            setWizardStep('comment');
        } else {
            setWizardStep('subcategory');
        }
    };

    // Function to select subcategory
    const selectSubcategory = async (subcategory: { value: string; label: string }) => {
        setSelectedSubcategory(subcategory);
        // Check if child reasons exist for this subcategory
        const hasChildren = await hasChildReasons(subcategory.value);
        if (hasChildren) {
            await loadChildReasons(subcategory.value);
            setWizardStep('childreason');
        } else {
            setWizardStep('comment');
        }
    };

    // Function to skip subcategory (if no subcategories available)
    const skipSubcategory = async () => {
        setSelectedSubcategory(null);
        setWizardStep('name');
    };

    // Function to select child reason
    const selectChildReason = (childReason: { value: string; label: string }) => {
        setSelectedChildReason(childReason);
        setWizardStep('comment');
    };

    // Function to save the preset
    const savePreset = async () => {
        if (selectedProduct === null || !selectedProcessing || !selectedCategory || !presetName.trim()) {
            notify('Быстрые обращения', 'Заполните все поля', 'error');
            return;
        }

        const categoryId = selectedPresetCategory || null;

        if (editingPresetId) {
            // Update existing preset
            const updatedPresets = quickAppealsPresets.map(preset => {
                if (preset.id === editingPresetId) {
                    return {
                        ...preset,
                        name: presetName.trim(),
                        product: selectedProduct,
                        processing: selectedProcessing.value,
                        processingLabel: selectedProcessing.label,
                        category: selectedCategory.value,
                        categoryLabel: selectedCategory.label,
                        subcategory: selectedSubcategory?.value,
                        subcategoryLabel: selectedSubcategory?.label,
                        childReason: selectedChildReason?.value,
                        childReasonLabel: selectedChildReason?.label,
                        categoryId: categoryId,
                        comment: presetComment.trim() || undefined,
                    };
                }
                return preset;
            });
            setQuickAppealsPresets(updatedPresets);

            const success = await saveQuickAppealsPresets(updatedPresets);
            if (success) {
                notify('Быстрые обращения', `Пресет "${presetName}" обновлён!`, 'success');
                setWizardOpen(false);
                setEditingPresetId(null);
            } else {
                notify('Быстрые обращения', 'Не удалось сохранить пресет', 'error');
            }
        } else {
            // Create new preset
            const newPreset = {
                id: Date.now().toString(),
                name: presetName.trim(),
                product: selectedProduct,
                processing: selectedProcessing.value,
                processingLabel: selectedProcessing.label,
                category: selectedCategory.value,
                categoryLabel: selectedCategory.label,
                subcategory: selectedSubcategory?.value,
                subcategoryLabel: selectedSubcategory?.label,
                childReason: selectedChildReason?.value,
                childReasonLabel: selectedChildReason?.label,
                categoryId: categoryId,
                comment: presetComment.trim() || undefined,
            };

            const updatedPresets = [...quickAppealsPresets, newPreset];
            setQuickAppealsPresets(updatedPresets);

            const success = await saveQuickAppealsPresets(updatedPresets);
            if (success) {
                notify('Быстрые обращения', `Пресет "${presetName}" сохранён!`, 'success');
                setWizardOpen(false);
            } else {
                notify('Быстрые обращения', 'Не удалось сохранить пресет', 'error');
            }
        }
    };

    // Function to create a new category
    const createNewCategory = async () => {
        if (!newCategoryName.trim()) {
            notify('Категории', 'Введите название категории', 'error');
            return;
        }

        const newCategory = {
            id: Date.now().toString(),
            name: newCategoryName.trim(),
        };

        const updatedCategories = [...presetCategories, newCategory];
        setPresetCategories(updatedCategories);
        setSelectedPresetCategory(newCategory.id);
        setNewCategoryName('');

        const success = await saveQuickAppealsPresetCategories(updatedCategories);
        if (success) {
            notify('Категории', `Категория "${newCategory.name}" создана!`, 'success');
        } else {
            notify('Категории', 'Не удалось создать категорию', 'error');
        }
    };

    // Function to delete a category
    const deleteCategory = async (categoryId: string) => {
        const updatedCategories = presetCategories.filter(cat => cat.id !== categoryId);
        setPresetCategories(updatedCategories);

        // Also update presets that belong to this category to remove category reference
        const updatedPresets = quickAppealsPresets.map(preset => {
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

    // Function to start editing a category
    const startEditCategory = (categoryId: string) => {
        const category = presetCategories.find(cat => cat.id === categoryId);
        if (category) {
            setEditingCategoryId(categoryId);
            setEditingCategoryName(category.name);
        }
    };

    // Function to save edited category
    const saveEditCategory = async () => {
        if (!editingCategoryId || !editingCategoryName.trim()) {
            notify('Категории', 'Введите название категории', 'error');
            return;
        }

        const updatedCategories = presetCategories.map(cat => {
            if (cat.id === editingCategoryId) {
                return {...cat, name: editingCategoryName.trim()};
            }
            return cat;
        });
        setPresetCategories(updatedCategories);
        setEditingCategoryId(null);
        setEditingCategoryName('');

        const success = await saveQuickAppealsPresetCategories(updatedCategories);
        if (success) {
            notify('Категории', 'Категория обновлена', 'success');
        } else {
            notify('Категории', 'Не удалось обновить категорию', 'error');
        }
    };

    // Function to cancel editing category
    const cancelEditCategory = () => {
        setEditingCategoryId(null);
        setEditingCategoryName('');
    };

    // Function to remove a preset
    const removePreset = async (presetId: string) => {
        const updatedPresets = quickAppealsPresets.filter(preset => preset.id !== presetId);
        setQuickAppealsPresets(updatedPresets);

        const success = await saveQuickAppealsPresets(updatedPresets);
        if (success) {
            notify('Быстрые обращения', 'Пресет удалён', 'success');
        } else {
            notify('Быстрые обращения', 'Не удалось удалить пресет', 'error');
        }
    };

    // Single effect to handle auth check and settings loading
    useEffect(() => {
        let mounted = true;

        const init = async () => {
            const authenticated = await isAuthenticated();
            if (!mounted) return;

            setIsAuthenticatedState(authenticated);

            if (authenticated) {
                const state = await getAuthState();
                if (!mounted) return;

                if (state?.user) {
                    setCurrentUser(state.user);
                }

                // Load settings
                setIsLoading(true);
                try {
                    const userSettings = await getUserSettings();
                    if (!mounted) return;

                    if (userSettings) {
                        setSettings({
                            arm: getModuleSettings('arm', userSettings) ?? undefined,
                            genesys: getModuleSettings('genesys', userSettings) ?? undefined,
                            line: getModuleSettings('line', userSettings) ?? undefined,
                        });
                    }
                } finally {
                    if (mounted) {
                        setIsLoading(false);
                    }
                }
            } else {
                setIsLoading(false);
            }
        };

        init();

        return () => {
            mounted = false;
        };
    }, []);

    useEffect(() => {
        // Detect platform
        setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0);

        // Get extension version
        const manifest = chrome.runtime.getManifest();
        if (manifest?.version) {
            setVersion(manifest.version);
        }

        // Load theme
        chrome.storage.local.get(['theme'], (result) => {
            if (result.theme) {
                setTheme(result.theme as 'light' | 'dark');
                document.documentElement.setAttribute('data-theme', result.theme);
            }
        });

        // Keyboard shortcut for search
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                const searchInput = document.querySelector('.search-input') as HTMLInputElement;
                searchInput?.focus();
            }
            if (e.key === 'Escape' && searchQuery) {
                setSearchQuery('');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [searchQuery]);

    const handleAuthorized = useCallback((user: TelegramUser) => {
        setCurrentUser(user);
        setIsAuthenticatedState(true);

        // Load settings for newly authorized user
        const loadNewUserSettings = async () => {
            setIsLoading(true);
            try {
                const userSettings = await getUserSettings();
                if (userSettings) {
                    setSettings({
                        arm: getModuleSettings('arm', userSettings) ?? undefined,
                        genesys: getModuleSettings('genesys', userSettings) ?? undefined,
                        line: getModuleSettings('line', userSettings) ?? undefined,
                    });
                }
            } finally {
                setIsLoading(false);
            }
        };

        loadNewUserSettings();
    }, []);

    const handleLogout = async () => {
        await logout();
        setIsAuthenticatedState(false);
        setCurrentUser(null);
        setSettings({});
    };

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
        chrome.storage.local.set({theme: newTheme});
    };

    const updateSetting = async (category: keyof Settings, key: string, value: boolean) => {
        const newSettings = {
            ...settings,
            [category]: {
                ...(settings[category] ?? {}),
                [key]: value,
            },
        };
        setSettings(newSettings);
        setIsSaving(true);
        try {
            const success = await updateUserSettings(newSettings);
            setSaveStatus(success ? 'success' : 'error');
            setTimeout(() => setSaveStatus('idle'), 2000);
        } catch {
            setSaveStatus('error');
            setTimeout(() => setSaveStatus('idle'), 2000);
        } finally {
            setIsSaving(false);
        }
    };

    const exportSettings = () => {
        const dataStr = JSON.stringify(settings, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `helper-settings-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const importSettings = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const importedSettings = JSON.parse(e.target?.result as string);
                setSettings(importedSettings);
                setIsSaving(true);
                const success = await updateUserSettings(importedSettings);
                setIsSaving(false);
                setSaveStatus(success ? 'success' : 'error');

                if (success) {
                    notify('Настройки', 'Настройки успешно импортированы!', 'success');
                } else {
                    notify('Настройки', 'Ошибка при импорте настроек', 'error');
                }
            } catch {
                notify('Настройки', 'Ошибка при импорте настроек. Проверьте файл.', 'error');
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    };

    const checkForUpdates = async (autoCheck = false) => {
        setUpdateStatus({checking: true, hasUpdate: null, latestVersion: null});
        try {
            const response = await fetch('https://helper.chrsnv.ru/api/versions.json');
            if (!response.ok) throw new Error('Failed to fetch');
            const data = await response.json();

            // Get the first addon's updates (the addon ID is the key)
            const addonId = Object.keys(data?.addons ?? {})[0];
            const updates = data?.addons?.[addonId]?.updates;

            if (updates && updates.length > 0) {
                const latestUpdate = updates[0];
                const latestVersion = latestUpdate.version;
                const updateLink = latestUpdate.update_link;

                // Semantic version comparison
                const hasUpdate = compareVersions(latestVersion, version) > 0;

                setUpdateStatus({
                    checking: false,
                    hasUpdate,
                    latestVersion,
                });

                if (hasUpdate && !autoCheck) {
                    // Automatically download the update only on manual check
                    const link = document.createElement('a');
                    link.href = updateLink;
                    link.download = `domhelper-${latestVersion}.xpi`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);

                    notify('Обновление', `Начата загрузка версии ${latestVersion}`, 'success');
                } else if (!hasUpdate && !autoCheck) {
                    notify('Обновление', 'Установлена последняя версия!', 'success');
                }
            } else {
                throw new Error('Invalid version data');
            }
        } catch {
            setUpdateStatus({checking: false, hasUpdate: null, latestVersion: null});
            if (!autoCheck) {
                notify('Обновление', 'Не удалось проверить обновления', 'error');
            }
        }
    };

    // Helper function to compare semantic versions
    // Returns: 1 if v1 > v2, -1 if v1 < v2, 0 if equal
    const compareVersions = (v1: string, v2: string): number => {
        const normalize = (v: string) => {
            return v.split('.').map(part => {
                const num = parseInt(part, 10);
                return isNaN(num) ? 0 : num;
            });
        };

        const parts1 = normalize(v1);
        const parts2 = normalize(v2);

        const maxLength = Math.max(parts1.length, parts2.length);

        for (let i = 0; i < maxLength; i++) {
            const p1 = parts1[i] || 0;
            const p2 = parts2[i] || 0;

            if (p1 > p2) return 1;
            if (p1 < p2) return -1;
        }

        return 0;
    };

    // Auto-check for updates on mount
    useEffect(() => {
        if (version) {
            checkForUpdates(true);
        }
    }, [version]);

    if (isAuthenticatedState === null) {
        return (
            <div className="options-page">
                <div className="loading-state">
                    <div className="spinner"/>
                    <p>Загрузка...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticatedState) {
        return <Auth onAuthorized={handleAuthorized}/>;
    }

    // Helper component to show selected options in wizard
    const SelectedOptionsSummary = () => {
        const options = [];

        if (selectedProduct !== null) {
            if (selectedProduct === 69) {
                options.push({label: 'Продукт', value: 'Без продукта'});
            } else {
                const product = products.find(p => p.id === selectedProduct);
                if (product) options.push({label: 'Продукт', value: product.name});
            }
        }

        if (selectedProcessing) {
            options.push({label: 'Обработка', value: selectedProcessing.label});
        }

        if (selectedCategory) {
            options.push({label: 'Категория', value: selectedCategory.label});
        }

        if (selectedSubcategory) {
            options.push({label: 'Подкатегория', value: selectedSubcategory.label});
        }

        if (selectedChildReason) {
            options.push({label: 'Причина-ребёнок', value: selectedChildReason.label});
        }

        if (options.length === 0) return null;

        return (
            <div style={{
                padding: '0.75rem',
                backgroundColor: 'var(--muted)',
                borderRadius: '0.5rem',
                marginBottom: '1rem',
                fontSize: '0.875rem',
            }}>
                <div style={{
                    fontWeight: 600,
                    marginBottom: '0.5rem',
                    color: 'var(--text-secondary)',
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                }}>
                    Выбрано:
                </div>
                {options.map((opt, idx) => (
                    <div
                        key={idx}
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '0.25rem 0',
                            borderBottom: idx < options.length - 1 ? '1px solid var(--border-color)' : 'none',
                        }}
                    >
                        <span style={{color: 'var(--text-secondary)'}}>{opt.label}:</span>
                        <span style={{fontWeight: 500}}>{opt.value}</span>
                    </div>
                ))}
            </div>
        );
    };

    const armFeatureGroups = [
        {
            title: 'Сворачивание',
            icon: '📁',
            description: 'Управление отображением вкладок и панелей',
            features: [
                {key: 'foldSpas', label: 'Предвосхищение', description: 'Сворачивать предвосхищения'},
                {key: 'foldTabInfo', label: 'Информация', description: 'Сворачивать вкладку "Информация"'},
                {key: 'foldTabApplications', label: 'Заявки', description: 'Сворачивать вкладку "Приложения"'},
                {key: 'foldTabAppeals', label: 'Обращения', description: 'Сворачивать вкладку "Обращения"'},
                {
                    key: 'foldTabSRequests',
                    label: 'Сервисные заявки',
                    description: 'Сворачивать вкладку "Сервисные запросы"'
                },
                {
                    key: 'foldTabCRequests',
                    label: 'Подключения',
                    description: 'Сворачивать вкладку "Подключения"'
                },
            ],
        },
        {
            title: 'Удаление',
            icon: '📁',
            description: 'Управление удалений информации',
            features: [
                {
                    key: 'removeDiagnosticTabs',
                    label: 'Вкладки диагностики',
                    description: 'Удаляет ненужные вкладки диагностики EQM:\nВосстановление сброшенных данных, Диагностика абонентского устройств, Диагностика сети НТК'
                },
                {
                    key: 'removeAppealsColumns',
                    label: 'Колонки обращений',
                    description: 'Удаляет ненужные колонки обращений:\nОборудование, Продукт, Платформа, Исполнитель'
                }
            ],
        },
        {
            title: 'Быстрые обращения',
            icon: '⚡',
            description: 'Создание быстрых шаблонов для обращений',
            features: [],
            isCustom: true,
        },
    ];

    const genesysFeatureGroups = [
        {
            title: 'Интерфейс',
            icon: '🖥️',
            description: 'Настройки интерфейса Genesys',
            features: [
                {key: 'showLineStatus', label: 'Статус линии', description: 'Показывать статус линии (слоты, аварии)'},
                {key: 'showDutyMessages', label: 'Сообщения дежурных', description: 'Отображать сообщения дежурных'},
                {key: 'hideButtons', label: 'Скрыть бесполезные кнопки', description: 'Скрыть ненужные кнопки'},
            ],
        },
        {
            title: 'Чат',
            icon: '💬',
            description: 'Настройки чата',
            features: [
                {
                    key: 'allowChatSizeEdit',
                    label: 'Изменение размера',
                    description: 'Разрешить изменение размера окна чата'
                },
                {
                    key: 'autoCollapseChatHeader',
                    label: 'Автосворачивание заголовка',
                    description: 'Автоматически сворачивать заголовок нового чата'
                },
                {
                    key: 'allowPaste',
                    label: 'Вставка изображений',
                    description: 'Разрешить вставку изображений из буфера'
                },
                {key: 'customChatColors', label: 'Кастомные цвета', description: 'Использовать кастомные цвета чата'},
                {
                    key: 'customChatSounds',
                    label: 'Кастомные звуки',
                    description: 'Использовать кастомные звуки уведомлений'
                },
            ],
        },
    ];

    const renderFeatureGroup = (
        category: keyof Settings,
        group: {
            title: string;
            icon: string;
            description: string;
            features: Array<{ key: string; label: string; description: string }>;
            isCustom?: boolean;
        }
    ) => {
        // Custom rendering for "Быстрые обращения" section
        if (group.isCustom && group.title === 'Быстрые обращения') {
            return (
                <div key={group.title} className="card">
                    <div className="card-header">
                        <div className="card-header-content">
                            <span className="card-icon">{group.icon}</span>
                            <div className="card-header-text">
                                <h3 className="card-title">{group.title}</h3>
                                <p className="card-description">{group.description}</p>
                            </div>
                        </div>
                    </div>
                    <div className="feature-list">
                        {/* Action buttons row */}
                        <div className="feature-item">
                            <div className="feature-info" style={{width: '100%'}}>
                                <label className="feature-label">Действия с пресетами</label>
                                <span className="feature-description">
                                    Управление пресетами и категориями
                                </span>
                                <div style={{
                                    display: 'flex',
                                    gap: '0.5rem',
                                    flexWrap: 'wrap',
                                    marginTop: '0.75rem',
                                }}>
                                    <button
                                        className="btn btn-primary btn-sm"
                                        onClick={startWizard}
                                    >
                                        ➕ Создать пресет
                                    </button>
                                    <button
                                        className="btn btn-secondary btn-sm"
                                        onClick={exportPresets}
                                    >
                                        📥 Экспорт всех
                                    </button>
                                    <label className="btn btn-secondary btn-sm" style={{cursor: 'pointer'}}>
                                        📤 Импорт
                                        <input
                                            type="file"
                                            accept=".json"
                                            onChange={importPresets}
                                            hidden
                                        />
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Create new preset button */}
                        <div className="feature-item" style={{display: 'none'}}>
                            <div className="feature-info">
                                <label className="feature-label">Создать новый пресет</label>
                                <span className="feature-description">
                                Создать быстрое обращение с помощью мастера
                                    </span>
                            </div>
                            <button
                                className="btn btn-primary btn-sm"
                                onClick={startWizard}
                            >
                                ➕ Создать
                            </button>
                        </div>

                        {/* Show saved presets organized by category */}
                        {quickAppealsPresets.length > 0 && (
                            <div className="feature-item">
                                <div className="feature-info" style={{width: '100%'}}>
                                    <label className="feature-label">Мои пресеты ({quickAppealsPresets.length})</label>
                                    <span className="feature-description">
                                        Сохранённые быстрые обращения
                                    </span>
                                    {/* Search field */}
                                    <input
                                        type="text"
                                        placeholder="Поиск пресетов..."
                                        value={presetSearchQuery}
                                        onChange={(e) => setPresetSearchQuery(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '0.5rem',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: '0.375rem',
                                            backgroundColor: 'var(--card-bg)',
                                            color: 'var(--text-primary)',
                                            fontSize: '0.875rem',
                                            marginTop: '0.75rem',
                                            marginBottom: '0.75rem',
                                        }}
                                    />
                                    {/* Display by category */}
                                    {presetCategories.length > 0 ? (
                                        <div style={{marginTop: '0.75rem'}}>
                                            {presetCategories.map((category) => {
                                                const categoryPresets = quickAppealsPresets.filter(preset =>
                                                    preset.categoryId === category.id &&
                                                    (preset.name.toLowerCase().includes(presetSearchQuery.toLowerCase()) ||
                                                        preset.processingLabel.toLowerCase().includes(presetSearchQuery.toLowerCase()) ||
                                                        preset.categoryLabel.toLowerCase().includes(presetSearchQuery.toLowerCase()) ||
                                                        (preset.childReasonLabel && preset.childReasonLabel.toLowerCase().includes(presetSearchQuery.toLowerCase())))
                                                );
                                                if (categoryPresets.length === 0) return null;
                                                return (
                                                    <div key={category.id} style={{marginBottom: '1rem'}}>
                                                        <div style={{
                                                            fontWeight: 600,
                                                            fontSize: '0.875rem',
                                                            marginBottom: '0.5rem',
                                                            color: 'var(--primary)',
                                                        }}>
                                                            {category.name}
                                                        </div>
                                                        <div style={{
                                                            display: 'grid',
                                                            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                                                            gap: '0.5rem',
                                                        }}>
                                                            {categoryPresets.map((preset) => (
                                                                <div
                                                                    key={preset.id}
                                                                    style={{
                                                                        position: 'relative',
                                                                        display: 'flex',
                                                                        alignItems: 'flex-start',
                                                                        gap: '0.5rem',
                                                                        padding: '0.75rem',
                                                                        backgroundColor: 'var(--muted)',
                                                                        borderRadius: '0.5rem',
                                                                    }}
                                                                >
                                                                    <div style={{flex: 1, minWidth: 0}}>
                                                                        <div style={{
                                                                            fontWeight: 600,
                                                                            fontSize: '0.875rem',
                                                                            marginBottom: '0.25rem',
                                                                            overflow: 'hidden',
                                                                            textOverflow: 'ellipsis',
                                                                            whiteSpace: 'nowrap',
                                                                        }}>
                                                                            {preset.name}
                                                                        </div>
                                                                        <div style={{
                                                                            fontSize: '0.75rem',
                                                                            color: 'var(--text-secondary)',
                                                                            overflow: 'hidden',
                                                                            textOverflow: 'ellipsis',
                                                                            whiteSpace: 'nowrap',
                                                                        }}>
                                                                            {products.find(p => p.id === preset.product)?.name} → {preset.processingLabel} → {preset.categoryLabel}
                                                                            {preset.subcategoryLabel && ` → ${preset.subcategoryLabel}`}
                                                                            {preset.childReasonLabel && ` → ${preset.childReasonLabel}`}
                                                                        </div>
                                                                    </div>
                                                                    <div style={{
                                                                        display: 'flex',
                                                                        gap: '0.25rem',
                                                                        flexWrap: 'wrap'
                                                                    }}>
                                                                        <button
                                                                            className="btn btn-secondary btn-sm"
                                                                            style={{
                                                                                padding: '0.25rem 0.5rem',
                                                                                minWidth: 'auto',
                                                                                fontSize: '0.75rem',
                                                                            }}
                                                                            title="Редактировать"
                                                                            onClick={() => editPreset(preset.id)}
                                                                        >
                                                                            ✏️
                                                                        </button>
                                                                        <button
                                                                            className="btn btn-secondary btn-sm"
                                                                            style={{
                                                                                padding: '0.25rem 0.5rem',
                                                                                minWidth: 'auto',
                                                                                fontSize: '0.75rem',
                                                                            }}
                                                                            title="Дублировать"
                                                                            onClick={() => duplicatePreset(preset.id)}
                                                                        >
                                                                            📋
                                                                        </button>
                                                                        <button
                                                                            className="btn btn-secondary btn-sm"
                                                                            style={{
                                                                                padding: '0.25rem 0.5rem',
                                                                                minWidth: 'auto',
                                                                                fontSize: '0.75rem',
                                                                            }}
                                                                            title="Копировать в буфер"
                                                                            onClick={() => copySinglePreset(preset.id)}
                                                                        >
                                                                            📤
                                                                        </button>
                                                                        <button
                                                                            className="btn btn-secondary btn-sm"
                                                                            style={{
                                                                                padding: '0.25rem 0.5rem',
                                                                                minWidth: 'auto',
                                                                                fontSize: '0.75rem',
                                                                            }}
                                                                            title="Удалить"
                                                                            onClick={() => removePreset(preset.id)}
                                                                        >
                                                                            ✕
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {/* Uncategorized presets */}
                                            {quickAppealsPresets.filter(preset => !preset.categoryId).length > 0 && (
                                                <div style={{marginBottom: '1rem'}}>
                                                    <div style={{
                                                        fontWeight: 600,
                                                        fontSize: '0.875rem',
                                                        marginBottom: '0.5rem',
                                                        color: 'var(--text-secondary)',
                                                    }}>
                                                        Без категории
                                                    </div>
                                                    <div style={{
                                                        display: 'grid',
                                                        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                                                        gap: '0.5rem',
                                                    }}>
                                                        {quickAppealsPresets.filter(preset =>
                                                            !preset.categoryId &&
                                                            (preset.name.toLowerCase().includes(presetSearchQuery.toLowerCase()) ||
                                                                preset.processingLabel.toLowerCase().includes(presetSearchQuery.toLowerCase()) ||
                                                                preset.categoryLabel.toLowerCase().includes(presetSearchQuery.toLowerCase()) ||
                                                                (preset.childReasonLabel && preset.childReasonLabel.toLowerCase().includes(presetSearchQuery.toLowerCase())))
                                                        ).map((preset) => (
                                                            <div
                                                                key={preset.id}
                                                                style={{
                                                                    position: 'relative',
                                                                    display: 'flex',
                                                                    alignItems: 'flex-start',
                                                                    gap: '0.5rem',
                                                                    padding: '0.75rem',
                                                                    backgroundColor: 'var(--muted)',
                                                                    borderRadius: '0.5rem',
                                                                }}
                                                            >
                                                                <div style={{flex: 1, minWidth: 0}}>
                                                                    <div style={{
                                                                        fontWeight: 600,
                                                                        fontSize: '0.875rem',
                                                                        marginBottom: '0.25rem',
                                                                        overflow: 'hidden',
                                                                        textOverflow: 'ellipsis',
                                                                        whiteSpace: 'nowrap',
                                                                    }}>
                                                                        {preset.name}
                                                                    </div>
                                                                    <div style={{
                                                                        fontSize: '0.75rem',
                                                                        color: 'var(--text-secondary)',
                                                                        overflow: 'hidden',
                                                                        textOverflow: 'ellipsis',
                                                                        whiteSpace: 'nowrap',
                                                                    }}>
                                                                        {products.find(p => p.id === preset.product)?.name} → {preset.processingLabel} → {preset.categoryLabel}
                                                                        {preset.subcategoryLabel && ` → ${preset.subcategoryLabel}`}
                                                                        {preset.childReasonLabel && ` → ${preset.childReasonLabel}`}
                                                                    </div>
                                                                </div>
                                                                <div style={{
                                                                    display: 'flex',
                                                                    gap: '0.25rem',
                                                                    flexWrap: 'wrap'
                                                                }}>
                                                                    <button
                                                                        className="btn btn-secondary btn-sm"
                                                                        style={{
                                                                            padding: '0.25rem 0.5rem',
                                                                            minWidth: 'auto',
                                                                            fontSize: '0.75rem',
                                                                        }}
                                                                        title="Редактировать"
                                                                        onClick={() => editPreset(preset.id)}
                                                                    >
                                                                        ✏️
                                                                    </button>
                                                                    <button
                                                                        className="btn btn-secondary btn-sm"
                                                                        style={{
                                                                            padding: '0.25rem 0.5rem',
                                                                            minWidth: 'auto',
                                                                            fontSize: '0.75rem',
                                                                        }}
                                                                        title="Дублировать"
                                                                        onClick={() => duplicatePreset(preset.id)}
                                                                    >
                                                                        📋
                                                                    </button>
                                                                    <button
                                                                        className="btn btn-secondary btn-sm"
                                                                        style={{
                                                                            padding: '0.25rem 0.5rem',
                                                                            minWidth: 'auto',
                                                                            fontSize: '0.75rem',
                                                                        }}
                                                                        title="Копировать в буфер"
                                                                        onClick={() => copySinglePreset(preset.id)}
                                                                    >
                                                                        📤
                                                                    </button>
                                                                    <button
                                                                        className="btn btn-secondary btn-sm"
                                                                        style={{
                                                                            padding: '0.25rem 0.5rem',
                                                                            minWidth: 'auto',
                                                                            fontSize: '0.75rem',
                                                                        }}
                                                                        title="Удалить"
                                                                        onClick={() => removePreset(preset.id)}
                                                                    >
                                                                        ✕
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        // No categories - show all presets flat
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                                            gap: '0.5rem',
                                            marginTop: '0.75rem'
                                        }}>
                                            {quickAppealsPresets
                                                .filter(preset =>
                                                    preset.name.toLowerCase().includes(presetSearchQuery.toLowerCase()) ||
                                                    preset.processingLabel.toLowerCase().includes(presetSearchQuery.toLowerCase()) ||
                                                    preset.categoryLabel.toLowerCase().includes(presetSearchQuery.toLowerCase()) ||
                                                    (preset.childReasonLabel && preset.childReasonLabel.toLowerCase().includes(presetSearchQuery.toLowerCase())))
                                                .map((preset) => (
                                                    <div
                                                        key={preset.id}
                                                        style={{
                                                            position: 'relative',
                                                            display: 'flex',
                                                            alignItems: 'flex-start',
                                                            gap: '0.5rem',
                                                            padding: '0.75rem',
                                                            backgroundColor: 'var(--muted)',
                                                            borderRadius: '0.5rem',
                                                        }}
                                                    >
                                                        <div style={{flex: 1, minWidth: 0}}>
                                                            <div style={{
                                                                fontWeight: 600,
                                                                fontSize: '0.875rem',
                                                                marginBottom: '0.25rem',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                whiteSpace: 'nowrap',
                                                            }}>
                                                                {preset.name}
                                                            </div>
                                                            <div style={{
                                                                fontSize: '0.75rem',
                                                                color: 'var(--text-secondary)',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                whiteSpace: 'nowrap',
                                                            }}>
                                                                {products.find(p => p.id === preset.product)?.name} → {preset.processingLabel} → {preset.categoryLabel}
                                                                {preset.subcategoryLabel && ` → ${preset.subcategoryLabel}`}
                                                                {preset.childReasonLabel && ` → ${preset.childReasonLabel}`}
                                                            </div>
                                                        </div>
                                                        <div
                                                            style={{display: 'flex', gap: '0.25rem', flexWrap: 'wrap'}}>
                                                            <button
                                                                className="btn btn-secondary btn-sm"
                                                                style={{
                                                                    padding: '0.25rem 0.5rem',
                                                                    minWidth: 'auto',
                                                                    fontSize: '0.75rem',
                                                                }}
                                                                title="Редактировать"
                                                                onClick={() => editPreset(preset.id)}
                                                            >
                                                                ✏️
                                                            </button>
                                                            <button
                                                                className="btn btn-secondary btn-sm"
                                                                style={{
                                                                    padding: '0.25rem 0.5rem',
                                                                    minWidth: 'auto',
                                                                    fontSize: '0.75rem',
                                                                }}
                                                                title="Дублировать"
                                                                onClick={() => duplicatePreset(preset.id)}
                                                            >
                                                                📋
                                                            </button>
                                                            <button
                                                                className="btn btn-secondary btn-sm"
                                                                style={{
                                                                    padding: '0.25rem 0.5rem',
                                                                    minWidth: 'auto',
                                                                    fontSize: '0.75rem',
                                                                }}
                                                                title="Копировать в буфер"
                                                                onClick={() => copySinglePreset(preset.id)}
                                                            >
                                                                📤
                                                            </button>
                                                            <button
                                                                className="btn btn-secondary btn-sm"
                                                                style={{
                                                                    padding: '0.25rem 0.5rem',
                                                                    minWidth: 'auto',
                                                                    fontSize: '0.75rem',
                                                                }}
                                                                title="Удалить"
                                                                onClick={() => removePreset(preset.id)}
                                                            >
                                                                ✕
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Category Management */}
                        <div className="feature-item">
                            <div className="feature-info" style={{width: '100%'}}>
                                <label className="feature-label">Управление категориями
                                    ({presetCategories.length})</label>
                                <span className="feature-description">
                                    Создавайте, редактируйте и удаляйте категории для организации пресетов
                                </span>

                                {/* Create new category */}
                                <div style={{
                                    display: 'flex',
                                    gap: '0.5rem',
                                    marginTop: '0.75rem',
                                    marginBottom: '1rem',
                                }}>
                                    <input
                                        type="text"
                                        value={newCategoryName}
                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                        placeholder="Новая категория..."
                                        style={{
                                            flex: 1,
                                            padding: '0.5rem',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: '0.375rem',
                                            backgroundColor: 'var(--card-bg)',
                                            color: 'var(--text-primary)',
                                            fontSize: '0.875rem',
                                        }}
                                    />
                                    <button
                                        className="btn btn-primary btn-sm"
                                        onClick={createNewCategory}
                                        disabled={!newCategoryName.trim()}
                                    >
                                        ➕ Создать
                                    </button>
                                </div>

                                {/* Categories list */}
                                {presetCategories.length > 0 ? (
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                                        gap: '0.75rem',
                                        marginTop: '0.75rem',
                                    }}>
                                        {presetCategories.map((category) => {
                                            const presetCount = quickAppealsPresets.filter(p => p.categoryId === category.id).length;
                                            const isEditing = editingCategoryId === category.id;

                                            return (
                                                <div
                                                    key={category.id}
                                                    style={{
                                                        padding: '0.75rem',
                                                        backgroundColor: 'var(--muted)',
                                                        borderRadius: '0.5rem',
                                                        border: '1px solid var(--border-color)',
                                                    }}
                                                >
                                                    {isEditing ? (
                                                        <div style={{
                                                            display: 'flex',
                                                            gap: '0.5rem',
                                                            alignItems: 'center'
                                                        }}>
                                                            <input
                                                                type="text"
                                                                value={editingCategoryName}
                                                                onChange={(e) => setEditingCategoryName(e.target.value)}
                                                                autoFocus
                                                                style={{
                                                                    flex: 1,
                                                                    padding: '0.375rem',
                                                                    border: '1px solid var(--border-color)',
                                                                    borderRadius: '0.375rem',
                                                                    backgroundColor: 'var(--card-bg)',
                                                                    color: 'var(--text-primary)',
                                                                    fontSize: '0.875rem',
                                                                }}
                                                            />
                                                            <button
                                                                className="btn btn-primary btn-sm"
                                                                onClick={saveEditCategory}
                                                                style={{padding: '0.25rem 0.5rem'}}
                                                            >
                                                                ✓
                                                            </button>
                                                            <button
                                                                className="btn btn-secondary btn-sm"
                                                                onClick={cancelEditCategory}
                                                                style={{padding: '0.25rem 0.5rem'}}
                                                            >
                                                                ✕
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div style={{
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center'
                                                        }}>
                                                            <div style={{flex: 1, minWidth: 0}}>
                                                                <div style={{
                                                                    fontWeight: 600,
                                                                    fontSize: '0.875rem',
                                                                    marginBottom: '0.25rem',
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis',
                                                                    whiteSpace: 'nowrap',
                                                                }}>
                                                                    {category.name}
                                                                </div>
                                                                <div style={{
                                                                    fontSize: '0.75rem',
                                                                    color: 'var(--text-secondary)',
                                                                }}>
                                                                    {presetCount} {presetCount === 1 ? 'пресет' : presetCount >= 2 && presetCount <= 4 ? 'пресета' : 'пресетов'}
                                                                </div>
                                                            </div>
                                                            <div style={{
                                                                display: 'flex',
                                                                gap: '0.25rem',
                                                                flexWrap: 'wrap'
                                                            }}>
                                                                <button
                                                                    className="btn btn-secondary btn-sm"
                                                                    onClick={() => startEditCategory(category.id)}
                                                                    style={{padding: '0.25rem 0.5rem'}}
                                                                    title="Редактировать"
                                                                >
                                                                    ✏️
                                                                </button>
                                                                <button
                                                                    className="btn btn-secondary btn-sm"
                                                                    onClick={() => duplicateCategory(category.id)}
                                                                    style={{padding: '0.25rem 0.5rem'}}
                                                                    title="Дублировать"
                                                                >
                                                                    📋
                                                                </button>
                                                                <button
                                                                    className="btn btn-secondary btn-sm"
                                                                    onClick={() => {
                                                                        if (confirm(`Удалить категорию "${category.name}"? Все пресеты в этой категории станут без категории.`)) {
                                                                            deleteCategory(category.id);
                                                                        }
                                                                    }}
                                                                    style={{padding: '0.25rem 0.5rem'}}
                                                                    title="Удалить"
                                                                >
                                                                    🗑️
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div style={{
                                        padding: '1rem',
                                        textAlign: 'center',
                                        color: 'var(--text-secondary)',
                                        fontSize: '0.875rem',
                                        backgroundColor: 'var(--muted)',
                                        borderRadius: '0.5rem',
                                        marginTop: '0.75rem',
                                    }}>
                                        Пока нет категорий. Создайте первую категорию выше!
                                    </div>
                                )}

                                {/* Uncategorized presets info */}
                                {quickAppealsPresets.filter(p => !p.categoryId).length > 0 && (
                                    <div style={{
                                        marginTop: '1rem',
                                        padding: '0.75rem',
                                        backgroundColor: 'rgba(255, 193, 7, 0.1)',
                                        border: '1px solid rgba(255, 193, 7, 0.3)',
                                        borderRadius: '0.5rem',
                                        fontSize: '0.875rem',
                                        color: 'var(--text-primary)',
                                    }}>
                                        <span
                                            style={{fontWeight: 500}}>Без категории:</span> {quickAppealsPresets.filter(p => !p.categoryId).length} {quickAppealsPresets.filter(p => !p.categoryId).length === 1 ? 'пресет' : quickAppealsPresets.filter(p => !p.categoryId).length >= 2 && quickAppealsPresets.filter(p => !p.categoryId).length <= 4 ? 'пресета' : 'пресетов'}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Wizard Modal */}
                        {wizardOpen && (
                            <div style={{
                                position: 'fixed',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 1000,
                                padding: '1rem',
                            }}>
                                <div style={{
                                    backgroundColor: 'var(--card-bg)',
                                    borderRadius: '0.75rem',
                                    padding: '1.5rem',
                                    maxWidth: '500px',
                                    width: '100%',
                                    maxHeight: '80vh',
                                    overflow: 'auto',
                                    boxShadow: 'var(--shadow-lg)',
                                }}>
                                    {/* Header */}
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: '1rem',
                                    }}>
                                        <h3 style={{margin: 0, fontSize: '1.125rem', fontWeight: 600}}>
                                            {editingPresetId ? 'Редактирование пресета' : 'Создание быстрого обращения'}
                                        </h3>
                                        <button
                                            className="btn btn-secondary btn-sm"
                                            onClick={() => {
                                                setWizardOpen(false);
                                                setEditingPresetId(null);
                                            }}
                                            style={{padding: '0.25rem 0.5rem'}}
                                        >
                                            ✕
                                        </button>
                                    </div>

                                    {/* Progress indicator */}
                                    <div style={{
                                        display: 'flex',
                                        gap: '0.25rem',
                                        marginBottom: '1.5rem',
                                    }}>
                                        {['product', 'processing', 'category', 'subcategory', 'childreason', 'comment', 'name'].map((step, index) => {
                                            const stepLabels = ['Продукт', 'Обработка', 'Категория', 'Подкатегория', 'Причина-ребёнок', 'Комментарий', 'Название'];
                                            const isCurrentStep = wizardStep === step;
                                            const isPastStep = ['product', 'processing', 'category', 'subcategory', 'childreason', 'comment', 'name'].indexOf(wizardStep) > index;
                                            return (
                                                <div
                                                    key={step}
                                                    style={{
                                                        flex: 1,
                                                        height: '4px',
                                                        backgroundColor: isCurrentStep ? 'var(--primary)' : isPastStep ? 'var(--positive)' : 'var(--muted)',
                                                        borderRadius: '2px',
                                                    }}
                                                    title={stepLabels[index]}
                                                />
                                            );
                                        })}
                                    </div>

                                    {/* Step content */}
                                    {wizardStep === 'product' && (
                                        <>
                                            <div style={{marginBottom: '1rem'}}>
                                                <label style={{
                                                    display: 'block',
                                                    fontWeight: 500,
                                                    marginBottom: '0.5rem',
                                                }}>
                                                    Шаг 1: Выберите продукт
                                                </label>
                                                <div style={{
                                                    display: 'grid',
                                                    gap: '0.5rem',
                                                }}>
                                                    <button
                                                        className="btn btn-secondary"
                                                        style={{
                                                            width: '100%',
                                                            justifyContent: 'flex-start',
                                                            border: selectedProduct === 69 ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                                                        }}
                                                        onClick={() => selectProduct(69)}
                                                    >
                                                        Без продукта
                                                    </button>
                                                    {products.map((product) => (
                                                        <button
                                                            key={product.id}
                                                            className="btn btn-secondary"
                                                            style={{
                                                                width: '100%',
                                                                justifyContent: 'flex-start',
                                                                border: selectedProduct === product.id ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                                                            }}
                                                            onClick={() => selectProduct(product.id)}
                                                        >
                                                            {product.name}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {wizardStep === 'processing' && (
                                        <>
                                            <SelectedOptionsSummary/>
                                            <div style={{marginBottom: '1rem'}}>
                                                <label style={{
                                                    display: 'block',
                                                    fontWeight: 500,
                                                    marginBottom: '0.5rem',
                                                }}>
                                                    Шаг 2: Выберите обработку
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="Поиск по обработке..."
                                                    value={processingSearchQuery}
                                                    onChange={(e) => setProcessingSearchQuery(e.target.value)}
                                                    style={{
                                                        width: '100%',
                                                        padding: '0.5rem',
                                                        border: '1px solid var(--border-color)',
                                                        borderRadius: '0.375rem',
                                                        backgroundColor: 'var(--card-bg)',
                                                        color: 'var(--text-primary)',
                                                        fontSize: '0.875rem',
                                                        marginBottom: '0.75rem',
                                                    }}
                                                />
                                                <div style={{
                                                    display: 'grid',
                                                    gap: '0.5rem',
                                                    maxHeight: '300px',
                                                    overflow: 'auto',
                                                }}>
                                                    {processingGroups
                                                        .filter(group => group.label.toLowerCase().includes(processingSearchQuery.toLowerCase()))
                                                        .map((group) => (
                                                            <button
                                                                key={group.value}
                                                                className="btn btn-secondary"
                                                                style={{
                                                                    width: '100%',
                                                                    justifyContent: 'flex-start',
                                                                    textAlign: 'left',
                                                                    border: selectedProcessing?.value === group.value ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                                                                }}
                                                                onClick={() => selectProcessing(group)}
                                                            >
                                                                {group.label}
                                                            </button>
                                                        ))}
                                                </div>
                                            </div>
                                            <div style={{display: 'flex', gap: '0.5rem'}}>
                                                <button
                                                    className="btn btn-secondary btn-sm"
                                                    onClick={() => setWizardStep('product')}
                                                >
                                                    ← Назад
                                                </button>
                                                <button
                                                    className="btn btn-primary btn-sm"
                                                    onClick={() => setWizardStep('comment')}
                                                    style={{flex: 1}}
                                                    disabled={!selectedProduct}
                                                >
                                                    Далее →
                                                </button>
                                            </div>
                                        </>
                                    )}

                                    {wizardStep === 'category' && (
                                        <>
                                            <SelectedOptionsSummary/>
                                            <div style={{marginBottom: '1rem'}}>
                                                <label style={{
                                                    display: 'block',
                                                    fontWeight: 500,
                                                    marginBottom: '0.5rem',
                                                }}>
                                                    Шаг 3: Выберите категорию обращения
                                                </label>
                                                {!isLoadingCategories && appealsCategories.length > 0 && (
                                                    <input
                                                        type="text"
                                                        placeholder="Поиск по категории..."
                                                        value={categorySearchQuery}
                                                        onChange={(e) => setCategorySearchQuery(e.target.value)}
                                                        style={{
                                                            width: '100%',
                                                            padding: '0.5rem',
                                                            border: '1px solid var(--border-color)',
                                                            borderRadius: '0.375rem',
                                                            backgroundColor: 'var(--card-bg)',
                                                            color: 'var(--text-primary)',
                                                            fontSize: '0.875rem',
                                                            marginBottom: '0.75rem',
                                                        }}
                                                    />
                                                )}
                                                {isLoadingCategories ? (
                                                    <div style={{
                                                        display: 'flex',
                                                        justifyContent: 'center',
                                                        padding: '1rem',
                                                    }}>
                                                        <div className="spinner"/>
                                                    </div>
                                                ) : (
                                                    <div style={{
                                                        display: 'grid',
                                                        gap: '0.5rem',
                                                        maxHeight: '300px',
                                                        overflow: 'auto',
                                                    }}>
                                                        {appealsCategories
                                                            .filter(cat => cat.label.toLowerCase().includes(categorySearchQuery.toLowerCase()))
                                                            .map((category) => (
                                                                <button
                                                                    key={category.value}
                                                                    className="btn btn-secondary"
                                                                    style={{
                                                                        width: '100%',
                                                                        justifyContent: 'flex-start',
                                                                        textAlign: 'left',
                                                                    }}
                                                                    onClick={() => selectCategory({
                                                                        value: category.value,
                                                                        label: category.label
                                                                    })}
                                                                >
                                                                    {category.label}
                                                                </button>
                                                            ))}
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{display: 'flex', gap: '0.5rem'}}>
                                                <button
                                                    className="btn btn-secondary btn-sm"
                                                    onClick={() => setWizardStep('processing')}
                                                >
                                                    ← Назад
                                                </button>
                                                <button
                                                    className="btn btn-primary btn-sm"
                                                    onClick={() => {
                                                        // If there are subcategories loaded, go to subcategory step, otherwise skip to comment
                                                        if (subcategories.length > 0) {
                                                            setWizardStep('subcategory');
                                                        } else {
                                                            setWizardStep('comment');
                                                        }
                                                    }}
                                                    style={{flex: 1}}
                                                    disabled={!selectedProduct}
                                                >
                                                    Далее →
                                                </button>
                                            </div>
                                        </>
                                    )}

                                    {wizardStep === 'subcategory' && (
                                        <>
                                            <SelectedOptionsSummary/>
                                            <div style={{marginBottom: '1rem'}}>
                                                <label style={{
                                                    display: 'block',
                                                    fontWeight: 500,
                                                    marginBottom: '0.5rem',
                                                }}>
                                                    {subcategories.length > 0 ? 'Шаг 4: Выберите подкатегорию' : 'Шаг 4: Подкатегории'}
                                                </label>
                                                {!isLoadingSubcategories && subcategories.length > 0 && (
                                                    <input
                                                        type="text"
                                                        placeholder="Поиск по подкатегории..."
                                                        value={subcategorySearchQuery}
                                                        onChange={(e) => setSubcategorySearchQuery(e.target.value)}
                                                        style={{
                                                            width: '100%',
                                                            padding: '0.5rem',
                                                            border: '1px solid var(--border-color)',
                                                            borderRadius: '0.375rem',
                                                            backgroundColor: 'var(--card-bg)',
                                                            color: 'var(--text-primary)',
                                                            fontSize: '0.875rem',
                                                            marginBottom: '0.75rem',
                                                        }}
                                                    />
                                                )}
                                                {isLoadingSubcategories ? (
                                                    <div style={{
                                                        display: 'flex',
                                                        justifyContent: 'center',
                                                        padding: '1rem',
                                                    }}>
                                                        <div className="spinner"/>
                                                    </div>
                                                ) : subcategories.length > 0 ? (
                                                    <div style={{
                                                        display: 'grid',
                                                        gap: '0.5rem',
                                                        maxHeight: '300px',
                                                        overflow: 'auto',
                                                    }}>
                                                        {subcategories
                                                            .filter(sub => sub.label.toLowerCase().includes(subcategorySearchQuery.toLowerCase()))
                                                            .map((subcategory) => (
                                                                <button
                                                                    key={subcategory.value}
                                                                    className="btn btn-secondary"
                                                                    style={{
                                                                        width: '100%',
                                                                        justifyContent: 'flex-start',
                                                                        textAlign: 'left',
                                                                    }}
                                                                    onClick={() => selectSubcategory(subcategory)}
                                                                >
                                                                    {subcategory.label}
                                                                </button>
                                                            ))}
                                                    </div>
                                                ) : (
                                                    <div style={{
                                                        padding: '1rem',
                                                        textAlign: 'center',
                                                        color: 'var(--text-secondary)',
                                                    }}>
                                                        Для выбранной категории нет подкатегорий
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{display: 'flex', gap: '0.5rem'}}>
                                                <button
                                                    className="btn btn-secondary btn-sm"
                                                    onClick={() => setWizardStep('category')}
                                                >
                                                    ← Назад
                                                </button>
                                                <button
                                                    className="btn btn-primary btn-sm"
                                                    onClick={() => {
                                                        // If there are child reasons loaded, go to childreason step, otherwise skip to comment
                                                        if (childReasons.length > 0) {
                                                            setWizardStep('childreason');
                                                        } else {
                                                            setWizardStep('comment');
                                                        }
                                                    }}
                                                    style={{flex: 1}}
                                                    disabled={!selectedProduct}
                                                >
                                                    Далее →
                                                </button>
                                            </div>
                                        </>
                                    )}

                                    {wizardStep === 'childreason' && (
                                        <>
                                            <SelectedOptionsSummary/>
                                            <div style={{marginBottom: '1rem'}}>
                                                <label style={{
                                                    display: 'block',
                                                    fontWeight: 500,
                                                    marginBottom: '0.5rem',
                                                }}>
                                                    {childReasons.length > 0 ? 'Шаг 5: Выберите причину-ребёнка' : 'Шаг 5: Причины-дети'}
                                                </label>
                                                {!isLoadingChildReasons && childReasons.length > 0 && (
                                                    <input
                                                        type="text"
                                                        placeholder="Поиск по причине-ребёнку..."
                                                        value={childReasonSearchQuery}
                                                        onChange={(e) => setChildReasonSearchQuery(e.target.value)}
                                                        style={{
                                                            width: '100%',
                                                            padding: '0.5rem',
                                                            border: '1px solid var(--border-color)',
                                                            borderRadius: '0.375rem',
                                                            backgroundColor: 'var(--card-bg)',
                                                            color: 'var(--text-primary)',
                                                            fontSize: '0.875rem',
                                                            marginBottom: '0.75rem',
                                                        }}
                                                    />
                                                )}
                                                {isLoadingChildReasons ? (
                                                    <div style={{
                                                        display: 'flex',
                                                        justifyContent: 'center',
                                                        padding: '1rem',
                                                    }}>
                                                        <div className="spinner"/>
                                                    </div>
                                                ) : childReasons.length > 0 ? (
                                                    <div style={{
                                                        display: 'grid',
                                                        gap: '0.5rem',
                                                        maxHeight: '300px',
                                                        overflow: 'auto',
                                                    }}>
                                                        {childReasons
                                                            .filter(cr => cr.label.toLowerCase().includes(childReasonSearchQuery.toLowerCase()))
                                                            .map((childReason) => (
                                                                <button
                                                                    key={childReason.value}
                                                                    className="btn btn-secondary"
                                                                    style={{
                                                                        width: '100%',
                                                                        justifyContent: 'flex-start',
                                                                        textAlign: 'left',
                                                                    }}
                                                                    onClick={() => selectChildReason(childReason)}
                                                                >
                                                                    {childReason.label}
                                                                </button>
                                                            ))}
                                                    </div>
                                                ) : (
                                                    <div style={{
                                                        padding: '1rem',
                                                        textAlign: 'center',
                                                        color: 'var(--text-secondary)',
                                                    }}>
                                                        Для выбранной подкатегории нет причин-детей
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{display: 'flex', gap: '0.5rem'}}>
                                                <button
                                                    className="btn btn-secondary btn-sm"
                                                    onClick={() => setWizardStep('subcategory')}
                                                >
                                                    ← Назад
                                                </button>
                                                <button
                                                    className="btn btn-primary btn-sm"
                                                    onClick={() => setWizardStep('comment')}
                                                    style={{flex: 1}}
                                                    disabled={!selectedProduct}
                                                >
                                                    Далее →
                                                </button>
                                            </div>
                                        </>
                                    )}

                                    {wizardStep === 'name' && (
                                        <>
                                            {/* Full summary of all selections */}
                                            <div style={{
                                                padding: '1rem',
                                                backgroundColor: 'var(--muted)',
                                                borderRadius: '0.5rem',
                                                marginBottom: '1rem',
                                            }}>
                                                <div style={{
                                                    fontWeight: 600,
                                                    marginBottom: '0.75rem',
                                                    color: 'var(--text-secondary)',
                                                    fontSize: '0.75rem',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.05em',
                                                }}>
                                                    Итоговый обзор:
                                                </div>
                                                <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                                                    {selectedProduct && (
                                                        <div style={{
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            fontSize: '0.875rem'
                                                        }}>
                                                            <span
                                                                style={{color: 'var(--text-secondary)'}}>Продукт:</span>
                                                            <span
                                                                style={{fontWeight: 500}}>{products.find(p => p.id === selectedProduct)?.name}</span>
                                                        </div>
                                                    )}
                                                    {selectedProcessing && (
                                                        <div style={{
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            fontSize: '0.875rem'
                                                        }}>
                                                            <span
                                                                style={{color: 'var(--text-secondary)'}}>Обработка:</span>
                                                            <span
                                                                style={{fontWeight: 500}}>{selectedProcessing.label}</span>
                                                        </div>
                                                    )}
                                                    {selectedCategory && (
                                                        <div style={{
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            fontSize: '0.875rem'
                                                        }}>
                                                            <span
                                                                style={{color: 'var(--text-secondary)'}}>Категория:</span>
                                                            <span
                                                                style={{fontWeight: 500}}>{selectedCategory.label}</span>
                                                        </div>
                                                    )}
                                                    {selectedSubcategory && (
                                                        <div style={{
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            fontSize: '0.875rem'
                                                        }}>
                                                            <span
                                                                style={{color: 'var(--text-secondary)'}}>Подкатегория:</span>
                                                            <span
                                                                style={{fontWeight: 500}}>{selectedSubcategory.label}</span>
                                                        </div>
                                                    )}
                                                    {selectedChildReason && (
                                                        <div style={{
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            fontSize: '0.875rem'
                                                        }}>
                                                            <span
                                                                style={{color: 'var(--text-secondary)'}}>Причина-ребёнок:</span>
                                                            <span
                                                                style={{fontWeight: 500}}>{selectedChildReason.label}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div style={{marginBottom: '1rem'}}>
                                                <label style={{
                                                    display: 'block',
                                                    fontWeight: 500,
                                                    marginBottom: '0.5rem',
                                                }}>
                                                    Шаг 7: Название пресета
                                                </label>
                                                <input
                                                    type="text"
                                                    value={presetName}
                                                    onChange={(e) => setPresetName(e.target.value)}
                                                    placeholder="Например: Нет интернета - Претензии"
                                                    style={{
                                                        width: '100%',
                                                        padding: '0.5rem',
                                                        border: '1px solid var(--border-color)',
                                                        borderRadius: '0.375rem',
                                                        backgroundColor: 'var(--card-bg)',
                                                        color: 'var(--text-primary)',
                                                        fontSize: '0.875rem',
                                                        marginBottom: '1rem',
                                                    }}
                                                    autoFocus
                                                />
                                            </div>

                                            <div style={{marginBottom: '1rem'}}>
                                                <label style={{
                                                    display: 'block',
                                                    fontWeight: 500,
                                                    marginBottom: '0.5rem',
                                                }}>
                                                    Категория для пресета
                                                </label>
                                                <div style={{
                                                    display: 'grid',
                                                    gap: '0.5rem',
                                                    marginBottom: '0.75rem',
                                                }}>
                                                    {presetCategories.map((cat) => (
                                                        <button
                                                            key={cat.id}
                                                            className="btn btn-secondary"
                                                            style={{
                                                                width: '100%',
                                                                justifyContent: 'flex-start',
                                                                textAlign: 'left',
                                                                border: selectedPresetCategory === cat.id ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                                                            }}
                                                            onClick={() => setSelectedPresetCategory(cat.id)}
                                                        >
                                                            {cat.name}
                                                        </button>
                                                    ))}
                                                </div>
                                                <div style={{display: 'flex', gap: '0.5rem'}}>
                                                    <input
                                                        type="text"
                                                        value={newCategoryName}
                                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                                        placeholder="Новая категория..."
                                                        style={{
                                                            flex: 1,
                                                            padding: '0.5rem',
                                                            border: '1px solid var(--border-color)',
                                                            borderRadius: '0.375rem',
                                                            backgroundColor: 'var(--card-bg)',
                                                            color: 'var(--text-primary)',
                                                            fontSize: '0.875rem',
                                                        }}
                                                    />
                                                    <button
                                                        className="btn btn-secondary btn-sm"
                                                        onClick={createNewCategory}
                                                        disabled={!newCategoryName.trim()}
                                                    >
                                                        ➕
                                                    </button>
                                                </div>
                                            </div>

                                            <div style={{display: 'flex', gap: '0.5rem'}}>
                                                <button
                                                    className="btn btn-secondary btn-sm"
                                                    onClick={() => setWizardStep('comment')}
                                                >
                                                    ← Назад
                                                </button>
                                                <button
                                                    className="btn btn-primary btn-sm"
                                                    onClick={savePreset}
                                                    style={{flex: 1}}
                                                    disabled={!presetName.trim()}
                                                >
                                                    Сохранить
                                                </button>
                                            </div>
                                        </>
                                    )}

                                    {wizardStep === 'comment' && (
                                        <>
                                            <SelectedOptionsSummary/>
                                            <div style={{marginBottom: '1rem'}}>
                                                <label style={{
                                                    display: 'block',
                                                    fontWeight: 500,
                                                    marginBottom: '0.5rem',
                                                }}>
                                                    Шаг 6: Комментарий (необязательно)
                                                </label>
                                                <textarea
                                                    value={presetComment}
                                                    onChange={(e) => setPresetComment(e.target.value)}
                                                    placeholder="Введите текст комментария, который будет автоматически вставлен в поле обращения при использовании этого пресета..."
                                                    style={{
                                                        width: '100%',
                                                        minHeight: '100px',
                                                        padding: '0.5rem',
                                                        border: '1px solid var(--border-color)',
                                                        borderRadius: '0.375rem',
                                                        backgroundColor: 'var(--card-bg)',
                                                        color: 'var(--text-primary)',
                                                        fontSize: '0.875rem',
                                                        fontFamily: 'inherit',
                                                        resize: 'vertical',
                                                    }}
                                                />
                                                <div style={{
                                                    fontSize: '0.75rem',
                                                    color: 'var(--text-secondary)',
                                                    marginTop: '0.5rem',
                                                }}>
                                                    Этот комментарий будет автоматически вставлен в
                                                    поле &quot;текст&quot; при выполнении пресета. Оставьте пустым, если
                                                    комментарий не нужен.
                                                </div>
                                            </div>

                                            <div style={{display: 'flex', gap: '0.5rem'}}>
                                                <button
                                                    className="btn btn-secondary btn-sm"
                                                    onClick={() => {
                                                        // Go back to the appropriate previous step
                                                        if (selectedChildReason) {
                                                            setWizardStep('childreason');
                                                        } else if (selectedSubcategory) {
                                                            setWizardStep('subcategory');
                                                        } else {
                                                            setWizardStep('category');
                                                        }
                                                    }}
                                                >
                                                    ← Назад
                                                </button>
                                                <button
                                                    className="btn btn-primary btn-sm"
                                                    onClick={() => setWizardStep('name')}
                                                    style={{flex: 1}}
                                                >
                                                    Далее →
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        return (
            <div key={group.title} className="card">
                <div className="card-header">
                    <div className="card-header-content">
                        <span className="card-icon">{group.icon}</span>
                        <div className="card-header-text">
                            <h3 className="card-title">{group.title}</h3>
                            <p className="card-description">{group.description}</p>
                        </div>
                    </div>
                </div>
                <div className="feature-list">
                    {group.features
                        .filter((f) => f.label.toLowerCase().includes(searchQuery.toLowerCase()) || f.description.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map((feature) => {
                            const isChecked = settings[category]?.[feature.key] === true;
                            return (
                                <div key={feature.key} className="feature-item">
                                    <div className="feature-info">
                                        <label className="feature-label" htmlFor={`feature-${feature.key}`}>
                                            {feature.label}
                                        </label>
                                        <span className="feature-description">{feature.description}</span>
                                    </div>
                                    <label className="switch">
                                        <input
                                            id={`feature-${feature.key}`}
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={(e) => updateSetting(category, feature.key, e.target.checked)}
                                            disabled={isSaving}
                                        />
                                        <span className="slider"/>
                                    </label>
                                </div>
                            );
                        })}
                </div>
            </div>
        );
    };

    return (
        <div className="options-page">
            <header className="options-header">
                <div className="header-content">
                    <div className="header-left">
                        <h1 className="header-title">Хелпер</h1>
                        <p className="header-subtitle">Настройки расширения. Версия - {version || 'загрузка...'}</p>
                    </div>
                    <div className="header-right">
                        <div className="user-info">
                            <div className="user-avatar">
                                {currentUser?.first_name?.[0] || 'U'}
                            </div>
                            <span className="user-name">
                                {currentUser?.first_name} {currentUser?.last_name || ''}
                            </span>
                        </div>
                        <a
                            href="https://t.me/nedomru_bot"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-secondary btn-sm"
                            title="Настройки в боте"
                        >
                            🤖
                        </a>
                        <button onClick={toggleTheme} className="btn btn-secondary btn-sm" title="Переключить тему">
                            {theme === 'light' ? '🌙' : '☀️'}
                        </button>
                        <button onClick={handleLogout} className="btn btn-secondary btn-sm">
                            Выйти
                        </button>
                    </div>
                </div>
            </header>

            <main className="options-main">
                <div className="main-content animate-fade-in">
                    {/* Tabs Navigation */}
                    <nav className="tabs-nav">
                        <button
                            className={`tab-button ${activeSection === 'arm' ? 'active' : ''}`}
                            onClick={() => setActiveSection('arm')}
                        >
                            <span className="tab-icon">🖥️</span>
                            <span>Настройки АРМа</span>
                        </button>
                        <button
                            className={`tab-button ${activeSection === 'genesys' ? 'active' : ''}`}
                            onClick={() => setActiveSection('genesys')}
                        >
                            <span className="tab-icon">💬</span>
                            <span>Настройки Генезиса</span>
                        </button>
                        <button
                            className={`tab-button ${activeSection === 'line' ? 'active' : ''}`}
                            onClick={() => setActiveSection('line')}
                        >
                            <span className="tab-icon">💚</span>
                            <span>Настройки Линии</span>
                        </button>
                    </nav>

                    {/* Search Bar */}
                    <div className="search-wrapper">
                        <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none"
                             stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8"/>
                            <path d="M21 21l-4.35-4.35"/>
                        </svg>
                        <input
                            type="text"
                            placeholder="Поиск настроек..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="search-input"
                        />
                        {searchQuery && (
                            <button
                                className="search-clear"
                                onClick={() => setSearchQuery('')}
                                title="Очистить"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                     strokeWidth="2">
                                    <path d="M18 6L6 18M6 6l12 12"/>
                                </svg>
                            </button>
                        )}
                        <kbd className="search-shortcut">{isMac ? '⌘K' : '⌃K'}</kbd>
                    </div>

                    {/* Actions Toolbar */}
                    <div className="actions-toolbar">
                        <div className="actions-left">
                            <button
                                onClick={() => checkForUpdates(false)}
                                className={`action-button ${updateStatus.hasUpdate === true ? 'update-available' : ''}`}
                                disabled={updateStatus.checking}
                            >
                                {updateStatus.checking ? (
                                    <svg className="spinning" width="16" height="16" viewBox="0 0 24 24" fill="none"
                                         stroke="currentColor" strokeWidth="2">
                                        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                                    </svg>
                                ) : updateStatus.hasUpdate === true ? (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                         strokeWidth="2">
                                        <path d="M21 12a9 9 0 1 1-9-9"/>
                                        <polyline points="21 3 21 9 15 9"/>
                                    </svg>
                                ) : (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                         strokeWidth="2">
                                        <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                                        <path d="M3 3v5h5"/>
                                        <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
                                        <path d="M16 21h5v-5"/>
                                    </svg>
                                )}
                                <span>
                                    {updateStatus.checking ? 'Проверка...' :
                                        updateStatus.hasUpdate === true ? `Доступна v${updateStatus.latestVersion}` :
                                            updateStatus.hasUpdate === false ? 'Проверить обновления' : 'Проверить обновления'}
                                </span>
                            </button>
                            <button onClick={exportSettings} className="action-button">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                     strokeWidth="2">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                    <polyline points="7 10 12 15 17 10"/>
                                    <line x1="12" y1="15" x2="12" y2="3"/>
                                </svg>
                                <span>Экспорт настроек</span>
                            </button>
                            <label className="action-button">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                     strokeWidth="2">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                    <polyline points="17 8 12 3 7 8"/>
                                    <line x1="12" y1="3" x2="12" y2="15"/>
                                </svg>
                                <span>Импорт настроек</span>
                                <input type="file" accept=".json" onChange={importSettings} hidden/>
                            </label>
                        </div>
                        <div className="actions-right">
                            {saveStatus === 'success' && (
                                <div className="save-indicator success">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                         strokeWidth="2">
                                        <path d="M20 6L9 17l-5-5"/>
                                    </svg>
                                    <span>Сохранено</span>
                                </div>
                            )}
                            {isSaving && (
                                <div className="save-indicator saving">
                                    <div className="spinner-small"/>
                                    <span>Сохранение...</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Settings Content */}
                    {isLoading ? (
                        <div className="loading-state">
                            <div className="spinner"/>
                            <p>Загрузка настроек...</p>
                        </div>
                    ) : (
                        <>
                            {activeSection === 'arm' && (
                                <div className="section">
                                    <div className="section-header">
                                        <h2 className="section-title">Настройки АРМ</h2>
                                        <p className="section-description">Управление функциями, связанными с работой
                                            АРМа</p>
                                    </div>
                                    {armFeatureGroups.map((group) => renderFeatureGroup('arm', group))}
                                </div>
                            )}

                            {activeSection === 'genesys' && (
                                <div className="section">
                                    <div className="section-header">
                                        <h2 className="section-title">Настройки Генезиса</h2>
                                        <p className="section-description">Управление функциями, связанными с работой
                                            Генезиса</p>
                                    </div>
                                    {genesysFeatureGroups.map((group) => renderFeatureGroup('genesys', group))}
                                </div>
                            )}

                            {activeSection === 'line' && (
                                <div className="section">
                                    <div className="section-header">
                                        <h2 className="section-title">Настройки Линии</h2>
                                        <p className="section-description">Управление функциями, связанными с работой
                                            Линии</p>
                                    </div>
                                    <div className="card">
                                        <div className="card-header">
                                            <div className="card-header-content">
                                                <span className="card-icon">💚</span>
                                                <div className="card-header-text">
                                                    <h3 className="card-title">Линия</h3>
                                                    <p className="card-description"></p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="feature-list">
                                            <div className="feature-item">
                                                <div className="feature-info">
                                                    <label className="feature-label" htmlFor="line-features">
                                                        Включить функции Line
                                                    </label>
                                                    <span className="feature-description">Активировать все функции интеграции с Line</span>
                                                </div>
                                                <label className="switch">
                                                    <input
                                                        id="line-features"
                                                        type="checkbox"
                                                        checked={settings.line?.featuresEnabled === true}
                                                        onChange={(e) => updateSetting('line', 'featuresEnabled', e.target.checked)}
                                                        disabled={isSaving}
                                                    />
                                                    <span className="slider"/>
                                                </label>
                                            </div>
                                            <div className="feature-item">
                                                <div className="feature-info">
                                                    <label className="feature-label" htmlFor="line-notifications">
                                                        Уведомления
                                                    </label>
                                                    <span
                                                        className="feature-description">Показывать уведомления от Line</span>
                                                </div>
                                                <label className="switch">
                                                    <input
                                                        id="line-notifications"
                                                        type="checkbox"
                                                        checked={settings.line?.notificationsEnabled === true}
                                                        onChange={(e) => updateSetting('line', 'notificationsEnabled', e.target.checked)}
                                                        disabled={isSaving}
                                                    />
                                                    <span className="slider"/>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}
