import type {PageConfig} from '../core/types';

import {removeAnswers, removeRMs} from "./features/chat-content";
import {hideUselessButtons, showDutyMessages, showLineStatus} from "./features/ui-enhancements";
import {customChatSounds} from "@pages/content/genesys/features/chat/sounds";
import {customChatColors} from "@pages/content/genesys/features/chat/colors";
import {allowPaste} from "@pages/content/genesys/features/chat/pasting";
import {allowChatSizeEdit} from "@pages/content/genesys/features/chat/message_area";
import {autoCollapseChatHeader} from "@pages/content/genesys/features/chat/headers";

export const URL_PATTERNS = {
    GENESYS_BASE: "genesys-app1",
} as const;

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
        ],
        alwaysRun: [
            allowChatSizeEdit,
            autoCollapseChatHeader,
            allowPaste
        ]
    }
];
