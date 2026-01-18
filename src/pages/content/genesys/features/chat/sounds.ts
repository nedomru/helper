// TODO Replace with values from settings before release
const CHAT_SOUNDS = {
    incomingChat: 'zvuk-chpok-4.mp3',
    incomingMessage: 'zvuk-chpok-4.mp3',
} as const;

const SOUND_BASE_URL = 'http://genesys-srv.cc3.ertelecom.ru/sounds/';
const GENESYS_SELECTOR = '.wwe-account-state';

function injectSoundScript(): void {
    const script = document.createElement('script');
    script.textContent = `
window.genesys.wwe.configuration.set("chat.ringing-bell", "${SOUND_BASE_URL}${CHAT_SOUNDS.incomingChat}|-1|0");
window.genesys.wwe.configuration.set("chat.new-message-bell", "${SOUND_BASE_URL}${CHAT_SOUNDS.incomingMessage}|-1|0");
    `;
    document.body.appendChild(script);
}

export async function customChatSounds(): Promise<void> {
    const applyIfReady = (): boolean => {
        if (document.querySelector(GENESYS_SELECTOR)) {
            injectSoundScript();
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
