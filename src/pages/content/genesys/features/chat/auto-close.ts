/**
 * Auto-close feature for Genesys chats
 * Adds a checkbox to each chat to leave it via API
 */

const AUTO_CLOSE_CHECKBOX_ID = 'helper-auto-close-checkbox';
const AUTO_CLOSE_CONTAINER_CLASS = 'helper-auto-close-container';
const AUTO_CLOSE_TIMER_INPUT_ID = 'helper-auto-close-timer';

// Store active timeouts for each chat
const activeTimeouts = new Map<string, NodeJS.Timeout>();
const remainingTimes = new Map<string, number>();
const updateIntervals = new Map<string, NodeJS.Timeout>();
const transcriptObservers = new Map<string, MutationObserver>();

interface ChatControls {
    checkbox: HTMLInputElement;
    timerInput: HTMLInputElement;
    timeUnitSelect: HTMLSelectElement;
    quickSelect3Min: HTMLButtonElement;
    quickSelect4Min: HTMLButtonElement;
    statusLabel: HTMLElement;
    container: HTMLElement;
}

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
 * Clear all timers and intervals for a specific chat
 */
function clearChatTimers(chatId: string): void {
    if (activeTimeouts.has(chatId)) {
        clearTimeout(activeTimeouts.get(chatId)!);
        activeTimeouts.delete(chatId);
    }
    if (updateIntervals.has(chatId)) {
        clearInterval(updateIntervals.get(chatId)!);
        updateIntervals.delete(chatId);
    }
    remainingTimes.delete(chatId);
}

/**
 * Set status message with auto-hide and background color
 */
function setStatus(
    controls: ChatControls,
    message: string,
    bgColor: string,
    duration: number = 3000,
): void {
    const {statusLabel, container} = controls;
    statusLabel.textContent = message;
    container.style.backgroundColor = bgColor;
    setTimeout(() => {
        statusLabel.textContent = '';
        container.style.backgroundColor = '#FFFFFF';
    }, duration);
}

/**
 * Reset controls to enabled state and uncheck checkbox
 */
function resetControls(controls: ChatControls): void {
    const {checkbox, timerInput, timeUnitSelect, quickSelect3Min, quickSelect4Min} =
        controls;
    checkbox.checked = false;
    checkbox.disabled = false;
    timerInput.disabled = false;
    timeUnitSelect.disabled = false;
    quickSelect3Min.disabled = false;
    quickSelect4Min.disabled = false;
}

/**
 * Disable timer controls while timer is active
 */
function disableTimerControls(controls: ChatControls): void {
    const {timerInput, timeUnitSelect} = controls;
    timerInput.disabled = true;
    timeUnitSelect.disabled = true;
}

/**
 * Check if textarea has a message
 */
function hasMessage(barElement: HTMLElement): boolean {
    const textarea = barElement.querySelector<HTMLTextAreaElement>('.wwe-textarea');
    return Boolean(textarea?.value?.trim());
}

/**
 * Handle timer cancellation with UI feedback
 */
function cancelTimerWithFeedback(chatId: string, controls: ChatControls, reason: string): void {
    clearChatTimers(chatId);
    resetControls(controls);
    setStatus(controls, reason, reason.includes('Клиент') ? '#fff3cd' : '#f8d7da');
}

/**
 * Validate message exists and show error if not
 */
function validateMessage(controls: ChatControls, barElement: HTMLElement): boolean {
    if (!hasMessage(barElement)) {
        setStatus(controls, 'Напишите сообщение перед таймером', '#f8d7da');
        return false;
    }
    return true;
}

/**
 * Create a styled button for quick select
 */
function createQuickSelectButton(text: string, title: string): HTMLButtonElement {
    const button = document.createElement('button');
    button.textContent = text;
    button.title = title;
    button.style.cssText = `
        padding: 1px 5px;
        font-size: 11px;
        border: 1px solid #d1d5db;
        border-radius: 3px;
        background: #fff;
        cursor: pointer;
        white-space: nowrap;
        transition: all 0.2s;
        height: 17px;
        box-sizing: border-box;
        display: inline-flex;
        align-items: center;
        justify-content: center;
    `;
    return button;
}

/**
 * Setup button hover effects
 */
function setupButtonHoverEffects(button: HTMLButtonElement, checkbox: HTMLInputElement): void {
    button.addEventListener('mouseenter', () => {
        if (!checkbox.disabled && !button.disabled) {
            button.style.backgroundColor = '#f3f4f6';
            button.style.borderColor = '#9ca3af';
        }
    });

    button.addEventListener('mouseleave', () => {
        if (!checkbox.disabled && !button.disabled) {
            button.style.backgroundColor = '#fff';
            button.style.borderColor = '#d1d5db';
        }
    });

    button.addEventListener('mousedown', () => {
        if (!checkbox.disabled && !button.disabled) {
            button.style.backgroundColor = '#e5e7eb';
            button.style.transform = 'scale(0.98)';
        }
    });

    button.addEventListener('mouseup', () => {
        if (!checkbox.disabled && !button.disabled) {
            button.style.transform = 'scale(1)';
        }
    });
}

/**
 * Setup quick select button with common logic
 */
function setupQuickSelectButton(
    button: HTMLButtonElement,
    minutes: number,
    controls: ChatControls,
    barElement: HTMLElement,
): void {
    button.addEventListener('click', () => {
        if (button.disabled) return;

        if (!validateMessage(controls, barElement)) return;

        const {checkbox, timerInput, timeUnitSelect} = controls;

        // Cancel any existing timer first
        if (checkbox.checked) {
            checkbox.checked = false;
            checkbox.dispatchEvent(new Event('change'));
        }

        // Start new timer after small delay
        setTimeout(() => {
            timerInput.value = minutes.toString();
            timeUnitSelect.value = 'minutes';
            checkbox.checked = true;
            checkbox.dispatchEvent(new Event('change'));
        }, 50);
    });
}

/**
 * Get message editor element for a chat bar
 */
function getMessageEditorElement(barElement: HTMLElement): HTMLElement | null {
    return barElement.querySelector('.wwe-message-editor');
}

/**
 * Get chat view element for a chat bar
 */
function getChatViewElement(barElement: HTMLElement): HTMLElement | null {
    return barElement.querySelector('.wwe-chat-view');
}

/**
 * Send message to Genesys chat and verify success
 */
async function sendMessage(
    chatId: string,
    text: string,
): Promise<{ success: boolean; statusCode?: number; error?: string }> {
    try {
        // Get the current URL to construct the API endpoint
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
        // Get the current URL to construct the API endpoint
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
 * Setup observer to watch for client messages and cancel timer
 */
function setupTranscriptObserver(
    chatId: string,
    transcriptElement: HTMLElement,
    controls: ChatControls,
): void {
    // Remove existing observer if any
    if (transcriptObservers.has(chatId)) {
        transcriptObservers.get(chatId)?.disconnect();
        transcriptObservers.delete(chatId);
    }

    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type === 'childList') {
                for (const node of mutation.addedNodes) {
                    if (
                        node instanceof HTMLElement &&
                        node.classList.contains('wwe-chat-message') &&
                        node.classList.contains('wwe-message-client')
                    ) {
                        console.log(`Client message detected in chat ${chatId}, cancelling timer`);

                        if (activeTimeouts.has(chatId) || updateIntervals.has(chatId)) {
                            cancelTimerWithFeedback(chatId, controls, 'Клиент написал, таймер отменён');
                        }
                    }
                }
            }
        }
    });

    observer.observe(transcriptElement, {childList: true, subtree: true});
    transcriptObservers.set(chatId, observer);
    console.log(`Setup transcript observer for chat ${chatId}`);
}

/**
 * Get transcript element for a chat bar
 */
function getTranscriptElement(barElement: HTMLElement): HTMLElement | null {
    return barElement.querySelector('.wwe-transcript');
}

/**
 * Setup observer to watch textarea for empty messages and cancel timer
 */
function setupTextareaObserver(
    chatId: string,
    textarea: HTMLTextAreaElement,
    controls: ChatControls,
): void {
    textarea.addEventListener('input', () => {
        if (!controls.checkbox.checked) return;

        if (!textarea.value?.trim()) {
            console.log(`Textarea became empty for chat ${chatId}, cancelling timer`);

            if (activeTimeouts.has(chatId) || updateIntervals.has(chatId)) {
                cancelTimerWithFeedback(chatId, controls, 'Сообщение удалено, таймер отменён');
            }
        }
    });

    console.log(`Setup textarea observer for chat ${chatId}`);
}

/**
 * Create auto-close checkbox element with timer
 */
function createAutoCloseCheckbox(
    chatId: string,
    barId: string,
    barElement: HTMLElement,
): HTMLElement {
    const container = document.createElement('div');
    container.className = AUTO_CLOSE_CONTAINER_CLASS;
    container.dataset.barId = barId; // Store bar ID for duplicate detection
    container.style.cssText = `
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 3px 8px;
		margin: 4px;
		background: #FFFFFF;
		border: 1px solid #d1d5db;
		border-radius: 10px;
		font-size: 12px;
		user-select: none;
		color: #374151;
		height: 23px;
	`;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `${AUTO_CLOSE_CHECKBOX_ID}-${chatId}`;
    checkbox.style.cssText = `
		cursor: pointer;
		width: 14px;
		height: 14px;
		flex-shrink: 0;
		margin: 0;
	`;

    const label = document.createElement('label');
    label.htmlFor = `${AUTO_CLOSE_CHECKBOX_ID}-${chatId}`;
    label.textContent = 'Закрыть через';
    label.style.cssText = `
		cursor: pointer;
		user-select: none;
		white-space: nowrap;
		margin: 0;
		font-size: 12px;
		line-height: 1;
	`;

    // Timer input wrapper
    const timerWrapper = document.createElement('div');
    timerWrapper.style.cssText = `
        display: flex;
        gap: 3px;
        height: 17px;
    `;

    // Quick select buttons for predefined times
    const quickSelect3Min = createQuickSelectButton('3 мин', 'Установить 3 минуты');
    const quickSelect4Min = createQuickSelectButton('4 мин', 'Установить 4 минуты');

    // Add hover effects
    [quickSelect3Min, quickSelect4Min].forEach((btn) => {
        setupButtonHoverEffects(btn, checkbox);
    });

    const timerInput = document.createElement('input');
    timerInput.type = 'number';
    timerInput.id = `${AUTO_CLOSE_TIMER_INPUT_ID}-${chatId}`;
    timerInput.min = '1';
    timerInput.max = '60';
    timerInput.value = '5';
    timerInput.style.cssText = `
		width: 40px;
		padding: 0 3px;
		border: 1px solid #d1d5db;
		border-radius: 3px;
		font-size: 12px;
		text-align: center;
		height: 17px;
		box-sizing: border-box;
		display: flex;
		align-items: center;
	`;

    const timeUnitSelect = document.createElement('select');
    timeUnitSelect.style.cssText = `
		padding: 0px 3px 0 3px;
		font-size: 12px;
		cursor: pointer;
		height: 17px;
		width: auto;
		box-sizing: border-box;
	`;

    const minutesOption = document.createElement('option');
    minutesOption.value = 'minutes';
    minutesOption.textContent = 'мин';

    const secondsOption = document.createElement('option');
    secondsOption.value = 'seconds';
    secondsOption.textContent = 'сек';
    secondsOption.selected = true;

    timeUnitSelect.appendChild(minutesOption);
    timeUnitSelect.appendChild(secondsOption);

    // Status label
    const statusLabel = document.createElement('span');
    statusLabel.className = 'helper-auto-close-status';
    statusLabel.dataset.chatId = chatId; // Store chat ID for finding element
    statusLabel.style.cssText = `
		font-size: 11px;
		color: #6b7280;
		margin-left: auto;
		line-height: 1;
	`;

    // Add event listeners for quick select buttons using helper
    const controlsForButtons: ChatControls = {
        checkbox,
        timerInput,
        timeUnitSelect,
        quickSelect3Min,
        quickSelect4Min,
        statusLabel,
        container,
    };

    setupQuickSelectButton(quickSelect3Min, 3, controlsForButtons, barElement);
    setupQuickSelectButton(quickSelect4Min, 4, controlsForButtons, barElement);

    timerWrapper.appendChild(timerInput);
    timerWrapper.appendChild(timeUnitSelect);
    timerWrapper.appendChild(quickSelect3Min);
    timerWrapper.appendChild(quickSelect4Min);

    container.appendChild(checkbox);
    container.appendChild(label);
    container.appendChild(timerWrapper);
    container.appendChild(statusLabel);

    // Setup transcript observer after container is added to DOM
    setTimeout(() => {
        const controls: ChatControls = {
            checkbox,
            timerInput,
            timeUnitSelect,
            quickSelect3Min,
            quickSelect4Min,
            statusLabel,
            container,
        };

        const transcriptElement = getTranscriptElement(barElement);
        if (transcriptElement) {
            setupTranscriptObserver(chatId, transcriptElement, controls);
        }

        // Setup textarea observer to detect empty messages
        const textarea = barElement.querySelector<HTMLTextAreaElement>('.wwe-textarea');
        if (textarea) {
            setupTextareaObserver(chatId, textarea, controls);
        }
    }, 100);

    // Function to cancel scheduled leave
    const cancelScheduledLeave = () => clearChatTimers(chatId);

    // Function to update countdown display - finds element by data attribute
    const updateCountdown = () => {
        const statusElement = document.querySelector(
            `.helper-auto-close-status[data-chat-id="${chatId}"]`,
        ) as HTMLElement;
        if (!statusElement) {
            // Element was removed, stop the interval
            console.log(`Status element for chat ${chatId} not found, stopping countdown`);
            if (updateIntervals.has(chatId)) {
                clearInterval(updateIntervals.get(chatId)!);
                updateIntervals.delete(chatId);
            }
            return;
        }

        const remaining = remainingTimes.get(chatId);
        if (remaining !== undefined) {
            const minutes = Math.floor(remaining / 60);
            const seconds = remaining % 60;
            statusElement.textContent = `Осталось: ${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
    };

    // Add event listener
    checkbox.addEventListener('change', async () => {
        if (checkbox.checked) {
            // Validate that there's a message in the textarea
            const textarea = barElement.querySelector('.wwe-textarea') as HTMLTextAreaElement;
            const messageText = textarea?.value?.trim() || '';

            if (!messageText) {
                statusLabel.textContent = 'Напишите сообщение перед таймером';
                container.style.backgroundColor = '#f8d7da';
                checkbox.checked = false;
                setTimeout(() => {
                    statusLabel.textContent = '';
                    container.style.backgroundColor = '#FFFFFF';
                }, 3000);
                return;
            }

            const timeValue = parseInt(timerInput.value, 10);
            const timeUnit = timeUnitSelect.value;

            let delayMs: number;
            if (timeUnit === 'minutes') {
                delayMs = timeValue * 60 * 1000;
            } else {
                delayMs = timeValue * 1000;
            }

            const totalSeconds = Math.floor(delayMs / 1000);
            remainingTimes.set(chatId, totalSeconds);

            // Disable controls while timer is active (but keep quick select buttons enabled for toggle)
            timerInput.disabled = true;
            timeUnitSelect.disabled = true;

            // Start countdown
            updateCountdown();
            const intervalId = setInterval(() => {
                const current = remainingTimes.get(chatId);
                if (current !== undefined && current > 0) {
                    remainingTimes.set(chatId, current - 1);
                    updateCountdown();
                }
            }, 1000);
            updateIntervals.set(chatId, intervalId);

            // Schedule the leave
            const timeoutId = setTimeout(async () => {
                cancelScheduledLeave();

                // Get message text from textarea again (in case it changed)
                const currentMessageText = textarea?.value?.trim() || '';

                // Check again if message exists (it might have been deleted)
                if (!currentMessageText) {
                    statusLabel.textContent = 'Сообщение удалено, таймер отменён';
                    container.style.backgroundColor = '#f8d7da';
                    checkbox.checked = false;
                    checkbox.disabled = false;
                    timerInput.disabled = false;
                    timeUnitSelect.disabled = false;
                    quickSelect3Min.disabled = false;
                    quickSelect4Min.disabled = false;
                    setTimeout(() => {
                        statusLabel.textContent = '';
                        container.style.backgroundColor = '#FFFFFF';
                    }, 3000);
                    return;
                }

                // Track if we successfully sent a message
                let messageWasSent = false;

                // Send message
                console.log(`Sending message before leaving chat ${chatId}:`, currentMessageText);
                statusLabel.textContent = 'Отправка сообщения...';

                const result = await sendMessage(chatId, currentMessageText);
                if (!result.success) {
                    console.warn(`Failed to send message in chat ${chatId}:`, result.error);
                    statusLabel.textContent = result.error || 'Ошибка отправки сообщения';
                    // Don't proceed with leave if message failed
                    checkbox.checked = false;
                    checkbox.disabled = false;
                    timerInput.disabled = false;
                    timeUnitSelect.disabled = false;
                    quickSelect3Min.disabled = false;
                    quickSelect4Min.disabled = false;
                    container.style.backgroundColor = '#f8d7da';
                    setTimeout(() => {
                        statusLabel.textContent = '';
                        container.style.backgroundColor = '#FFFFFF';
                    }, 5000); // Longer display for error messages
                    return;
                }

                // Clear the textarea after successful send
                if (textarea) {
                    textarea.value = '';
                }

                messageWasSent = true;
                console.log(`Message sent and verified successfully for chat ${chatId}`);
                statusLabel.textContent = 'Сообщение отправлено';

                // Now leave the chat
                const success = await leaveChat(chatId);
                if (success) {
                    console.log(`Successfully initiated leave for chat ${chatId}`);
                    checkbox.disabled = true;
                    statusLabel.textContent = messageWasSent
                        ? 'Отправлено, выход из чата...'
                        : 'Запрос на выход отправлен...';
                    container.style.backgroundColor = '#d4edda';
                } else {
                    checkbox.checked = false;
                    checkbox.disabled = false;
                    timerInput.disabled = false;
                    timeUnitSelect.disabled = false;
                    quickSelect3Min.disabled = false;
                    quickSelect4Min.disabled = false;
                    statusLabel.textContent = 'Ошибка. Попробуйте снова.';
                    container.style.backgroundColor = '#f8d7da';
                    setTimeout(() => {
                        statusLabel.textContent = '';
                        container.style.backgroundColor = '#FFFFFF';
                    }, 3000);
                }
            }, delayMs);

            activeTimeouts.set(chatId, timeoutId);
            container.style.backgroundColor = '#fff3cd';
        } else {
            // Cancel the scheduled leave
            cancelScheduledLeave();
            statusLabel.textContent = 'Отменено';
            container.style.backgroundColor = '#FFFFFF';
            timerInput.disabled = false;
            timeUnitSelect.disabled = false;
            quickSelect3Min.disabled = false;
            quickSelect4Min.disabled = false;

            setTimeout(() => {
                statusLabel.textContent = '';
            }, 2000);
        }
    });

    return container;
}

/**
 * Add auto-close checkbox to a single chat
 */
function addAutoCloseToChat(barElement: HTMLElement): void {
    console.log('Attempting to add auto-close to bar:', barElement.className, barElement.id);

    // Check if already added using bar ID
    if (hasAutoCloseForBar(barElement)) {
        console.log(`Bar ${barElement.id} already has auto-close container, skipping`);
        return;
    }

    const chatId = getChatIdFromBar(barElement);
    if (!chatId) {
        console.warn('Could not find chat ID for bar element:', barElement.id);
        return;
    }

    console.log('Found chat ID:', chatId);

    // Cancel any existing timer for this chat (from previous instance)
    if (activeTimeouts.has(chatId)) {
        console.log(`Clearing existing timeout for chat ${chatId}`);
        clearTimeout(activeTimeouts.get(chatId)!);
        activeTimeouts.delete(chatId);
    }
    if (updateIntervals.has(chatId)) {
        console.log(`Clearing existing interval for chat ${chatId}`);
        clearInterval(updateIntervals.get(chatId)!);
        updateIntervals.delete(chatId);
    }
    remainingTimes.delete(chatId);

    // Disconnect existing transcript observer if any
    if (transcriptObservers.has(chatId)) {
        console.log(`Disconnecting existing transcript observer for chat ${chatId}`);
        transcriptObservers.get(chatId)?.disconnect();
        transcriptObservers.delete(chatId);
    }

    const chatViewElement = getChatViewElement(barElement);
    if (!chatViewElement) {
        console.warn('Could not find chat view element for chat:', chatId);
        return;
    }

    console.log('Found chat view element');

    console.log('Creating checkbox for chat:', chatId);
    const checkboxElement = createAutoCloseCheckbox(chatId, barElement.id, barElement);

    // Find the message editor to place checkbox before it
    const messageEditor = getMessageEditorElement(barElement);

    if (messageEditor && messageEditor.parentNode) {
        console.log('Inserting checkbox before message editor');
        // Insert before the message editor
        messageEditor.parentNode.insertBefore(checkboxElement, messageEditor);
        console.log('Successfully added checkbox for chat:', chatId);
    } else {
        console.log('Message editor not found, appending to chat view');
        // Fallback: append to chat view
        chatViewElement.appendChild(checkboxElement);
        console.log('Successfully added checkbox for chat:', chatId);
    }
}

/**
 * Check if a chat already has an auto-close container by its bar ID
 */
function hasAutoCloseForBar(barElement: HTMLElement): boolean {
    const barId = barElement.id;
    if (!barId) return false;

    // Check if there's already a container for this specific bar
    const existingContainer = document.querySelector(
        `.${AUTO_CLOSE_CONTAINER_CLASS}[data-bar-id="${barId}"]`,
    );
    return existingContainer !== null;
}

/**
 * Scan for all active chats and add auto-close checkboxes
 */
function scanAndAddAutoClose(): void {
    // First, cleanup any orphaned timers (timers whose containers no longer exist)
    cleanupOrphanedTimers();

    // Only scan for bars - this is the most reliable selector
    const chatBars = document.querySelectorAll<HTMLElement>('.wwe-bar.wwe-media-type-chat');

    if (chatBars.length > 0) {
        console.log(`Found ${chatBars.length} chat bars`);
    }

    chatBars.forEach((bar) => {
        // Skip if this bar already has a container
        if (hasAutoCloseForBar(bar)) {
            console.log(`Bar ${bar.id} already has auto-close container, skipping`);
            return;
        }
        addAutoCloseToChat(bar);
    });
}

/**
 * Cleanup timers for containers that no longer exist in the DOM
 */
function cleanupOrphanedTimers(): void {
    const allContainers = document.querySelectorAll(`.${AUTO_CLOSE_CONTAINER_CLASS}`);
    const existingBarIds = new Set<string>();

    allContainers.forEach((container) => {
        const barId = container.getAttribute('data-bar-id');
        if (barId) {
            existingBarIds.add(barId);
        }
    });

    // Helper to check if status element exists
    const statusExists = (chatId: string): boolean => {
        return Boolean(
            document.querySelector(`.helper-auto-close-status[data-chat-id="${chatId}"]`),
        );
    };

    // Cleanup active timeouts
    for (const [chatId, timeout] of activeTimeouts.entries()) {
        if (!statusExists(chatId)) {
            console.log(`Cleaning up orphaned timer for chat ${chatId}`);
            clearTimeout(timeout);
            activeTimeouts.delete(chatId);
        }
    }

    // Cleanup intervals
    for (const [chatId, interval] of updateIntervals.entries()) {
        if (!statusExists(chatId)) {
            console.log(`Cleaning up orphaned interval for chat ${chatId}`);
            clearInterval(interval);
            updateIntervals.delete(chatId);
            remainingTimes.delete(chatId);
        }
    }

    // Cleanup transcript observers
    for (const [chatId, observer] of transcriptObservers.entries()) {
        if (!statusExists(chatId)) {
            console.log(`Cleaning up orphaned transcript observer for chat ${chatId}`);
            observer.disconnect();
            transcriptObservers.delete(chatId);
        }
    }
}

/**
 * Initialize the auto-close feature
 */
export function initAutoClose(): void {
    console.log('Initializing Genesys auto-close feature...');

    // Initial scan with delay to ensure DOM is ready
    setTimeout(() => {
        console.log('Running initial scan...');
        scanAndAddAutoClose();
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
                    console.log('New chat element detected:', element.className);
                    // Find the parent bar and add checkbox
                    const bar = element.closest<HTMLElement>('.wwe-bar.wwe-media-type-chat');
                    if (bar && !hasAutoCloseForBar(bar)) {
                        addAutoCloseToChat(bar);
                    }
                }

                // Check for nested elements
                const chatBars = element.querySelectorAll<HTMLElement>(
                    '.wwe-bar.wwe-media-type-chat',
                );
                chatBars.forEach((el) => {
                    if (!hasAutoCloseForBar(el)) {
                        addAutoCloseToChat(el);
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

    // Periodic rescan as fallback (every 30 seconds, less frequent to avoid issues)
    setInterval(() => {
        console.log('Running periodic scan...');
        scanAndAddAutoClose();
    }, 30000);

    console.log('Genesys auto-close feature initialized');
}

/**
 * Remove all auto-close checkboxes
 */
export function removeAutoClose(): void {
    // Cancel all active timeouts and intervals
    activeTimeouts.forEach((timeout) => clearTimeout(timeout));
    activeTimeouts.clear();

    updateIntervals.forEach((interval) => clearInterval(interval));
    updateIntervals.clear();

    remainingTimes.clear();

    // Disconnect all transcript observers
    transcriptObservers.forEach((observer) => observer.disconnect());
    transcriptObservers.clear();

    // Remove all checkbox containers from DOM
    const containers = document.querySelectorAll(`.${AUTO_CLOSE_CONTAINER_CLASS}`);
    containers.forEach((container) => container.remove());
    console.log('Genesys auto-close feature removed');
}
