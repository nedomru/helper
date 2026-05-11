import {type ReactNode, useCallback, useEffect, useMemo, useState} from 'react';
import {
    CLIPBOARD_TYPE_LABELS,
    type ClipboardEntry,
    type ClipboardEntryType,
    clearClipboardHistory,
    getClipboardHistory,
    pushClipboardEntry,
    removeClipboardEntry,
} from '@src/shared/clipboard-history';

const TYPE_FILTERS: (ClipboardEntryType | 'all')[] = ['all', 'ip', 'mac', 'agreement', 'phone', 'email', 'text'];

const TYPE_COLORS: Record<ClipboardEntryType, string> = {
    ip: 'bg-sky-100 text-sky-700 border-sky-200',
    mac: 'bg-violet-100 text-violet-700 border-violet-200',
    agreement: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    phone: 'bg-amber-100 text-amber-700 border-amber-200',
    email: 'bg-pink-100 text-pink-700 border-pink-200',
    text: 'bg-gray-100 text-gray-700 border-gray-200',
};

function formatRelativeTime(timestamp: number): string {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'только что';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} мин назад`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} ч назад`;
    return `${Math.floor(seconds / 86400)} дн назад`;
}

export function ClipboardTab(): ReactNode {
    const [history, setHistory] = useState<ClipboardEntry[]>([]);
    const [filter, setFilter] = useState<ClipboardEntryType | 'all'>('all');
    const [query, setQuery] = useState('');
    const [copiedValue, setCopiedValue] = useState<string | null>(null);

    const reload = useCallback(async () => {
        const data = await getClipboardHistory();
        setHistory(data);
    }, []);

    useEffect(() => {
        void reload();
        const onChange = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
            if (area === 'local' && changes.helper_clipboard_history) {
                void reload();
            }
        };
        chrome.storage.onChanged.addListener(onChange);
        return () => chrome.storage.onChanged.removeListener(onChange);
    }, [reload]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return history.filter((entry) => {
            if (filter !== 'all' && entry.type !== filter) return false;
            if (q && !entry.value.toLowerCase().includes(q)) return false;
            return true;
        });
    }, [history, filter, query]);

    const copyAgain = async (value: string) => {
        try {
            await navigator.clipboard.writeText(value);
            await pushClipboardEntry(value);
            setCopiedValue(value);
            setTimeout(() => setCopiedValue(null), 1200);
        } catch (err) {
            console.error('[Helper] Copy failed:', err);
        }
    };

    const remove = async (value: string) => {
        await removeClipboardEntry(value);
        await reload();
    };

    const handleClear = async () => {
        if (!confirm('Очистить всю историю буфера обмена?')) return;
        await clearClipboardHistory();
        await reload();
    };

    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Поиск..."
                    className="flex-1 min-w-[140px] px-3 py-1.5 text-sm rounded-lg border border-gray-300 focus:outline-none focus:border-blue-400"
                />
                <button
                    type="button"
                    onClick={handleClear}
                    disabled={history.length === 0}
                    className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-red-50 hover:border-red-300 hover:text-red-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    Очистить
                </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
                {TYPE_FILTERS.map((t) => {
                    const count = t === 'all' ? history.length : history.filter((e) => e.type === t).length;
                    const isActive = filter === t;
                    return (
                        <button
                            key={t}
                            type="button"
                            onClick={() => setFilter(t)}
                            className={`text-xs px-2.5 py-1 rounded-full border ${
                                isActive
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                            }`}
                        >
                            {t === 'all' ? 'Все' : CLIPBOARD_TYPE_LABELS[t]}
                            <span className={`ml-1 ${isActive ? 'opacity-80' : 'text-gray-400'}`}>{count}</span>
                        </button>
                    );
                })}
            </div>

            {filtered.length === 0 ? (
                <div className="text-sm text-gray-500 text-center py-8">
                    {history.length === 0
                        ? 'История пуста. Скопируйте что-нибудь в АРМ или Genesys — оно появится здесь.'
                        : 'Ничего не найдено по фильтру.'}
                </div>
            ) : (
                <ul className="flex flex-col gap-1.5">
                    {filtered.map((entry) => (
                        <li
                            key={entry.value + entry.copiedAt}
                            className="group flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/40"
                        >
                            <span
                                className={`flex-shrink-0 text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded border font-semibold ${TYPE_COLORS[entry.type]}`}
                            >
                                {CLIPBOARD_TYPE_LABELS[entry.type]}
                            </span>
                            <button
                                type="button"
                                onClick={() => copyAgain(entry.value)}
                                className="flex-1 min-w-0 text-left text-sm font-mono truncate text-gray-900 hover:text-blue-700"
                                title={entry.value}
                            >
                                {entry.value}
                            </button>
                            <span className="text-[10px] text-gray-400 whitespace-nowrap">
                                {copiedValue === entry.value ? '✓ скопировано' : formatRelativeTime(entry.copiedAt)}
                            </span>
                            <button
                                type="button"
                                onClick={() => remove(entry.value)}
                                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 text-sm"
                                title="Удалить из истории"
                            >
                                ✕
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
