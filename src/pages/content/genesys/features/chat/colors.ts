// TODO Replace with values from settings before relase
const CHAT_COLORS = {
    agentPrompt: '#FF6B35',
    agentText: '#2C3E50',
    clientPrompt: '#27AE60',
    clientText: '#34495E',
} as const;

const GENESYS_SELECTOR = '.wwe-account-state';

function injectColorScript(): void {
    const script = document.createElement('script');
    script.textContent = `
window.genesys.wwe.configuration.set("chat.agent.prompt-color", "${CHAT_COLORS.agentPrompt}");
window.genesys.wwe.configuration.set("chat.agent.text-color", "${CHAT_COLORS.agentText}");
window.genesys.wwe.configuration.set("chat.client.prompt-color", "${CHAT_COLORS.clientPrompt}");
window.genesys.wwe.configuration.set("chat.client.text-color", "${CHAT_COLORS.clientText}");
    `;
    document.body.appendChild(script);
}

export async function customChatColors(): Promise<void> {
    const applyIfReady = (): boolean => {
        if (document.querySelector(GENESYS_SELECTOR)) {
            injectColorScript();
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
