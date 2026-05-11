import {useRef, useState} from 'react';
import type {
    ServiceRequestPreset,
    ServiceRequestPresetCategory,
} from '@src/shared/user-settings';
import {notify} from '@src/utils/notify';

interface Props {
    presets: ServiceRequestPreset[];
    categories: ServiceRequestPresetCategory[];
    onSavePreset: (preset: ServiceRequestPreset) => Promise<boolean>;
    onRemovePreset: (id: string) => Promise<void>;
    onDuplicatePreset: (id: string) => Promise<void>;
    onCreateCategory: (name: string) => Promise<ServiceRequestPresetCategory | null>;
    onRenameCategory: (id: string, name: string) => Promise<void>;
    onDeleteCategory: (id: string) => Promise<void>;
    onMoveCategory: (id: string, direction: -1 | 1) => Promise<void>;
    onExport: () => void;
    onImport: (raw: string) => Promise<void>;
}

export default function ServiceRequestsSection({
    presets,
    categories,
    onSavePreset,
    onRemovePreset,
    onDuplicatePreset,
    onCreateCategory,
    onRenameCategory,
    onDeleteCategory,
    onMoveCategory,
    onExport,
    onImport,
}: Props) {
    const [search, setSearch] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editCategoryId, setEditCategoryId] = useState<string | null>(null);
    const [editComment, setEditComment] = useState('');
    const [expanded, setExpanded] = useState<Set<string>>(new Set());
    const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
    const [editingCategoryName, setEditingCategoryName] = useState('');
    const [newCategoryName, setNewCategoryName] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const startEdit = (preset: ServiceRequestPreset) => {
        setEditingId(preset.id);
        setEditName(preset.name);
        setEditCategoryId(preset.categoryId ?? null);
        setEditComment(preset.comment ?? '');
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditName('');
        setEditCategoryId(null);
        setEditComment('');
    };

    const commitEdit = async (preset: ServiceRequestPreset) => {
        const trimmed = editName.trim();
        if (!trimmed) return;
        await onSavePreset({
            ...preset,
            name: trimmed,
            categoryId: editCategoryId,
            comment: editComment.trim() || undefined,
        });
        cancelEdit();
    };

    const handleCopyPreset = async (preset: ServiceRequestPreset) => {
        try {
            await navigator.clipboard.writeText(JSON.stringify(preset, null, 2));
            notify('Сервисные заявки', `Пресет "${preset.name}" скопирован в буфер`, 'success');
        } catch {
            notify('Сервисные заявки', 'Не удалось скопировать', 'error');
        }
    };

    const handleImportFromFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const text = await file.text();
        e.target.value = '';
        await onImport(text);
    };

    const handleImportFromClipboard = async () => {
        try {
            const txt = await navigator.clipboard.readText();
            if (!txt.trim()) {
                notify('Сервисные заявки', 'Буфер пуст', 'error');
                return;
            }
            await onImport(txt);
        } catch {
            notify('Сервисные заявки', 'Не удалось прочитать буфер', 'error');
        }
    };

    const filter = (list: ServiceRequestPreset[]) => {
        const q = search.toLowerCase().trim();
        if (!q) return list;
        return list.filter(
            (p) =>
                p.name.toLowerCase().includes(q) ||
                p.productLabel.toLowerCase().includes(q) ||
                p.reasonChain.some((s) => s.label.toLowerCase().includes(q)) ||
                (p.comment ?? '').toLowerCase().includes(q),
        );
    };

    const toggleExpand = (id: string) =>
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });

    const renderPresetCard = (preset: ServiceRequestPreset) => {
        const isEditing = editingId === preset.id;
        const isOpen = expanded.has(preset.id);
        const chain = preset.reasonChain.map((s) => s.label).join(' → ');

        return (
            <div
                key={preset.id}
                style={{
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.5rem',
                    padding: '0.75rem',
                    backgroundColor: 'var(--card-bg)',
                    marginBottom: '0.5rem',
                }}
            >
                {isEditing ? (
                    <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                        <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="Название"
                            style={inputStyle}
                            autoFocus
                        />
                        <select
                            value={editCategoryId ?? ''}
                            onChange={(e) => setEditCategoryId(e.target.value || null)}
                            style={inputStyle}
                        >
                            <option value="">Без категории</option>
                            {categories.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                        <textarea
                            value={editComment}
                            onChange={(e) => setEditComment(e.target.value)}
                            placeholder="Комментарий (необязательно)"
                            rows={3}
                            style={{...inputStyle, resize: 'vertical'}}
                        />
                        <div style={{display: 'flex', gap: '0.5rem'}}>
                            <button
                                className="btn btn-primary btn-sm"
                                onClick={() => commitEdit(preset)}
                                disabled={!editName.trim()}
                            >
                                Сохранить
                            </button>
                            <button className="btn btn-secondary btn-sm" onClick={cancelEdit}>
                                Отмена
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                gap: '0.5rem',
                                cursor: 'pointer',
                            }}
                            onClick={() => toggleExpand(preset.id)}
                        >
                            <div style={{flex: 1, minWidth: 0}}>
                                <div style={{fontWeight: 600, fontSize: '0.9rem'}}>{preset.name}</div>
                                <div
                                    style={{
                                        fontSize: '0.75rem',
                                        color: 'var(--text-secondary)',
                                        marginTop: '0.25rem',
                                        wordBreak: 'break-word',
                                    }}
                                >
                                    {preset.productLabel}
                                    {chain ? ` → ${chain}` : ''}
                                </div>
                            </div>
                            <div style={{display: 'flex', gap: '0.25rem'}}>
                                <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        startEdit(preset);
                                    }}
                                    style={iconBtnStyle}
                                    title="Редактировать"
                                >
                                    ✏️
                                </button>
                                <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDuplicatePreset(preset.id);
                                    }}
                                    style={iconBtnStyle}
                                    title="Дублировать"
                                >
                                    📋
                                </button>
                                <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleCopyPreset(preset);
                                    }}
                                    style={iconBtnStyle}
                                    title="Скопировать JSON"
                                >
                                    ⧉
                                </button>
                                <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (confirm(`Удалить пресет "${preset.name}"?`)) {
                                            onRemovePreset(preset.id);
                                        }
                                    }}
                                    style={iconBtnStyle}
                                    title="Удалить"
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                        {isOpen && (
                            <div
                                style={{
                                    marginTop: '0.5rem',
                                    paddingTop: '0.5rem',
                                    borderTop: '1px solid var(--border-color)',
                                    fontSize: '0.75rem',
                                    color: 'var(--text-secondary)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.25rem',
                                }}
                            >
                                {preset.stepLabel && (
                                    <div>
                                        <b>Обработка:</b> {preset.stepLabel}
                                    </div>
                                )}
                                {preset.technologyLabel && (
                                    <div>
                                        <b>Технология:</b> {preset.technologyLabel}
                                    </div>
                                )}
                                {preset.comment && (
                                    <div style={{whiteSpace: 'pre-wrap'}}>
                                        <b>Комментарий:</b> {preset.comment}
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        );
    };

    const renderCategoryHeader = (cat: ServiceRequestPresetCategory, index: number, count: number) => {
        const isEditing = editingCategoryId === cat.id;
        if (isEditing) {
            return (
                <div style={{display: 'flex', gap: '0.5rem', marginBottom: '0.5rem'}}>
                    <input
                        type="text"
                        value={editingCategoryName}
                        onChange={(e) => setEditingCategoryName(e.target.value)}
                        autoFocus
                        style={{...inputStyle, flex: 1}}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && editingCategoryName.trim()) {
                                onRenameCategory(cat.id, editingCategoryName);
                                setEditingCategoryId(null);
                            }
                            if (e.key === 'Escape') setEditingCategoryId(null);
                        }}
                    />
                    <button
                        className="btn btn-primary btn-sm"
                        onClick={() => {
                            onRenameCategory(cat.id, editingCategoryName);
                            setEditingCategoryId(null);
                        }}
                    >
                        ✓
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => setEditingCategoryId(null)}>
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
                <span style={{flex: 1, fontWeight: 500, fontSize: '0.9rem'}}>
                    {cat.name}{' '}
                    <span style={{fontSize: '0.75rem', color: 'var(--text-secondary)'}}>({count})</span>
                </span>
                <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => onMoveCategory(cat.id, -1)}
                    disabled={index === 0}
                    style={iconBtnStyle}
                    title="Вверх"
                >
                    ↑
                </button>
                <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => onMoveCategory(cat.id, 1)}
                    disabled={index === categories.length - 1}
                    style={iconBtnStyle}
                    title="Вниз"
                >
                    ↓
                </button>
                <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                        setEditingCategoryId(cat.id);
                        setEditingCategoryName(cat.name);
                    }}
                    style={iconBtnStyle}
                    title="Переименовать"
                >
                    ✏️
                </button>
                <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                        if (
                            confirm(
                                `Удалить категорию "${cat.name}"? Пресеты в этой категории станут без категории.`,
                            )
                        ) {
                            onDeleteCategory(cat.id);
                        }
                    }}
                    style={iconBtnStyle}
                    title="Удалить"
                >
                    🗑️
                </button>
            </div>
        );
    };

    const uncategorized = filter(presets.filter((p) => !p.categoryId));

    return (
        <div className="card">
            <div className="card-header">
                <div className="card-header-content">
                    <span className="card-icon">🛠️</span>
                    <div className="card-header-text">
                        <h3 className="card-title">Быстрые сервисные заявки</h3>
                        <p className="card-description">
                            Пресеты для блока «Сервисная заявка». Создание — через 💾 на странице ARM.
                        </p>
                    </div>
                </div>
            </div>
            <div className="feature-list">
                <div className="feature-item">
                    <div className="feature-info" style={{width: '100%'}}>
                        <label className="feature-label">Действия</label>
                        <span className="feature-description">
                            Создание пресета — кнопкой 💾 в блоке «Сервисная заявка» на странице ARM
                        </span>
                        <div style={{display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem'}}>
                            <button className="btn btn-secondary btn-sm" onClick={onExport}>
                                📥 Экспорт всех
                            </button>
                            <label className="btn btn-secondary btn-sm" style={{cursor: 'pointer'}}>
                                📤 Импорт из файла
                                <input
                                    type="file"
                                    accept=".json"
                                    onChange={handleImportFromFile}
                                    hidden
                                    ref={fileInputRef}
                                />
                            </label>
                            <button className="btn btn-secondary btn-sm" onClick={handleImportFromClipboard}>
                                📋 Импорт из буфера
                            </button>
                        </div>
                    </div>
                </div>

                <div className="feature-item">
                    <div className="feature-info" style={{width: '100%'}}>
                        <label className="feature-label">Категории</label>
                        <div style={{display: 'flex', gap: '0.5rem', marginTop: '0.5rem'}}>
                            <input
                                type="text"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                placeholder="Новая категория…"
                                style={{...inputStyle, flex: 1}}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && newCategoryName.trim()) {
                                        onCreateCategory(newCategoryName).then(() => setNewCategoryName(''));
                                    }
                                }}
                            />
                            <button
                                className="btn btn-secondary btn-sm"
                                disabled={!newCategoryName.trim()}
                                onClick={() => onCreateCategory(newCategoryName).then(() => setNewCategoryName(''))}
                            >
                                ➕
                            </button>
                        </div>
                    </div>
                </div>

                {presets.length > 0 && (
                    <div className="feature-item">
                        <div className="feature-info" style={{width: '100%'}}>
                            <label className="feature-label">Мои пресеты ({presets.length})</label>
                            <input
                                type="text"
                                placeholder="Поиск пресетов…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                style={{...inputStyle, marginTop: '0.5rem', marginBottom: '0.75rem'}}
                            />
                            {categories.length > 0 ? (
                                <div>
                                    {categories.map((cat, index) => {
                                        const list = filter(presets.filter((p) => p.categoryId === cat.id));
                                        return (
                                            <div key={cat.id} style={{marginBottom: '1rem'}}>
                                                {renderCategoryHeader(cat, index, list.length)}
                                                {list.map(renderPresetCard)}
                                            </div>
                                        );
                                    })}
                                    {uncategorized.length > 0 && (
                                        <div>
                                            <div
                                                style={{
                                                    padding: '0.5rem',
                                                    backgroundColor: 'var(--muted)',
                                                    borderRadius: '0.375rem',
                                                    marginBottom: '0.5rem',
                                                    fontSize: '0.85rem',
                                                    color: 'var(--text-secondary)',
                                                }}
                                            >
                                                Без категории ({uncategorized.length})
                                            </div>
                                            {uncategorized.map(renderPresetCard)}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                filter(presets).map(renderPresetCard)
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.5rem',
    border: '1px solid var(--border-color)',
    borderRadius: '0.375rem',
    backgroundColor: 'var(--card-bg)',
    color: 'var(--text-primary)',
    fontSize: '0.875rem',
};

const iconBtnStyle: React.CSSProperties = {
    padding: '0.25rem 0.5rem',
    fontSize: '0.75rem',
};
