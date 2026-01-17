/**
 * Set custom colors for operator and client.
 *
 * Uses basic genesys configuration:
 * chat.agent.prompt-color - Color of agent name
 * chat.agent.text-color - Color of agent message text
 * chat.client.prompt-color - Color of client name
 * chat.client.text-color - Color of client message text.
 */
export function customChatColors() {
    chrome.storage.sync.get('settings', (result) => {
        if (result?.settings?.genesys?.chats) {
            const {
                operatorNameColor,
                operatorMessageColor,
                clientNameColor,
                clientMessageColor
            } = result.settings.genesys.chats;

            const genesys = (window as any).genesys;
            if (genesys?.wwe?.configuration?.set) {
                genesys.wwe.configuration.set("chat.agent.prompt-color", operatorNameColor);
                genesys.wwe.configuration.set("chat.agent.text-color", operatorMessageColor);
                genesys.wwe.configuration.set("chat.client.prompt-color", clientNameColor);
                genesys.wwe.configuration.set("chat.client.text-color", clientMessageColor);
            }
        }
    });
}
