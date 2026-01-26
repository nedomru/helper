import {useMemo, useState} from 'react';
import type {SpeechPhrase, SpeechPhraseCategory} from '@src/shared/speech-phrases';
import CategoryTree from './CategoryTree';

interface SpeechPhrasesSectionProps {
    phrases: SpeechPhrase[];
    categories: SpeechPhraseCategory[];
    isCreatingPhrase: boolean;
    isCreatingCategory: boolean;
    editingPhraseId: string | null;
    editingCategoryId: string | null;
    newPhraseShortcut: string;
    newPhraseName: string;
    newPhraseText: string;
    newPhraseCategoryId: string | null;
    newCategoryName: string;
    newCategoryParentId: string | null;
    editPhraseShortcut: string;
    editPhraseName: string;
    editPhraseText: string;
    editPhraseCategoryId: string | null;
    editCategoryName: string;
    editingCategoryParentId: string | null;
    setNewPhraseShortcut: (value: string) => void;
    setNewPhraseName: (value: string) => void;
    setNewPhraseText: (value: string) => void;
    setNewPhraseCategoryId: (value: string | null) => void;
    setNewCategoryName: (value: string) => void;
    setNewCategoryParentId: (value: string | null) => void;
    setEditPhraseShortcut: (value: string) => void;
    setEditPhraseName: (value: string) => void;
    setEditPhraseText: (value: string) => void;
    setEditPhraseCategoryId: (value: string | null) => void;
    setEditCategoryName: (value: string) => void;
    setEditingCategoryParentId: (value: string | null) => void;
    startCreatePhrase: () => void;
    cancelCreatePhrase: () => void;
    savePhrase: () => void;
    startEditPhrase: (id: string) => void;
    cancelEditPhrase: () => void;
    updatePhrase: () => void;
    deletePhrase: (id: string) => void;
    duplicatePhrase: (id: string) => void;
    startCreateCategory: () => void;
    cancelCreateCategory: () => void;
    saveCategory: () => void;
    startEditCategory: (id: string) => void;
    cancelEditCategory: () => void;
    updateCategory: () => void;
    deleteCategory: (id: string) => void;
    duplicateCategory: (id: string) => void;
    getCategoryTree: () => import('@src/shared/speech-phrases').CategoryTreeNode[];
    moveCategory: (categoryId: string, newParentId: string | null) => void;
    getCategoryPath: (categoryId: string) => string;
}

export default function SpeechPhrasesSection({
                                                 phrases,
                                                 categories,
                                                 isCreatingPhrase,
                                                 isCreatingCategory,
                                                 editingPhraseId,
                                                 editingCategoryId,
                                                 newPhraseShortcut,
                                                 newPhraseName,
                                                 newPhraseText,
                                                 newPhraseCategoryId,
                                                 newCategoryName,
                                                 newCategoryParentId,
                                                 editPhraseShortcut,
                                                 editPhraseName,
                                                 editPhraseText,
                                                 editPhraseCategoryId,
                                                 editCategoryName,
                                                 editingCategoryParentId,
                                                 setNewPhraseShortcut,
                                                 setNewPhraseName,
                                                 setNewPhraseText,
                                                 setNewPhraseCategoryId,
                                                 setNewCategoryName,
                                                 setNewCategoryParentId,
                                                 setEditPhraseShortcut,
                                                 setEditPhraseName,
                                                 setEditPhraseText,
                                                 setEditPhraseCategoryId,
                                                 setEditCategoryName,
                                                 setEditingCategoryParentId,
                                                 startCreatePhrase,
                                                 cancelCreatePhrase,
                                                 savePhrase,
                                                 startEditPhrase,
                                                 cancelEditPhrase,
                                                 updatePhrase,
                                                 deletePhrase,
                                                 duplicatePhrase,
                                                 startCreateCategory,
                                                 cancelCreateCategory,
                                                 saveCategory,
                                                 startEditCategory,
                                                 cancelEditCategory,
                                                 updateCategory,
                                                 deleteCategory,
                                                 duplicateCategory,
                                                 getCategoryTree,
                                                 moveCategory,
                                                 getCategoryPath,
                                             }: SpeechPhrasesSectionProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [draggedCategoryId, setDraggedCategoryId] = useState<string | null>(null);

    // Compute phrases count by category
    const phrasesCountByCategory = useMemo(() => {
        const count = new Map<string, number>();
        for (const phrase of phrases) {
            if (phrase.categoryId) {
                count.set(phrase.categoryId, (count.get(phrase.categoryId) || 0) + 1);
            }
        }
        return count;
    }, [phrases]);

    // Build category tree
    const categoryTree = useMemo(() => getCategoryTree(), [categories, getCategoryTree]);

    const filteredPhrases = phrases.filter(phrase => {
        const matchesSearch =
            phrase.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            phrase.shortcut.toLowerCase().includes(searchQuery.toLowerCase()) ||
            phrase.text.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesCategory = selectedCategory === null || phrase.categoryId === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    const getPhraseCountText = (count: number) => {
        if (count === 1) return 'фраза';
        if (count >= 2 && count <= 4) return 'фразы';
        return 'фраз';
    };

    const renderCategoryOptions = (excludeId?: string) => {
        const flatCategories: SpeechPhraseCategory[] = [];

        function flattenTree(nodes: import('@src/shared/speech-phrases').CategoryTreeNode[], depth = 0) {
            for (const node of nodes) {
                if (node.category.id !== excludeId) {
                    flatCategories.push({
                        ...node.category,
                        name: '  '.repeat(depth) + node.category.name,
                    });
                }
                if (node.children.length > 0) {
                    flattenTree(node.children, depth + 1);
                }
            }
        }

        flattenTree(categoryTree);

        return (
            <>
                <option value="">Без категории</option>
                {flatCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                        {cat.name}
                    </option>
                ))}
            </>
        );
    };

    const renderPhraseCard = (phrase: SpeechPhrase) => {
        const category = categories.find(c => c.id === phrase.categoryId);
        const isEditing = editingPhraseId === phrase.id;

        if (isEditing) {
            return (
                <div key={phrase.id} className="speech-phrase-card speech-phrase-card-editing">
                    <div className="speech-phrase-form">
                        <input
                            type="text"
                            value={editPhraseShortcut}
                            onChange={(e) => setEditPhraseShortcut(e.target.value)}
                            placeholder="Сокращение (например: пр)"
                            className="speech-phrase-input"
                        />
                        <input
                            type="text"
                            value={editPhraseName}
                            onChange={(e) => setEditPhraseName(e.target.value)}
                            placeholder="Название"
                            className="speech-phrase-input"
                        />
                        <select
                            value={editPhraseCategoryId || ''}
                            onChange={(e) => setEditPhraseCategoryId(e.target.value || null)}
                            className="speech-phrase-select"
                        >
                            {renderCategoryOptions(phrase.id)}
                        </select>
                        <textarea
                            value={editPhraseText}
                            onChange={(e) => setEditPhraseText(e.target.value)}
                            placeholder="Текст для замены"
                            className="speech-phrase-textarea"
                            rows={3}
                        />
                        <div className="speech-phrase-actions">
                            <button className="btn btn-primary btn-sm" onClick={updatePhrase}>
                                💾 Сохранить
                            </button>
                            <button className="btn btn-secondary btn-sm" onClick={cancelEditPhrase}>
                                ❌ Отмена
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        const categoryPath = category ? getCategoryPath(category.id) : null;

        return (
            <div key={phrase.id} className="speech-phrase-card">
                <div className="speech-phrase-header">
                    <span className="speech-phrase-shortcut">{phrase.shortcut}</span>
                    <span className="speech-phrase-name">{phrase.name}</span>
                </div>
                <div className="speech-phrase-text">{phrase.text}</div>
                {categoryPath && (
                    <div className="speech-phrase-category-tag" title={categoryPath}>
                        📁 {categoryPath}
                    </div>
                )}
                <div className="speech-phrase-actions">
                    <button className="btn btn-secondary btn-sm" onClick={() => startEditPhrase(phrase.id)}>
                        ✏️ Изменить
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => duplicatePhrase(phrase.id)}>
                        📋 Копия
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => deletePhrase(phrase.id)}>
                        🗑️ Удалить
                    </button>
                </div>
            </div>
        );
    };

    const renderNewPhraseForm = () => {
        if (!isCreatingPhrase) return null;

        return (
            <div className="speech-phrase-card speech-phrase-card-new">
                <div className="speech-phrase-form">
                    <input
                        type="text"
                        value={newPhraseShortcut}
                        onChange={(e) => setNewPhraseShortcut(e.target.value)}
                        placeholder="Сокращение (например: пр)"
                        className="speech-phrase-input"
                    />
                    <input
                        type="text"
                        value={newPhraseName}
                        onChange={(e) => setNewPhraseName(e.target.value)}
                        placeholder="Название"
                        className="speech-phrase-input"
                    />
                    <select
                        value={newPhraseCategoryId || ''}
                        onChange={(e) => setNewPhraseCategoryId(e.target.value || null)}
                        className="speech-phrase-select"
                    >
                        {renderCategoryOptions()}
                    </select>
                    <textarea
                        value={newPhraseText}
                        onChange={(e) => setNewPhraseText(e.target.value)}
                        placeholder="Текст для замены"
                        className="speech-phrase-textarea"
                        rows={3}
                    />
                    <div className="speech-phrase-actions">
                        <button className="btn btn-primary btn-sm" onClick={savePhrase}>
                            ➕ Создать
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={cancelCreatePhrase}>
                            ❌ Отмена
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // Drag and drop handlers
    const handleDragStart = (e: React.DragEvent, categoryId: string) => {
        setDraggedCategoryId(categoryId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent, targetCategoryId: string | null) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent, targetCategoryId: string | null) => {
        e.preventDefault();
        if (draggedCategoryId) {
            moveCategory(draggedCategoryId, targetCategoryId);
            setDraggedCategoryId(null);
        }
    };

    const handleDragEnd = () => {
        setDraggedCategoryId(null);
    };

    return (
        <div key="Речевые модули" className="card">
            <div className="card-header">
                <div className="card-header-content">
                    <span className="card-icon">🗣️</span>
                    <div className="card-header-text">
                        <h3 className="card-title">Речевые модули</h3>
                        <p className="card-description">
                            Создавайте сокращения для быстрой вставки текста (например, "пр" → "Привет, хеллоу!")
                        </p>
                    </div>
                </div>
            </div>
            <div className="feature-list">
                {/* Phrases Section */}
                <div className="feature-item">
                    <div className="feature-info" style={{width: '100%'}}>
                        <label className="feature-label">
                            Мои фразы ({phrases.length})
                        </label>
                        <span className="feature-description">
                            Создавайте и управляйте текстовыми сокращениями
                        </span>

                        <div style={{display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem'}}>
                            <button className="btn btn-primary btn-sm" onClick={startCreatePhrase}>
                                ➕ Создать фразу
                            </button>
                            <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => setSelectedCategory(null)}
                                disabled={selectedCategory === null}
                            >
                                🔄 Сбросить фильтр
                            </button>
                        </div>

                        <input
                            type="text"
                            placeholder="Поиск фраз..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
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

                        {renderNewPhraseForm()}

                        <div className="speech-phrases-grid">
                            {filteredPhrases.length === 0 ? (
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
                                    {searchQuery || selectedCategory
                                        ? 'Нет фраз, соответствующих фильтру'
                                        : 'Пока нет фраз. Создайте первую!'}
                                </div>
                            ) : (
                                filteredPhrases.map(renderPhraseCard)
                            )}
                        </div>
                    </div>
                </div>

                {/* Categories Section */}
                <div className="feature-item">
                    <div className="feature-info" style={{width: '100%'}}>
                        <label className="feature-label">
                            Категории ({categories.length})
                        </label>
                        <span className="feature-description">
                            Организуйте фразы по категориям (перетаскивайте для изменения структуры)
                        </span>

                        {isCreatingCategory ? (
                            <div style={{
                                display: 'flex',
                                gap: '0.5rem',
                                marginTop: '0.75rem',
                                marginBottom: '1rem',
                                alignItems: 'center'
                            }}>
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
                                <select
                                    value={newCategoryParentId || ''}
                                    onChange={(e) => setNewCategoryParentId(e.target.value || null)}
                                    style={{
                                        padding: '0.5rem 0.75rem',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '0.375rem',
                                        backgroundColor: 'var(--card-bg)',
                                        color: 'var(--text-primary)',
                                        fontSize: '0.875rem',
                                    }}
                                >
                                    <option value="">Без родителя (корень)</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>
                                            {getCategoryPath(cat.id)}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    className="btn btn-primary btn-sm"
                                    onClick={saveCategory}
                                    disabled={!newCategoryName.trim()}
                                >
                                    ➕
                                </button>
                                <button className="btn btn-secondary btn-sm" onClick={cancelCreateCategory}>
                                    ❌
                                </button>
                            </div>
                        ) : (
                            <button className="btn btn-secondary btn-sm" onClick={startCreateCategory}
                                    style={{marginTop: '0.75rem'}}>
                                ➕ Создать категорию
                            </button>
                        )}

                        <CategoryTree
                            tree={categoryTree}
                            categories={categories}
                            phrasesCount={phrasesCountByCategory}
                            editingCategoryId={editingCategoryId}
                            editCategoryName={editCategoryName}
                            editingCategoryParentId={editingCategoryParentId}
                            onToggleExpand={() => {
                            }}
                            onStartEdit={startEditCategory}
                            onCancelEdit={cancelEditCategory}
                            onUpdateCategory={updateCategory}
                            onSetEditCategoryName={setEditCategoryName}
                            onSetEditCategoryParentId={setEditingCategoryParentId}
                            onDeleteCategory={deleteCategory}
                            onDuplicateCategory={duplicateCategory}
                            onDragStart={handleDragStart}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                            onDragEnd={handleDragEnd}
                            draggedCategoryId={draggedCategoryId}
                        />

                        {phrases.filter(p => !p.categoryId).length > 0 && (
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
                                {phrases.filter(p => !p.categoryId).length} {getPhraseCountText(phrases.filter(p => !p.categoryId).length)}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
