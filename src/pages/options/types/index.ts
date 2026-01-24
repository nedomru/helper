export interface Settings {
    arm?: Record<string, boolean>;
    genesys?: Record<string, boolean>;
    line?: Record<string, boolean>;
}

export interface SelectOption {
    value: string;
    label: string;
    title?: string;
}

export interface Product {
    id: number;
    name: string;
}

export type WizardStep =
    | 'product'
    | 'processing'
    | 'category'
    | 'subcategory'
    | 'childreason'
    | 'comment'
    | 'name';

export interface UpdateStatus {
    checking: boolean;
    hasUpdate: boolean | null;
    latestVersion: string | null;
}

export interface AppealsCategory {
    value: string;
    label: string;
    title: string;
}
