/**
 * Type definitions for Clippings browser extension export format
 * @see https://github.com/aecreations/clippings
 */

/**
 * A clipping item (phrase) in the Clippings export format
 */
export interface ClippingItem {
    /** Name of the clipping */
    name: string;
    /** Text content of the clipping */
    content: string;
    /** Keyboard shortcut (empty string if none) */
    shortcutKey: string;
    /** Source URL (optional) */
    sourceURL: string;
    /** Color label (optional) */
    label: string;
    /** Sequence number for ordering */
    seq: number;
    /** Separator flag (optional) */
    sep?: boolean;
}

/**
 * A folder in the Clippings export format
 * Can contain both clipping items and nested folders
 */
export interface ClippingFolder {
    /** Name of the folder */
    name: string;
    /** Child items (can be mix of folders and clippings) */
    children: Array<ClippingFolder | ClippingItem>;
    /** Sequence number for ordering */
    seq: number;
}

/**
 * Root Clippings export structure
 */
export interface ClippingsExport {
    /** Format version */
    version: string;
    /** Creator identifier */
    createdBy: string;
    /** Root level folders and clippings */
    userClippingsRoot: ClippingFolder[];
}

/**
 * Type guard to check if an item is a folder
 */
export function isClippingFolder(item: ClippingFolder | ClippingItem): item is ClippingFolder {
    return 'children' in item;
}

/**
 * Type guard to check if an item is a clipping
 */
export function isClippingItem(item: ClippingFolder | ClippingItem): item is ClippingItem {
    return 'content' in item;
}
