import React, {useEffect, useState} from 'react';

interface Settings {
    general: {},
    genesys: {
        main: {
            showLineStatus: boolean;
            showDutyMessages: boolean;
            hideUselessButtons: boolean;
        };
        chats: {
            CollapseChatHeader: boolean;
            ChatSizeEdit: boolean;
            allowPaste: boolean;
            addMarkerToVerticalMenu: boolean;
            customChatColors: boolean;
            operatorNameColor: string;
            operatorMessageColor: string;
            clientNameColor: string;
            clientMessageColor: string;
            customChatSounds: boolean;
            incomingChatSound: string;
            incomingMessageSound: string;
        };
    };
    features: {
        armIntegration: boolean;
        genesysIntegration: boolean;
        lineIntegration: boolean;
        autoFillForms: boolean;
    };
    advanced: {
        debugMode: boolean;
        cacheEnabled: boolean;
        telemetry: boolean;
    };
}

export default function Options() {
    const availableSounds = [
        'Sound_1.mp3',
        'Sound_2.mp3',
        'Sound_3.mp3',
        'Sound_4.mp3',
        'Sound_5.mp3',
        'Sound_6.mp3',
        'Sound_7.mp3',
        'Sound_8.mp3',
        'Sound_9.mp3',
        'zvuk-chpok-4.mp3',
    ];

    const [settings, setSettings] = useState<Settings>({
        general: {},
        genesys: {
            main: {
                showLineStatus: true,
                showDutyMessages: true,
                hideUselessButtons: false,
            },
            chats: {
                CollapseChatHeader: false,
                ChatSizeEdit: false,
                allowPaste: false,
                addMarkerToVerticalMenu: true,
                customChatColors: false,
                operatorNameColor: '#0066cc',
                operatorMessageColor: '#333333',
                clientNameColor: '#009688',
                clientMessageColor: '#555555',
                customChatSounds: false,
                incomingChatSound: 'Sound_1.mp3',
                incomingMessageSound: 'Sound_2.mp3',
            },
        },
        features: {
            armIntegration: true,
            genesysIntegration: true,
            lineIntegration: true,
            autoFillForms: false,
        },
        advanced: {
            debugMode: false,
            cacheEnabled: true,
            telemetry: true,
        },
    });

    const [activeTab, setActiveTab] = useState<keyof Settings>('general');
    const [genesysSubTab, setGenesysSubTab] = useState<'main' | 'chats'>('main');

    // Load settings from storage
    useEffect(() => {
        chrome.storage.sync.get('settings', (result) => {
            if (result && result.settings) {
                setSettings(result.settings);
            }
        });
    }, []);

    // Save settings to storage
    const saveSettings = (newSettings: Settings) => {
        setSettings(newSettings);
        chrome.storage.sync.set({settings: newSettings});
    };

    const handleToggle = (category: keyof Settings, key: string, subCategory?: string) => {
        let newSettings;
        if (subCategory) {
            newSettings = {
                ...settings,
                [category]: {
                    ...settings[category],
                    [subCategory]: {
                        ...(settings[category] as any)[subCategory],
                        [key]: !(settings[category] as any)[subCategory][key],
                    },
                },
            };
        } else {
            newSettings = {
                ...settings,
                [category]: {
                    ...settings[category],
                    [key]: !settings[category][key as keyof typeof settings[typeof category]],
                },
            };
        }
        saveSettings(newSettings);
    };

    const handleColorChange = (category: keyof Settings, key: string, value: string, subCategory?: string) => {
        let newSettings;
        if (subCategory) {
            newSettings = {
                ...settings,
                [category]: {
                    ...settings[category],
                    [subCategory]: {
                        ...(settings[category] as any)[subCategory],
                        [key]: value,
                    },
                },
            };
        } else {
            newSettings = {
                ...settings,
                [category]: {
                    ...settings[category],
                    [key]: value,
                },
            };
        }
        saveSettings(newSettings);
    };

    const playSound = (soundFile: string) => {
        const audio = new Audio(chrome.runtime.getURL(`sounds/${soundFile}`));
        audio.play().catch(err => console.error('Error playing sound:', err));
    };

    const exportSettings = () => {
        const dataStr = JSON.stringify(settings, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `helper-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedSettings = JSON.parse(e.target?.result as string);
                saveSettings(importedSettings);
                alert('Настройки успешно импортированы!');
            } catch (error) {
                alert('Ошибка при импорте настроек. Проверьте файл.');
                console.error('Import error:', error);
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    };

    const exportTabs = async () => {
        try {
            const tabs = await chrome.tabs.query({});
            const tabsData = tabs
                .filter(tab => tab.url && !tab.url.startsWith('about:') && !tab.url.startsWith('chrome:') && !tab.url.startsWith('moz-extension:'))
                .map(tab => ({
                    url: tab.url,
                    title: tab.title,
                    pinned: tab.pinned,
                    index: tab.index
                }));

            const dataStr = JSON.stringify(tabsData, null, 2);
            const dataBlob = new Blob([dataStr], {type: 'application/json'});
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `browser-tabs-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            URL.revokeObjectURL(url);
            alert(`Экспортировано вкладок: ${tabsData.length}`);
        } catch (error) {
            alert('Ошибка при экспорте вкладок');
            console.error('Export tabs error:', error);
        }
    };

    const importTabs = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const importedTabs = JSON.parse(e.target?.result as string);

                // Sort by index to maintain original order
                importedTabs.sort((a: any, b: any) => a.index - b.index);

                let successCount = 0;
                let errorCount = 0;

                // Create tabs in order
                for (const tab of importedTabs) {
                    // Skip browser internal URLs
                    if (tab.url && !tab.url.startsWith('about:') && !tab.url.startsWith('chrome:') && !tab.url.startsWith('moz-extension:')) {
                        try {
                            await chrome.tabs.create({
                                url: tab.url,
                                pinned: tab.pinned,
                                active: false
                            });
                            successCount++;
                        } catch (err) {
                            console.error(`Failed to create tab: ${tab.url}`, err);
                            errorCount++;
                        }
                    }
                }

                alert(`Импортировано вкладок: ${successCount}${errorCount > 0 ? `, пропущено: ${errorCount}` : ''}`);
            } catch (error) {
                alert('Ошибка при импорте вкладок. Проверьте файл.');
                console.error('Import tabs error:', error);
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    };

    const TabButton = ({tab, label}: { tab: keyof Settings; label: string }) => (
        <button
            className={`px-6 py-4 text-base font-medium transition-all relative ${
                activeTab === tab
                    ? 'text-cyan-600 border-b-2 border-cyan-600 bg-white'
                    : 'text-gray-600 border-b-2 border-transparent hover:text-cyan-600 hover:bg-cyan-50'
            }`}
            onClick={() => setActiveTab(tab)}
        >
            {label}
        </button>
    );

    const ToggleSwitch = ({
                              label,
                              checked,
                              onChange,
                              description,
                          }: {
        label: string;
        checked: boolean;
        onChange: () => void;
        description?: string;
    }) => (
        <div className="flex justify-between items-center border-b border-gray-100 last:border-b-0">
            <div className="flex-1">
                <div className="text-base font-medium text-gray-900 mb-1">{label}</div>
                {description && <div className="text-sm text-gray-500 mt-1">{description}</div>}
            </div>
            <label className="inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={checked} onChange={onChange} className="sr-only peer"/>
                <div
                    className="relative w-[52px] h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300 rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
            </label>
        </div>
    );

    const ColorPicker = ({
                             label,
                             value,
                             onChange,
                             description,
                             disabled,
                         }: {
        label: string;
        value: string;
        onChange: (color: string) => void;
        description?: string;
        disabled?: boolean;
    }) => (
        <div className="flex justify-between items-center border-b border-gray-100 last:border-b-0">
            <div className="flex-1">
                <div className="text-base font-medium text-gray-900 mb-1">{label}</div>
                {description && <div className="text-sm text-gray-500 mt-1">{description}</div>}
            </div>
            <div className="flex items-center gap-3">
                <input
                    type="color"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled}
                    className="w-14 h-10 rounded border border-gray-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled}
                    className="w-24 px-2 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                />
            </div>
        </div>
    );

    const SoundPicker = ({
                             label,
                             value,
                             onChange,
                             description,
                             disabled,
                         }: {
        label: string;
        value: string;
        onChange: (sound: string) => void;
        description?: string;
        disabled?: boolean;
    }) => (
        <div className="flex justify-between items-center border-b border-gray-100 last:border-b-0">
            <div className="flex-1">
                <div className="text-base font-medium text-gray-900 mb-1">{label}</div>
                {description && <div className="text-sm text-gray-500 mt-1">{description}</div>}
            </div>
            <div className="flex items-center gap-2">
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled}
                    className="px-3 py-2 text-sm border border-gray-300 rounded bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {availableSounds.map(sound => (
                        <option key={sound} value={sound}>{sound.replace('.mp3', '')}</option>
                    ))}
                </select>
                <button
                    onClick={() => playSound(value)}
                    disabled={disabled}
                    className="px-3 py-2 text-sm bg-cyan-600 text-white rounded hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    ▶
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-cyan-400 to-blue-600 p-8">
            <div className="max-w-4xl mx-auto bg-white rounded-xl overflow-hidden shadow-2xl">
                <nav className="flex bg-gray-50 border-b border-gray-200 px-4">
                    <TabButton tab="general" label="Общие"/>
                    <TabButton tab="genesys" label="Генезис"/>
                    <TabButton tab="features" label="АРМ"/>
                    <TabButton tab="advanced" label="Линия"/>
                </nav>

                <div className="p-8">
                    {activeTab === 'general' && (

                        <div className="animate-fadeIn">

                            <div>
                                <div className="bg-gradient-to-r from-pink-50 to-indigo-50 rounded-lg p-4 mb-4">
                                    <h3 className="text-lg font-bold text-black mb-3">Общие настройки</h3>
                                    <div className="space-y-3 ml-7">
                                        <div className="flex justify-between items-center border-b border-gray-100">
                                            <div className="flex-1">
                                                <div className="text-base font-medium text-gray-900 mb-1">Импорт/экспорт
                                                    настроек расширения
                                                </div>
                                                <div className="text-sm text-gray-500 mt-1">Сохраните или загрузите все
                                                    настройки расширения
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={exportSettings}
                                                    className="px-4 py-2 text-sm bg-cyan-600 text-white rounded hover:bg-cyan-700 transition-colors"
                                                >
                                                    Экспорт
                                                </button>
                                                <label
                                                    className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors cursor-pointer">
                                                    Импорт
                                                    <input
                                                        type="file"
                                                        accept=".json"
                                                        onChange={importSettings}
                                                        className="hidden"
                                                    />
                                                </label>
                                            </div>
                                        </div>
                                        <div
                                            className="flex justify-between items-center border-b border-gray-100 last:border-b-0">
                                            <div className="flex-1">
                                                <div className="text-base font-medium text-gray-900 mb-1">Импорт/экспорт
                                                    вкладок браузера
                                                </div>
                                                <div className="text-sm text-gray-500 mt-1">Сохраните или восстановите
                                                    все вкладки в исходном порядке
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={exportTabs}
                                                    className="px-4 py-2 text-sm bg-cyan-600 text-white rounded hover:bg-cyan-700 transition-colors"
                                                >
                                                    Экспорт
                                                </button>
                                                <label
                                                    className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors cursor-pointer">
                                                    Импорт
                                                    <input
                                                        type="file"
                                                        accept=".json"
                                                        onChange={importTabs}
                                                        className="hidden"
                                                    />
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    )}

                    {activeTab === 'genesys' && (
                        <div className="animate-fadeIn">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Настройки генезиса</h2>

                            <div className="flex gap-3 mb-6 border-b border-gray-200">
                                <button
                                    className={`px-4 py-2 text-sm font-medium transition-all ${
                                        genesysSubTab === 'main'
                                            ? 'text-cyan-600 border-b-2 border-cyan-600'
                                            : 'text-gray-600 hover:text-cyan-600'
                                    }`}
                                    onClick={() => setGenesysSubTab('main')}
                                >
                                    Основное
                                </button>
                                <button
                                    className={`px-4 py-2 text-sm font-medium transition-all ${
                                        genesysSubTab === 'chats'
                                            ? 'text-cyan-600 border-b-2 border-cyan-600'
                                            : 'text-gray-600 hover:text-cyan-600'
                                    }`}
                                    onClick={() => setGenesysSubTab('chats')}
                                >
                                    Чаты
                                </button>
                            </div>

                            {genesysSubTab === 'main' && (
                                <div>
                                    <div className="bg-gradient-to-r from-green-50 to-sky-50 rounded-lg p-4 mb-4">
                                        <h3 className="text-lg font-bold text-black mb-3">Общий функционал</h3>
                                        <div className="space-y-3 ml-7">
                                            <ToggleSwitch
                                                label="Отображать статус линии"
                                                checked={settings.genesys.main.showLineStatus}
                                                onChange={() => handleToggle('genesys', 'showLineStatus', 'main')}
                                                description="Добавляет статус линии в Генезис: кол-во слотов, статус аварийности"
                                            />
                                            <ToggleSwitch
                                                label="Отображать сообщения дежурных"
                                                checked={settings.genesys.main.showDutyMessages}
                                                onChange={() => handleToggle('genesys', 'showDutyMessages', 'main')}
                                                description="При появлении сообщения на линии оно будет отображено в Генезисе"
                                            />
                                            <ToggleSwitch
                                                label="Скрывать бесполезные кнопки"
                                                checked={settings.genesys.main.hideUselessButtons}
                                                onChange={() => handleToggle('genesys', 'hideUselessButtons', 'main')}
                                                description="Помощь, Facebook Drafts & in Progress, Twitter Drafts & in Progress"
                                            />

                                        </div>
                                    </div>
                                </div>
                            )}

                            {genesysSubTab === 'chats' && (
                                <div>
                                    <div className="bg-gradient-to-r from-green-50 to-sky-50 rounded-lg p-4 mb-4">
                                        <h3 className="text-lg font-bold text-blue-700 mb-3">🗂️ Вертикальные
                                            вкладки</h3>
                                        <div className="space-y-3 ml-7">
                                            <ToggleSwitch
                                                label="Добавлять Фломастер"
                                                checked={settings.genesys.chats.addMarkerToVerticalMenu}
                                                onChange={() => handleToggle('genesys', 'addFlomaster', 'chats')}
                                                description="В вертикальное меню каждого чата добавляется кнопка Фломастер. Работает как Личные РМы"
                                            />
                                            <ToggleSwitch
                                                label="Скрывать Ответы"
                                                checked={settings.genesys.chats.addMarkerToVerticalMenu}
                                                onChange={() => handleToggle('genesys', 'removeAnswers', 'chats')}
                                                description="Скрывает во всех чатах вкладку Ответы "
                                            />
                                            <ToggleSwitch
                                                label="Скрывать Личные РМы"
                                                checked={settings.genesys.chats.addMarkerToVerticalMenu}
                                                onChange={() => handleToggle('genesys', 'removeRMs', 'chats')}
                                                description="Скрывает во всех чатах вкладку Личные РМы  "
                                            />
                                        </div>
                                    </div>

                                    <div className="bg-gradient-to-r from-sky-50 to-red-50 rounded-lg p-4 mb-4">
                                        <h3 className="text-lg font-bold text-cyan-700 mb-3">🎨 Цвета чата</h3>
                                        <div className="space-y-3 ml-7">
                                            <ToggleSwitch
                                                label="Кастомные цвета"
                                                checked={settings.genesys.chats.customChatColors}
                                                onChange={() => handleToggle('genesys', 'customChatColors', 'chats')}
                                                description="Функция активирует выбранные в пунктах ниже цвета. Для применения обнови страницу Генезиса"
                                            />
                                            <ColorPicker
                                                label="Цвет имени оператора"
                                                value={settings.genesys.chats.operatorNameColor}
                                                onChange={(color) => handleColorChange('genesys', 'operatorNameColor', color, 'chats')}
                                                description="Изменяет цвет имени оператора"
                                                disabled={!settings.genesys.chats.customChatColors}
                                            />
                                            <ColorPicker
                                                label="Цвет сообщения оператора"
                                                value={settings.genesys.chats.operatorMessageColor}
                                                onChange={(color) => handleColorChange('genesys', 'operatorMessageColor', color, 'chats')}
                                                description="Изменяет цвет текста сообщения оператора"
                                                disabled={!settings.genesys.chats.customChatColors}
                                            />
                                            <ColorPicker
                                                label="Цвет имени клиента"
                                                value={settings.genesys.chats.clientNameColor}
                                                onChange={(color) => handleColorChange('genesys', 'clientNameColor', color, 'chats')}
                                                description="Изменяет цвет имени клиента"
                                                disabled={!settings.genesys.chats.customChatColors}
                                            />
                                            <ColorPicker
                                                label="Цвет сообщения клиента"
                                                value={settings.genesys.chats.clientMessageColor}
                                                onChange={(color) => handleColorChange('genesys', 'clientMessageColor', color, 'chats')}
                                                description="Изменяет цвет текста сообщения клиента"
                                                disabled={!settings.genesys.chats.customChatColors}
                                            />
                                        </div>
                                    </div>

                                    <div className="bg-gradient-to-r from-red-50 to-cyan-50 rounded-lg p-4 mb-4">
                                        <h3 className="text-lg font-bold text-cyan-700 mb-3">🔊 Звуки чата</h3>
                                        <div className="space-y-3 ml-7">
                                            <ToggleSwitch
                                                label="Кастомные звуки"
                                                checked={settings.genesys.chats.customChatSounds}
                                                onChange={() => handleToggle('genesys', 'customChatSounds', 'chats')}
                                                description="Функция активирует выбранные ниже звуки чата"
                                            />
                                            <SoundPicker
                                                label="Звук нового чата"
                                                value={settings.genesys.chats.incomingChatSound}
                                                onChange={(sound) => handleColorChange('genesys', 'incomingChatSound', sound, 'chats')}
                                                description="Воспроизводится при получении нового чата"
                                                disabled={!settings.genesys.chats.customChatSounds}
                                            />
                                            <SoundPicker
                                                label="Звук нового сообщения"
                                                value={settings.genesys.chats.incomingMessageSound}
                                                onChange={(sound) => handleColorChange('genesys', 'incomingMessageSound', sound, 'chats')}
                                                description="Воспроизводится при получении сообщения от клиента"
                                                disabled={!settings.genesys.chats.customChatSounds}
                                            />
                                        </div>
                                    </div>

                                    <div className="bg-gradient-to-r from-cyan-50 to-orange-50 rounded-lg p-4 mb-4">
                                        <h3 className="text-lg font-bold text-cyan-700 mb-3">🧨 Нестабильные
                                            настройки</h3>
                                        <div className="space-y-3 ml-7">
                                            <ToggleSwitch
                                                label="Сворачивание заголовок чата"
                                                checked={settings.genesys.chats.CollapseChatHeader}
                                                onChange={() => handleToggle('genesys', 'CollapseChatHeader', 'chats')}
                                                description="Сворачивает заголовок нового чата автоматически"
                                            />
                                            <ToggleSwitch
                                                label="Изменение размера окна чата"
                                                checked={settings.genesys.chats.ChatSizeEdit}
                                                onChange={() => handleToggle('genesys', 'ChatSizeEdit', 'chats')}
                                                description="Разрешает изменение размера текстового поля в чате"
                                            />
                                            <ToggleSwitch
                                                label="Загрузка картинок в чат из буфера обмена"
                                                checked={settings.genesys.chats.allowPaste}
                                                onChange={() => handleToggle('genesys', 'allowPaste', 'chats')}
                                                description="Разрешает вставку изображений в чат через ПКМ-Вставить или ctrl+v"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'features' && (
                        <div className="animate-fadeIn">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-6">АРМ</h2>

                            <div className="mb-6">
                                <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg p-4 mb-4">
                                    <h3 className="text-lg font-bold text-cyan-700 mb-3 flex items-center gap-2">
                                        <span className="text-xl">📋</span>
                                        Копирование
                                    </h3>
                                    <div className="space-y-3 ml-7">
                                        <ToggleSwitch
                                            label="Копирование номера телефона"
                                            checked={settings.features.armIntegration}
                                            onChange={() => handleToggle('features', 'copyPhoneNumbber')}
                                            description="Автоматическое копирование при клике на номер"
                                        />
                                        <ToggleSwitch
                                            label="Копирование адреса"
                                            checked={settings.features.genesysIntegration}
                                            onChange={() => handleToggle('features', 'genesysIntegration')}
                                            description="Быстрое копирование адреса клиента"
                                        />
                                    </div>
                                </div>

                                <div className="bg-gradient-to-r from-blue-50 to-sky-50 rounded-lg p-4 mb-4">
                                    <h3 className="text-lg font-bold text-blue-700 mb-3 flex items-center gap-2">
                                        <span className="text-xl">👁️</span>
                                        Скрытие элементов
                                    </h3>
                                    <div className="space-y-3 ml-7">
                                        <ToggleSwitch
                                            label="Скрывать баннеры"
                                            checked={settings.features.lineIntegration}
                                            onChange={() => handleToggle('features', 'lineIntegration')}
                                            description="Убрать рекламные баннеры из интерфейса"
                                        />
                                        <ToggleSwitch
                                            label="Скрывать подсказки"
                                            checked={settings.features.autoFillForms}
                                            onChange={() => handleToggle('features', 'autoFillForms')}
                                            description="Скрыть всплывающие подсказки"
                                        />
                                    </div>
                                </div>

                                <div className="bg-gradient-to-r from-sky-50 to-teal-50 rounded-lg p-4">
                                    <h3 className="text-lg font-bold text-sky-700 mb-3 flex items-center gap-2">
                                        <span className="text-xl">✨</span>
                                        Подсветка
                                    </h3>
                                    <div className="space-y-3 ml-7">
                                        <ToggleSwitch
                                            label="Подсветка активных элементов"
                                            checked={settings.features.armIntegration}
                                            onChange={() => handleToggle('features', 'armIntegration')}
                                            description="Визуальное выделение интерактивных элементов"
                                        />
                                        <ToggleSwitch
                                            label="Подсветка ошибок"
                                            checked={settings.features.genesysIntegration}
                                            onChange={() => handleToggle('features', 'genesysIntegration')}
                                            description="Цветовое выделение полей с ошибками"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'advanced' && (
                        <div className="animate-fadeIn">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Линия</h2>
                            <ToggleSwitch
                                label="Режим отладки"
                                checked={settings.advanced.debugMode}
                                onChange={() => handleToggle('advanced', 'debugMode')}
                                description="Включить подробное логирование для разработчиков"
                            />
                            <ToggleSwitch
                                label="Кэширование"
                                checked={settings.advanced.cacheEnabled}
                                onChange={() => handleToggle('advanced', 'cacheEnabled')}
                                description="Использовать кэш для ускорения работы"
                            />
                            <ToggleSwitch
                                label="Телеметрия"
                                checked={settings.advanced.telemetry}
                                onChange={() => handleToggle('advanced', 'telemetry')}
                                description="Отправлять анонимные данные об использовании для улучшения расширения"
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
