import {processingGroups} from '../../constants/processing-groups';
import type {SelectOption} from '../../types';
import type {SelectedOptionsSummaryProps} from '../SelectedOptionsSummary';

interface ProcessingStepProps {
    selectedProcessing: SelectOption | null;
    processingSearchQuery: string;
    onProcessingSearchChange: (query: string) => void;
    onSelectProcessing: (processing: SelectOption) => void;
    onBack: () => void;
    onNext: () => void;
}

export default function ProcessingStep({
                                           selectedProcessing,
                                           processingSearchQuery,
                                           onProcessingSearchChange,
                                           onSelectProcessing,
                                           onBack,
                                           onNext,
                                       }: ProcessingStepProps) {
    return (
        <>
            <div style={{marginBottom: '1rem'}}>
                <label style={{display: 'block', fontWeight: 500, marginBottom: '0.5rem'}}>
                    Шаг 2: Выберите обработку
                </label>
                <input
                    type="text"
                    placeholder="Поиск по обработке..."
                    value={processingSearchQuery}
                    onChange={(e) => onProcessingSearchChange(e.target.value)}
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
                <div style={{display: 'grid', gap: '0.5rem', maxHeight: '300px', overflow: 'auto'}}>
                    {processingGroups
                        .filter((group) => group.label.toLowerCase().includes(processingSearchQuery.toLowerCase()))
                        .map((group) => (
                            <button
                                key={group.value}
                                className="btn btn-secondary"
                                style={{
                                    width: '100%',
                                    justifyContent: 'flex-start',
                                    textAlign: 'left',
                                    border: selectedProcessing?.value === group.value ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                                }}
                                onClick={() => onSelectProcessing({value: group.value, label: group.label})}
                            >
                                {group.label}
                            </button>
                        ))}
                </div>
            </div>
            <div style={{display: 'flex', gap: '0.5rem'}}>
                <button className="btn btn-secondary btn-sm" onClick={onBack}>
                    ← Назад
                </button>
                <button className="btn btn-primary btn-sm" onClick={onNext} style={{flex: 1}}>
                    Далее →
                </button>
            </div>
        </>
    );
}
