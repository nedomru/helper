import {getUserSettings} from '@src/shared/user-settings';

interface ChatSounds {
    incomingChat: string;
    incomingMessage: string;
}

const DEFAULT_SOUNDS: ChatSounds = {
    incomingChat: 'Sound_1.mp3',
    incomingMessage: 'zvuk-chpok-4.mp3',
};

const GENESYS_SELECTOR = '.wwe-account-state';
const GENESYS_SOUND_BASE_URL = 'http://genesys-srv.cc3.ertelecom.ru/sounds/';

const toGenesysUrl = (fileName: string): string =>
    `${GENESYS_SOUND_BASE_URL}${fileName}|-1|0`;

const getChatSounds = async (): Promise<ChatSounds> => {
    const settings = await getUserSettings();
    const genesysSettings = settings?.genesys as Record<string, unknown> | undefined;
    const chatSounds = genesysSettings?.chatSounds as ChatSounds | undefined;

    if (!genesysSettings?.customChatSounds || !chatSounds) {
        return DEFAULT_SOUNDS;
    }

    return {
        incomingChat: chatSounds.incomingChat || DEFAULT_SOUNDS.incomingChat,
        incomingMessage: chatSounds.incomingMessage || DEFAULT_SOUNDS.incomingMessage,
    };
};

const injectSoundScript = (newChatSound: string, newMessageSound: string): void => {
    const script = document.createElement('script');
    script.textContent = `
window.genesys.wwe.configuration.set("chat.ringing-bell", "${newChatSound}");
window.genesys.wwe.configuration.set("chat.new-message-bell", "${newMessageSound}");
    `;
    document.body.appendChild(script);
};

export async function customChatSounds(): Promise<void> {
    const sounds = await getChatSounds();
    const [chatUrl, messageUrl] = [toGenesysUrl(sounds.incomingChat), toGenesysUrl(sounds.incomingMessage)];

    const apply = (): boolean => {
        if (document.querySelector(GENESYS_SELECTOR)) {
            injectSoundScript(chatUrl, messageUrl);
            return true;
        }
        return false;
    };

    if (!apply()) {
        new MutationObserver((_, obs) => {
            if (apply()) obs.disconnect();
        }).observe(document, {childList: true, subtree: true});
    }
}
