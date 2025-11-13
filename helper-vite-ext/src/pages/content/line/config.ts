import type {PageConfig} from '../core/types';

// TODO заполнить URL паттерны для Line
export const URL_PATTERNS = {
    LINE_BASE: "line.example.com",
} as const;

// Конфигурация страниц Line
export const linePageConfigs: PageConfig[] = [
    {
        pattern: URL_PATTERNS.LINE_BASE,
        features: [
            // { key: 'LINE_messageTemplates', handler: enableMessageTemplates },
            // { key: 'LINE_autoTranslate', handler: enableAutoTranslate }
        ],
        alwaysRun: [
            // initChatUI
        ]
    },
];
