import {useEffect, useState} from 'react';
import type {QuickAppealsPreset, QuickAppealsPresetCategory} from '@src/shared/user-settings';
import {saveQuickAppealsPresetCategories, saveQuickAppealsPresets} from '@src/shared/user-settings';
import {copySinglePreset, exportPresets, importPresets} from '../utils/export-import';
import PresetCard from './PresetCard';
import CategoryCard from './CategoryCard';

interface QuickAppealsSectionProps {
    quickAppealsPresets: QuickAppealsPreset[];
    presetCategories: QuickAppealsPresetCategory[];
    onStartWizard: () => void;
    onEditPreset: (presetId: string) => void;
    onDuplicatePreset: (presetId: string) => void;
    onRemovePreset: (presetId: string) => void;
    onDuplicateCategory: (categoryId: string) => void;
    onDeleteCategory: (categoryId: string) => void;
    onCreateCategory: (name: string) => Promise<QuickAppealsPresetCategory | undefined>;
    onSaveEditCategory: (categoryId: string, name: string) => void;
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
                                                onCreateCategory,
                                                onSaveEditCategory,
                                            }: QuickAppealsSectionProps) {
    const [presetSearchQuery, setPresetSearchQuery] = useState('');
    const [newCategoryName, setNewCategoryName] = useState('');
    const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
    const [editingCategoryName, setEditingCategoryName] = useState('');
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(presetCategories.map(c => c.id)));

    const handleExport = () => {
        exportPresets(presetCategories, quickAppealsPresets);
    };

    const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const {newPresets, newCategories} = await importPresets(event, presetCategories, quickAppealsPresets);

        if (newPresets.length > 0 || newCategories.length > 0) {
            const mergedPresets = [...quickAppealsPresets, ...newPresets];
            const mergedCategories = [...presetCategories, ...newCategories];

            await saveQuickAppealsPresets(mergedPresets);
            await saveQuickAppealsPresetCategories(mergedCategories);
        }
    };

    const handleCopySinglePreset = async (presetId: string) => {
        const preset = quickAppealsPresets.find((p) => p.id === presetId);
        if (!preset) return;
        await copySinglePreset(preset);
    };

    const handleCreateCategory = async () => {
        const newCategory = await onCreateCategory(newCategoryName);
        if (newCategory) {
            setNewCategoryName('');
        }
    };

    const handleStartEditCategory = (categoryId: string) => {
        setEditingCategoryId(categoryId);
        const category = presetCategories.find((cat) => cat.id === categoryId);
        if (category) {
            setEditingCategoryName(category.name);
        }
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

    useEffect(() => {
        setExpandedCategories((prev) => {
            const newSet = new Set(prev);
            presetCategories.forEach((category) => {
                newSet.add(category.id);
            });
            return newSet;
        });
    }, [presetCategories]);

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

    const renderCategoryCards = () => {
        if (presetCategories.length === 0) {
            return (
                <div
                    style={{
                        padding: '1rem',
                        textAlign: 'center',
                        color: 'var(--text-secondary)',
                        fontSize: '0.875rem',
                        backgroundColor: 'var(--muted)',
                        borderRadius: '0.5rem',
                        marginTop: '0.75rem',
                    }}
                >
                    Пока нет категорий. Создайте первую категорию выше!
                </div>
            );
        }

        return (
            <div className="category-cards-grid">
                {presetCategories.map((category) => {
                    const categoryPresets = quickAppealsPresets.filter((p) => p.categoryId === category.id);
                    const isEditing = editingCategoryId === category.id;

                    return (
                        <CategoryCard
                            key={category.id}
                            category={category}
                            presets={categoryPresets}
                            isEditing={isEditing}
                            editName={editingCategoryName}
                            onEditChange={setEditingCategoryName}
                            onEditStart={() => handleStartEditCategory(category.id)}
                            onEdit={handleSaveEditCategory}
                            onCancelEdit={handleCancelEditCategory}
                            onDuplicate={() => onDuplicateCategory(category.id)}
                            onDelete={() => {
                                if (confirm(`Удалить категорию "${category.name}"? Все пресеты в этой категории станут без категории.`)) {
                                    onDeleteCategory(category.id);
                                }
                            }}
                        />
                    );
                })}
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
                                📤 Импорт
                                <input type="file" accept=".json" onChange={handleImport} hidden/>
                            </label>
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
                                    {presetCategories.map((category) => {
                                        const categoryPresets = filterPresets(
                                            quickAppealsPresets.filter((preset) => preset.categoryId === category.id)
                                        );
                                        if (categoryPresets.length === 0) return null;

                                        const isExpanded = expandedCategories.has(category.id);

                                        return (
                                            <div key={category.id} style={{marginBottom: '1rem'}}>
                                                <div
                                                    className="preset-category-header"
                                                    onClick={() => toggleCategoryExpanded(category.id)}
                                                    style={{cursor: 'pointer', userSelect: 'none'}}
                                                >
                                                    {category.name}
                                                </div>
                                                {isExpanded && renderPresetCards(categoryPresets)}
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

                <div className="feature-item">
                    <div className="feature-info" style={{width: '100%'}}>
                        <label className="feature-label">Управление категориями ({presetCategories.length})</label>
                        <span className="feature-description">
                            Создавайте, редактируйте и удаляйте категории для организации пресетов
                        </span>

                        <div style={{display: 'flex', gap: '0.5rem', marginTop: '0.75rem', marginBottom: '1rem'}}>
                            <input
                                type="text"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                placeholder="Новая категория..."
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
                            <button className="btn btn-primary btn-sm" onClick={handleCreateCategory}
                                    disabled={!newCategoryName.trim()}>
                                ➕ Создать
                            </button>
                        </div>

                        {renderCategoryCards()}

                        {quickAppealsPresets.filter((p) => !p.categoryId).length > 0 && (
                            <div
                                style={{
                                    marginTop: '1rem',
                                    padding: '0.625rem 0.875rem',
                                    backgroundColor: 'rgba(255, 193, 7, 0.1)',
                                    border: '1px solid rgba(255, 193, 7, 0.3)',
                                    borderRadius: '0.5rem',
                                    fontSize: '0.875rem',
                                    color: 'var(--text-primary)',
                                }}
                            >
                                <span style={{fontWeight: 500}}>Без категории:</span>{' '}
                                {quickAppealsPresets.filter((p) => !p.categoryId).length}{' '}
                                {presetCountText(quickAppealsPresets.filter((p) => !p.categoryId).length)}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
