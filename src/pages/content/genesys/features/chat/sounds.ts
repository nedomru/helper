import {getUserSettings} from '@src/shared/user-settings';

interface ChatSounds {
    incomingChat: string;
    incomingMessage: string;
}

const DEFAULT_SOUNDS: ChatSounds = {
    incomingChat: 'zvuk-chpok-4.mp3',
    incomingMessage: 'zvuk-chpok-4.mp3',
};

const SOUND_BASE_URL = chrome.runtime.getURL('sounds/');
const GENESYS_SELECTOR = '.wwe-account-state';

async function getChatSounds(): Promise<ChatSounds> {
    const settings = await getUserSettings();
    if (!settings) {
        return DEFAULT_SOUNDS;
    }

    const genesysSettings = settings.genesys as Record<string, unknown> | undefined;
    if (!genesysSettings) {
        return DEFAULT_SOUNDS;
    }

    // Check if custom chat sounds are enabled
    if (genesysSettings.customChatSounds !== true) {
        return DEFAULT_SOUNDS;
    }

    const chatSounds = genesysSettings.chatSounds as ChatSounds | undefined;
    if (!chatSounds || typeof chatSounds !== 'object') {
        return DEFAULT_SOUNDS;
    }

    return {
        incomingChat: chatSounds.incomingChat || DEFAULT_SOUNDS.incomingChat,
        incomingMessage: chatSounds.incomingMessage || DEFAULT_SOUNDS.incomingMessage,
    };
}

function injectSoundScript(sounds: ChatSounds): void {
    const script = document.createElement('script');
    script.textContent = `
window.genesys.wwe.configuration.set("chat.ringing-bell", "${SOUND_BASE_URL}${sounds.incomingChat}|-1|0");
window.genesys.wwe.configuration.set("chat.new-message-bell", "${SOUND_BASE_URL}${sounds.incomingMessage}|-1|0");
    `;
    document.body.appendChild(script);
}

export async function customChatSounds(): Promise<void> {
    const sounds = await getChatSounds();

    const applyIfReady = (): boolean => {
        if (document.querySelector(GENESYS_SELECTOR)) {
            injectSoundScript(sounds);
            return true;
        }
        return false;
    };

    if (!applyIfReady()) {
        new MutationObserver((_, obs) => {
            if (applyIfReady()) obs.disconnect();
        }).observe(document, {childList: true, subtree: true});
    }
}
