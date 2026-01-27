export interface QuickTextPasteEntry {
    id: string;
    shortcut: string;
    text: string;
    label?: string;
}

export interface QuickTextPasteData {
    program: {
        testIni?: string;
        last_backup?: string;
        listcmd_count?: string;
        sort_col?: string;
        SortDescending?: string;
    };
    list_text: Record<string, string>;
    list_label: Record<string, string>;
}

export function isQuickTextPasteFormat(data: unknown): data is QuickTextPasteData {
    if (typeof data !== 'object' || data === null) return false;
    const obj = data as Record<string, unknown>;
    if (!('list_text' in obj) || typeof obj.list_text !== 'object') return false;

    const listText = obj.list_text as Record<string, unknown>;
    const entries = Object.keys(listText);

    return entries.length > 0 && entries.some(key =>
        key.startsWith('text_') &&
        typeof listText[key] === 'string' &&
        (listText[key] as string).includes('=')
    );
}
