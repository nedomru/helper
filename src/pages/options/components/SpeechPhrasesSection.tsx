import {JSX, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import type {SpeechPhrase, SpeechPhraseCategory} from '@src/shared/speech-phrases';
import {buildCategoryTree} from '@src/shared/speech-phrases';
import {notify} from '@src/utils/notify';

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
    editPhraseShortcut: string;
    editPhraseName: string;
    editPhraseText: string;
    editPhraseCategoryId: string | null;
    editCategoryName: string;
    setNewPhraseShortcut: (value: string) => void;
    setNewPhraseName: (value: string) => void;
    setNewPhraseText: (value: string) => void;
    setNewPhraseCategoryId: (value: string | null) => void;
    setNewCategoryName: (value: string) => void;
    setEditPhraseShortcut: (value: string) => void;
    setEditPhraseName: (value: string) => void;
    setEditPhraseText: (value: string) => void;
    setEditPhraseCategoryId: (value: string | null) => void;
    setEditCategoryName: (value: string) => void;
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
    movePhrase: (phraseId: string, categoryId: string | null) => void;
    getCategoryPath: (categoryId: string) => string;
    importPhrases: (file: File) => Promise<boolean>;
    clearAll: () => Promise<boolean>;
}

interface TreeNode {
    id: string;
    type: 'category' | 'phrase';
    name: string;
    children: TreeNode[];
    data: SpeechPhrase | SpeechPhraseCategory;
    path: string[];
    depth: number;
}

interface ContextMenuState {
    isOpen: boolean;
    nodeId: string | null;
    nodeType: 'category' | 'phrase' | null;
    x: number;
    y: number;
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
                                                 newCategoryName,
                                                 editPhraseShortcut,
                                                 editPhraseName,
                                                 editPhraseText,
                                                 editCategoryName,
                                                 setNewPhraseShortcut,
                                                 setNewPhraseName,
                                                 setNewPhraseText,
                                                 setNewPhraseCategoryId,
                                                 setNewCategoryName,
                                                 setEditPhraseShortcut,
                                                 setEditPhraseName,
                                                 setEditPhraseText,
                                                 setEditCategoryName,
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
                                                 moveCategory,
                                                 movePhrase,
                                                 importPhrases,
                                                 clearAll,
                                             }: SpeechPhrasesSectionProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
    const [draggedNodeType, setDraggedNodeType] = useState<'category' | 'phrase' | null>(null);
    const [dropTargetNodeId, setDropTargetNodeId] = useState<string | null>(null);
    const [dropOnRoot, setDropOnRoot] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Context menu state
    const [contextMenu, setContextMenu] = useState<ContextMenuState>({
        isOpen: false,
        nodeId: null,
        nodeType: null,
        x: 0,
        y: 0,
    });

    // Close context menu when clicking elsewhere
    useEffect(() => {
        const handleClick = () => setContextMenu(prev => ({...prev, isOpen: false, nodeId: null, nodeType: null}));
        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, []);

    // Build tree structure
    const tree = useMemo(() => {
        const categoryTree = buildCategoryTree(categories);

        const buildTreeNode = (category: typeof categoryTree[0], depth: number): TreeNode => {
            const categoryPhrases = phrases.filter(p => p.categoryId === category.category.id);

            const childNodes = category.children.map(child => buildTreeNode(child, depth + 1));

            // Add phrases as children
            for (const phrase of categoryPhrases) {
                childNodes.push({
                    id: phrase.id,
                    type: 'phrase',
                    name: phrase.name,
                    children: [],
                    data: phrase,
                    path: [...category.path, phrase.name],
                    depth: depth + 1,
                });
            }

            return {
                id: category.category.id,
                type: 'category',
                name: category.category.name,
                children: childNodes,
                data: category.category,
                path: category.path,
                depth,
            };
        };

        // Build root nodes
        const rootNodes: TreeNode[] = [];

        // Add categories without parents
        for (const category of categoryTree) {
            rootNodes.push(buildTreeNode(category, 0));
        }

        // Add uncategorized phrases
        const uncategorizedPhrases = phrases.filter(p => !p.categoryId);
        for (const phrase of uncategorizedPhrases) {
            rootNodes.push({
                id: phrase.id,
                type: 'phrase',
                name: phrase.name,
                children: [],
                data: phrase,
                path: [phrase.name],
                depth: 0,
            });
        }

        return rootNodes;
    }, [phrases, categories]);

    // Filter tree by search query
    const filteredTree = useMemo(() => {
        if (!searchQuery.trim()) return tree;

        const filterNode = (node: TreeNode): TreeNode | null => {
            const matchesSearch =
                node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (node.type === 'phrase' && (node.data as SpeechPhrase).text?.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (node.type === 'phrase' && (node.data as SpeechPhrase).shortcut?.toLowerCase().includes(searchQuery.toLowerCase()));

            const filteredChildren = node.children.map(child => filterNode(child)).filter(Boolean) as TreeNode[];

            if (matchesSearch || filteredChildren.length > 0) {
                return {
                    ...node,
                    children: filteredChildren,
                };
            }

            return null;
        };

        return tree.map(node => filterNode(node)).filter(Boolean) as TreeNode[];
    }, [tree, searchQuery]);

    const toggleExpand = useCallback((nodeId: string) => {
        setExpandedNodes(prev => {
            const newSet = new Set(prev);
            if (newSet.has(nodeId)) {
                newSet.delete(nodeId);
            } else {
                newSet.add(nodeId);
            }
            return newSet;
        });
    }, []);

    const expandAll = useCallback(() => {
        const allCategoryIds = new Set(categories.map(c => c.id));
        setExpandedNodes(allCategoryIds);
    }, [categories]);

    const collapseAll = useCallback(() => {
        setExpandedNodes(new Set());
    }, []);

    const handleImportClick = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }

        // Check file extension - support JSON and INI files
        if (!file.name.endsWith('.json') && !file.name.endsWith('.ini')) {
            notify('Импорт фраз', 'Выберите файл JSON или INI', 'error');
            return;
        }

        setIsImporting(true);
        try {
            await importPhrases(file);
        } finally {
            setIsImporting(false);
        }
    }, [importPhrases]);

    // Flatten tree for rendering
    const flatTree = useMemo(() => {
        const result: TreeNode[] = [];
        const traverse = (node: TreeNode) => {
            result.push(node);
            if (expandedNodes.has(node.id)) {
                for (const child of node.children) {
                    traverse(child);
                }
            }
        };
        for (const node of filteredTree) {
            traverse(node);
        }
        return result;
    }, [filteredTree, expandedNodes]);

    // Handle drag start
    const handleDragStart = useCallback((e: React.DragEvent, node: TreeNode) => {
        setDraggedNodeId(node.id);
        setDraggedNodeType(node.type);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', node.id);
    }, []);

    // Handle drag over with proper target detection
    const handleDragOver = useCallback((e: React.DragEvent, targetNode: TreeNode) => {
        e.preventDefault();
        e.stopPropagation();

        // Only allow dropping on categories
        if (targetNode.type === 'category') {
            setDropTargetNodeId(targetNode.id);
            setDropOnRoot(false);
        }
    }, []);

    // Handle drag leave
    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.stopPropagation();
        // Clear drop target only when leaving the specific node
        const target = e.currentTarget as HTMLElement;
        const rect = target.getBoundingClientRect();
        const x = e.clientX;
        const y = e.clientY;
        if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
            setDropTargetNodeId(null);
        }
    }, []);

    // Handle drop
    const handleDrop = useCallback((e: React.DragEvent, targetNode: TreeNode) => {
        e.preventDefault();
        e.stopPropagation();

        if (!draggedNodeId || !targetNode || draggedNodeId === targetNode.id) {
            setDraggedNodeId(null);
            setDraggedNodeType(null);
            setDropTargetNodeId(null);
            return;
        }

        if (draggedNodeType === 'category' && targetNode.type === 'category') {
            moveCategory(draggedNodeId, targetNode.id);
        } else if (draggedNodeType === 'phrase') {
            movePhrase(draggedNodeId, targetNode.id);
        }

        setDraggedNodeId(null);
        setDraggedNodeType(null);
        setDropTargetNodeId(null);
    }, [draggedNodeId, draggedNodeType, moveCategory, movePhrase]);

    // Handle root drop
    const handleRootDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();

        // Check if we're not over any node
        const target = e.target as HTMLElement;
        if (target.closest('.tree-node')) {
            setDropOnRoot(false);
            return;
        }

        if (dropOnRoot && draggedNodeId) {
            if (draggedNodeType === 'category') {
                moveCategory(draggedNodeId, null);
            } else if (draggedNodeType === 'phrase') {
                movePhrase(draggedNodeId, null);
            }
        }

        setDropOnRoot(false);
        setDraggedNodeId(null);
        setDraggedNodeType(null);
    }, [dropOnRoot, draggedNodeId, draggedNodeType, moveCategory, movePhrase]);

    // Context menu handlers
    const handleContextMenu = useCallback((e: React.MouseEvent, node: TreeNode) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({
            isOpen: true,
            nodeId: node.id,
            nodeType: node.type,
            x: e.clientX,
            y: e.clientY,
        });
    }, []);

    const handleContextAction = useCallback((action: string) => {
        if (!contextMenu.nodeId) return;

        switch (action) {
            case 'rename':
                if (contextMenu.nodeType === 'phrase') {
                    startEditPhrase(contextMenu.nodeId);
                } else {
                    startEditCategory(contextMenu.nodeId);
                }
                break;
            case 'delete':
                if (contextMenu.nodeType === 'phrase') {
                    deletePhrase(contextMenu.nodeId);
                } else {
                    deleteCategory(contextMenu.nodeId);
                }
                break;
            case 'duplicate':
                if (contextMenu.nodeType === 'phrase') {
                    duplicatePhrase(contextMenu.nodeId);
                } else {
                    duplicateCategory(contextMenu.nodeId);
                }
                break;
            case 'create-phrase':
                // When creating inside a category, set it as the parent
                if (contextMenu.nodeType === 'category') {
                    setNewPhraseCategoryId(contextMenu.nodeId);
                }
                startCreatePhrase();
                break;
            case 'create-category':
                startCreateCategory();
                break;
        }

        setContextMenu(prev => ({...prev, isOpen: false, nodeId: null, nodeType: null}));
    }, [contextMenu.nodeId, contextMenu.nodeType, phrases, categories, startEditPhrase, startEditCategory, deletePhrase, deleteCategory, duplicatePhrase, duplicateCategory, startCreatePhrase, startCreateCategory, setNewPhraseCategoryId]);

    const renderTreeNode = (node: TreeNode): JSX.Element => {
        const isEditing = node.type === 'category' ? editingCategoryId === node.id : editingPhraseId === node.id;
        const isSelected = selectedNodeId === node.id;
        const isDragging = draggedNodeId === node.id;
        const isDropTarget = dropTargetNodeId === node.id && node.type === 'category';

        const indent = node.depth * 20;

        if (isEditing) {
            if (node.type === 'category') {
                return (
                    <div key={node.id} className="tree-node-editing-container" style={{paddingLeft: `${indent + 8}px`}}>
                        <div className="tree-node-edit-inline">
                            <span className="tree-edit-label">Название категории:</span>
                            <input
                                type="text"
                                value={editCategoryName}
                                onChange={(e) => setEditCategoryName(e.target.value)}
                                className="tree-edit-input-inline"
                                placeholder="Название категории"
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') updateCategory();
                                    if (e.key === 'Escape') cancelEditCategory();
                                }}
                            />
                            <div className="tree-edit-actions-inline">
                                <button className="tree-btn-inline tree-btn-save-inline" onClick={updateCategory}
                                        title="Сохранить (Enter)">
                                    ✓
                                </button>
                                <button className="tree-btn-inline tree-btn-cancel-inline" onClick={cancelEditCategory}
                                        title="Отмена (Esc)">
                                    ✕
                                </button>
                            </div>
                        </div>
                    </div>
                );
            } else {
                return (
                    <div key={node.id} className="tree-node-editing-container" style={{paddingLeft: `${indent + 8}px`}}>
                        <div className="tree-node-edit-inline tree-node-edit-inline-phrase">
                            <div className="tree-edit-field">
                                <label className="tree-edit-label">Сокращение:</label>
                                <input
                                    type="text"
                                    value={editPhraseShortcut}
                                    onChange={(e) => setEditPhraseShortcut(e.target.value)}
                                    className="tree-edit-input-inline-shortcut"
                                    placeholder="(опционально)"
                                />
                            </div>
                            <div className="tree-edit-field">
                                <label className="tree-edit-label">Название:</label>
                                <input
                                    type="text"
                                    value={editPhraseName}
                                    onChange={(e) => setEditPhraseName(e.target.value)}
                                    className="tree-edit-input-inline-name"
                                    placeholder="Название *"
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && e.shiftKey) updatePhrase();
                                        if (e.key === 'Escape') cancelEditPhrase();
                                    }}
                                />
                            </div>
                            <div className="tree-edit-field tree-edit-field-full">
                                <label className="tree-edit-label">Текст для замены:</label>
                                <textarea
                                    value={editPhraseText}
                                    onChange={(e) => setEditPhraseText(e.target.value)}
                                    className="tree-edit-textarea-inline"
                                    placeholder="Текст *"
                                    rows={2}
                                />
                            </div>
                            <div className="tree-edit-actions-inline">
                                <button className="tree-btn-inline tree-btn-save-inline" onClick={updatePhrase}
                                        title="Сохранить (Shift+Enter)">
                                    ✓
                                </button>
                                <button className="tree-btn-inline tree-btn-cancel-inline" onClick={cancelEditPhrase}
                                        title="Отмена (Esc)">
                                    ✕
                                </button>
                            </div>
                        </div>
                    </div>
                );
            }
        }

        const isPhrase = node.type === 'phrase';
        const phrase = isPhrase ? (node.data as SpeechPhrase) : null;
        const hasChildren = !isPhrase && node.children.length > 0;

        return (
            <div key={node.id} className="tree-node-wrapper">
                <div
                    className={`tree-node ${isSelected ? 'tree-node-selected' : ''} ${isDragging ? 'tree-node-dragging' : ''} ${isDropTarget || dropOnRoot ? 'tree-node-drop-target' : ''}`}
                    style={{paddingLeft: `${indent + 8}px`}}
                    onClick={() => setSelectedNodeId(node.id)}
                    onDoubleClick={() => {
                        if (isPhrase) startEditPhrase(node.id);
                        else toggleExpand(node.id);
                    }}
                    draggable={true}
                    onDragStart={(e) => handleDragStart(e, node)}
                    onDragOver={(e) => handleDragOver(e, node)}
                    onDragLeave={(e) => handleDragLeave(e)}
                    onDrop={(e) => handleDrop(e, node)}
                    onDragEnd={() => {
                        setDraggedNodeId(null);
                        setDraggedNodeType(null);
                        setDropTargetNodeId(null);
                    }}
                    onContextMenu={(e) => handleContextMenu(e, node)}
                >
                    {!isPhrase && (
                        <span
                            className={`tree-expander ${hasChildren ? '' : 'tree-expander-hidden'} ${expandedNodes.has(node.id) ? 'tree-expander-expanded' : ''}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (hasChildren) toggleExpand(node.id);
                            }}
                        >
                            {hasChildren ? (expandedNodes.has(node.id) ? '▼' : '▶') : '•'}
                        </span>
                    )}
                    {isPhrase && <span className="tree-spacer"/>}
                    <span className={`tree-icon ${isPhrase ? 'tree-icon-phrase' : 'tree-icon-folder'}`}>
                        {isPhrase ? '📄' : expandedNodes.has(node.id) ? '📂' : '📁'}
                    </span>
                    <span className="tree-node-text">
                        {phrase?.shortcut && <span className="tree-shortcut-badge">{phrase.shortcut}</span>}
                        {node.name}
                    </span>
                    <div className="tree-node-actions" onClick={(e) => e.stopPropagation()}>
                        {isPhrase ? (
                            <>
                                <button className="tree-btn tree-btn-small" onClick={() => startEditPhrase(node.id)}
                                        title="Изменить">
                                    ✏️
                                </button>
                                <button className="tree-btn tree-btn-small" onClick={() => duplicatePhrase(node.id)}
                                        title="Копия">
                                    📋
                                </button>
                            </>
                        ) : (
                            <button className="tree-btn tree-btn-small" onClick={() => startEditCategory(node.id)}
                                    title="Изменить">
                                ✏️
                            </button>
                        )}
                        <button
                            className="tree-btn tree-btn-small tree-btn-danger"
                            onClick={() => {
                                if (isPhrase) {
                                    deletePhrase(node.id);
                                } else {
                                    deleteCategory(node.id);
                                }
                            }}
                            title="Удалить"
                        >
                            🗑️
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // Auto-focus input when creating
    const createInputRef = useRef<HTMLInputElement>(null);
    const createCategoryInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isCreatingPhrase) {
            createInputRef.current?.focus();
        } else if (isCreatingCategory) {
            createCategoryInputRef.current?.focus();
        }
    }, [isCreatingPhrase, isCreatingCategory]);

    return (
        <div key="РМы" className="card">
            {/*<div className="card-header">*/}
            {/*    <div className="card-header-content">*/}
            {/*        <span className="card-icon">🗣️</span>*/}
            {/*        <div className="card-header-text">*/}
            {/*            <h3 className="card-title">РМы</h3>*/}
            {/*            <p className="card-description">*/}
            {/*                Создавайте текстовые сокращения для быстрой вставки. Используйте фразы двумя способами:*/}
            {/*                через сокращение (например, наберите &#34;пр&#34; для вставки текста) или через контекстное*/}
            {/*                меню*/}
            {/*                (правая кнопка мыши → РМы)*/}
            {/*            </p>*/}
            {/*        </div>*/}
            {/*    </div>*/}
            {/*</div>*/}

            <div className="speech-phrases-manager">
                {/* Toolbar */}
                <div className="speech-phrases-toolbar">
                    <div className="speech-phrases-toolbar-left">
                        <button className="speech-toolbar-btn" onClick={startCreatePhrase}>
                            <span className="speech-toolbar-icon">➕</span>
                            <span>Новая фраза</span>
                        </button>
                        <button className="speech-toolbar-btn" onClick={startCreateCategory}>
                            <span className="speech-toolbar-icon">📁</span>
                            <span>Новая категория</span>
                        </button>
                        <div className="speech-toolbar-divider"/>
                        <button className="speech-toolbar-btn" onClick={handleImportClick} disabled={isImporting}
                                title="Импортировать из Clippings, Genesys или QuickTextPaste">
                            <span className="speech-toolbar-icon">{isImporting ? '⏳' : '📥'}</span>
                            <span>{isImporting ? 'Импорт...' : 'Импорт'}</span>
                        </button>
                        <button className="speech-toolbar-btn" onClick={() => clearAll()} title="Очистить все данные">
                            <span className="speech-toolbar-icon">🗑️</span>
                            <span>Очистить всё</span>
                        </button>
                        <div className="speech-toolbar-divider"/>
                        <button className="speech-toolbar-btn" onClick={expandAll} title="Развернуть всё">
                            <span className="speech-toolbar-icon">⬇️</span>
                        </button>
                        <button className="speech-toolbar-btn" onClick={collapseAll} title="Свернуть всё">
                            <span className="speech-toolbar-icon">⬆️</span>
                        </button>
                    </div>
                    <div className="speech-phrases-toolbar-right">
                        <input
                            type="text"
                            className="speech-search-input"
                            placeholder="Поиск..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Hidden file input for import */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,.ini"
                    style={{display: 'none'}}
                    onChange={handleFileChange}
                />

                {/* Tree Container with Root Drop Target */}
                <div
                    className="speech-tree-container"
                    onDragOver={(e) => {
                        e.preventDefault();
                        const isOverNode = (e.target as HTMLElement).closest('.tree-node');
                        if (!isOverNode) {
                            setDropOnRoot(true);
                            setDropTargetNodeId(null);
                        }
                    }}
                    onDragLeave={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = e.clientX;
                        const y = e.clientY;
                        if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
                            setDropOnRoot(false);
                        }
                    }}
                    onDrop={handleRootDrop}
                >
                    {/* Create New Phrase Form */}
                    {isCreatingPhrase && (
                        <div className="tree-node-create-form">
                            <div className="tree-create-header">
                                <span className="tree-create-icon">📄</span>
                                <span className="tree-create-title">Новая фраза</span>
                            </div>
                            <div className="tree-create-fields">
                                <div className="tree-create-field">
                                    <label className="tree-create-label">Сокращение:</label>
                                    <input
                                        ref={createInputRef}
                                        type="text"
                                        value={newPhraseShortcut}
                                        onChange={(e) => setNewPhraseShortcut(e.target.value)}
                                        className="tree-create-input-shortcut"
                                        placeholder="(опционально, например: пр)"
                                    />
                                </div>
                                <div className="tree-create-field">
                                    <label className="tree-create-label">Название:</label>
                                    <input
                                        type="text"
                                        value={newPhraseName}
                                        onChange={(e) => setNewPhraseName(e.target.value)}
                                        className="tree-create-input-name"
                                        placeholder="Название *"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && e.shiftKey) savePhrase();
                                            if (e.key === 'Escape') cancelCreatePhrase();
                                        }}
                                    />
                                </div>
                                <div className="tree-create-field tree-create-field-full">
                                    <label className="tree-create-label">Текст для замены:</label>
                                    <textarea
                                        value={newPhraseText}
                                        onChange={(e) => setNewPhraseText(e.target.value)}
                                        className="tree-create-textarea"
                                        placeholder="Текст *"
                                        rows={2}
                                    />
                                </div>
                                <div className="tree-create-actions">
                                    <button className="tree-create-btn tree-create-btn-save" onClick={savePhrase}>
                                        ✓ Сохранить
                                    </button>
                                    <button className="tree-create-btn tree-create-btn-cancel"
                                            onClick={cancelCreatePhrase}>
                                        ✕ Отмена
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Create New Category Form */}
                    {isCreatingCategory && (
                        <div className="tree-node-create-form">
                            <div className="tree-create-header">
                                <span className="tree-create-icon">📁</span>
                                <span className="tree-create-title">Новая категория</span>
                            </div>
                            <div className="tree-create-fields">
                                <div className="tree-create-field">
                                    <label className="tree-create-label">Название:</label>
                                    <input
                                        ref={createCategoryInputRef}
                                        type="text"
                                        value={newCategoryName}
                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                        className="tree-create-input-name"
                                        placeholder="Название категории *"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') saveCategory();
                                            if (e.key === 'Escape') cancelCreateCategory();
                                        }}
                                    />
                                </div>
                                <div className="tree-create-actions">
                                    <button className="tree-create-btn tree-create-btn-save" onClick={saveCategory}>
                                        ✓ Сохранить
                                    </button>
                                    <button className="tree-create-btn tree-create-btn-cancel"
                                            onClick={cancelCreateCategory}>
                                        ✕ Отмена
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tree */}
                    {flatTree.length === 0 && !isCreatingPhrase && !isCreatingCategory ? (
                        <div className="speech-tree-empty">
                            {searchQuery ? 'Ничего не найдено' : 'Нет фраз. Создайте первую фразу или категорию!'}
                        </div>
                    ) : (
                        <div className={`speech-tree ${dropOnRoot ? 'speech-tree-drop-root' : ''}`}>
                            {flatTree.map(node => renderTreeNode(node))}
                        </div>
                    )}
                </div>

                {/* Status Bar */}
                <div className="speech-status-bar">
                    <span>
                        {phrases.length} {phrases.length === 1 ? 'фраза' : phrases.length >= 2 && phrases.length <= 4 ? 'фразы' : 'фраз'} • {categories.length} {categories.length === 1 ? 'категория' : categories.length >= 2 && categories.length <= 4 ? 'категории' : 'категорий'}
                    </span>
                    <span className="speech-status-hint">
                        Drag & drop • ПКМ для меню • Двойной клик для редактирования
                    </span>
                </div>

                {/* Context Menu */}
                {contextMenu.isOpen && (
                    <div
                        className="speech-context-menu"
                        style={{
                            position: 'fixed',
                            left: `${contextMenu.x}px`,
                            top: `${contextMenu.y}px`,
                            zIndex: 10000,
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div
                            className="speech-context-item"
                            onClick={() => handleContextAction('rename')}
                        >
                            ✏️ Переименовать
                        </div>
                        <div
                            className="speech-context-item speech-context-item-danger"
                            onClick={() => handleContextAction('delete')}
                        >
                            🗑️ Удалить
                        </div>
                        <div className="speech-context-divider"/>
                        <div
                            className="speech-context-item"
                            onClick={() => handleContextAction('duplicate')}
                        >
                            📋 Дублировать
                        </div>
                        {contextMenu.nodeType === 'category' && (
                            <>
                                <div className="speech-context-divider"/>
                                <div
                                    className="speech-context-item"
                                    onClick={() => handleContextAction('create-phrase')}
                                >
                                    ➕ Создать фразу
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
