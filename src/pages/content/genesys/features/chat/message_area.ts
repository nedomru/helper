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
        .wwe-textarea-wrapper { position: relative; min-height: 100px; border: 1px solid #ccc; border-radius: 4px; margin-bottom: 10px; box-sizing: border-box; }
        .wwe-textarea { width: 100%; min-height: 100px; border: none; outline: none; resize: none; padding: 8px 8px 20px; box-sizing: border-box; font-family: inherit; font-size: inherit; line-height: 1.5; overflow-y: hidden; }
        .resize-handle { position: absolute; bottom: 2px; right: 2px; width: 12px; height: 12px; cursor: se-resize; opacity: 0.6; transition: opacity 0.2s; z-index: 10; }
        .resize-handle::after { content: ''; position: absolute; right: 0; bottom: 0; width: 0; height: 0; border-style: solid; border-width: 0 0 12px 12px; border-color: transparent transparent #666 transparent; }
        .resize-handle:hover { opacity: 1; }
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
