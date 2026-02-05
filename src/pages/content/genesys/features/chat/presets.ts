/**
 * Adds a presets feature to the Genesys chat interface
 *
 * Creates a collapsible categories panel that loads user-created speech phrases,
 * showing only categories that have at least one phrase. All categories are
 * collapsed by default and expand on click to show phrases with shortcuts.
 */
import type {SpeechPhrase, SpeechPhraseCategory} from '@src/shared/speech-phrases';
import {buildCategoryTree, getSpeechPhraseCategories, getSpeechPhrases} from '@src/shared/speech-phrases';

export async function setupPresets(): Promise<void> {
    const STYLES_ID = "genesys-chat-presets-styles";
    if (document.getElementById(STYLES_ID)) return;

    const style = document.createElement("style");
    style.id = STYLES_ID;
    style.textContent = `
        @keyframes wwe-presets-fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .wwe-presets-wrapper {
            position: absolute;
            right: 40px;
            z-index: 999;
            display: none;
            box-sizing: border-box;
        }
        .wwe-presets-wrapper.show {
            display: block;
        }
        .wwe-presets-wrapper.show .wwe-presets-container {
            animation: wwe-presets-fadeIn 0.3s ease-in-out;
        }
        .wwe-presets-container {
            position: relative;
            background: linear-gradient(145deg, #fff, #f0f0f0);
            backdrop-filter: blur(10px);
            border: 1px solid lightgray;
            border-radius: 10px;
            padding: 5px;
            padding-bottom: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            max-height: 300px;
            width: 350px;
            overflow-y: auto;
        }
        .wwe-presets-empty {
            color: #999;
            font-size: 13px;
            text-align: center;
            padding: 10px;
        }
        .wwe-presets-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 6px 8px;
            border-bottom: 1px solid #e0e0e0;
            margin-bottom: 4px;
        }
        .wwe-presets-title {
            font-size: 12px;
            font-weight: 600;
            color: #666;
        }
        .wwe-presets-edit-btn {
            background: linear-gradient(145deg, #f0f0f0, #e0e0e0);
            border: 1px solid #ccc;
            border-radius: 4px;
            padding: 4px 8px;
            font-size: 11px;
            cursor: pointer;
            transition: all 0.2s;
            color: #555;
        }
        .wwe-presets-edit-btn:hover {
            background: linear-gradient(145deg, #e0e0e0, #d0d0d0);
            border-color: #999;
        }
        .wwe-presets-edit-btn:active {
            transform: scale(0.98);
        }
        .wwe-presets-category {
            border: 1px solid #e0e0e0;
            border-radius: 3px;
            margin-bottom: 4px;
            overflow: hidden;
        }
        .wwe-presets-category-header {
            display: flex;
            align-items: center;
            padding: 6px 8px;
            cursor: pointer;
            background: #f5f5f5;
            user-select: none;
            transition: background 0.2s;
        }
        .wwe-presets-category-header:hover {
            background: #ebebeb;
        }
        .wwe-presets-category-expanded .wwe-presets-category-header {
            background: #e0e0e0;
        }
        .wwe-presets-category-icon {
            margin-right: 6px;
            font-size: 10px;
            transition: transform 0.2s;
        }
        .wwe-presets-category-expanded .wwe-presets-category-icon {
            transform: rotate(90deg);
        }
        .wwe-presets-category-name {
            flex: 1;
            font-size: 13px;
            font-weight: 500;
            color: #333;
        }
        .wwe-presets-category-count {
            font-size: 11px;
            color: #999;
        }
        .wwe-presets-phrases {
            display: none;
            border-top: 1px solid #e0e0e0;
        }
        .wwe-presets-category-expanded .wwe-presets-phrases {
            display: block;
        }
        .wwe-presets-phrase {
            display: flex;
            align-items: center;
            padding: 5px 8px 5px 24px;
            cursor: pointer;
            border-bottom: 1px solid #f0f0f0;
            transition: background 0.2s;
        }
        .wwe-presets-phrase:last-child {
            border-bottom: none;
        }
        .wwe-presets-phrase:hover {
            background: #ededed;
        }
        .wwe-presets-phrase-shortcut {
            font-size: 11px;
            font-weight: 600;
            color: #666;
            background: #eee;
            padding: 2px 5px;
            border-radius: 3px;
            margin-right: 8px;
            min-width: 30px;
            text-align: center;
        }
        .wwe-presets-phrase-shortcut:empty {
            display: none;
        }
        .wwe-presets-phrase-name {
            flex: 1;
            font-size: 12px;
            color: #333;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .wwe-presets-phrase-preview {
            font-size: 11px;
            color: #999;
            margin-left: 8px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 150px;
        }
        .wwe-presets-phrase:active {
            background: #f0f0f0;
        }
    `;
    document.head.appendChild(style);

    // Track expanded categories
    const expandedCategories = new Set<string>();
    // Load phrases and categories from storage
    const loadPresetsData = async (): Promise<{
        categories: SpeechPhraseCategory[],
        phrasesByCategory: Map<string, SpeechPhrase[]>
    }> => {
        const [phrases, categories] = await Promise.all([
            getSpeechPhrases(),
            getSpeechPhraseCategories()
        ]);

        // Group phrases by category
        const phrasesByCategory = new Map<string, SpeechPhrase[]>();
        for (const phrase of phrases) {
            if (phrase.categoryId) {
                if (!phrasesByCategory.has(phrase.categoryId)) {
                    phrasesByCategory.set(phrase.categoryId, []);
                }
                phrasesByCategory.get(phrase.categoryId)!.push(phrase);
            }
        }

        // Only return categories that have at least one phrase
        const categoriesWithPhrases = categories.filter(cat => phrasesByCategory.has(cat.id));

        return {categories: categoriesWithPhrases, phrasesByCategory};
    };

    // Refresh all active presets panels
    const refreshAllPresetsPanels = async (): Promise<void> => {
        const messageEditors = document.querySelectorAll<HTMLElement>(".wwe-message-editor");

        for (const messageEditor of messageEditors) {
            const presetsWrapper = messageEditor.querySelector(".wwe-presets-wrapper") as HTMLElement;

            // Store expanded categories before refresh
            const wasExpanded = presetsWrapper?.classList.contains("show") || false;
            const expandedCategoriesCopy = new Set(expandedCategories);

            // Remove existing wrapper
            presetsWrapper?.remove();

            // If it was visible, recreate with fresh data
            if (wasExpanded) {
                const newWrapper = await createPresetsElement(messageEditor);
                newWrapper.classList.add("show");
                messageEditor.appendChild(newWrapper);

                // Restore expanded state
                for (const categoryId of expandedCategoriesCopy) {
                    const categoryElement = newWrapper.querySelector(`[data-category-id="${categoryId}"]`) as HTMLElement;
                    if (categoryElement) {
                        categoryElement.classList.add("wwe-presets-category-expanded");
                    }
                }

                // Update position
                updatePresetsPosition(messageEditor);
            }
        }
    };

    // Listen for storage changes
    const setupStorageListener = (): void => {
        chrome.storage.onChanged.addListener((changes, areaName) => {
            // Check if speech phrases or categories changed
            const phrasesChanged = 'speechPhrases' in changes ||
                ('userSettings' in changes && areaName === 'local');
            const categoriesChanged = 'speechPhraseCategories' in changes ||
                ('userSettings' in changes && areaName === 'local');

            if (phrasesChanged || categoriesChanged) {
                // Debounce refresh to avoid excessive updates
                setTimeout(() => {
                    refreshAllPresetsPanels();
                }, 100);
            }
        });
    };

    const createPresetsElement = async (messageEditor: HTMLElement): Promise<HTMLElement> => {
        const existingWrapper = messageEditor.querySelector(".wwe-presets-wrapper");
        if (existingWrapper) {
            return existingWrapper as HTMLElement;
        }

        const wrapper = document.createElement("div");
        wrapper.className = "wwe-presets-wrapper";

        const container = document.createElement("div");
        container.className = "wwe-presets-container";

        // Add header with edit button
        const header = document.createElement("div");
        header.className = "wwe-presets-header";

        const title = document.createElement("span");
        title.className = "wwe-presets-title";
        title.textContent = "Быстрые фразы";

        const editBtn = document.createElement("button");
        editBtn.className = "wwe-presets-edit-btn";
        editBtn.textContent = "✏️";
        editBtn.addEventListener("click", () => {
            chrome.runtime.sendMessage({action: 'openSpeechPhrasesManager'});
        });

        header.appendChild(title);
        header.appendChild(editBtn);
        container.appendChild(header);

        // Load and render presets
        const {categories, phrasesByCategory} = await loadPresetsData();

        if (categories.length === 0) {
            container.innerHTML = '<div class="wwe-presets-empty">Нет настроенных фраз</div>';
        } else {
            // Build category tree to handle hierarchical categories
            buildCategoryTree(categories);

            // Render categories recursively
            const renderCategory = (categoryId: string, depth: number = 0): HTMLElement => {
                const category = categories.find(c => c.id === categoryId);
                if (!category) return document.createElement('div');

                const phrases = phrasesByCategory.get(categoryId) || [];
                const categoryDiv = document.createElement("div");
                categoryDiv.className = "wwe-presets-category";
                categoryDiv.dataset.categoryId = categoryId;

                // Category header
                const header = document.createElement("div");
                header.className = "wwe-presets-category-header";
                header.style.paddingLeft = `${8 + depth * 12}px`;

                const icon = document.createElement("span");
                icon.className = "wwe-presets-category-icon";
                icon.textContent = "▶";

                const name = document.createElement("span");
                name.className = "wwe-presets-category-name";
                name.textContent = category.name;

                const count = document.createElement("span");
                count.className = "wwe-presets-category-count";
                count.textContent = `(${phrases.length})`;

                header.appendChild(icon);
                header.appendChild(name);
                header.appendChild(count);

                // Toggle expand/collapse
                header.addEventListener("click", () => {
                    if (categoryDiv.classList.contains("wwe-presets-category-expanded")) {
                        categoryDiv.classList.remove("wwe-presets-category-expanded");
                        expandedCategories.delete(categoryId);
                    } else {
                        categoryDiv.classList.add("wwe-presets-category-expanded");
                        expandedCategories.add(categoryId);
                    }
                    // Update wrapper position after expansion
                    updatePresetsPosition(messageEditor);
                });

                categoryDiv.appendChild(header);

                // Phrases container
                const phrasesDiv = document.createElement("div");
                phrasesDiv.className = "wwe-presets-phrases";

                // Add phrases
                for (const phrase of phrases) {
                    const phraseDiv = document.createElement("div");
                    phraseDiv.className = "wwe-presets-phrase";
                    phraseDiv.title = `ЛКМ: заменить весь текст\nCtrl+ЛКМ: вставить в курсор`;

                    const shortcut = document.createElement("span");
                    shortcut.className = "wwe-presets-phrase-shortcut";
                    if (phrase.shortcut) {
                        shortcut.textContent = phrase.shortcut;
                    }

                    const name = document.createElement("span");
                    name.className = "wwe-presets-phrase-name";
                    name.textContent = phrase.name;

                    const preview = document.createElement("span");
                    preview.className = "wwe-presets-phrase-preview";
                    preview.textContent = phrase.text.length > 30 ? phrase.text.substring(0, 30) + "..." : phrase.text;
                    preview.title = `${phrase.text}\n\nЛКМ: заменить весь текст\nCtrl+ЛКМ: вставить в курсор`;

                    phraseDiv.appendChild(shortcut);
                    phraseDiv.appendChild(name);
                    phraseDiv.appendChild(preview);

                    phraseDiv.addEventListener("click", (e) => {
                        const messageBox = messageEditor.querySelector(".wwe-message-box") as HTMLElement;
                        const textarea = messageBox?.querySelector(".wwe-textarea") as HTMLTextAreaElement;
                        if (textarea) {
                            // Normal click replaces all text, Ctrl + click inserts at cursor
                            if (e.ctrlKey) {
                                const cursorPosition = textarea.selectionStart;
                                textarea.value = textarea.value.substring(0, cursorPosition) + phrase.text + textarea.value.substring(cursorPosition);
                            } else {
                                textarea.value = phrase.text;
                            }

                            // Trigger input event to auto-resize if needed
                            textarea.dispatchEvent(new Event("input", {bubbles: true}));

                            // Focus textarea
                            textarea.focus();

                            // Close presets after selection (optional)
                            // togglePresets(messageEditor, false);
                        }
                    });

                    phrasesDiv.appendChild(phraseDiv);
                }

                categoryDiv.appendChild(phrasesDiv);
                return categoryDiv;
            };

            // Render all categories (flattened for now, as we're filtering by phrases)
            for (const category of categories) {
                const categoryElement = renderCategory(category.id);
                container.appendChild(categoryElement);
            }
        }

        wrapper.appendChild(container);

        return wrapper;
    };

    // Calculate the top position for presets button and container
    const calculatePresetsTopPosition = (messageEditor: HTMLElement): number => {
        // Try to get position from selectSmile if custom message area is enabled
        const selectSmile = messageEditor.querySelector(".selectSmile") as HTMLElement;
        if (selectSmile?.style.top) {
            return parseInt(selectSmile.style.top, 10);
        }

        // Fallback: calculate based on textarea/message-box height
        const messageBox = messageEditor.querySelector(".wwe-message-box") as HTMLElement;
        if (messageBox) {
            // Get the actual height of messageBox content
            const textareaWrapper = messageBox.querySelector(".wwe-textarea-wrapper") as HTMLElement;
            const pushUrlWrapper = messageBox.querySelector(".wwe-push-url-wrapper") as HTMLElement;
            const sendFileWrapper = messageBox.querySelector(".wwe-send-file-wrapper") as HTMLElement;

            let currentTop = 100; // Default base height

            // Add textarea wrapper height if it exists and is visible
            if (textareaWrapper) {
                const computedStyle = window.getComputedStyle(textareaWrapper);
                if (computedStyle.display !== 'none') {
                    currentTop = textareaWrapper.offsetHeight;
                }
            }

            // Add push URL wrapper height if visible
            if (pushUrlWrapper) {
                const computedStyle = window.getComputedStyle(pushUrlWrapper);
                if (computedStyle.display !== 'none') {
                    currentTop += pushUrlWrapper.offsetHeight + 5;
                }
            }

            // Add send file wrapper height if visible
            if (sendFileWrapper) {
                const computedStyle = window.getComputedStyle(sendFileWrapper);
                if (computedStyle.display !== 'none') {
                    currentTop += sendFileWrapper.offsetHeight + 5;
                }
            }

            return currentTop - 4; // -4 to align with emoji button
        }

        return 96; // Default fallback position
    };

    // Update presets button and container position based on selectSmile position
    const updatePresetsPosition = (messageEditor: HTMLElement): void => {
        const selectSmile = messageEditor.querySelector(".selectSmile") as HTMLElement;
        const containerSmile = messageEditor.querySelector(".containerSmile") as HTMLElement;
        const presetsToggle = messageEditor.querySelector(".wwe-presets-toggle") as HTMLElement;
        const presetsWrapper = messageEditor.querySelector(".wwe-presets-wrapper") as HTMLElement;

        // Calculate the top position
        const topPosition = calculatePresetsTopPosition(messageEditor);

        if (selectSmile && presetsToggle) {
            // Position toggle button to the left of selectSmile
            // Emoji is at right: 75px, so we place presets at around right: 40px
            presetsToggle.style.right = "40px";
            presetsToggle.style.top = `${topPosition}px`;
        }

        if (presetsWrapper) {
            // Position container at the same place as containerSmile or calculate it
            if (containerSmile?.style.top) {
                presetsWrapper.style.top = containerSmile.style.top;
            } else {
                // Position below the button (same as emoji container)
                presetsWrapper.style.top = `${topPosition + 30}px`;
            }
            presetsWrapper.style.right = containerSmile?.style.right || "105px";
        }
    };

    // Toggle presets visibility
    const togglePresets = async (messageEditor: HTMLElement, show?: boolean): Promise<void> => {
        let presetsWrapper = messageEditor.querySelector(".wwe-presets-wrapper") as HTMLElement;
        const containerSmile = messageEditor.querySelector(".containerSmile") as HTMLElement;

        // Create presets element if it doesn't exist
        if (!presetsWrapper) {
            presetsWrapper = await createPresetsElement(messageEditor);
            messageEditor.appendChild(presetsWrapper);
        }

        const isVisible = show !== undefined ? show : !presetsWrapper.classList.contains("show");

        if (isVisible) {
            // Hide emoji container when showing presets
            if (containerSmile) {
                containerSmile.classList.add("containerSmileHidden");
            }
            presetsWrapper.classList.add("show");
        } else {
            presetsWrapper.classList.remove("show");
        }

        updatePresetsPosition(messageEditor);
    };

    // Add toggle button to message editor
    const addPresetsToggleButton = (messageEditor: HTMLElement): void => {
        if (messageEditor.querySelector(".wwe-presets-toggle")) return;

        const button = document.createElement("div");
        button.className = "wwe-presets-toggle";
        button.innerHTML = '<span style="font-size: 20px; padding: 0; background-color: #ECECEC; border: none; cursor: pointer;">📝</span>';
        button.style.cssText = `
            position: absolute;
            right: 40px;
            cursor: pointer;
            z-index: 20;
        `;

        button.addEventListener("click", (e) => {
            e.stopPropagation();
            togglePresets(messageEditor);
        });

        button.addEventListener("mousedown", (e) => {
            e.preventDefault();
        });

        messageEditor.appendChild(button);
    };

    // Setup presets for a message editor
    const setupPresetsForMessageBox = (messageBox: HTMLElement): void => {
        if (!messageBox.classList.contains("wwe-message-box")) return;
        const messageEditor = messageBox.parentElement as HTMLElement;
        if (!messageEditor || !messageEditor.classList.contains("wwe-message-editor")) return;
        if (messageEditor.querySelector(".wwe-presets-toggle")) return;

        addPresetsToggleButton(messageEditor);

        // Add listener to hide presets when emoji button is clicked
        const selectSmile = messageEditor.querySelector(".selectSmile") as HTMLElement;
        if (selectSmile && !selectSmile.dataset.presetsListener) {
            selectSmile.addEventListener("click", () => {
                const presetsWrapper = messageEditor.querySelector(".wwe-presets-wrapper") as HTMLElement;
                if (presetsWrapper && presetsWrapper.classList.contains("show")) {
                    togglePresets(messageEditor, false);
                }
            });
            selectSmile.dataset.presetsListener = "true";
        }

        // Add listener to hide presets when emoji items are clicked
        const containerSmile = messageEditor.querySelector(".containerSmile") as HTMLElement;
        if (containerSmile && !containerSmile.dataset.presetsListener) {
            containerSmile.addEventListener("click", () => {
                const presetsWrapper = messageEditor.querySelector(".wwe-presets-wrapper") as HTMLElement;
                if (presetsWrapper && presetsWrapper.classList.contains("show")) {
                    togglePresets(messageEditor, false);
                }
            });
            containerSmile.dataset.presetsListener = "true";
        }

        // Update position after initial setup
        setTimeout(() => updatePresetsPosition(messageEditor), 100);

        // Auto-show presets if user has any phrases
        setTimeout(async () => {
            const {categories} = await loadPresetsData();
            if (categories.length > 0) {
                await togglePresets(messageEditor, true);
            }
        }, 200);
    };

    // Hook into existing resize events and position changes
    const observeResizeEvents = (): void => {
        // Listen for custom events or DOM mutations that indicate resizing
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    const target = mutation.target as HTMLElement;
                    if (target.classList.contains("wwe-textarea-wrapper") ||
                        target.classList.contains("wwe-message-box") ||
                        target.classList.contains("selectSmile") ||
                        target.classList.contains("wwe-push-url-wrapper") ||
                        target.classList.contains("wwe-send-file-wrapper")) {

                        const messageEditor = target.closest(".wwe-message-editor") as HTMLElement;
                        if (messageEditor) {
                            updatePresetsPosition(messageEditor);
                        }
                    }
                }
            }
        });

        observer.observe(document.body, {
            attributes: true,
            attributeFilter: ['style', 'class'],
            subtree: true
        });
    };

    // Initialize existing message boxes
    document.querySelectorAll<HTMLElement>(".wwe-message-box").forEach(setupPresetsForMessageBox);

    // Watch for new message boxes
    const messageBoxObserver = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType !== Node.ELEMENT_NODE) continue;
                const element = node as Element;

                if (element.classList.contains("wwe-message-box")) {
                    setupPresetsForMessageBox(element as HTMLElement);
                }

                const messageBoxes = element.querySelectorAll<HTMLElement>(".wwe-message-box");
                messageBoxes.forEach(setupPresetsForMessageBox);
            }
        }
    });

    messageBoxObserver.observe(document.body, {childList: true, subtree: true});

    observeResizeEvents();
    setupStorageListener();

    // Close presets when clicking outside
    document.addEventListener("click", (e) => {
        const target = e.target as HTMLElement;
        const presetsWrappers = document.querySelectorAll(".wwe-presets-wrapper.show");

        for (const presetsWrapper of presetsWrappers) {
            const messageEditor = presetsWrapper.closest(".wwe-message-editor") as HTMLElement;
            const toggle = messageEditor?.querySelector(".wwe-presets-toggle");

            // Check if click is outside presets and not on toggle button
            if (!presetsWrapper.contains(target) && (!toggle || !toggle.contains(target))) {
                presetsWrapper.classList.remove("show");
            }
        }
    });
}
