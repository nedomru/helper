import {useState} from 'react';
import type {CategoryTreeNode, SpeechPhraseCategory} from '@src/shared/speech-phrases';

interface CategoryTreeProps {
    tree: CategoryTreeNode[];
    categories: SpeechPhraseCategory[];
    phrasesCount: Map<string, number>;
    editingCategoryId: string | null;
    editCategoryName: string;
    editingCategoryParentId: string | null;
    onToggleExpand: (categoryId: string) => void;
    onStartEdit: (categoryId: string) => void;
    onCancelEdit: () => void;
    onUpdateCategory: () => void;
    onSetEditCategoryName: (name: string) => void;
    onSetEditCategoryParentId: (parentId: string | null) => void;
    onDeleteCategory: (categoryId: string) => void;
    onDuplicateCategory: (categoryId: string) => void;
    onDragStart: (e: React.DragEvent, categoryId: string) => void;
    onDragOver: (e: React.DragEvent, categoryId: string | null) => void;
    onDrop: (e: React.DragEvent, targetCategoryId: string | null) => void;
    onDragEnd: () => void;
    draggedCategoryId: string | null;
}

export default function CategoryTree({
                                         tree,
                                         categories,
                                         phrasesCount,
                                         editingCategoryId,
                                         editCategoryName,
                                         editingCategoryParentId,
                                         onToggleExpand,
                                         onStartEdit,
                                         onCancelEdit,
                                         onUpdateCategory,
                                         onSetEditCategoryName,
                                         onSetEditCategoryParentId,
                                         onDeleteCategory,
                                         onDuplicateCategory,
                                         onDragStart,
                                         onDragOver,
                                         onDrop,
                                         onDragEnd,
                                         draggedCategoryId,
                                     }: CategoryTreeProps) {
    const [localExpanded, setLocalExpanded] = useState<Set<string>>(new Set());

    const toggleExpand = (categoryId: string) => {
        setLocalExpanded(prev => {
            const newSet = new Set(prev);
            if (newSet.has(categoryId)) {
                newSet.delete(categoryId);
            } else {
                newSet.add(categoryId);
            }
            return newSet;
        });
        onToggleExpand(categoryId);
    };

    const isExpanded = (categoryId: string) => localExpanded.has(categoryId);

    const getPhraseCountText = (count: number) => {
        if (count === 1) return 'фраза';
        if (count >= 2 && count <= 4) return 'фразы';
        return 'фраз';
    };

    const renderParentOptions = (excludeId: string) => {
        return (
            <>
                <option value="">Без родителя (корень)</option>
                {categories
                    .filter(c => c.id !== excludeId)
                    .map(cat => (
                        <option key={cat.id} value={cat.id}>
                            {cat.name}
                        </option>
                    ))}
            </>
        );
    };

    const renderTreeNode = (node: CategoryTreeNode) => {
        const isEditing = editingCategoryId === node.category.id;
        const isDragging = draggedCategoryId === node.category.id;
        const hasChildren = node.children.length > 0;
        const count = phrasesCount.get(node.category.id) || 0;
        const expanded = isExpanded(node.category.id);

        return (
            <div key={node.category.id} className="category-tree-node">
                <div
                    className={`category-tree-item ${isEditing ? 'editing' : ''} ${isDragging ? 'dragging' : ''}`}
                    style={{paddingLeft: `${node.depth * 1.5}rem`}}
                    draggable={!isEditing}
                    onDragStart={(e) => onDragStart(e, node.category.id)}
                    onDragOver={(e) => onDragOver(e, node.category.id)}
                    onDrop={(e) => onDrop(e, node.category.id)}
                >
                    {hasChildren && (
                        <button
                            className="category-tree-expand"
                            onClick={() => toggleExpand(node.category.id)}
                            type="button"
                        >
                            {expanded ? '▼' : '▶'}
                        </button>
                    )}

                    {!hasChildren && <span className="category-tree-spacer"/>}

                    {isEditing ? (
                        <div className="category-tree-edit">
                            <input
                                type="text"
                                value={editCategoryName}
                                onChange={(e) => onSetEditCategoryName(e.target.value)}
                                placeholder="Название категории"
                                className="speech-category-input"
                            />
                            <select
                                value={editingCategoryParentId || ''}
                                onChange={(e) => onSetEditCategoryParentId(e.target.value || null)}
                                className="speech-category-select"
                            >
                                {renderParentOptions(node.category.id)}
                            </select>
                            <button
                                className="btn btn-primary btn-sm"
                                onClick={onUpdateCategory}
                                type="button"
                            >
                                💾
                            </button>
                            <button
                                className="btn btn-secondary btn-sm"
                                onClick={onCancelEdit}
                                type="button"
                            >
                                ❌
                            </button>
                        </div>
                    ) : (
                        <>
                            <span className="category-tree-name">
                                📁 {node.category.name}
                            </span>
                            <span className="category-tree-count">
                                {count} {getPhraseCountText(count)}
                            </span>
                            <div className="category-tree-actions">
                                <button
                                    className="btn btn-sm speech-category-btn"
                                    onClick={() => onStartEdit(node.category.id)}
                                    type="button"
                                >
                                    ✏️
                                </button>
                                <button
                                    className="btn btn-sm speech-category-btn"
                                    onClick={() => onDuplicateCategory(node.category.id)}
                                    type="button"
                                >
                                    📋
                                </button>
                                <button
                                    className="btn btn-sm speech-category-btn btn-danger"
                                    onClick={() => onDeleteCategory(node.category.id)}
                                    type="button"
                                >
                                    🗑️
                                </button>
                            </div>
                        </>
                    )}
                </div>

                {hasChildren && expanded && (
                    <div className="category-tree-children">
                        {node.children.map(renderTreeNode)}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="category-tree">
            {tree.length === 0 ? (
                <div
                    style={{
                        padding: '2rem',
                        textAlign: 'center',
                        color: 'var(--text-secondary)',
                        fontSize: '0.875rem',
                        backgroundColor: 'var(--muted)',
                        borderRadius: '0.5rem',
                    }}
                >
                    Нет категорий. Создайте первую!
                </div>
            ) : (
                <>
                    <div
                        className="category-tree-drop-zone"
                        onDragOver={(e) => onDragOver(e, null)}
                        onDrop={(e) => onDrop(e, null)}
                        style={{
                            padding: '0.5rem',
                            marginBottom: '0.5rem',
                            border: '2px dashed transparent',
                            borderRadius: '0.375rem',
                            textAlign: 'center',
                            fontSize: '0.75rem',
                            color: 'var(--text-secondary)',
                        }}
                    >
                        Перетащите категорию сюда, чтобы переместить в корень
                    </div>
                    {tree.map(renderTreeNode)}
                </>
            )}
        </div>
    );
}
