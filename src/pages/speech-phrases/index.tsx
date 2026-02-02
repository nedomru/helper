import {useEffect, useState} from 'react';
import ReactDOM from 'react-dom/client';
import {useSpeechPhrases} from '@src/pages/options/hooks/useSpeechPhrases';
import type {CategoryTreeNode, SpeechPhrase, SpeechPhraseCategory} from '@src/shared/speech-phrases';
import {buildCategoryTree, getCategoryPathString} from '@src/shared/speech-phrases';
import './SpeechPhrasesManager.css';

interface TreeNode {
    id: string;
    name: string;
    type: 'phrase' | 'category';
    children?: TreeNode[];
    indent: number;
    data?: SpeechPhrase | SpeechPhraseCategory;
}

function SpeechPhrasesManager() {
    const speechPhrases = useSpeechPhrases();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
    const [treeNodes, setTreeNodes] = useState<TreeNode[]>([]);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        if (speechPhrases.phrases.length >= 0 && speechPhrases.categories.length >= 0) {
            setIsReady(true);
        }
    }, [speechPhrases.phrases, speechPhrases.categories]);

    useEffect(() => {
        const buildTree = () => {
            const categoryTree = buildCategoryTree(speechPhrases.categories);
            const nodes: TreeNode[] = [];

            const addCategoryNodes = (categories: CategoryTreeNode[], indent: number = 0) => {
                for (const category of categories) {
                    nodes.push({
                        id: category.id,
                        name: category.name,
                        type: 'category',
                        indent,
                        data: speechPhrases.categories.find(c => c.id === category.id),
                        children: [],
                    });

                    const phrasesInCategory = speechPhrases.phrases.filter(p => p.categoryId === category.id);
                    for (const phrase of phrasesInCategory) {
                        nodes.push({
                            id: phrase.id,
                            name: phrase.name,
                            type: 'phrase',
                            indent: indent + 1,
                            data: phrase,
                        });
                    }

                    if (category.children && category.children.length > 0) {
                        addCategoryNodes(category.children, indent + 1);
                    }
                }
            };

            addCategoryNodes(categoryTree);

            const uncategorizedPhrases = speechPhrases.phrases.filter(p => !p.categoryId);
            for (const phrase of uncategorizedPhrases) {
                nodes.push({
                    id: phrase.id,
                    name: phrase.name,
                    type: 'phrase',
                    indent: 0,
                    data: phrase,
                });
            }

            setTreeNodes(nodes);
        };

        buildTree();
    }, [speechPhrases.phrases, speechPhrases.categories]);

    const filteredNodes = treeNodes.filter(node =>
        node.name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? !searchQuery
    );

    const handleNodeClick = (node: TreeNode) => {
        setSelectedNode(node);
        if (node.type === 'phrase' && node.data as SpeechPhrase) {
            speechPhrases.startEditPhrase(node.id);
        } else if (node.type === 'category') {
            speechPhrases.startEditCategory(node.id);
        }
    };

    const handleNewPhrase = () => {
        speechPhrases.startCreatePhrase();
        setSelectedNode(null);
    };

    const handleNewCategory = () => {
        speechPhrases.startCreateCategory();
        setSelectedNode(null);
    };

    const handleDelete = () => {
        if (!selectedNode) return;
        if (selectedNode.type === 'phrase') {
            speechPhrases.deletePhrase(selectedNode.id);
        } else {
            speechPhrases.deleteCategory(selectedNode.id);
        }
        setSelectedNode(null);
    };

    const handleClose = () => {
        window.close();
    };

    if (!isReady) {
        return (
            <div className="speech-manager-window">
                <div className="speech-manager-loading">
                    <div className="spinner"/>
                    <p>Загрузка...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="speech-manager-window">
            <div className="speech-manager-toolbar">
                <button
                    className="speech-manager-toolbar-btn"
                    onClick={handleNewPhrase}
                    title="Новая фраза"
                >
                    <span className="speech-manager-icon">📄</span>
                    <span>Фраза</span>
                </button>
                <button
                    className="speech-manager-toolbar-btn"
                    onClick={handleNewCategory}
                    title="Новая категория"
                >
                    <span className="speech-manager-icon">📁</span>
                    <span>Категория</span>
                </button>
                {selectedNode && (
                    <>
                        <button
                            className="speech-manager-toolbar-btn speech-manager-danger-btn"
                            onClick={handleDelete}
                            title="Удалить"
                        >
                            <span className="speech-manager-icon">🗑️</span>
                        </button>
                    </>
                )}
                <div className="speech-manager-spacer"/>
                <div className="speech-manager-search">
                    <input
                        type="search"
                        placeholder="Поиск..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="speech-manager-search-input"
                    />
                </div>
                <button
                    className="speech-manager-toolbar-btn"
                    onClick={handleClose}
                    title="Закрыть"
                >
                    <span className="speech-manager-icon">✕</span>
                </button>
            </div>

            <div className="speech-manager-content">
                <div className="speech-manager-tree">
                    {filteredNodes.length === 0 ? (
                        <div className="speech-manager-empty">
                            {searchQuery ? 'Ничего не найдено' : 'Нет фраз. Создайте первую фразу!'}
                        </div>
                    ) : (
                        filteredNodes.map(node => (
                            <div
                                key={node.id}
                                className={`speech-manager-tree-node ${selectedNode?.id === node.id ? 'selected' : ''}`}
                                style={{paddingLeft: `${node.indent * 16 + 8}px`}}
                                onClick={() => handleNodeClick(node)}
                            >
                                <span className="speech-manager-node-icon">
                                    {node.type === 'category' ? '📁' : '📄'}
                                </span>
                                <span className="speech-manager-node-name">{node.name || 'Без названия'}</span>
                            </div>
                        ))
                    )}
                </div>

                <div className="speech-manager-splitter"/>

                <div className="speech-manager-editor">
                    {speechPhrases.isCreatingPhrase && (
                        <div className="speech-manager-edit-panel">
                            <h3 className="speech-manager-edit-title">Новая фраза</h3>
                            <div className="speech-manager-field">
                                <label>Сокращение (необязательно)</label>
                                <input
                                    type="text"
                                    value={speechPhrases.newPhraseShortcut}
                                    onChange={(e) => speechPhrases.setNewPhraseShortcut(e.target.value)}
                                    placeholder="например: пр"
                                />
                            </div>
                            <div className="speech-manager-field">
                                <label>Название *</label>
                                <input
                                    type="text"
                                    value={speechPhrases.newPhraseName}
                                    onChange={(e) => speechPhrases.setNewPhraseName(e.target.value)}
                                    placeholder="Название фразы"
                                />
                            </div>
                            <div className="speech-manager-field">
                                <label>Текст для замены *</label>
                                <textarea
                                    value={speechPhrases.newPhraseText}
                                    onChange={(e) => speechPhrases.setNewPhraseText(e.target.value)}
                                    placeholder="Текст, который будет вставлен"
                                    rows={10}
                                />
                            </div>
                            <div className="speech-manager-field">
                                <label>Категория</label>
                                <select
                                    value={speechPhrases.newPhraseCategoryId || ''}
                                    onChange={(e) => speechPhrases.setNewPhraseCategoryId(e.target.value || null)}
                                >
                                    <option value="">Без категории</option>
                                    {speechPhrases.categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>
                                            {getCategoryPathString(cat.id, speechPhrases.categories)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="speech-manager-actions">
                                <button onClick={speechPhrases.savePhrase} className="speech-manager-btn primary">
                                    Сохранить
                                </button>
                                <button onClick={speechPhrases.cancelCreatePhrase} className="speech-manager-btn">
                                    Отмена
                                </button>
                            </div>
                        </div>
                    )}

                    {speechPhrases.isCreatingCategory && (
                        <div className="speech-manager-edit-panel">
                            <h3 className="speech-manager-edit-title">Новая категория</h3>
                            <div className="speech-manager-field">
                                <label>Название *</label>
                                <input
                                    type="text"
                                    value={speechPhrases.newCategoryName}
                                    onChange={(e) => speechPhrases.setNewCategoryName(e.target.value)}
                                    placeholder="Название категории"
                                />
                            </div>
                            <div className="speech-manager-field">
                                <label>Родительская категория</label>
                                <select
                                    value={speechPhrases.newCategoryParentId || ''}
                                    onChange={(e) => speechPhrases.setNewCategoryParentId(e.target.value || null)}
                                >
                                    <option value="">Корень</option>
                                    {speechPhrases.categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>
                                            {getCategoryPathString(cat.id, speechPhrases.categories)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="speech-manager-actions">
                                <button onClick={speechPhrases.saveCategory} className="speech-manager-btn primary">
                                    Сохранить
                                </button>
                                <button onClick={speechPhrases.cancelCreateCategory} className="speech-manager-btn">
                                    Отмена
                                </button>
                            </div>
                        </div>
                    )}

                    {speechPhrases.editingPhraseId && !speechPhrases.isCreatingPhrase && (
                        <div className="speech-manager-edit-panel">
                            <h3 className="speech-manager-edit-title">Редактирование фразы</h3>
                            <div className="speech-manager-field">
                                <label>Сокращение (необязательно)</label>
                                <input
                                    type="text"
                                    value={speechPhrases.editPhraseShortcut}
                                    onChange={(e) => speechPhrases.setEditPhraseShortcut(e.target.value)}
                                    placeholder="например: пр"
                                />
                            </div>
                            <div className="speech-manager-field">
                                <label>Название *</label>
                                <input
                                    type="text"
                                    value={speechPhrases.editPhraseName}
                                    onChange={(e) => speechPhrases.setEditPhraseName(e.target.value)}
                                    placeholder="Название фразы"
                                />
                            </div>
                            <div className="speech-manager-field">
                                <label>Текст для замены *</label>
                                <textarea
                                    value={speechPhrases.editPhraseText}
                                    onChange={(e) => speechPhrases.setEditPhraseText(e.target.value)}
                                    placeholder="Текст, который будет вставлен"
                                    rows={10}
                                />
                            </div>
                            <div className="speech-manager-field">
                                <label>Категория</label>
                                <select
                                    value={speechPhrases.editPhraseCategoryId || ''}
                                    onChange={(e) => speechPhrases.setEditPhraseCategoryId(e.target.value || null)}
                                >
                                    <option value="">Без категории</option>
                                    {speechPhrases.categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>
                                            {getCategoryPathString(cat.id, speechPhrases.categories)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="speech-manager-actions">
                                <button onClick={speechPhrases.updatePhrase} className="speech-manager-btn primary">
                                    Сохранить
                                </button>
                                <button onClick={speechPhrases.cancelEditPhrase} className="speech-manager-btn">
                                    Отмена
                                </button>
                            </div>
                        </div>
                    )}

                    {speechPhrases.editingCategoryId && !speechPhrases.isCreatingCategory && (
                        <div className="speech-manager-edit-panel">
                            <h3 className="speech-manager-edit-title">Редактирование категории</h3>
                            <div className="speech-manager-field">
                                <label>Название *</label>
                                <input
                                    type="text"
                                    value={speechPhrases.editCategoryName}
                                    onChange={(e) => speechPhrases.setEditCategoryName(e.target.value)}
                                    placeholder="Название категории"
                                />
                            </div>
                            <div className="speech-manager-field">
                                <label>Родительская категория</label>
                                <select
                                    value={speechPhrases.editingCategoryParentId || ''}
                                    onChange={(e) => speechPhrases.setEditingCategoryParentId(e.target.value || null)}
                                >
                                    <option value="">Корень</option>
                                    {speechPhrases.categories
                                        .filter(c => c.id !== speechPhrases.editingCategoryId)
                                        .map(cat => (
                                            <option key={cat.id} value={cat.id}>
                                                {getCategoryPathString(cat.id, speechPhrases.categories)}
                                            </option>
                                        ))}
                                </select>
                            </div>
                            <div className="speech-manager-actions">
                                <button onClick={speechPhrases.updateCategory} className="speech-manager-btn primary">
                                    Сохранить
                                </button>
                                <button onClick={speechPhrases.cancelEditCategory} className="speech-manager-btn">
                                    Отмена
                                </button>
                            </div>
                        </div>
                    )}

                    {!speechPhrases.isCreatingPhrase && !speechPhrases.isCreatingCategory &&
                        !speechPhrases.editingPhraseId && !speechPhrases.editingCategoryId && (
                            <div className="speech-manager-intro">
                                <h3>📝 Редактор речевых модулей</h3>
                                <p>Выберите фразу или категорию слева для редактирования, или создайте новую с помощью
                                    кнопок на панели инструментов.</p>
                                <div className="speech-manager-usage">
                                    <h4>Как использовать:</h4>
                                    <ul>
                                        <li><strong>Через сокращение:</strong> Введите сокращение
                                            (например: <code>пр</code>) и текст заменится автоматически
                                        </li>
                                        <li><strong>Через контекстное меню:</strong> Нажмите правую кнопку мыши и
                                            выберите фразу из меню "РМы"
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        )}
                </div>
            </div>
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('__root')!);
root.render(<SpeechPhrasesManager/>);
