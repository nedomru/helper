export interface FeatureConfig {
    key: string;
    handler: () => void | Promise<void>;
}

export interface PageConfig {
    pattern: string | string[];
    features: FeatureConfig[];
    alwaysRun?: Array<() => void | Promise<void>>;
}

export type SettingsStorage = Record<string, boolean>;
