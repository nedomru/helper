import type {PageConfig} from '../core/types';

// TODO заполнить URL паттерны для Genesys
export const URL_PATTERNS = {
    GENESYS_BASE: "genesys.example.com",
} as const;

// Конфигурация страниц Genesys
export const genesysPageConfigs: PageConfig[] = [
    {
        pattern: URL_PATTERNS.GENESYS_BASE,
        features: []
    }
];
