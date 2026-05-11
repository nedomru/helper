import type {ReactNode} from 'react';
import {
    CHANGELOG,
    type ChangelogEntry,
    sortChanges,
    TYPE_COLORS,
    TYPE_LABELS,
} from '../data/changelog';

interface WhatsNewTabProps {
    lastSeenVersion: string | null;
}

export function WhatsNewTab({lastSeenVersion}: WhatsNewTabProps): ReactNode {
    if (CHANGELOG.length === 0) {
        return (
            <div className="text-sm text-gray-500 text-center py-12">
                История обновлений пока пуста.
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            {CHANGELOG.map((entry) => (
                <EntryCard
                    key={entry.version}
                    entry={entry}
                    isNew={lastSeenVersion !== null && entry.version > lastSeenVersion}
                />
            ))}
        </div>
    );
}

function EntryCard({entry, isNew}: {entry: ChangelogEntry; isNew: boolean}): ReactNode {
    return (
        <div className="rounded-lg border border-gray-200 bg-white p-3">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">v{entry.version}</span>
                    {isNew && (
                        <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-semibold">
                            новое
                        </span>
                    )}
                </div>
                <span className="text-xs text-gray-500">{entry.date}</span>
            </div>
            <ul className="flex flex-col gap-1.5">
                {sortChanges(entry.changes).map((change, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                        <span
                            className={`flex-shrink-0 text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded border font-semibold ${TYPE_COLORS[change.type]}`}
                        >
                            {TYPE_LABELS[change.type]}
                        </span>
                        <span className="text-gray-700 leading-snug">{change.text}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
