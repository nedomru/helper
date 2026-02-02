import type {ReactNode} from 'react';
import type {MacLookupResult} from '../types';

interface MacResultProps {
    result: MacLookupResult;
}

export function MacResult({result}: MacResultProps): ReactNode {
    const isError = !!result.error;

    return (
        <div
            className={`px-4 py-3 rounded-lg border ${
                isError ? 'bg-red-50 border-red-200 text-red-800' : 'bg-green-50 border-green-200 text-green-800'
            }`}
        >
            {isError ? (
                <div className="flex items-center gap-2">
                    <span className="text-sm">❌</span>
                    <span className="text-sm font-medium">{result.error}</span>
                </div>
            ) : (
                <div className="flex items-center gap-2">
                    <span className="text-sm">✓</span>
                    <div className="text-sm">
                        <span className="font-medium">Производитель:</span> <span>{result.company}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
