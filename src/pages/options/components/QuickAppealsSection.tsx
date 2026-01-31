import {useEffect, useState} from 'react';
import type {QuickAppealsPreset, QuickAppealsPresetCategory} from '@src/shared/user-settings';
import {copySinglePreset, exportPresets, importPresets, importPresetsFromClipboard} from '../utils/export-import';
import PresetCard from './PresetCard';

interface QuickAppealsSectionProps {
    quickAppealsPresets: QuickAppealsPreset[];
    presetCategories: QuickAppealsPresetCategory[];
    onStartWizard: () => void;
    onEditPreset: (presetId: string) => void;
    onDuplicatePreset: (presetId: string) => void;
    onRemovePreset: (presetId: string) => void;
    onDuplicateCategory: (categoryId: string) => void;
    onDeleteCategory: (categoryId: string) => void;
    onSaveEditCategory: (categoryId: string, name: string) => void;
    onMergeImportedData: (newPresets: QuickAppealsPreset[], newCategories: QuickAppealsPresetCategory[]) => Promise<void>;
    onMoveCategoryUp: (categoryId: string) => void;
    onMoveCategoryDown: (categoryId: string) => void;
}

export default function QuickAppealsSection({
                                                quickAppealsPresets,
                                                presetCategories,
                                                onStartWizard,
                                                onEditPreset,
                                                onDuplicatePreset,
                                                onRemovePreset,
                                                onDuplicateCategory,
                                                onDeleteCategory,
                                                onSaveEditCategory,
                                                onMergeImportedData,
                                                onMoveCategoryUp,
                                                onMoveCategoryDown,
                                            }: QuickAppealsSectionProps) {
    const [presetSearchQuery, setPresetSearchQuery] = useState('');
    const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
    const [editingCategoryName, setEditingCategoryName] = useState('');
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
    const [showCategoryActions, setShowCategoryActions] = useState<string | null>(null);

    // Initialize expanded categories on first load
    useEffect(() => {
        if (expandedCategories.size === 0 && presetCategories.length > 0) {
            setExpandedCategories(new Set(presetCategories.map(c => c.id)));
        }
    }, []);

    const handleExport = () => {
        exportPresets(presetCategories, quickAppealsPresets);
    };

    const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const {newPresets, newCategories} = await importPresets(event, presetCategories, quickAppealsPresets);

        if (newPresets.length > 0 || newCategories.length > 0) {
            await onMergeImportedData(newPresets, newCategories);
        }
    };

    const handleImportFromClipboard = async () => {
        const {newPresets, newCategories} = await importPresetsFromClipboard(presetCategories, quickAppealsPresets);

        if (newPresets.length > 0 || newCategories.length > 0) {
            await onMergeImportedData(newPresets, newCategories);
        }
    };

    const handleCopySinglePreset = async (presetId: string) => {
        const preset = quickAppealsPresets.find((p) => p.id === presetId);
        if (!preset) return;
        await copySinglePreset(preset);
    };

    const handleStartEditCategory = (categoryId: string) => {
        setEditingCategoryId(categoryId);
        const category = presetCategories.find((cat) => cat.id === categoryId);
        if (category) {
            setEditingCategoryName(category.name);
        }
        setShowCategoryActions(null);
    };

    const handleSaveEditCategory = () => {
        if (editingCategoryId && editingCategoryName.trim()) {
            onSaveEditCategory(editingCategoryId, editingCategoryName.trim());
            setEditingCategoryId(null);
            setEditingCategoryName('');
        }
    };

    const handleCancelEditCategory = () => {
        setEditingCategoryId(null);
        setEditingCategoryName('');
    };

    const toggleCategoryExpanded = (categoryId: string) => {
        setExpandedCategories((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(categoryId)) {
                newSet.delete(categoryId);
            } else {
                newSet.add(categoryId);
            }
            return newSet;
        });
    };

    const presetCountText = (count: number) => {
        if (count === 1) return 'пресет';
        if (count >= 2 && count <= 4) return 'пресета';
        return 'пресетов';
    };

    const filterPresets = (presets: QuickAppealsPreset[]) => {
        return presets.filter(
            (preset) =>
                preset.name.toLowerCase().includes(presetSearchQuery.toLowerCase()) ||
                preset.processingLabel.toLowerCase().includes(presetSearchQuery.toLowerCase()) ||
                preset.categoryLabel.toLowerCase().includes(presetSearchQuery.toLowerCase()) ||
                (preset.childReasonLabel &&
                    preset.childReasonLabel.toLowerCase().includes(presetSearchQuery.toLowerCase())) ||
                (preset.comment && preset.comment.toLowerCase().includes(presetSearchQuery.toLowerCase()))
        );
    };

    const renderPresetCards = (presets: QuickAppealsPreset[]) => {
        return (
            <div className="preset-cards-grid">
                {presets.map((preset) => (
                    <PresetCard
                        key={preset.id}
                        preset={preset}
                        onEdit={() => onEditPreset(preset.id)}
                        onDuplicate={() => onDuplicatePreset(preset.id)}
                        onCopy={() => handleCopySinglePreset(preset.id)}
                        onDelete={() => onRemovePreset(preset.id)}
                    />
                ))}
            </div>
        );
    };

    const renderCategoryHeader = (category: QuickAppealsPresetCategory, index: number, presetCount: number) => {
        const isEditing = editingCategoryId === category.id;
        const isExpanded = expandedCategories.has(category.id);
        const canMoveUp = index > 0;
        const canMoveDown = index < presetCategories.length - 1;
        const showActions = showCategoryActions === category.id;

        if (isEditing) {
            return (
                <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem'}}>
                    <input
                        type="text"
                        value={editingCategoryName}
                        onChange={(e) => setEditingCategoryName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEditCategory();
                            if (e.key === 'Escape') handleCancelEditCategory();
                        }}
                        autoFocus
                        style={{
                            flex: 1,
                            padding: '0.375rem 0.5rem',
                            border: '1px solid var(--border-color)',
                            borderRadius: '0.25rem',
                            backgroundColor: 'var(--card-bg)',
                            color: 'var(--text-primary)',
                            fontSize: '0.875rem',
                        }}
                    />
                    <button
                        className="btn btn-primary btn-sm"
                        onClick={handleSaveEditCategory}
                        title="Сохранить"
                    >
                        ✓
                    </button>
                    <button
                        className="btn btn-secondary btn-sm"
                        onClick={handleCancelEditCategory}
                        title="Отмена"
                    >
                        ✕
                    </button>
                </div>
            );
        }

        return (
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.5rem',
                    padding: '0.5rem',
                    backgroundColor: 'var(--muted)',
                    borderRadius: '0.375rem',
                }}
            >
                <div
                    className="preset-category-header"
                    onClick={() => toggleCategoryExpanded(category.id)}
                    style={{
                        cursor: 'pointer',
                        userSelect: 'none',
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.25rem',
                        transition: 'background-color 0.15s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--border-color)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                    <span style={{fontWeight: 500, fontSize: '0.9rem'}}>{category.name}</span>
                    <span style={{fontSize: '0.75rem', color: 'var(--text-secondary)'}}>
                        ({presetCount} {presetCountText(presetCount)})
                    </span>
                </div>
                <div style={{display: 'flex', gap: '0.25rem'}}>
                    {!showActions ? (
                        <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => setShowCategoryActions(category.id)}
                            style={{padding: '0.25rem 0.5rem', fontSize: '0.75rem'}}
                            title="Показать действия"
                        >
                            ⋯
                        </button>
                    ) : (
                        <>
                            <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => onMoveCategoryUp(category.id)}
                                disabled={!canMoveUp}
                                style={{
                                    opacity: canMoveUp ? 1 : 0.3,
                                    cursor: canMoveUp ? 'pointer' : 'not-allowed',
                                    padding: '0.25rem 0.5rem',
                                    fontSize: '0.75rem'
                                }}
                                title="Переместить вверх"
                            >
                                ↑
                            </button>
                            <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => onMoveCategoryDown(category.id)}
                                disabled={!canMoveDown}
                                style={{
                                    opacity: canMoveDown ? 1 : 0.3,
                                    cursor: canMoveDown ? 'pointer' : 'not-allowed',
                                    padding: '0.25rem 0.5rem',
                                    fontSize: '0.75rem'
                                }}
                                title="Переместить вниз"
                            >
                                ↓
                            </button>
                            <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => handleStartEditCategory(category.id)}
                                style={{padding: '0.25rem 0.5rem', fontSize: '0.75rem'}}
                                title="Редактировать"
                            >
                                ✏️
                            </button>
                            <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => onDuplicateCategory(category.id)}
                                style={{padding: '0.25rem 0.5rem', fontSize: '0.75rem'}}
                                title="Дублировать"
                            >
                                📋
                            </button>
                            <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => {
                                    if (confirm(`Удалить категорию "${category.name}"? Все пресеты в этой категории станут без категории.`)) {
                                        onDeleteCategory(category.id);
                                    }
                                }}
                                style={{padding: '0.25rem 0.5rem', fontSize: '0.75rem'}}
                                title="Удалить"
                            >
                                🗑️
                            </button>
                            <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => setShowCategoryActions(null)}
                                style={{padding: '0.25rem 0.5rem', fontSize: '0.75rem'}}
                                title="Скрыть"
                            >
                                ✕
                            </button>
                        </>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div key="Быстрые обращения" className="card">
            <div className="card-header">
                <div className="card-header-content">
                    <span className="card-icon">⚡</span>
                    <div className="card-header-text">
                        <h3 className="card-title">Быстрые обращения</h3>
                        <p className="card-description">Создание быстрых шаблонов для обращений</p>
                    </div>
                </div>
            </div>
            <div className="feature-list">
                <div className="feature-item">
                    <div className="feature-info" style={{width: '100%'}}>
                        <label className="feature-label">Действия с пресетами</label>
                        <span className="feature-description">Управление пресетами и категориями</span>
                        <div style={{display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem'}}>
                            <button className="btn btn-primary btn-sm" onClick={onStartWizard}>
                                ➕ Создать пресет
                            </button>
                            <button className="btn btn-secondary btn-sm" onClick={handleExport}>
                                📥 Экспорт всех
                            </button>
                            <label className="btn btn-secondary btn-sm" style={{cursor: 'pointer'}}>
                                📤 Импорт из файла
                                <input type="file" accept=".json" onChange={handleImport} hidden/>
                            </label>
                            <button className="btn btn-secondary btn-sm" onClick={handleImportFromClipboard}>
                                📋 Импорт из буфера
                            </button>
                        </div>
                    </div>
                </div>

                {quickAppealsPresets.length > 0 && (
                    <div className="feature-item">
                        <div className="feature-info" style={{width: '100%'}}>
                            <label className="feature-label">Мои пресеты ({quickAppealsPresets.length})</label>
                            <span className="feature-description">Сохранённые быстрые обращения</span>
                            <input
                                type="text"
                                placeholder="Поиск пресетов..."
                                value={presetSearchQuery}
                                onChange={(e) => setPresetSearchQuery(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.5rem 0.75rem',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '0.375rem',
                                    backgroundColor: 'var(--card-bg)',
                                    color: 'var(--text-primary)',
                                    fontSize: '0.875rem',
                                    marginTop: '0.75rem',
                                    marginBottom: '1rem',
                                }}
                            />
                            {presetCategories.length > 0 ? (
                                <div>
                                    {presetCategories.map((category, index) => {
                                        const categoryPresets = filterPresets(
                                            quickAppealsPresets.filter((preset) => preset.categoryId === category.id)
                                        );
                                        const isExpanded = expandedCategories.has(category.id);

                                        return (
                                            <div key={category.id} style={{marginBottom: '1rem'}}>
                                                {renderCategoryHeader(category, index, categoryPresets.length)}
                                                {isExpanded && categoryPresets.length > 0 && renderPresetCards(categoryPresets)}
                                            </div>
                                        );
                                    })}
                                    {filterPresets(quickAppealsPresets.filter((p) => !p.categoryId)).length > 0 && (
                                        <div>
                                            <div className="preset-category-header uncategorized">
                                                Без категории
                                            </div>
                                            {renderPresetCards(filterPresets(quickAppealsPresets.filter((p) => !p.categoryId)))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                renderPresetCards(filterPresets(quickAppealsPresets))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
