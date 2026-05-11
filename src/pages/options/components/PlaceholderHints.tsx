import {SUPPORTED_PLACEHOLDERS} from '@src/shared/placeholders';

interface PlaceholderHintsProps {
    onInsert: (placeholder: string) => void;
}

export function PlaceholderHints({onInsert}: PlaceholderHintsProps) {
    return (
        <div className="placeholder-hints">
            <span className="placeholder-hints-label">Плейсхолдеры:</span>
            <div className="placeholder-hints-chips">
                {SUPPORTED_PLACEHOLDERS.map((p) => (
                    <button
                        type="button"
                        key={p.key}
                        className="placeholder-hint-chip"
                        title={p.description}
                        onClick={() => onInsert(`{${p.key}}`)}
                    >
                        {`{${p.key}}`}
                    </button>
                ))}
            </div>
        </div>
    );
}
