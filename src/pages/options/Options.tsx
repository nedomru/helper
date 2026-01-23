import React, {useCallback, useEffect, useState} from 'react';
import {getAuthState, isAuthenticated, logout} from '@src/utils/auth';
import {getModuleSettings, getUserSettings, updateUserSettings} from '@src/shared/user-settings';
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
                    notify('Обновление', 'установлена последняя версия!', 'success');
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
            title: 'Копирование',
            icon: '📋',
            description: 'Быстрое копирование данных клиента',
            features: [
                {key: 'copyClientCard', label: 'Карточка клиента', description: 'Копировать данные карточки клиента'},
                {key: 'sendClientCard', label: 'Отправить карточку', description: 'Отправить карточку по email'},
                {key: 'copyClientAgreement', label: 'Договор', description: 'Копировать номер договора'},
                {key: 'copyClientAddress', label: 'Адрес', description: 'Копировать адрес клиента'},
                {key: 'copyClientNumber', label: 'Номер телефона', description: 'Копировать номер телефона'},
                {key: 'copyMACAddress', label: 'MAC-адрес', description: 'Копировать MAC-адрес'},
                {key: 'copyIPAddress', label: 'IP-адрес', description: 'Копировать IP-адрес'},
            ],
        },
        {
            title: 'Подсветка и уведомления',
            icon: '✨',
            description: 'Визуальные уведомления и подсветка',
            features: [
                {
                    key: 'showWarrantyExpiration',
                    label: 'Истечение гарантии',
                    description: 'Показывать истечение гарантии'
                },
                {
                    key: 'showAppealsHighlights',
                    label: 'Подсветка обращений',
                    description: 'Подсвечивать важные обращения'
                },
                {key: 'showSubscriptionStatus', label: 'Статус подписки', description: 'Показывать статус подписки'},
            ],
        },
        {
            title: 'Дополнительно',
            icon: '⚙️',
            description: 'Дополнительные функции АРМ',
            features: [
                {
                    key: 'removeDiagnosticTabs',
                    label: 'Убрать диагностические вкладки',
                    description: 'Скрыть диагностические вкладки'
                },
                {
                    key: 'removeAppealsColumns',
                    label: 'Убрать колонки обращений',
                    description: 'Скрыть лишние колонки в обращениях'
                },
                {key: 'compensateButton', label: 'Кнопка компенсации', description: 'Добавить кнопку компенсации'},
                {key: 'filterSessions', label: 'Фильтр сессий', description: 'Фильтрация сессий клиента'},
                {
                    key: 'loadLastDayClientSessions',
                    label: 'Сессии за последний день',
                    description: 'Автозагрузка сессий за день'
                },
                {key: 'smsButtons', label: 'Кнопки СМС', description: 'Быстрый выбор СМС'},
            ],
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
            features: Array<{ key: string; label: string; description: string }>
        }
    ) => (
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
