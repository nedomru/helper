import {useCallback, useEffect, useState} from 'react';
import {updateUserSettings} from '@src/shared/user-settings';

const AVAILABLE_TABS = [
    "Инфо",
    "Приложения",
    "Диагностика",
    "Диагностика (new)",
    "Диагностика СПАС",
    "Обращения",
    "Оборудование",
    "Агентское IPTV",
    "ИКТВ",
    "Заявки",
    "Подключение",
    "Операции с договором",
    "Свойства договора",
    "Ограничение по балансу",
    "Спецпредложения",
    "АвтоСП",
    "Лог",
    "Подписки контента",
    "Контакты с Клиентами",
    "Карты и автоплатеж",
    "Счета",
    "MVNO",
    "Портрет клиента",
    "Основные продажи",
    "Платежи",
    "Домофония/ОДВН",
    "Новая ПЛ",
    "Абонемент",
    "Автоактивация инфо",
] as const;

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
    const [isExpanded, setIsExpanded] = useState(false);

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
        const filteredTabs = AVAILABLE_TABS.filter((tab) =>
            tab.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setSelectedTabs(new Set(filteredTabs));
    };

    const handleDeselectAll = () => {
        setSelectedTabs(new Set());
    };

    const handleSave = async () => {
        const newHiddenTabs = Array.from(selectedTabs);
        onHiddenTabsChange(newHiddenTabs);
        await updateUserSettings({arm: {...{hiddenTabs: newHiddenTabs}}});
    };

    const filteredTabs = AVAILABLE_TABS.filter((tab) =>
        tab.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const selectedCount = selectedTabs.size;
    const totalCount = AVAILABLE_TABS.length;
    const hasChanges = selectedCount !== hiddenTabs.length ||
        JSON.stringify(Array.from(selectedTabs).sort()) !== JSON.stringify(hiddenTabs.sort());

    return (
        <div key="Скрытие вкладок" className="card">
            <div className="card-header">
                <div className="card-header-content">
                    <span className="card-icon">👁️</span>
                    <div className="card-header-text">
                        <h3 className="card-title">Скрытие вкладок</h3>
                        <p className="card-description">
                            Выберите вкладки, которые нужно скрыть в АРМ
                            {selectedCount > 0 && ` (${selectedCount} выбрано)`}
                        </p>
                    </div>
                </div>
            </div>
            <div className="feature-list">
                <div className="feature-item">
                    <div className="feature-info" style={{width: '100%'}}>
                        <label className="feature-label">Выберите вкладки для скрытия</label>
                        <span className="feature-description">
                            Нажмите на вкладку, чтобы добавить или удалить её из списка скрытых.
                            Скрытые вкладки можно вернуть кнопкой рядом с вкладками в АРМ.
                        </span>

                        {/* Selected tabs preview */}
                        {selectedCount > 0 && (
                            <div
                                style={{
                                    marginTop: '0.75rem',
                                    padding: '0.625rem 0.875rem',
                                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                                    border: '1px solid rgba(0, 123, 255, 0.3)',
                                    borderRadius: '0.5rem',
                                    fontSize: '0.875rem',
                                    color: 'var(--text-primary)',
                                }}
                            >
                                <div style={{fontWeight: 500, marginBottom: '0.5rem', color: 'var(--text-primary)'}}>
                                    Выбрано вкладок: {selectedCount} из {totalCount}
                                </div>
                                <div style={{display: 'flex', flexWrap: 'wrap', gap: '0.375rem'}}>
                                    {Array.from(selectedTabs).slice(0, 10).map((tab) => (
                                        <span
                                            key={tab}
                                            style={{
                                                padding: '0.25rem 0.625rem',
                                                backgroundColor: 'var(--primary)',
                                                color: '#fff',
                                                borderRadius: '0.25rem',
                                                fontSize: '0.75rem',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                            }}
                                            onClick={() => handleTabToggle(tab)}
                                            title="Нажмите, чтобы отменить выбор"
                                        >
                                            {tab} ✕
                                        </span>
                                    ))}
                                    {selectedCount > 10 && (
                                        <span
                                            style={{
                                                padding: '0.25rem 0.625rem',
                                                backgroundColor: 'var(--muted)',
                                                color: 'var(--text-secondary)',
                                                borderRadius: '0.25rem',
                                                fontSize: '0.75rem',
                                            }}
                                        >
                                            +{selectedCount - 10} ещё
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Expand/Collapse button */}
                        <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => setIsExpanded(!isExpanded)}
                            style={{
                                marginTop: '0.75rem',
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                            }}
                        >
                            <span>{isExpanded ? 'Скрыть список вкладок' : 'Показать список вкладок'}</span>
                            <span style={{fontSize: '1.25rem'}}>{isExpanded ? '▴' : '▾'}</span>
                        </button>

                        {/* Expandable tab list */}
                        {isExpanded && (
                            <div style={{marginTop: '0.75rem'}}>
                                {/* Search and actions */}
                                <div style={{display: 'flex', gap: '0.5rem', marginBottom: '0.75rem'}}>
                                    <input
                                        type="text"
                                        placeholder="Поиск вкладок..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        style={{
                                            flex: 1,
                                            padding: '0.5rem 0.75rem',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: '0.375rem',
                                            backgroundColor: 'var(--card-bg)',
                                            color: 'var(--text-primary)',
                                            fontSize: '0.875rem',
                                        }}
                                    />
                                    <button
                                        className="btn btn-secondary btn-sm"
                                        onClick={handleSelectAll}
                                        disabled={filteredTabs.length === selectedTabs.size}
                                    >
                                        Все
                                    </button>
                                    <button
                                        className="btn btn-secondary btn-sm"
                                        onClick={handleDeselectAll}
                                        disabled={selectedTabs.size === 0}
                                    >
                                        Сброс
                                    </button>
                                </div>

                                {/* Tab grid */}
                                <div
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                                        gap: '0.5rem',
                                        maxHeight: '300px',
                                        overflowY: 'auto',
                                        padding: '0.5rem',
                                        backgroundColor: 'var(--muted)',
                                        borderRadius: '0.5rem',
                                    }}
                                >
                                    {filteredTabs.map((tab) => {
                                        const isSelected = selectedTabs.has(tab);
                                        return (
                                            <button
                                                key={tab}
                                                type="button"
                                                onClick={() => handleTabToggle(tab)}
                                                style={{
                                                    padding: '0.625rem 0.75rem',
                                                    border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border-color)'}`,
                                                    borderRadius: '0.375rem',
                                                    backgroundColor: isSelected ? 'var(--primary)' : 'var(--card-bg)',
                                                    color: isSelected ? '#fff' : 'var(--text-primary)',
                                                    fontSize: '0.875rem',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    textAlign: 'left',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.5rem',
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (!isSelected) {
                                                        e.currentTarget.style.backgroundColor = 'var(--muted)';
                                                        e.currentTarget.style.borderColor = 'var(--primary)';
                                                    }
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (!isSelected) {
                                                        e.currentTarget.style.backgroundColor = 'var(--card-bg)';
                                                        e.currentTarget.style.borderColor = 'var(--border-color)';
                                                    }
                                                }}
                                            >
                                                <span style={{flex: 1}}>{tab}</span>
                                                {isSelected && <span>✓</span>}
                                            </button>
                                        );
                                    })}
                                </div>

                                {filteredTabs.length === 0 && (
                                    <div
                                        style={{
                                            textAlign: 'center',
                                            padding: '1rem',
                                            color: 'var(--text-secondary)',
                                            fontSize: '0.875rem',
                                        }}
                                    >
                                        Нет вкладок, соответствующих поиску
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Save button */}
                        {hasChanges ? (
                            <div style={{display: 'flex', gap: '0.5rem', marginTop: '0.75rem'}}>
                                <button
                                    className="btn btn-primary btn-sm"
                                    onClick={handleSave}
                                >
                                    💾 Сохранить изменения
                                </button>
                                <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => setSelectedTabs(new Set(hiddenTabs))}
                                >
                                    Отмена
                                </button>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
}
