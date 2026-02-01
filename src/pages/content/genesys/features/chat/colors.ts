import {getUserSettings} from '@src/shared/user-settings';

interface ChatColors {
    agentPrompt: string;
    agentText: string;
    clientPrompt: string;
    clientText: string;
}

const DEFAULT_COLORS: ChatColors = {
    agentPrompt: '#FF6B35',
    agentText: '#2C3E50',
    clientPrompt: '#27AE60',
    clientText: '#34495E',
};

const GENESYS_SELECTOR = '.wwe-account-state';

async function getChatColors(): Promise<ChatColors> {
    const settings = await getUserSettings();
    if (!settings) {
        return DEFAULT_COLORS;
    }

    const genesysSettings = settings.genesys as Record<string, unknown> | undefined;
    if (!genesysSettings) {
        return DEFAULT_COLORS;
    }

    const chatColors = genesysSettings.chatColors as ChatColors | undefined;
    if (!chatColors || typeof chatColors !== 'object') {
        return DEFAULT_COLORS;
    }

    return {
        agentPrompt: chatColors.agentPrompt || DEFAULT_COLORS.agentPrompt,
        agentText: chatColors.agentText || DEFAULT_COLORS.agentText,
        clientPrompt: chatColors.clientPrompt || DEFAULT_COLORS.clientPrompt,
        clientText: chatColors.clientText || DEFAULT_COLORS.clientText,
    };
}

function injectColorScript(colors: ChatColors): void {
    const script = document.createElement('script');
    script.textContent = `
window.genesys.wwe.configuration.set("chat.agent.prompt-color", "${colors.agentPrompt}");
window.genesys.wwe.configuration.set("chat.agent.text-color", "${colors.agentText}");
window.genesys.wwe.configuration.set("chat.client.prompt-color", "${colors.clientPrompt}");
window.genesys.wwe.configuration.set("chat.client.text-color", "${colors.clientText}");
    `;
    document.body.appendChild(script);
}

export async function customChatColors(): Promise<void> {
    const colors = await getChatColors();

    const applyIfReady = (): boolean => {
        if (document.querySelector(GENESYS_SELECTOR)) {
            injectColorScript(colors);
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
