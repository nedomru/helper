import type {PageConfig} from '../core/types';
import {customChatSounds} from "@pages/content/genesys/features/chat/sounds";
import {customChatColors} from "@pages/content/genesys/features/chat/colors";
import {allowPaste} from "@pages/content/genesys/features/chat/pasting";
import {allowChatSizeEdit} from "@pages/content/genesys/features/chat/message_area";
import {autoCollapseChatHeader} from "@pages/content/genesys/features/chat/headers";
import {showLineStatus} from "@pages/content/genesys/features/ui-enhancements/line_status";
import {hideButtons} from "@pages/content/genesys/features/ui-enhancements/hideButtons";
import {showClock} from "@pages/content/genesys/features/ui-enhancements/clock";
import {initAutoClose} from "@pages/content/genesys/features/chat/auto-close";
import {setupPresets} from "@pages/content/genesys/features/chat/presets";
import {initCtrlSend} from "@pages/content/genesys/features/chat/close";

export const URL_PATTERNS = {
    GENESYS_BASE: "genesys-app1",
} as const;

export const genesysPageConfigs: PageConfig[] = [
    {
        pattern: URL_PATTERNS.GENESYS_BASE,
        features: [
            {key: 'showClock', handler: showClock},
            {key: 'showLineStatus', handler: showLineStatus},
            {key: 'hideButtons', handler: hideButtons},
            {key: 'customChatColors', handler: customChatColors},
            {key: 'customChatSounds', handler: customChatSounds},
            {key: 'allowChatSizeEdit', handler: allowChatSizeEdit},
            {key: 'autoCollapseChatHeader', handler: autoCollapseChatHeader},
            {key: 'allowPaste', handler: allowPaste},
            {key: 'autoClose', handler: initAutoClose},
            {key: 'ctrlClose', handler: initCtrlSend},
            {key: 'showPresets', handler: setupPresets}
        ],
        alwaysRun: []
    }
];
