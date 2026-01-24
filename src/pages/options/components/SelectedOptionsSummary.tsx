import type {SelectOption} from '../types';
import {products} from '../constants/products';

interface SelectedOptionsSummaryProps {
    selectedProduct: number | null;
    selectedProcessing: SelectOption | null;
    selectedCategory: SelectOption | null;
    selectedSubcategory: SelectOption | null;
    selectedChildReason: SelectOption | null;
}

export default function SelectedOptionsSummary({
                                                   selectedProduct,
                                                   selectedProcessing,
                                                   selectedCategory,
                                                   selectedSubcategory,
                                                   selectedChildReason,
                                               }: SelectedOptionsSummaryProps) {
    const options: Array<{ label: string; value: string }> = [];

    if (selectedProduct !== null) {
        if (selectedProduct === 69) {
            options.push({label: 'Продукт', value: 'Без продукта'});
        } else {
            const product = products.find((p) => p.id === selectedProduct);
            if (product) options.push({label: 'Продукт', value: product.name});
        }
    }

    if (selectedProcessing) {
        options.push({label: 'Обработка', value: selectedProcessing.label});
    }

    if (selectedCategory) {
        options.push({label: 'Категория', value: selectedCategory.label});
    }

    if (selectedSubcategory) {
        options.push({label: 'Подкатегория', value: selectedSubcategory.label});
    }

    if (selectedChildReason) {
        options.push({label: 'Причина-ребёнок', value: selectedChildReason.label});
    }

    if (options.length === 0) return null;

    return (
        <div
            style={{
                padding: '0.75rem',
                backgroundColor: 'var(--muted)',
                borderRadius: '0.5rem',
                marginBottom: '1rem',
                fontSize: '0.875rem',
            }}
        >
            <div
                style={{
                    fontWeight: 600,
                    marginBottom: '0.5rem',
                    color: 'var(--text-secondary)',
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                }}
            >
                Выбрано:
            </div>
            {options.map((opt, idx) => (
                <div
                    key={idx}
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '0.25rem 0',
                        borderBottom: idx < options.length - 1 ? '1px solid var(--border-color)' : 'none',
                    }}
                >
                    <span style={{color: 'var(--text-secondary)'}}>{opt.label}:</span>
                    <span style={{fontWeight: 500}}>{opt.value}</span>
                </div>
            ))}
        </div>
    );
}
