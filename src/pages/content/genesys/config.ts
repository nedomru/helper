import type {PageConfig} from '../core/types';

// Chat Features
import {
    allowChatSizeEdit,
    allowPaste,
    autoCollapseChatHeader,
    customChatColors,
    customChatSounds
} from "./features/chat";

// Chat Content Features
import {removeAnswers, removeRMs} from "./features/chat-content";

// UI Enhancement Features
import {hideUselessButtons, showDutyMessages, showLineStatus} from "./features/ui-enhancements";

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
