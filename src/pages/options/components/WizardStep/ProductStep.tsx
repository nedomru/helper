import {products} from '../../constants/products';

interface ProductStepProps {
    selectedProduct: number | null;
    onSelectProduct: (productId: number) => void;
}

export default function ProductStep({selectedProduct, onSelectProduct}: ProductStepProps) {
    return (
        <>
            <div style={{marginBottom: '1rem'}}>
                <label style={{display: 'block', fontWeight: 500, marginBottom: '0.5rem'}}>
                    Шаг 1: Выберите продукт
                </label>
                <div style={{display: 'grid', gap: '0.5rem'}}>
                    <button
                        className="btn btn-secondary"
                        style={{
                            width: '100%',
                            justifyContent: 'flex-start',
                            border: selectedProduct === 69 ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                        }}
                        onClick={() => onSelectProduct(69)}
                    >
                        Без продукта
                    </button>
                    {products.map((product) => (
                        <button
                            key={product.id}
                            className="btn btn-secondary"
                            style={{
                                width: '100%',
                                justifyContent: 'flex-start',
                                border: selectedProduct === product.id ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                            }}
                            onClick={() => onSelectProduct(product.id)}
                        >
                            {product.name}
                        </button>
                    ))}
                </div>
            </div>
        </>
    );
}
