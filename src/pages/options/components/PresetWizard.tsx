import type {SelectOption, WizardStep} from '../types';
import {products} from '../constants/products';
import SelectedOptionsSummary from './SelectedOptionsSummary';
import ProductStep from './WizardStep/ProductStep';
import ProcessingStep from './WizardStep/ProcessingStep';

interface PresetWizardProps {
    open: boolean;
    step: WizardStep;
    editingId: string | null;
    selectedProduct: number | null;
    selectedProcessing: SelectOption | null;
    selectedCategory: SelectOption | null;
    selectedSubcategory: SelectOption | null;
    selectedChildReason: SelectOption | null;
    subcategories: SelectOption[];
    childReasons: SelectOption[];
    presetName: string;
    selectedPresetCategory: string | null;
    newCategoryName: string;
    presetComment: string;
    appealsCategories: SelectOption[];
    isLoadingCategories: boolean;
    isLoadingSubcategories: boolean;
    isLoadingChildReasons: boolean;
    processingSearchQuery: string;
    categorySearchQuery: string;
    subcategorySearchQuery: string;
    childReasonSearchQuery: string;
    presetCategories: any[];
    onSelectProduct: (productId: number) => void;
    onSelectProcessing: (processing: SelectOption) => Promise<void>;
    onSelectCategory: (category: SelectOption) => Promise<void>;
    onSelectSubcategory: (subcategory: SelectOption) => Promise<void>;
    onSelectChildReason: (childReason: SelectOption) => void;
    setStep: (step: WizardStep) => void;
    setPresetName: (name: string) => void;
    setSelectedPresetCategory: (categoryId: string | null) => void;
    setNewCategoryName: (name: string) => void;
    setPresetComment: (comment: string) => void;
    setProcessingSearchQuery: (query: string) => void;
    setCategorySearchQuery: (query: string) => void;
    setSubcategorySearchQuery: (query: string) => void;
    setChildReasonSearchQuery: (query: string) => void;
    onClose: () => void;
    onSave: () => void;
    onCreateCategory: () => void;
}

export default function PresetWizard({
                                         open,
                                         step,
                                         editingId,
                                         selectedProduct,
                                         selectedProcessing,
                                         selectedCategory,
                                         selectedSubcategory,
                                         selectedChildReason,
                                         subcategories,
                                         childReasons,
                                         presetName,
                                         selectedPresetCategory,
                                         newCategoryName,
                                         presetComment,
                                         appealsCategories,
                                         isLoadingCategories,
                                         isLoadingSubcategories,
                                         isLoadingChildReasons,
                                         processingSearchQuery,
                                         categorySearchQuery,
                                         subcategorySearchQuery,
                                         childReasonSearchQuery,
                                         presetCategories,
                                         onSelectProduct,
                                         onSelectProcessing,
                                         onSelectCategory,
                                         onSelectSubcategory,
                                         onSelectChildReason,
                                         setStep,
                                         setPresetName,
                                         setSelectedPresetCategory,
                                         setNewCategoryName,
                                         setPresetComment,
                                         setProcessingSearchQuery,
                                         setCategorySearchQuery,
                                         setSubcategorySearchQuery,
                                         setChildReasonSearchQuery,
                                         onClose,
                                         onSave,
                                         onCreateCategory,
                                     }: PresetWizardProps) {
    if (!open) return null;

    const steps: WizardStep[] = ['product', 'processing', 'category', 'subcategory', 'childreason', 'comment', 'name'];
    const stepLabels = ['Продукт', 'Обработка', 'Категория', 'Подкатегория', 'Причина-ребёнок', 'Комментарий', 'Название'];

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: '1rem',
            }}
        >
            <div
                style={{
                    backgroundColor: 'var(--card-bg)',
                    borderRadius: '0.75rem',
                    padding: '1.5rem',
                    maxWidth: '500px',
                    width: '100%',
                    maxHeight: '80vh',
                    overflow: 'auto',
                    boxShadow: 'var(--shadow-lg)',
                }}
            >
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1rem'
                }}>
                    <h3 style={{margin: 0, fontSize: '1.125rem', fontWeight: 600}}>
                        {editingId ? 'Редактирование пресета' : 'Создание быстрого обращения'}
                    </h3>
                    <button className="btn btn-secondary btn-sm" onClick={onClose} style={{padding: '0.25rem 0.5rem'}}>
                        ✕
                    </button>
                </div>

                <div style={{display: 'flex', gap: '0.25rem', marginBottom: '1.5rem'}}>
                    {steps.map((s, index) => {
                        const isCurrentStep = step === s;
                        const isPastStep = steps.indexOf(step) > index;
                        return (
                            <div
                                key={s}
                                style={{
                                    flex: 1,
                                    height: '4px',
                                    backgroundColor: isCurrentStep ? 'var(--primary)' : isPastStep ? 'var(--positive)' : 'var(--muted)',
                                    borderRadius: '2px',
                                }}
                                title={stepLabels[index]}
                            />
                        );
                    })}
                </div>

                {step === 'product' &&
                    <ProductStep selectedProduct={selectedProduct} onSelectProduct={onSelectProduct}/>}

                {step === 'processing' && (
                    <ProcessingStep
                        selectedProcessing={selectedProcessing}
                        processingSearchQuery={processingSearchQuery}
                        onProcessingSearchChange={setProcessingSearchQuery}
                        onSelectProcessing={onSelectProcessing}
                        onBack={() => setStep('product')}
                        onNext={() => setStep('category')}
                    />
                )}

                {step === 'category' && (
                    <>
                        <SelectedOptionsSummary
                            selectedProduct={selectedProduct}
                            selectedProcessing={selectedProcessing}
                            selectedCategory={selectedCategory}
                            selectedSubcategory={selectedSubcategory}
                            selectedChildReason={selectedChildReason}
                        />
                        <div style={{marginBottom: '1rem'}}>
                            <label style={{display: 'block', fontWeight: 500, marginBottom: '0.5rem'}}>
                                Шаг 3: Выберите категорию обращения
                            </label>
                            {!isLoadingCategories && appealsCategories.length > 0 && (
                                <input
                                    type="text"
                                    placeholder="Поиск по категории..."
                                    value={categorySearchQuery}
                                    onChange={(e) => setCategorySearchQuery(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '0.5rem',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '0.375rem',
                                        backgroundColor: 'var(--card-bg)',
                                        color: 'var(--text-primary)',
                                        fontSize: '0.875rem',
                                        marginBottom: '0.75rem',
                                    }}
                                />
                            )}
                            {isLoadingCategories ? (
                                <div style={{display: 'flex', justifyContent: 'center', padding: '1rem'}}>
                                    <div className="spinner"/>
                                </div>
                            ) : (
                                <div style={{display: 'grid', gap: '0.5rem', maxHeight: '300px', overflow: 'auto'}}>
                                    {appealsCategories
                                        .filter((cat) => cat.label.toLowerCase().includes(categorySearchQuery.toLowerCase()))
                                        .map((category) => (
                                            <button
                                                key={category.value}
                                                className="btn btn-secondary"
                                                style={{
                                                    width: '100%',
                                                    justifyContent: 'flex-start',
                                                    textAlign: 'left',
                                                }}
                                                onClick={() => onSelectCategory({
                                                    value: category.value,
                                                    label: category.label
                                                })}
                                            >
                                                {category.label}
                                            </button>
                                        ))}
                                </div>
                            )}
                        </div>
                        <div style={{display: 'flex', gap: '0.5rem'}}>
                            <button className="btn btn-secondary btn-sm" onClick={() => setStep('processing')}>
                                ← Назад
                            </button>
                            <button
                                className="btn btn-primary btn-sm"
                                onClick={() => {
                                    if (subcategories.length > 0) {
                                        setStep('subcategory');
                                    } else {
                                        setStep('comment');
                                    }
                                }}
                                style={{flex: 1}}
                            >
                                Далее →
                            </button>
                        </div>
                    </>
                )}

                {step === 'subcategory' && (
                    <>
                        <SelectedOptionsSummary
                            selectedProduct={selectedProduct}
                            selectedProcessing={selectedProcessing}
                            selectedCategory={selectedCategory}
                            selectedSubcategory={selectedSubcategory}
                            selectedChildReason={selectedChildReason}
                        />
                        <div style={{marginBottom: '1rem'}}>
                            <label style={{display: 'block', fontWeight: 500, marginBottom: '0.5rem'}}>
                                {subcategories.length > 0 ? 'Шаг 4: Выберите подкатегорию' : 'Шаг 4: Подкатегории'}
                            </label>
                            {!isLoadingSubcategories && subcategories.length > 0 && (
                                <input
                                    type="text"
                                    placeholder="Поиск по подкатегории..."
                                    value={subcategorySearchQuery}
                                    onChange={(e) => setSubcategorySearchQuery(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '0.5rem',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '0.375rem',
                                        backgroundColor: 'var(--card-bg)',
                                        color: 'var(--text-primary)',
                                        fontSize: '0.875rem',
                                        marginBottom: '0.75rem',
                                    }}
                                />
                            )}
                            {isLoadingSubcategories ? (
                                <div style={{display: 'flex', justifyContent: 'center', padding: '1rem'}}>
                                    <div className="spinner"/>
                                </div>
                            ) : subcategories.length > 0 ? (
                                <div style={{display: 'grid', gap: '0.5rem', maxHeight: '300px', overflow: 'auto'}}>
                                    {subcategories
                                        .filter((sub) => sub.label.toLowerCase().includes(subcategorySearchQuery.toLowerCase()))
                                        .map((subcategory) => (
                                            <button
                                                key={subcategory.value}
                                                className="btn btn-secondary"
                                                style={{
                                                    width: '100%',
                                                    justifyContent: 'flex-start',
                                                    textAlign: 'left',
                                                }}
                                                onClick={() => onSelectSubcategory(subcategory)}
                                            >
                                                {subcategory.label}
                                            </button>
                                        ))}
                                </div>
                            ) : (
                                <div style={{padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)'}}>
                                    Для выбранной категории нет подкатегорий
                                </div>
                            )}
                        </div>
                        <div style={{display: 'flex', gap: '0.5rem'}}>
                            <button className="btn btn-secondary btn-sm" onClick={() => setStep('category')}>
                                ← Назад
                            </button>
                            <button
                                className="btn btn-primary btn-sm"
                                onClick={() => {
                                    if (childReasons.length > 0) {
                                        setStep('childreason');
                                    } else {
                                        setStep('comment');
                                    }
                                }}
                                style={{flex: 1}}
                            >
                                Далее →
                            </button>
                        </div>
                    </>
                )}

                {step === 'childreason' && (
                    <>
                        <SelectedOptionsSummary
                            selectedProduct={selectedProduct}
                            selectedProcessing={selectedProcessing}
                            selectedCategory={selectedCategory}
                            selectedSubcategory={selectedSubcategory}
                            selectedChildReason={selectedChildReason}
                        />
                        <div style={{marginBottom: '1rem'}}>
                            <label style={{display: 'block', fontWeight: 500, marginBottom: '0.5rem'}}>
                                {childReasons.length > 0 ? 'Шаг 5: Выберите причину-ребёнка' : 'Шаг 5: Причины-дети'}
                            </label>
                            {!isLoadingChildReasons && childReasons.length > 0 && (
                                <input
                                    type="text"
                                    placeholder="Поиск по причине-ребёнку..."
                                    value={childReasonSearchQuery}
                                    onChange={(e) => setChildReasonSearchQuery(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '0.5rem',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '0.375rem',
                                        backgroundColor: 'var(--card-bg)',
                                        color: 'var(--text-primary)',
                                        fontSize: '0.875rem',
                                        marginBottom: '0.75rem',
                                    }}
                                />
                            )}
                            {isLoadingChildReasons ? (
                                <div style={{display: 'flex', justifyContent: 'center', padding: '1rem'}}>
                                    <div className="spinner"/>
                                </div>
                            ) : childReasons.length > 0 ? (
                                <div style={{display: 'grid', gap: '0.5rem', maxHeight: '300px', overflow: 'auto'}}>
                                    {childReasons
                                        .filter((cr) => cr.label.toLowerCase().includes(childReasonSearchQuery.toLowerCase()))
                                        .map((childReason) => (
                                            <button
                                                key={childReason.value}
                                                className="btn btn-secondary"
                                                style={{
                                                    width: '100%',
                                                    justifyContent: 'flex-start',
                                                    textAlign: 'left',
                                                }}
                                                onClick={() => onSelectChildReason(childReason)}
                                            >
                                                {childReason.label}
                                            </button>
                                        ))}
                                </div>
                            ) : (
                                <div style={{padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)'}}>
                                    Для выбранной подкатегории нет причин-детей
                                </div>
                            )}
                        </div>
                        <div style={{display: 'flex', gap: '0.5rem'}}>
                            <button className="btn btn-secondary btn-sm" onClick={() => setStep('subcategory')}>
                                ← Назад
                            </button>
                            <button className="btn btn-primary btn-sm" onClick={() => setStep('comment')}
                                    style={{flex: 1}}>
                                Далее →
                            </button>
                        </div>
                    </>
                )}

                {step === 'comment' && (
                    <>
                        <SelectedOptionsSummary
                            selectedProduct={selectedProduct}
                            selectedProcessing={selectedProcessing}
                            selectedCategory={selectedCategory}
                            selectedSubcategory={selectedSubcategory}
                            selectedChildReason={selectedChildReason}
                        />
                        <div style={{marginBottom: '1rem'}}>
                            <label style={{display: 'block', fontWeight: 500, marginBottom: '0.5rem'}}>
                                Шаг 6: Комментарий (необязательно)
                            </label>
                            <textarea
                                value={presetComment}
                                onChange={(e) => setPresetComment(e.target.value)}
                                placeholder="Введите текст комментария, который будет автоматически вставлен в поле обращения при использовании этого пресета..."
                                style={{
                                    width: '100%',
                                    minHeight: '100px',
                                    padding: '0.5rem',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '0.375rem',
                                    backgroundColor: 'var(--card-bg)',
                                    color: 'var(--text-primary)',
                                    fontSize: '0.875rem',
                                    fontFamily: 'inherit',
                                    resize: 'vertical',
                                }}
                            />
                            <div style={{fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem'}}>
                                Этот комментарий будет автоматически вставлен в поле &quot;текст&quot; при выполнении
                                пресета.
                                Оставьте пустым, если комментарий не нужен.
                            </div>
                        </div>
                        <div style={{display: 'flex', gap: '0.5rem'}}>
                            <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => {
                                    if (selectedChildReason) {
                                        setStep('childreason');
                                    } else if (selectedSubcategory) {
                                        setStep('subcategory');
                                    } else {
                                        setStep('category');
                                    }
                                }}
                            >
                                ← Назад
                            </button>
                            <button className="btn btn-primary btn-sm" onClick={() => setStep('name')}
                                    style={{flex: 1}}>
                                Далее →
                            </button>
                        </div>
                    </>
                )}

                {step === 'name' && (
                    <>
                        <div
                            style={{
                                padding: '1rem',
                                backgroundColor: 'var(--muted)',
                                borderRadius: '0.5rem',
                                marginBottom: '1rem',
                            }}
                        >
                            <div
                                style={{
                                    fontWeight: 600,
                                    marginBottom: '0.75rem',
                                    color: 'var(--text-secondary)',
                                    fontSize: '0.75rem',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                }}
                            >
                                Итоговый обзор:
                            </div>
                            <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                                {selectedProduct && (
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        fontSize: '0.875rem'
                                    }}>
                                        <span style={{color: 'var(--text-secondary)'}}>Продукт:</span>
                                        <span style={{fontWeight: 500}}>
                                            {products.find((p) => p.id === selectedProduct)?.name}
                                        </span>
                                    </div>
                                )}
                                {selectedProcessing && (
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        fontSize: '0.875rem'
                                    }}>
                                        <span style={{color: 'var(--text-secondary)'}}>Обработка:</span>
                                        <span style={{fontWeight: 500}}>{selectedProcessing.label}</span>
                                    </div>
                                )}
                                {selectedCategory && (
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        fontSize: '0.875rem'
                                    }}>
                                        <span style={{color: 'var(--text-secondary)'}}>Категория:</span>
                                        <span style={{fontWeight: 500}}>{selectedCategory.label}</span>
                                    </div>
                                )}
                                {selectedSubcategory && (
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        fontSize: '0.875rem'
                                    }}>
                                        <span style={{color: 'var(--text-secondary)'}}>Подкатегория:</span>
                                        <span style={{fontWeight: 500}}>{selectedSubcategory.label}</span>
                                    </div>
                                )}
                                {selectedChildReason && (
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        fontSize: '0.875rem'
                                    }}>
                                        <span style={{color: 'var(--text-secondary)'}}>Причина-ребёнок:</span>
                                        <span style={{fontWeight: 500}}>{selectedChildReason.label}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div style={{marginBottom: '1rem'}}>
                            <label style={{display: 'block', fontWeight: 500, marginBottom: '0.5rem'}}>
                                Шаг 7: Название пресета
                            </label>
                            <input
                                type="text"
                                value={presetName}
                                onChange={(e) => setPresetName(e.target.value)}
                                placeholder="Например: Нет интернета - Претензии"
                                style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '0.375rem',
                                    backgroundColor: 'var(--card-bg)',
                                    color: 'var(--text-primary)',
                                    fontSize: '0.875rem',
                                    marginBottom: '1rem',
                                }}
                                autoFocus
                            />
                        </div>

                        <div style={{marginBottom: '1rem'}}>
                            <label style={{display: 'block', fontWeight: 500, marginBottom: '0.5rem'}}>
                                Категория для пресета
                            </label>
                            <div style={{display: 'grid', gap: '0.5rem', marginBottom: '0.75rem'}}>
                                {presetCategories.map((cat) => (
                                    <button
                                        key={cat.id}
                                        className="btn btn-secondary"
                                        style={{
                                            width: '100%',
                                            justifyContent: 'flex-start',
                                            textAlign: 'left',
                                            border: selectedPresetCategory === cat.id ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                                        }}
                                        onClick={() => setSelectedPresetCategory(cat.id)}
                                    >
                                        {cat.name}
                                    </button>
                                ))}
                            </div>
                            <div style={{display: 'flex', gap: '0.5rem'}}>
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
                                <button className="btn btn-secondary btn-sm" onClick={onCreateCategory}
                                        disabled={!newCategoryName.trim()}>
                                    ➕
                                </button>
                            </div>
                        </div>

                        <div style={{display: 'flex', gap: '0.5rem'}}>
                            <button className="btn btn-secondary btn-sm" onClick={() => setStep('comment')}>
                                ← Назад
                            </button>
                            <button className="btn btn-primary btn-sm" onClick={onSave} style={{flex: 1}}
                                    disabled={!presetName.trim()}>
                                Сохранить
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
