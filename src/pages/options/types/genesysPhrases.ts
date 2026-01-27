export interface GenesysPhraseItem {
    id: string;
    itemName: string;
    value: string;
    hotkey1: string | null;
    hotkey2: string | null;
}

export interface GenesysPhraseFolder {
    folderName: string;
    items: GenesysPhraseItem[];
}

export type GenesysPhrases = GenesysPhraseFolder[];

export function isGenesysPhrases(data: unknown): data is GenesysPhrases {
    if (!Array.isArray(data)) {
        return false;
    }

    // Check if at least one item matches the structure
    return data.some(
        (item): item is GenesysPhraseFolder =>
            typeof item === 'object' &&
            item !== null &&
            'folderName' in item &&
            typeof item.folderName === 'string' &&
            'items' in item &&
            Array.isArray(item.items) &&
            item.items.length > 0 &&
            typeof item.items[0] === 'object' &&
            item.items[0] !== null &&
            'itemName' in item.items[0] &&
            'value' in item.items[0]
    );
}
