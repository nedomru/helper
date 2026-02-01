import {useEffect, useRef, useState} from 'react';
import type {QuickAppealsPreset} from '@src/shared/user-settings';
import {products} from '../constants/products';

interface PresetCardProps {
    preset: QuickAppealsPreset;
    onEdit: () => void;
    onDuplicate: () => void;
    onCopy: () => void;
    onDelete: () => void;
}

export default function PresetCard({preset, onEdit, onDuplicate, onCopy, onDelete}: PresetCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);
    const [contentHeight, setContentHeight] = useState(0);

    const product = products.find((p) => p.id === preset.product);
    const hasComment = preset.comment && preset.comment.trim().length > 0;

    useEffect(() => {
        if (contentRef.current) {
            setContentHeight(contentRef.current.scrollHeight);
        }
    }, [isExpanded]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsExpanded(!isExpanded);
        }
    };

    const getProductBadgeColor = () => {
        switch (preset.product) {
            case 70:
                return 'rgba(8, 145, 178, 0.15)';
            case 101:
                return 'rgba(168, 85, 247, 0.15)';
            case 71:
                return 'rgba(34, 197, 94, 0.15)';
            case 1451:
                return 'rgba(251, 146, 60, 0.15)';
            case 72:
                return 'rgba(59, 130, 246, 0.15)';
            default:
                return 'var(--muted)';
        }
    };

    const getProductTextColor = () => {
        switch (preset.product) {
            case 70:
                return '#0891b2';
            case 101:
                return '#a855f7';
            case 71:
                return '#22c55e';
            case 1451:
                return '#fb923c';
            case 72:
                return '#3b82f6';
            default:
                return 'var(--text-secondary)';
        }
    };

    return (
        <div
            className="preset-card"
            data-expanded={isExpanded}
        >
            <div
                className="preset-card-header"
                onClick={() => setIsExpanded(!isExpanded)}
                onKeyDown={handleKeyDown}
                role="button"
                tabIndex={0}
                aria-expanded={isExpanded}
            >
                <div className="preset-card-main">
                    <div className="preset-card-title-row">
                        <div className="preset-card-title">{preset.name}</div>
                        <div
                            className="preset-product-badge"
                            style={{
                                backgroundColor: getProductBadgeColor(),
                                color: getProductTextColor(),
                            }}
                        >
                            {product?.name || 'Продукт'}
                        </div>
                    </div>
                    <div className="preset-card-summary">
                        <span className="preset-processing">{preset.processingLabel}</span>
                        {hasComment && (
                            <span className="preset-comment-indicator" title="Есть комментарий">
                                💬
                            </span>
                        )}
                    </div>
                </div>
                <div className="preset-card-actions">
                    <button
                        className="preset-action-btn preset-action-btn-edit"
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit();
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
                        className="preset-action-btn preset-action-btn-copy"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDuplicate();
                        }}
                        title="Дублировать"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                             strokeWidth="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                        </svg>
                    </button>
                    <button
                        className="preset-action-btn preset-action-btn-copy"
                        onClick={(e) => {
                            e.stopPropagation();
                            onCopy();
                        }}
                        title="Копировать в буфер"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                             strokeWidth="2">
                            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                            <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
                        </svg>
                    </button>
                    <button
                        className="preset-action-btn preset-action-btn-danger"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                        title="Удалить"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                             strokeWidth="2">
                            <path d="M3 6h18"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                    </button>
                    <button
                        className={`preset-expand-btn ${isExpanded ? 'expanded' : ''}`}
                        aria-label={isExpanded ? 'Свернуть' : 'Развернуть'}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                             strokeWidth="2">
                            <polyline points="6 9 12 15 18 9"/>
                        </svg>
                    </button>
                </div>
            </div>
            <div
                className="preset-card-content"
                style={{
                    maxHeight: isExpanded ? contentHeight : 0,
                }}
            >
                <div ref={contentRef} className="preset-card-content-inner">
                    <div className="preset-details-grid">
                        <div className="preset-detail-item">
                            <span className="preset-detail-label">Категория</span>
                            <span className="preset-detail-value">{preset.categoryLabel}</span>
                        </div>
                        {preset.subcategoryLabel && (
                            <div className="preset-detail-item">
                                <span className="preset-detail-label">Подкатегория</span>
                                <span className="preset-detail-value">{preset.subcategoryLabel}</span>
                            </div>
                        )}
                        {preset.childReasonLabel && (
                            <div className="preset-detail-item">
                                <span className="preset-detail-label">Причина</span>
                                <span className="preset-detail-value">{preset.childReasonLabel}</span>
                            </div>
                        )}
                    </div>
                    {hasComment && (
                        <div className="preset-comment-box">
                            <div className="preset-comment-label">Комментарий</div>
                            <div className="preset-comment-text">{preset.comment}</div>
                        </div>
                    )}
                    <div className="preset-meta">
                        <span className="preset-meta-label">ID: {preset.id}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
