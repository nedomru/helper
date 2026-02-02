/**
 * Ctrl+Send feature for Genesys chats
 * Adds Ctrl+Click functionality to the Send button to send message and leave chat
 */

const SEND_BUTTON_SELECTOR = '.wwe-button-send.btn';
const TEXTAREA_SELECTOR = '.wwe-textarea';

// Store state for each chat
const chatStates = new Map<
    string,
    {
        pendingLeave: boolean;
        originalText: string;
    }
>();

/**
 * Extract chat ID from the case data section
 */
function getChatIdFromBar(barElement: HTMLElement): string | null {
    console.log('Looking for chat ID in bar:', barElement.id);

    // The chat ID is in a deeply nested structure, so we need to search within the entire bar
    // Try to find any element with id ending in "intid" (interaction ID)
    const intIdRow = barElement.querySelector('[id$="intid"]');
    if (!intIdRow) {
        console.log('Could not find [id$="intid"] element');
        return null;
    }

    console.log('Found intid row:', intIdRow.id);

    // Get the value from the wwe-data-text-value div
    const valueDiv = intIdRow.querySelector('.wwe-data-text-value');
    if (!valueDiv) {
        console.log('Could not find .wwe-data-text-value');
        return null;
    }

    const chatId = valueDiv.getAttribute('title') || valueDiv.textContent?.trim() || null;

    if (chatId) {
        console.log('Successfully extracted chat ID:', chatId);
    } else {
        console.log('Could not extract chat ID from valueDiv');
    }

    return chatId;
}

/**
 * Get message textarea for a chat bar
 */
function getTextarea(barElement: HTMLElement): HTMLTextAreaElement | null {
    return barElement.querySelector<HTMLTextAreaElement>(TEXTAREA_SELECTOR);
}

/**
 * Get send button for a chat bar
 */
function getSendButton(barElement: HTMLElement): HTMLButtonElement | null {
    return barElement.querySelector<HTMLButtonElement>(SEND_BUTTON_SELECTOR);
}

/**
 * Send message to Genesys chat via API
 */
async function sendMessage(
    chatId: string,
    text: string,
): Promise<{ success: boolean; statusCode?: number; error?: string }> {
    try {
        const currentUrl = window.location.href;
        const urlObj = new URL(currentUrl);
        const baseUrl = `${urlObj.protocol}//${urlObj.host}`;

        const apiUrl = `${baseUrl}/api/v2/me/chats/${chatId}`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=UTF-8',
            },
            body: JSON.stringify({
                operationName: 'SendMessage',
                text: text,
            }),
        });

        if (!response.ok) {
            return {
                success: false,
                error: `HTTP ${response.status}: ${response.statusText}`,
            };
        }

        const data = await response.json();
        console.log('SendMessage API response:', data);

        // Check if statusCode is 0 (success)
        if (data.statusCode !== 0) {
            return {
                success: false,
                statusCode: data.statusCode,
                error: data.statusMessage || `API вернул код ${data.statusCode}`,
            };
        }

        return {success: true, statusCode: 0};
    } catch (error) {
        console.error(`Failed to send message in chat ${chatId}:`, error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Send leave request to Genesys API
 */
async function leaveChat(chatId: string): Promise<boolean> {
    try {
        const currentUrl = window.location.href;
        const urlObj = new URL(currentUrl);
        const baseUrl = `${urlObj.protocol}//${urlObj.host}`;

        const apiUrl = `${baseUrl}/api/v2/me/chats/${chatId}`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=UTF-8',
            },
            body: JSON.stringify({operationName: 'Leave'}),
        });

        return response.ok;
    } catch (error) {
        console.error(`Failed to leave chat ${chatId}:`, error);
        return false;
    }
}

/**
 * Handle Ctrl+Click on send button
 */
async function handleCtrlSend(
    barElement: HTMLElement,
    chatId: string,
    sendButton: HTMLButtonElement,
    textarea: HTMLTextAreaElement,
): Promise<void> {
    const messageText = textarea.value?.trim();

    if (!messageText) {
        console.log('No message to send');
        return;
    }

    console.log(`Ctrl+Send detected for chat ${chatId}, message:`, messageText);

    // Store state
    const state = chatStates.get(chatId) || {
        pendingLeave: false,
        originalText: '',
    };
    state.pendingLeave = true;
    state.originalText = messageText;
    chatStates.set(chatId, state);

    // Disable the button temporarily to prevent double-clicks
    const wasDisabled = sendButton.disabled;
    sendButton.disabled = true;

    try {
        // Send message via API
        console.log(`Sending message via API for chat ${chatId}`);
        const result = await sendMessage(chatId, messageText);

        if (!result.success) {
            console.warn(`Failed to send message in chat ${chatId}:`, result.error);
            return;
        }

        console.log(`Message sent successfully for chat ${chatId}, leaving chat...`);

        // Clear the textarea after successful send
        textarea.value = '';

        // Leave the chat immediately after API confirms success
        const success = await leaveChat(chatId);
        if (success) {
            console.log(`Successfully left chat ${chatId}`);
        } else {
            console.warn(`Failed to leave chat ${chatId}`);
        }
    } catch (error) {
        console.error('Error during Ctrl+Send operation:', error);
    } finally {
        // Re-enable the button
        sendButton.disabled = wasDisabled;
        state.pendingLeave = false;
        chatStates.set(chatId, state);
    }
}

/**
 * Add Ctrl+Send functionality to a single chat
 */
function addCtrlSendToChat(barElement: HTMLElement): void {
    console.log('Adding Ctrl+Send to bar:', barElement.className, barElement.id);

    const chatId = getChatIdFromBar(barElement);
    if (!chatId) {
        console.warn('Could not find chat ID for bar element:', barElement.id);
        return;
    }

    console.log('Found chat ID:', chatId);

    const sendButton = getSendButton(barElement);
    if (!sendButton) {
        console.warn('Could not find send button for chat:', chatId);
        return;
    }

    const textarea = getTextarea(barElement);
    if (!textarea) {
        console.warn('Could not find textarea for chat:', chatId);
        return;
    }

    // Check if we already added the event listener
    if (sendButton.dataset.ctrlSendAdded === 'true') {
        console.log(`Ctrl+Send already added to chat ${chatId}, skipping`);
        return;
    }

    console.log('Adding Ctrl+Send event listener to chat:', chatId);

    // Add click event listener with Ctrl detection
    sendButton.addEventListener('click', (event) => {
        if (event.ctrlKey || event.metaKey) {
            console.log('Ctrl+Click detected on send button');
            event.preventDefault();
            event.stopPropagation();

            handleCtrlSend(barElement, chatId, sendButton, textarea).catch((error) => {
                console.error('Error in Ctrl+Send handler:', error);
            });
        }
    });

    // Mark as added
    sendButton.dataset.ctrlSendAdded = 'true';

    console.log('Successfully added Ctrl+Send for chat:', chatId);
}

/**
 * Check if a chat already has Ctrl+Send functionality
 */
function hasCtrlSendForBar(barElement: HTMLElement): boolean {
    const sendButton = getSendButton(barElement);
    return sendButton?.dataset.ctrlSendAdded === 'true';
}

/**
 * Scan for all active chats and add Ctrl+Send functionality
 */
function scanAndAddCtrlSend(): void {
    const chatBars = document.querySelectorAll<HTMLElement>('.wwe-bar.wwe-media-type-chat');

    if (chatBars.length > 0) {
        console.log(`Found ${chatBars.length} chat bars for Ctrl+Send`);
    }

    chatBars.forEach((bar) => {
        if (!hasCtrlSendForBar(bar)) {
            addCtrlSendToChat(bar);
        }
    });
}

/**
 * Initialize the Ctrl+Send feature
 */
export function initCtrlSend(): void {
    console.log('Initializing Genesys Ctrl+Send feature...');

    // Initial scan with delay to ensure DOM is ready
    setTimeout(() => {
        console.log('Running initial Ctrl+Send scan...');
        scanAndAddCtrlSend();
    }, 1000);

    // Set up MutationObserver to detect new chats
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType !== Node.ELEMENT_NODE) continue;

                const element = node as Element;

                // Check if it's a chat-related element
                if (
                    element.classList.contains('wwe-bar') ||
                    element.classList.contains('wwe-case') ||
                    element.classList.contains('wwe-chat-view') ||
                    element.classList.contains('wwe-message-editor')
                ) {
                    console.log('New chat element detected for Ctrl+Send:', element.className);
                    const bar = element.closest<HTMLElement>('.wwe-bar.wwe-media-type-chat');
                    if (bar && !hasCtrlSendForBar(bar)) {
                        addCtrlSendToChat(bar);
                    }
                }

                // Check for nested elements
                const chatBars = element.querySelectorAll<HTMLElement>(
                    '.wwe-bar.wwe-media-type-chat',
                );
                chatBars.forEach((el) => {
                    if (!hasCtrlSendForBar(el)) {
                        addCtrlSendToChat(el);
                    }
                });
            }
        }
    });

    // Start observing
    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });

    // Periodic rescan as fallback
    setInterval(() => {
        console.log('Running periodic Ctrl+Send scan...');
        scanAndAddCtrlSend();
    }, 30000);

    console.log('Genesys Ctrl+Send feature initialized');
}

/**
 * Remove all Ctrl+Send functionality
 */
export function removeCtrlSend(): void {
    // Clear state map
    chatStates.clear();

    // Remove event listeners by removing data attribute
    const sendButtons = document.querySelectorAll<HTMLButtonElement>(
        `${SEND_BUTTON_SELECTOR}[data-ctrl-send-added]`,
    );
    sendButtons.forEach((button) => {
        delete button.dataset.ctrlSendAdded;
    });

    console.log('Genesys Ctrl+Send feature removed');
}
