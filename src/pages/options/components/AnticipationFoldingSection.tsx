import {useCallback, useEffect, useState} from 'react';
import {updateUserSettings} from '@src/shared/user-settings';

const FOLDING_TABS = [
    {id: "info", key: "foldTabInfo", name: "Информация", icon: "ℹ️", category: "Вкладки"},
    {id: "applications", key: "foldTabApplications", name: "Приложения", icon: "📋", category: "Вкладки"},
    {id: "appeals", key: "foldTabAppeals", name: "Обращения", icon: "📝", category: "Вкладки"},
    {id: "s_requests", key: "foldTabSRequests", name: "Заявки", icon: "🔧", category: "Вкладки"},
    {id: "c_requests", key: "foldTabCRequests", name: "Подключения", icon: "🔌", category: "Вкладки"},
] as const;

interface AnticipationFoldingSectionProps {
    foldSpas: boolean;
    onFoldSpasChange: (value: boolean) => void;
    foldingTabs: string[];
    onFoldingTabsChange: (tabs: string[]) => void;
}

export default function AnticipationFoldingSection({
                                                       foldSpas,
                                                       onFoldSpasChange,
                                                       foldingTabs,
                                                       onFoldingTabsChange,
                                                   }: AnticipationFoldingSectionProps) {
    const [selectedTabs, setSelectedTabs] = useState<Set<string>>(new Set(foldingTabs));
    const [isListExpanded, setIsListExpanded] = useState(false);

    useEffect(() => {
        setSelectedTabs(new Set(foldingTabs));
    }, [foldingTabs]);

    const handleTabToggle = useCallback((tabKey: string) => {
        setSelectedTabs((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(tabKey)) {
                newSet.delete(tabKey);
            } else {
                newSet.add(tabKey);
            }
            return newSet;
        });
    }, []);

    const handleSelectAll = () => {
        setSelectedTabs(new Set(FOLDING_TABS.map((tab) => tab.key)));
    };

    const handleDeselectAll = () => {
        setSelectedTabs(new Set());
    };

    const handleSave = async () => {
        const newFoldingTabs = Array.from(selectedTabs);
        onFoldingTabsChange(newFoldingTabs);
        await updateUserSettings({arm: {...{foldingTabs: newFoldingTabs}}});
        setIsListExpanded(false);
    };

    const filteredTabs = FOLDING_TABS.filter(
        (tab) => !selectedTabs.has(tab.key)
    );

    const selectedCount = selectedTabs.size;
    const totalCount = FOLDING_TABS.length;
    const hasChanges =
        selectedCount !== foldingTabs.length ||
        JSON.stringify(Array.from(selectedTabs).sort()) !== JSON.stringify(foldingTabs.sort());

    const renderTabChip = (tab: any) => {
        const isSelected = selectedTabs.has(tab.key);

        return (
            <button
                key={tab.id}
                type="button"
                onClick={() => handleTabToggle(tab.key)}
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
        <div key="Сворачивание" className="card">
            <div className="card-header">
                <div className="card-header-content">
                    <span className="card-icon">📁</span>
                    <div className="card-header-text">
                        <h3 className="card-title">Сворачивание</h3>
                        <p className="card-description">
                            Управление отображением вкладок и панелей
                        </p>
                    </div>
                </div>
            </div>
            <div className="feature-list">
                {/* Предвосхищение - Simple Checkbox */}
                <div className="feature-item">
                    <div className="feature-info">
                        <label className="feature-label" htmlFor="fold-spas">
                            Предвосхищение
                        </label>
                        <span className="feature-description">
                            Сворачивать предвосхищения автоматически
                        </span>
                    </div>
                    <label className="switch">
                        <input
                            id="fold-spas"
                            type="checkbox"
                            checked={foldSpas}
                            onChange={(e) => onFoldSpasChange(e.target.checked)}
                        />
                        <span className="slider"/>
                    </label>
                </div>

                {/* Tabs Picker Section */}
                {selectedCount > 0 && (
                    <div className="feature-item">
                        <div className="feature-info" style={{width: '100%'}}>
                            <label className="feature-label">Сворачиваемые вкладки ({selectedCount})</label>
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
                                {Array.from(selectedTabs).map((tabKey) => {
                                    const tab = FOLDING_TABS.find((t) => t.key === tabKey);
                                    return (
                                        <span
                                            key={tabKey}
                                            onClick={() => handleTabToggle(tabKey)}
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
                                            {tab?.icon} {tab?.name} ×
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
                            {/* Actions */}
                            <div style={{marginBottom: '0.75rem'}}>
                                <div style={{display: 'flex', gap: '0.5rem', flexWrap: 'wrap'}}>
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
                                            Все вкладки уже добавлены
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
                                    onClick={() => setSelectedTabs(new Set(foldingTabs))}
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
