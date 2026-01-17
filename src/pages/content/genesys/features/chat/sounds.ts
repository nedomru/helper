/**
 * Set custom chat sounds.
 *
 * Uses basic genesys configuration:
 * chat.ringing-bell - Sound of new chat
 * chat.new-message-bell - Sound of new message in chat.
 */
export function customChatSounds() {
    const baseURL = "http://genesys-srv.cc3.ertelecom.ru/sounds/";

    chrome.storage.sync.get('settings', (result) => {
        if (result?.settings?.genesys?.chats) {
            const {
                incomingChatSound,
                incomingMessageSound,
            } = result.settings.genesys.chats;

            const genesys = (window as any).genesys;
            if (genesys?.wwe?.configuration?.set) {
                genesys.wwe.configuration.set("chat.ringing-bell", `${baseURL}/${incomingChatSound}|-1|0`);
                genesys.wwe.configuration.set("chat.new-message-bell", `${baseURL}/${incomingMessageSound}|-1|0`);
            }
        }
    });
}
