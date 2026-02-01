export interface Settings {
    arm?: Record<string, boolean | string[]>;
    genesys?: Record<string, boolean | ChatSounds>;
    line?: Record<string, boolean>;
    updateChannel?: UpdateChannel;
}

export interface ChatSounds {
    incomingChat: string;
    incomingMessage: string;
}

export interface ChatColors {
    agentPrompt: string;
    agentText: string;
    clientPrompt: string;
    clientText: string;
}

export type UpdateChannel = 'stable' | 'beta';

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
