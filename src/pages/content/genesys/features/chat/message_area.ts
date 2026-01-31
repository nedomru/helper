/**
 * Enables resizable chat input areas for all Genesys chats
 *
 * Adds resize handles to all existing and future chat textarea wrappers,
 * allowing users to manually adjust the height of the input area
 */
export async function allowChatSizeEdit(): Promise<void> {
    const STYLES_ID = "genesys-chat-resize-styles";
    if (document.getElementById(STYLES_ID)) return;

    const style = document.createElement("style");
    style.id = STYLES_ID;
    style.textContent = `
        .wwe-textarea-wrapper {
            position: relative;
            min-height: 100px;
            border: 1px solid #ccc;
            border-radius: 4px;
            margin-bottom: 10px;
            box-sizing: border-box;
        }
        .wwe-textarea-wrapper::after {
            content: '⟴';
            position: absolute;
            bottom: 3px;
            right: 8px;
            font-size: 14px;
            color: #999;
            opacity: 0.4;
            pointer-events: none;
            transition: opacity 0.2s, color 0.2s;
            z-index: 5;
        }
        .wwe-textarea-wrapper:hover::after {
            opacity: 0.8;
            color: #666;
        }
        .wwe-textarea {
            width: 100%;
            min-height: 100px;
            border: none;
            outline: none;
            resize: none;
            padding: 8px 8px 20px;
            box-sizing: border-box;
            font-family: inherit;
            font-size: inherit;
            line-height: 1.5;
            overflow-y: hidden;
        }
        .resize-handle {
            position: absolute;
            bottom: 0;
            right: 0;
            width: 16px;
            height: 16px;
            cursor: se-resize;
            opacity: 0;
            transition: opacity 0.2s;
            z-index: 10;
            background: transparent;
            border-bottom-right-radius: 4px;
        }
        .resize-handle:hover,
        .wwe-textarea-wrapper:hover .resize-handle {
            opacity: 0.3;
            background: linear-gradient(135deg, transparent 50%, rgba(0, 0, 0, 0.1) 50%);
        }
        .resize-handle:active {
            opacity: 0.5;
            background: linear-gradient(135deg, transparent 50%, rgba(0, 0, 0, 0.2) 50%);
        }
    `;
    document.head.appendChild(style);

    const getMaxHeight = (): number => {
        const messageBox = document.querySelector(".wwe-message-box");
        if (!messageBox) return 300;
        const buttons = document.querySelector(".wwe-buttons");
        const windowHeight = window.innerHeight;
        const topOffset = messageBox.getBoundingClientRect().top;
        const bottomButtons = buttons?.offsetHeight || 0;
        return windowHeight - topOffset - bottomButtons - 20;
    };

    let activeWrapper: HTMLElement | null = null;
    let startY = 0;
    let startHeight = 0;

    const handleMouseMove = (e: MouseEvent): void => {
        if (!activeWrapper) return;
        const newHeight = Math.max(100, startHeight + (e.clientY - startY));
        const finalHeight = Math.min(newHeight, getMaxHeight());
        activeWrapper.style.height = `${finalHeight}px`;
        activeWrapper.dataset.userResized = "true";

        // Adjust absolutely positioned elements within message box
        const messageBox = activeWrapper.closest(".wwe-message-box") as HTMLElement;
        if (messageBox) {
            const pushUrlWrapper = messageBox.querySelector(".wwe-push-url-wrapper") as HTMLElement;
            const sendFileWrapper = messageBox.querySelector(".wwe-send-file-wrapper") as HTMLElement;
            const selectSmile = messageBox.parentElement?.querySelector(".selectSmile") as HTMLElement;
            const containerSmile = messageBox.parentElement?.querySelector(".containerSmile") as HTMLElement;

            // Position elements right after the textarea (not including presets)
            let currentTop = finalHeight + 5;

            if (pushUrlWrapper) {
                const computedStyle = window.getComputedStyle(pushUrlWrapper);
                if (computedStyle.display !== 'none') {
                    pushUrlWrapper.style.top = `${currentTop}px`;
                    currentTop += pushUrlWrapper.offsetHeight + 5;
                }
            }

            if (sendFileWrapper) {
                const computedStyle = window.getComputedStyle(sendFileWrapper);
                if (computedStyle.display !== 'none') {
                    sendFileWrapper.style.top = `${currentTop}px`;
                    currentTop += sendFileWrapper.offsetHeight + 5;
                }
            }

            messageBox.style.height = `${currentTop + 30}px`;

            // Adjust emoji button and picker position
            const baseTop = 96; // Original top position
            const heightDiff = finalHeight - 100; // Difference from default height
            const newTop = baseTop + heightDiff;

            if (selectSmile) {
                selectSmile.style.top = `${newTop}px`;
            }
            if (containerSmile) {
                // Position the emoji container below the button
                containerSmile.style.top = `${newTop + 30}px`;
            }
        }
    };

    const handleMouseUp = (): void => {
        activeWrapper = null;
        document.body.style.cursor = "";
    };

    const handleMouseDown = (e: MouseEvent): void => {
        const handle = e.target as HTMLElement;
        if (!handle.classList.contains("resize-handle")) return;
        const wrapper = handle.closest(".wwe-textarea-wrapper") as HTMLElement;
        if (!wrapper) return;

        activeWrapper = wrapper;
        startY = e.clientY;
        startHeight = wrapper.offsetHeight;
        document.body.style.cursor = "se-resize";
        e.preventDefault();
    };

    const handleDoubleClick = (e: MouseEvent): void => {
        const handle = e.target as HTMLElement;
        if (!handle.classList.contains("resize-handle")) return;
        const wrapper = handle.closest(".wwe-textarea-wrapper") as HTMLElement;
        if (!wrapper) return;

        delete wrapper.dataset.userResized;
        const textarea = wrapper.querySelector(".wwe-textarea") as HTMLTextAreaElement;
        if (!textarea) return;

        textarea.style.height = "auto";
        wrapper.style.height = "auto";
        const desiredHeight = Math.max(100, textarea.scrollHeight + 20);
        wrapper.style.height = `${Math.min(desiredHeight, getMaxHeight())}px`;
        textarea.style.height = "100%";

        const messageBox = wrapper.closest(".wwe-message-box") as HTMLElement;
        if (messageBox) {
            const pushUrlWrapper = messageBox.querySelector(".wwe-push-url-wrapper") as HTMLElement;
            const sendFileWrapper = messageBox.querySelector(".wwe-send-file-wrapper") as HTMLElement;
            const selectSmile = messageBox.parentElement?.querySelector(".selectSmile") as HTMLElement;
            const containerSmile = messageBox.parentElement?.querySelector(".containerSmile") as HTMLElement;

            let currentTop = desiredHeight + 5;

            if (pushUrlWrapper) {
                const computedStyle = window.getComputedStyle(pushUrlWrapper);
                if (computedStyle.display !== 'none') {
                    pushUrlWrapper.style.top = `${currentTop}px`;
                    currentTop += pushUrlWrapper.offsetHeight + 5;
                }
            }

            if (sendFileWrapper) {
                const computedStyle = window.getComputedStyle(sendFileWrapper);
                if (computedStyle.display !== 'none') {
                    sendFileWrapper.style.top = `${currentTop}px`;
                    currentTop += sendFileWrapper.offsetHeight + 5;
                }
            }

            messageBox.style.height = `${currentTop + 30}px`;

            // Reset emoji button and picker position
            const baseTop = 96;
            const heightDiff = desiredHeight - 100;
            const newTop = baseTop + heightDiff;

            if (selectSmile) {
                selectSmile.style.top = `${newTop}px`;
            }
            if (containerSmile) {
                containerSmile.style.top = `${newTop + 30}px`;
            }
        }
    };

    const handleInput = (e: Event): void => {
        const textarea = e.target as HTMLTextAreaElement;
        if (!textarea.classList.contains("wwe-textarea")) return;
        const wrapper = textarea.closest(".wwe-textarea-wrapper") as HTMLElement;
        if (!wrapper || wrapper.dataset.userResized) return;

        textarea.style.height = "auto";
        wrapper.style.height = "auto";
        const desiredHeight = Math.max(100, textarea.scrollHeight + 20);
        wrapper.style.height = `${Math.min(desiredHeight, getMaxHeight())}px`;
        textarea.style.height = "100%";

        const messageBox = wrapper.closest(".wwe-message-box") as HTMLElement;
        if (messageBox) {
            const pushUrlWrapper = messageBox.querySelector(".wwe-push-url-wrapper") as HTMLElement;
            const sendFileWrapper = messageBox.querySelector(".wwe-send-file-wrapper") as HTMLElement;
            const selectSmile = messageBox.parentElement?.querySelector(".selectSmile") as HTMLElement;
            const containerSmile = messageBox.parentElement?.querySelector(".containerSmile") as HTMLElement;

            let currentTop = desiredHeight + 5;

            if (pushUrlWrapper) {
                const computedStyle = window.getComputedStyle(pushUrlWrapper);
                if (computedStyle.display !== 'none') {
                    pushUrlWrapper.style.top = `${currentTop}px`;
                    currentTop += pushUrlWrapper.offsetHeight + 5;
                }
            }

            if (sendFileWrapper) {
                const computedStyle = window.getComputedStyle(sendFileWrapper);
                if (computedStyle.display !== 'none') {
                    sendFileWrapper.style.top = `${currentTop}px`;
                    currentTop += sendFileWrapper.offsetHeight + 5;
                }
            }

            messageBox.style.height = `${currentTop + 30}px`;

            // Adjust emoji button and picker position during auto-resize
            const baseTop = 96;
            const heightDiff = desiredHeight - 100;
            const newTop = baseTop + heightDiff;

            if (selectSmile) {
                selectSmile.style.top = `${newTop}px`;
            }
            if (containerSmile) {
                containerSmile.style.top = `${newTop + 30}px`;
            }
        }
    };

    const setupWrapper = (wrapper: HTMLElement): void => {
        if (wrapper.querySelector(".resize-handle")) return;

        const handle = document.createElement("div");
        handle.className = "resize-handle";
        wrapper.appendChild(handle);

        const textarea = wrapper.querySelector(".wwe-textarea") as HTMLTextAreaElement;
        if (!textarea || wrapper.dataset.userResized) return;

        textarea.style.height = "auto";
        wrapper.style.height = "auto";
        const desiredHeight = Math.max(100, textarea.scrollHeight + 20);
        wrapper.style.height = `${Math.min(desiredHeight, getMaxHeight())}px`;
        textarea.style.height = "100%";

        const messageBox = wrapper.closest(".wwe-message-box") as HTMLElement;
        if (messageBox) {
            const pushUrlWrapper = messageBox.querySelector(".wwe-push-url-wrapper") as HTMLElement;
            const sendFileWrapper = messageBox.querySelector(".wwe-send-file-wrapper") as HTMLElement;
            const selectSmile = messageBox.parentElement?.querySelector(".selectSmile") as HTMLElement;
            const containerSmile = messageBox.parentElement?.querySelector(".containerSmile") as HTMLElement;

            let currentTop = desiredHeight + 5;

            if (pushUrlWrapper) {
                const computedStyle = window.getComputedStyle(pushUrlWrapper);
                if (computedStyle.display !== 'none') {
                    pushUrlWrapper.style.top = `${currentTop}px`;
                    currentTop += pushUrlWrapper.offsetHeight + 5;
                }
            }

            if (sendFileWrapper) {
                const computedStyle = window.getComputedStyle(sendFileWrapper);
                if (computedStyle.display !== 'none') {
                    sendFileWrapper.style.top = `${currentTop}px`;
                    currentTop += sendFileWrapper.offsetHeight + 5;
                }
            }

            messageBox.style.height = `${currentTop + 30}px`;

            // Set initial emoji button and picker position
            const baseTop = 96;
            const heightDiff = desiredHeight - 100;
            const newTop = baseTop + heightDiff;

            if (selectSmile) {
                selectSmile.style.top = `${newTop}px`;
            }
            if (containerSmile) {
                containerSmile.style.top = `${newTop + 30}px`;
            }
        }
    };

    document.addEventListener("mousedown", handleMouseDown, true);
    document.addEventListener("mousemove", handleMouseMove, true);
    document.addEventListener("mouseup", handleMouseUp, true);
    document.addEventListener("dblclick", handleDoubleClick, true);
    document.addEventListener("input", handleInput, true);

    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType !== Node.ELEMENT_NODE) continue;
                const element = node as Element;

                if (element.classList.contains("wwe-textarea-wrapper")) {
                    setupWrapper(element as HTMLElement);
                }
                element.querySelectorAll(".wwe-textarea-wrapper").forEach((w) => setupWrapper(w as HTMLElement));
            }
        }
    });

    observer.observe(document.body, {childList: true, subtree: true});

    document.querySelectorAll<HTMLElement>(".wwe-textarea-wrapper").forEach(setupWrapper);
}
