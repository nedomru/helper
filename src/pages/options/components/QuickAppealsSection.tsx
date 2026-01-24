import {useState} from 'react';
import type {QuickAppealsPreset, QuickAppealsPresetCategory} from '@src/shared/user-settings';
import {saveQuickAppealsPresetCategories, saveQuickAppealsPresets} from '@src/shared/user-settings';
import {products} from '../constants/products';
import {copySinglePreset, exportPresets, importPresets} from '../utils/export-import';

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
    const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
    const [editingCategoryName, setEditingCategoryName] = useState('');
    const [newCategoryName, setNewCategoryName] = useState('');

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
        const category = presetCategories.find((cat) => cat.id === categoryId);
        if (category) {
            setEditingCategoryId(categoryId);
            setEditingCategoryName(category.name);
        }
    };

    const handleSaveEditCategory = () => {
        if (editingCategoryId) {
            onSaveEditCategory(editingCategoryId, editingCategoryName);
            setEditingCategoryId(null);
            setEditingCategoryName('');
        }
    };

    const handleCancelEditCategory = () => {
        setEditingCategoryId(null);
        setEditingCategoryName('');
    };

    const presetCountText = (count: number) => {
        if (count === 1) return 'пресет';
        if (count >= 2 && count <= 4) return 'пресета';
        return 'пресетов';
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
                            {presetCategories.length > 0 ? (
                                <div style={{marginTop: '0.75rem'}}>
                                    {presetCategories.map((category) => {
                                        const categoryPresets = quickAppealsPresets.filter(
                                            (preset) =>
                                                preset.categoryId === category.id &&
                                                (preset.name.toLowerCase().includes(presetSearchQuery.toLowerCase()) ||
                                                    preset.processingLabel.toLowerCase().includes(presetSearchQuery.toLowerCase()) ||
                                                    preset.categoryLabel.toLowerCase().includes(presetSearchQuery.toLowerCase()) ||
                                                    (preset.childReasonLabel &&
                                                        preset.childReasonLabel.toLowerCase().includes(presetSearchQuery.toLowerCase())))
                                        );
                                        if (categoryPresets.length === 0) return null;
                                        return (
                                            <div key={category.id} style={{marginBottom: '1rem'}}>
                                                <div
                                                    style={{
                                                        fontWeight: 600,
                                                        fontSize: '0.875rem',
                                                        marginBottom: '0.5rem',
                                                        color: 'var(--primary)',
                                                    }}
                                                >
                                                    {category.name}
                                                </div>
                                                <div
                                                    style={{
                                                        display: 'grid',
                                                        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                                                        gap: '0.5rem',
                                                    }}
                                                >
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
                                                                <div
                                                                    style={{
                                                                        fontWeight: 600,
                                                                        fontSize: '0.875rem',
                                                                        marginBottom: '0.25rem',
                                                                        overflow: 'hidden',
                                                                        textOverflow: 'ellipsis',
                                                                        whiteSpace: 'nowrap',
                                                                    }}
                                                                >
                                                                    {preset.name}
                                                                </div>
                                                                <div
                                                                    style={{
                                                                        fontSize: '0.75rem',
                                                                        color: 'var(--text-secondary)',
                                                                        overflow: 'hidden',
                                                                        textOverflow: 'ellipsis',
                                                                        whiteSpace: 'nowrap',
                                                                    }}
                                                                >
                                                                    {products.find((p) => p.id === preset.product)?.name} →{' '}
                                                                    {preset.processingLabel} → {preset.categoryLabel}
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
                                                                        fontSize: '0.75rem'
                                                                    }}
                                                                    title="Редактировать"
                                                                    onClick={() => onEditPreset(preset.id)}
                                                                >
                                                                    ✏️
                                                                </button>
                                                                <button
                                                                    className="btn btn-secondary btn-sm"
                                                                    style={{
                                                                        padding: '0.25rem 0.5rem',
                                                                        minWidth: 'auto',
                                                                        fontSize: '0.75rem'
                                                                    }}
                                                                    title="Дублировать"
                                                                    onClick={() => onDuplicatePreset(preset.id)}
                                                                >
                                                                    📋
                                                                </button>
                                                                <button
                                                                    className="btn btn-secondary btn-sm"
                                                                    style={{
                                                                        padding: '0.25rem 0.5rem',
                                                                        minWidth: 'auto',
                                                                        fontSize: '0.75rem'
                                                                    }}
                                                                    title="Копировать в буфер"
                                                                    onClick={() => handleCopySinglePreset(preset.id)}
                                                                >
                                                                    📤
                                                                </button>
                                                                <button
                                                                    className="btn btn-secondary btn-sm"
                                                                    style={{
                                                                        padding: '0.25rem 0.5rem',
                                                                        minWidth: 'auto',
                                                                        fontSize: '0.75rem'
                                                                    }}
                                                                    title="Удалить"
                                                                    onClick={() => onRemovePreset(preset.id)}
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
                                    {quickAppealsPresets.filter((p) => !p.categoryId).length > 0 && (
                                        <div style={{marginBottom: '1rem'}}>
                                            <div
                                                style={{
                                                    fontWeight: 600,
                                                    fontSize: '0.875rem',
                                                    marginBottom: '0.5rem',
                                                    color: 'var(--text-secondary)',
                                                }}
                                            >
                                                Без категории
                                            </div>
                                            <div
                                                style={{
                                                    display: 'grid',
                                                    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                                                    gap: '0.5rem',
                                                }}
                                            >
                                                {quickAppealsPresets
                                                    .filter(
                                                        (preset) =>
                                                            !preset.categoryId &&
                                                            (preset.name.toLowerCase().includes(presetSearchQuery.toLowerCase()) ||
                                                                preset.processingLabel.toLowerCase().includes(presetSearchQuery.toLowerCase()) ||
                                                                preset.categoryLabel.toLowerCase().includes(presetSearchQuery.toLowerCase()) ||
                                                                (preset.childReasonLabel &&
                                                                    preset.childReasonLabel.toLowerCase().includes(presetSearchQuery.toLowerCase())))
                                                    )
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
                                                                <div
                                                                    style={{
                                                                        fontWeight: 600,
                                                                        fontSize: '0.875rem',
                                                                        marginBottom: '0.25rem',
                                                                        overflow: 'hidden',
                                                                        textOverflow: 'ellipsis',
                                                                        whiteSpace: 'nowrap',
                                                                    }}
                                                                >
                                                                    {preset.name}
                                                                </div>
                                                                <div
                                                                    style={{
                                                                        fontSize: '0.75rem',
                                                                        color: 'var(--text-secondary)',
                                                                        overflow: 'hidden',
                                                                        textOverflow: 'ellipsis',
                                                                        whiteSpace: 'nowrap',
                                                                    }}
                                                                >
                                                                    {products.find((p) => p.id === preset.product)?.name} →{' '}
                                                                    {preset.processingLabel} → {preset.categoryLabel}
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
                                                                        fontSize: '0.75rem'
                                                                    }}
                                                                    title="Редактировать"
                                                                    onClick={() => onEditPreset(preset.id)}
                                                                >
                                                                    ✏️
                                                                </button>
                                                                <button
                                                                    className="btn btn-secondary btn-sm"
                                                                    style={{
                                                                        padding: '0.25rem 0.5rem',
                                                                        minWidth: 'auto',
                                                                        fontSize: '0.75rem'
                                                                    }}
                                                                    title="Дублировать"
                                                                    onClick={() => onDuplicatePreset(preset.id)}
                                                                >
                                                                    📋
                                                                </button>
                                                                <button
                                                                    className="btn btn-secondary btn-sm"
                                                                    style={{
                                                                        padding: '0.25rem 0.5rem',
                                                                        minWidth: 'auto',
                                                                        fontSize: '0.75rem'
                                                                    }}
                                                                    title="Копировать в буфер"
                                                                    onClick={() => handleCopySinglePreset(preset.id)}
                                                                >
                                                                    📤
                                                                </button>
                                                                <button
                                                                    className="btn btn-secondary btn-sm"
                                                                    style={{
                                                                        padding: '0.25rem 0.5rem',
                                                                        minWidth: 'auto',
                                                                        fontSize: '0.75rem'
                                                                    }}
                                                                    title="Удалить"
                                                                    onClick={() => onRemovePreset(preset.id)}
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
                                <div
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                                        gap: '0.5rem',
                                        marginTop: '0.75rem',
                                    }}
                                >
                                    {quickAppealsPresets
                                        .filter(
                                            (preset) =>
                                                preset.name.toLowerCase().includes(presetSearchQuery.toLowerCase()) ||
                                                preset.processingLabel.toLowerCase().includes(presetSearchQuery.toLowerCase()) ||
                                                preset.categoryLabel.toLowerCase().includes(presetSearchQuery.toLowerCase()) ||
                                                (preset.childReasonLabel &&
                                                    preset.childReasonLabel.toLowerCase().includes(presetSearchQuery.toLowerCase()))
                                        )
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
                                                    <div
                                                        style={{
                                                            fontWeight: 600,
                                                            fontSize: '0.875rem',
                                                            marginBottom: '0.25rem',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap',
                                                        }}
                                                    >
                                                        {preset.name}
                                                    </div>
                                                    <div
                                                        style={{
                                                            fontSize: '0.75rem',
                                                            color: 'var(--text-secondary)',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap',
                                                        }}
                                                    >
                                                        {products.find((p) => p.id === preset.product)?.name} →{' '}
                                                        {preset.processingLabel} → {preset.categoryLabel}
                                                        {preset.subcategoryLabel && ` → ${preset.subcategoryLabel}`}
                                                        {preset.childReasonLabel && ` → ${preset.childReasonLabel}`}
                                                    </div>
                                                </div>
                                                <div style={{display: 'flex', gap: '0.25rem', flexWrap: 'wrap'}}>
                                                    <button
                                                        className="btn btn-secondary btn-sm"
                                                        style={{
                                                            padding: '0.25rem 0.5rem',
                                                            minWidth: 'auto',
                                                            fontSize: '0.75rem'
                                                        }}
                                                        title="Редактировать"
                                                        onClick={() => onEditPreset(preset.id)}
                                                    >
                                                        ✏️
                                                    </button>
                                                    <button
                                                        className="btn btn-secondary btn-sm"
                                                        style={{
                                                            padding: '0.25rem 0.5rem',
                                                            minWidth: 'auto',
                                                            fontSize: '0.75rem'
                                                        }}
                                                        title="Дублировать"
                                                        onClick={() => onDuplicatePreset(preset.id)}
                                                    >
                                                        📋
                                                    </button>
                                                    <button
                                                        className="btn btn-secondary btn-sm"
                                                        style={{
                                                            padding: '0.25rem 0.5rem',
                                                            minWidth: 'auto',
                                                            fontSize: '0.75rem'
                                                        }}
                                                        title="Копировать в буфер"
                                                        onClick={() => handleCopySinglePreset(preset.id)}
                                                    >
                                                        📤
                                                    </button>
                                                    <button
                                                        className="btn btn-secondary btn-sm"
                                                        style={{
                                                            padding: '0.25rem 0.5rem',
                                                            minWidth: 'auto',
                                                            fontSize: '0.75rem'
                                                        }}
                                                        title="Удалить"
                                                        onClick={() => onRemovePreset(preset.id)}
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
                                    padding: '0.5rem',
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

                        {presetCategories.length > 0 ? (
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                                    gap: '0.75rem',
                                    marginTop: '0.75rem',
                                }}
                            >
                                {presetCategories.map((category) => {
                                    const presetCount = quickAppealsPresets.filter((p) => p.categoryId === category.id).length;
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
                                                <div style={{display: 'flex', gap: '0.5rem', alignItems: 'center'}}>
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
                                                    <button className="btn btn-primary btn-sm"
                                                            onClick={handleSaveEditCategory}
                                                            style={{padding: '0.25rem 0.5rem'}}>
                                                        ✓
                                                    </button>
                                                    <button className="btn btn-secondary btn-sm"
                                                            onClick={handleCancelEditCategory}
                                                            style={{padding: '0.25rem 0.5rem'}}>
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
                                                        <div
                                                            style={{
                                                                fontWeight: 600,
                                                                fontSize: '0.875rem',
                                                                marginBottom: '0.25rem',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                whiteSpace: 'nowrap',
                                                            }}
                                                        >
                                                            {category.name}
                                                        </div>
                                                        <div style={{
                                                            fontSize: '0.75rem',
                                                            color: 'var(--text-secondary)'
                                                        }}>
                                                            {presetCount} {presetCountText(presetCount)}
                                                        </div>
                                                    </div>
                                                    <div style={{display: 'flex', gap: '0.25rem', flexWrap: 'wrap'}}>
                                                        <button
                                                            className="btn btn-secondary btn-sm"
                                                            onClick={() => handleStartEditCategory(category.id)}
                                                            style={{padding: '0.25rem 0.5rem'}}
                                                            title="Редактировать"
                                                        >
                                                            ✏️
                                                        </button>
                                                        <button
                                                            className="btn btn-secondary btn-sm"
                                                            onClick={() => onDuplicateCategory(category.id)}
                                                            style={{padding: '0.25rem 0.5rem'}}
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
                        )}

                        {quickAppealsPresets.filter((p) => !p.categoryId).length > 0 && (
                            <div
                                style={{
                                    marginTop: '1rem',
                                    padding: '0.75rem',
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
