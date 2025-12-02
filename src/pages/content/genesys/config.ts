import type {PageConfig} from '../core/types';
import {hideUselessButtons, showDutyMessages, showLineStatus} from "@pages/content/genesys/utility";
import {
    allowChatSizeEdit,
    allowPaste,
    autoCollapseChatHeader,
    customChatColors,
    customChatSounds,
    removeAnswers,
    removeRMs
} from "@pages/content/genesys/chats";

// TODO заполнить URL паттерны для Genesys
export const URL_PATTERNS = {
    GENESYS_BASE: "genesys-app1",
} as const;

// Конфигурация страниц Genesys
export const genesysPageConfigs: PageConfig[] = [
    {
        pattern: URL_PATTERNS.GENESYS_BASE,
        features: [
            {key: 'showLineStatus', handler: showLineStatus},
            {key: 'showDutyMessages', handler: showDutyMessages},
            {key: 'hideUselessButtons', handler: hideUselessButtons},
            {key: 'removeAnswers', handler: removeAnswers},
            {key: 'removeRMs', handler: removeRMs},
            {key: 'customChatColors', handler: customChatColors},
            {key: 'customChatSounds', handler: customChatSounds},
            {key: 'autoCollapseChatHeader', handler: autoCollapseChatHeader},
            {key: 'allowChatSizeEdit', handler: allowChatSizeEdit},
            {key: 'allowPaste', handler: allowPaste},
        ]
    }
];
