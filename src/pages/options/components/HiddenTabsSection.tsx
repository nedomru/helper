import {useCallback, useEffect, useState} from 'react';
import {updateUserSettings} from '@src/shared/user-settings';

const AVAILABLE_TABS = [
    {id: "info", name: "Инфо", icon: "ℹ️", category: "Основное"},
    {id: "applications", name: "Приложения", icon: "📱", category: "Основное"},
    {id: "diagnostics", name: "Диагностика", icon: "🔧", category: "Диагностика"},
    {id: "diagnostics_new", name: "Диагностика (new)", icon: "🔧", category: "Диагностика"},
    {id: "diagnostics_spas", name: "Диагностика СПАС", icon: "🛠️", category: "Диагностика"},
    {id: "appeals", name: "Обращения", icon: "📝", category: "Обращения"},
    {id: "equipment", name: "Оборудование", icon: "📡", category: "Оборудование"},
    {id: "agent_iptv", name: "Агентское IPTV", icon: "📺", category: "TV"},
    {id: "iktv", name: "ИКТВ", icon: "📺", category: "TV"},
    {id: "requests", name: "Заявки", icon: "📋", category: "Обращения"},
    {id: "connection", name: "Подключение", icon: "🔌", category: "Подключение"},
    {id: "contract_ops", name: "Операции с договором", icon: "📄", category: "Договор"},
    {id: "contract_props", name: "Свойства договора", icon: "📋", category: "Договор"},
    {id: "balance_limit", name: "Ограничение по балансу", icon: "💰", category: "Финансы"},
    {id: "special_offers", name: "Спецпредложения", icon: "🎁", category: "Продажи"},
    {id: "auto_sp", name: "АвтоСП", icon: "⚡", category: "Продажи"},
    {id: "log", name: "Лог", icon: "📜", category: "Система"},
    {id: "content_subs", name: "Подписки контента", icon: "🎬", category: "TV"},
    {id: "client_contacts", name: "Контакты с Клиентами", icon: "👥", category: "Клиенты"},
    {id: "cards_autopay", name: "Карты и автоплатеж", icon: "💳", category: "Финансы"},
    {id: "bills", name: "Счета", icon: "🧾", category: "Финансы"},
    {id: "mvno", name: "MVNO", icon: "📱", category: "Мобильные"},
    {id: "client_portrait", name: "Портрет клиента", icon: "👤", category: "Клиенты"},
    {id: "main_sales", name: "Основные продажи", icon: "🛒", category: "Продажи"},
    {id: "payments", name: "Платежи", icon: "💵", category: "Финансы"},
    {id: "intercom_odvn", name: "Домофония/ОДВН", icon: "🏠", category: "Оборудование"},
    {id: "new_pl", name: "Новая ПЛ", icon: "🔗", category: "Подключение"},
    {id: "subscription", name: "Абонемент", icon: "🎫", category: "Продажи"},
    {id: "autoactivation_info", name: "Автоактивация инфо", icon: "🔄", category: "Система"},
] as const;

interface Tab {
    id: string;
    name: string;
    icon: string;
    category: string;
}

interface HiddenTabsSectionProps {
    hiddenTabs: string[];
    onHiddenTabsChange: (tabs: string[]) => void;
}

export default function HiddenTabsSection({
                                              hiddenTabs,
                                              onHiddenTabsChange,
                                          }: HiddenTabsSectionProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTabs, setSelectedTabs] = useState<Set<string>>(new Set(hiddenTabs));
    const [isListExpanded, setIsListExpanded] = useState(false);

    useEffect(() => {
        setSelectedTabs(new Set(hiddenTabs));
    }, [hiddenTabs]);

    const handleTabToggle = useCallback((tabName: string) => {
        setSelectedTabs((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(tabName)) {
                newSet.delete(tabName);
            } else {
                newSet.add(tabName);
            }
            return newSet;
        });
    }, []);

    const handleSelectAll = () => {
        setSelectedTabs(new Set(AVAILABLE_TABS.map((tab) => tab.name)));
    };

    const handleDeselectAll = () => {
        setSelectedTabs(new Set());
    };

    const handleSave = async () => {
        const newHiddenTabs = Array.from(selectedTabs);
        onHiddenTabsChange(newHiddenTabs);
        await updateUserSettings({arm: {...{hiddenTabs: newHiddenTabs}}});
        setIsListExpanded(false);
    };

    const filteredTabs = AVAILABLE_TABS.filter(
        (tab) =>
            !selectedTabs.has(tab.name) &&
            tab.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const selectedCount = selectedTabs.size;
    const totalCount = AVAILABLE_TABS.length;
    const hasChanges =
        selectedCount !== hiddenTabs.length ||
        JSON.stringify(Array.from(selectedTabs).sort()) !== JSON.stringify(hiddenTabs.sort());

    const renderTabChip = (tab: Tab) => {
        const isSelected = selectedTabs.has(tab.name);

        return (
            <button
                key={tab.id}
                type="button"
                onClick={() => handleTabToggle(tab.name)}
                title={tab.name}
                style={{
                    padding: '0.375rem 0.625rem',
                    border: '1px solid',
                    borderColor: isSelected ? 'var(--primary)' : 'var(--border-color)',
                    borderRadius: '0.375rem',
                    backgroundColor: isSelected ? 'var(--primary)' : 'var(--card-bg)',
                    color: isSelected ? '#fff' : 'var(--text-primary)',
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                    if (!isSelected) {
                        e.currentTarget.style.borderColor = 'var(--primary)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                    }
                }}
                onMouseLeave={(e) => {
                    if (!isSelected) {
                        e.currentTarget.style.borderColor = 'var(--border-color)';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                    }
                }}
            >
                <span style={{fontSize: '0.875rem'}}>{tab.icon}</span>
                <span>{tab.name}</span>
                {isSelected && (
                    <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{flexShrink: 0}}
                    >
                        <polyline points="20 6 9 17 4 12"/>
                    </svg>
                )}
            </button>
        );
    };

    return (
        <div key="Скрытие вкладок" className="card">
            <div className="card-header">
                <div className="card-header-content">
                    <span className="card-icon">👁️</span>
                    <div className="card-header-text">
                        <h3 className="card-title">Скрытие вкладок</h3>
                        <p className="card-description">
                            Выберите вкладки, которые нужно скрыть в
                            АРМ {selectedCount > 0 && `(${selectedCount} из ${totalCount})`}
                        </p>
                    </div>
                </div>
            </div>
            <div className="feature-list">
                {/* Selected Tabs Preview */}
                {selectedCount > 0 && (
                    <div className="feature-item">
                        <div className="feature-info" style={{width: '100%'}}>
                            <label className="feature-label">Скрытые вкладки ({selectedCount})</label>
                            <span className="feature-description">Нажмите на вкладку, чтобы вернуть её</span>
                            <div
                                style={{
                                    marginTop: '0.5rem',
                                    padding: '0.5rem 0.625rem',
                                    background: 'linear-gradient(135deg, rgba(8, 145, 178, 0.08) 0%, rgba(14, 116, 144, 0.04) 100%)',
                                    border: '1px solid rgba(8, 145, 178, 0.15)',
                                    borderRadius: '0.5rem',
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: '0.25rem',
                                }}
                            >
                                {Array.from(selectedTabs).map((tabName) => {
                                    const tab = AVAILABLE_TABS.find((t) => t.name === tabName);
                                    return (
                                        <span
                                            key={tabName}
                                            onClick={() => handleTabToggle(tabName)}
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '0.25rem',
                                                padding: '0.25rem 0.5rem',
                                                backgroundColor: 'var(--primary)',
                                                color: '#fff',
                                                borderRadius: '0.25rem',
                                                fontSize: '0.75rem',
                                                fontWeight: 500,
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                                border: '2px solid transparent',
                                                position: 'relative',
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
                                                e.currentTarget.style.color = 'var(--primary)';
                                                e.currentTarget.style.transform = 'scale(1.05)';
                                                e.currentTarget.style.boxShadow = '0 2px 12px rgba(239, 68, 68, 0.5), 0 0 0 2px rgba(239, 68, 68, 0.2)';
                                                e.currentTarget.style.borderColor = '#ef4444';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = 'var(--primary)';
                                                e.currentTarget.style.color = '#fff';
                                                e.currentTarget.style.transform = 'scale(1)';
                                                e.currentTarget.style.boxShadow = 'none';
                                                e.currentTarget.style.borderColor = 'transparent';
                                            }}
                                            title="Нажмите, чтобы вернуть вкладку"
                                        >
                                            {tab?.icon} {tabName} ×
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit List Button */}
                <div className="feature-item">
                    <div className="feature-info" style={{width: '100%'}}>
                        <button
                            className={`btn btn-sm ${isListExpanded ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setIsListExpanded(!isListExpanded)}
                            style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                padding: '0.625rem',
                                fontWeight: 500,
                            }}
                        >
                            <span>{isListExpanded ? '− Свернуть список' : '+ Изменить список'}</span>
                        </button>

                        {/* Expandable Content */}
                        <div
                            style={{
                                maxHeight: isListExpanded ? '1000px' : '0',
                                overflow: 'hidden',
                                transition: 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease',
                                opacity: isListExpanded ? 1 : 0,
                                marginTop: isListExpanded ? '0.75rem' : '0',
                            }}
                        >
                            {/* Search and Actions */}
                            <div style={{marginBottom: '0.75rem'}}>
                                <div style={{display: 'flex', gap: '0.5rem', flexWrap: 'wrap'}}>
                                    <input
                                        type="text"
                                        placeholder="🔍 Поиск..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        style={{
                                            flex: 1,
                                            minWidth: '150px',
                                            padding: '0.375rem 0.625rem',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: '0.375rem',
                                            backgroundColor: 'var(--card-bg)',
                                            color: 'var(--text-primary)',
                                            fontSize: '0.8125rem',
                                        }}
                                    />
                                    <button className="btn btn-secondary btn-sm" onClick={handleSelectAll}
                                            disabled={selectedCount === totalCount}>
                                        Все
                                    </button>
                                    <button className="btn btn-secondary btn-sm" onClick={handleDeselectAll}
                                            disabled={selectedCount === 0}>
                                        Сброс
                                    </button>
                                </div>
                            </div>

                            {/* Available Tabs List */}
                            <div>
                                <label className="feature-label">
                                    Доступные вкладки ({filteredTabs.length})
                                </label>
                                <div style={{marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.375rem'}}>
                                    {filteredTabs.length > 0 ? (
                                        filteredTabs.map((tab) => renderTabChip(tab))
                                    ) : (
                                        <div
                                            style={{
                                                padding: '0.75rem',
                                                textAlign: 'center',
                                                color: 'var(--text-secondary)',
                                                fontSize: '0.8125rem',
                                                backgroundColor: 'var(--muted)',
                                                borderRadius: '0.375rem',
                                                width: '100%',
                                            }}
                                        >
                                            {searchQuery ? 'Нет вкладок, соответствующих поиску' : 'Все вкладки уже скрыты'}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Save Actions */}
                {hasChanges && (
                    <div className="feature-item">
                        <div className="feature-info" style={{width: '100%'}}>
                            <div style={{display: 'flex', gap: '0.5rem', marginTop: '0.25rem'}}>
                                <button className="btn btn-primary btn-sm" onClick={handleSave}>
                                    💾 Сохранить ({selectedCount})
                                </button>
                                <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => setSelectedTabs(new Set(hiddenTabs))}
                                >
                                    Отмена
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
