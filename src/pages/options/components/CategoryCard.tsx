import type {QuickAppealsPreset, QuickAppealsPresetCategory} from '@src/shared/user-settings';

interface CategoryCardProps {
    category: QuickAppealsPresetCategory;
    presets: QuickAppealsPreset[];
    isEditing: boolean;
    editName: string;
    onEditChange: (name: string) => void;
    onEditStart: () => void;
    onEdit: () => void;
    onCancelEdit: () => void;
    onDuplicate: () => void;
    onDelete: () => void;
}

export default function CategoryCard({
                                         category,
                                         presets,
                                         isEditing,
                                         editName,
                                         onEditChange,
                                         onEditStart,
                                         onEdit,
                                         onCancelEdit,
                                         onDuplicate,
                                         onDelete,
                                     }: CategoryCardProps) {
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            onEdit();
        } else if (e.key === 'Escape') {
            onCancelEdit();
        }
    };

    const presetCount = presets.length;
    const presetCountText = presetCount === 1 ? 'пресет' : presetCount >= 2 && presetCount <= 4 ? 'пресета' : 'пресетов';

    return (
        <div className="category-card">
            <div className="category-card-content">
                <div className="category-card-main">
                    {!isEditing && (
                        <div className="category-card-icon">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                 strokeWidth="2">
                                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                            </svg>
                        </div>
                    )}
                    {isEditing ? (
                        <input
                            type="text"
                            value={editName}
                            onChange={(e) => onEditChange(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onBlur={onEdit}
                            autoFocus
                            className="category-edit-input"
                        />
                    ) : (
                        <div className="category-info">
                            <div className="category-name">{category.name}</div>
                            <div className="category-meta">
                                {presetCount} {presetCountText}
                            </div>
                        </div>
                    )}
                </div>
                {!isEditing && (
                    <div className="category-card-actions">
                        <button
                            className="category-action-btn category-action-btn-edit"
                            onClick={() => {
                                onEditChange(category.name);
                                onEditStart();
                            }}
                            title="Редактировать"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                 strokeWidth="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                        </button>
                        <button
                            className="category-action-btn category-action-btn-copy"
                            onClick={onDuplicate}
                            title="Дублировать"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                 strokeWidth="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                            </svg>
                        </button>
                        <button
                            className="category-action-btn category-action-btn-danger"
                            onClick={onDelete}
                            title="Удалить"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                 strokeWidth="2">
                                <path d="M3 6h18"/>
                                <path
                                    d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
                        </button>
                    </div>
                )}
                {isEditing && (
                    <div className="category-card-actions">
                        <button
                            className="category-action-btn category-action-btn-primary"
                            onClick={onEdit}
                            title="Сохранить"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                 strokeWidth="2">
                                <polyline points="20 6 9 17 4 12"/>
                            </svg>
                        </button>
                        <button
                            className="category-action-btn"
                            onClick={onCancelEdit}
                            title="Отмена"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                 strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18"/>
                                <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                        </button>
                    </div>
                )}
            </div>
            {presetCount > 0 && !isEditing && (
                <div className="category-presets-preview">
                    {presets.slice(0, 3).map((preset) => (
                        <div key={preset.id} className="category-preset-chip" title={preset.name}>
                            {preset.name}
                        </div>
                    ))}
                    {presetCount > 3 && (
                        <div className="category-preset-chip category-preset-chip-more">
                            +{presetCount - 3}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
