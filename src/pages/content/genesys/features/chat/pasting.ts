/**
 * Enables pasting images in chat input areas
 *
 * Allows users to paste images from clipboard directly into chat,
 * with preview functionality before sending
 */
export async function allowPaste(): Promise<void> {
    const PREVIEW_ID = "genesys-paste-preview-styles";
    if (document.getElementById(PREVIEW_ID)) return;

    const style = document.createElement("style");
    style.id = PREVIEW_ID;
    style.textContent = `
        .preview-container {
            display: none;
            margin-top: 12px;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            background: linear-gradient(to bottom, #ffffff, #fafafa);
            overflow: hidden;
            animation: slideIn 0.2s ease-out;
            width: 100%;
            box-sizing: border-box;
        }
        .wwe-chat-view > .wwe-message-editor + .preview-container {
            width: 85%;
        }
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(-10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        .preview-header {
            cursor: pointer;
            padding: 10px 14px;
            background: linear-gradient(to bottom, #f9fafb, #f3f4f6);
            border-bottom: 1px solid #e5e7eb;
            display: flex;
            align-items: center;
            justify-content: space-between;
            transition: background-color 0.2s ease;
        }
        .preview-header:hover {
            background: linear-gradient(to bottom, #f3f4f6, #e5e7eb);
        }
        .preview-title-wrapper {
            display: flex;
            align-items: center;
            flex: 1;
            cursor: pointer;
        }
        .preview-toggle {
            margin-right: 10px;
            width: 20px;
            text-align: center;
            color: #6b7280;
            transition: transform 0.2s ease;
            font-size: 12px;
        }
        .preview-toggle.expanded {
            transform: rotate(90deg);
        }
        .preview-title {
            font-weight: 600;
            color: #1f2937;
            font-size: 14px;
            user-select: none;
        }
        .preview-close {
            background: #ef4444;
            border: none;
            color: white;
            font-size: 18px;
            cursor: pointer;
            padding: 4px 10px;
            line-height: 1;
            border-radius: 6px;
            transition: all 0.2s ease;
            font-weight: bold;
            margin-left: 8px;
        }
        .preview-close:hover {
            background: #dc2626;
            transform: scale(1.05);
        }
        .preview-close:active {
            transform: scale(0.95);
        }
        .preview-content {
            display: none;
            padding: 16px;
            max-height: 400px;
            overflow: auto;
            background-color: #ffffff;
        }
        .preview-image {
            max-width: 100%;
            max-height: 350px;
            object-fit: contain;
            border-radius: 6px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            display: block;
            margin: 0 auto;
        }
    `;
    document.head.appendChild(style);

    const ensurePreviewExists = (messageEditor: Element): HTMLElement | null => {
        if (!messageEditor) return null;

        const nextSibling = (messageEditor as HTMLElement).nextElementSibling;
        if (nextSibling?.classList.contains("preview-container")) return nextSibling as HTMLElement;

        const preview = document.createElement("div");
        preview.className = "preview-container";
        preview.innerHTML = `
            <div class="preview-header">
                <div class="preview-title-wrapper">
                    <span class="preview-toggle">▶</span>
                    <span class="preview-title">Превью картинки</span>
                </div>
                <button class="preview-close" aria-label="Закрыть превью">×</button>
            </div>
            <div class="preview-content">
                <img class="preview-image" alt="Превью изображения"/>
            </div>
        `;

        (messageEditor as HTMLElement).insertAdjacentElement("afterend", preview);

        return preview;
    };

    const removePreview = (messageEditor: Element): void => {
        const nextSibling = (messageEditor as HTMLElement).nextElementSibling;
        if (nextSibling?.classList.contains("preview-container")) {
            nextSibling.remove();
        }
    };

    const handlePaste = (e: ClipboardEvent): void => {
        const textarea = e.target as HTMLElement;
        if (!textarea.classList.contains("wwe-textarea")) return;

        const messageEditor = textarea.closest(".wwe-message-editor");
        if (!messageEditor) return;

        const wrapper = messageEditor as HTMLElement;
        const fileInput = wrapper.querySelector<HTMLInputElement>(".wwe-file");
        const fileLabel = wrapper.querySelector(".file-label");
        const clearButton = wrapper.querySelector<HTMLElement>(".wwe-button-clear-file");
        const sendButton = wrapper.querySelector<HTMLElement>(".wwe-button-send-file");

        if (!fileInput || !fileLabel) return;

        const items = e.clipboardData?.items;
        if (!items) return;

        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf("image") !== -1) {
                e.preventDefault();
                const file = items[i].getAsFile();
                if (!file) continue;

                try {
                    const dataTransfer = new DataTransfer();
                    dataTransfer.items.add(file);
                    fileInput.files = dataTransfer.files;
                    if (fileLabel) fileLabel.textContent = file.name;

                    const preview = ensurePreviewExists(wrapper);
                    if (preview) {
                        const previewImage = preview.querySelector<HTMLImageElement>(".preview-image");
                        if (previewImage) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                                if (previewImage) {
                                    previewImage.src = event.target?.result as string;
                                    preview.style.display = "block";
                                    const previewContent = preview.querySelector(".preview-content") as HTMLElement;
                                    const previewToggle = preview.querySelector(".preview-toggle") as HTMLElement;
                                    if (previewContent) previewContent.style.display = "none";
                                    if (previewToggle) previewToggle.textContent = "▶";
                                }
                            };
                            reader.readAsDataURL(file);
                        }
                    }

                    if (clearButton) (clearButton as HTMLButtonElement).disabled = false;
                    if (sendButton) (sendButton as HTMLButtonElement).disabled = false;

                    const sendFileWrapper = wrapper.querySelector<HTMLElement>(".wwe-send-file-wrapper");
                    const textareaWrapper = wrapper.querySelector<HTMLElement>(".wwe-textarea-wrapper");
                    const buttonShow = wrapper.querySelector<HTMLElement>(".wwe-button-send-file-show");
                    const buttonHide = wrapper.querySelector<HTMLElement>(".wwe-button-send-file-hide");

                    if (sendFileWrapper) sendFileWrapper.style.display = "block";
                    textareaWrapper?.classList.add("wwe-textarea-with-push-url");
                    if (buttonShow) buttonShow.style.display = "none";
                    if (buttonHide) buttonHide.style.display = "inline-block";
                } catch (error) {
                    console.error("[Хелпер] - Ошибка вставки картинки из буфера:", error);
                }
                break;
            }
        }
    };

    const handleFileChange = (e: Event): void => {
        const fileInput = e.target as HTMLInputElement;
        const file = fileInput.files?.[0];
        const messageEditor = fileInput?.closest(".wwe-message-editor") as HTMLElement;
        if (!messageEditor) return;

        const fileLabel = messageEditor.querySelector<HTMLElement>(".file-label");
        const clearButton = messageEditor.querySelector<HTMLElement>(".wwe-button-clear-file");
        const sendButton = messageEditor.querySelector<HTMLElement>(".wwe-button-send-file");
        const sendFileWrapper = messageEditor.querySelector<HTMLElement>(".wwe-send-file-wrapper");
        const textareaWrapper = messageEditor.querySelector<HTMLElement>(".wwe-textarea-wrapper");
        const buttonShow = messageEditor.querySelector<HTMLElement>(".wwe-button-send-file-show");
        const buttonHide = messageEditor.querySelector<HTMLElement>(".wwe-button-send-file-hide");

        if (file) {
            if (fileLabel) fileLabel.textContent = file.name;
            if (clearButton) (clearButton as HTMLButtonElement).disabled = false;
            if (sendButton) (sendButton as HTMLButtonElement).disabled = false;

            if (file.type.startsWith("image/")) {
                const preview = ensurePreviewExists(messageEditor);
                if (preview) {
                    const previewImage = preview.querySelector<HTMLImageElement>(".preview-image");
                    if (previewImage) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                            if (previewImage) {
                                previewImage.src = event.target?.result as string;
                                preview.style.display = "block";
                                const previewContent = preview.querySelector(".preview-content") as HTMLElement;
                                const previewToggle = preview.querySelector(".preview-toggle") as HTMLElement;
                                if (previewContent) previewContent.style.display = "none";
                                if (previewToggle) previewToggle.textContent = "▶";
                            }
                        };
                        reader.readAsDataURL(file);
                    }
                }
            } else {
                removePreview(messageEditor);
            }

            if (sendFileWrapper) sendFileWrapper.style.display = "block";
            textareaWrapper?.classList.add("wwe-textarea-with-push-url");
            if (buttonShow) buttonShow.style.display = "none";
            if (buttonHide) buttonHide.style.display = "inline-block";
        } else {
            if (fileLabel) fileLabel.textContent = "Выбери файл";
            if (clearButton) (clearButton as HTMLButtonElement).disabled = true;
            if (sendButton) (sendButton as HTMLButtonElement).disabled = true;
            removePreview(messageEditor);

            if (sendFileWrapper) sendFileWrapper.style.display = "none";
            textareaWrapper?.classList.remove("wwe-textarea-with-push-url");
            if (buttonShow) buttonShow.style.display = "block";
            if (buttonHide) buttonHide.style.display = "none";
        }
    };

    const handleClick = (e: MouseEvent): void => {
        const target = e.target as HTMLElement;

        // Handle preview title toggle - only when clicking on title wrapper or toggle
        if (target.classList.contains("preview-title-wrapper") ||
            target.classList.contains("preview-toggle") ||
            target.classList.contains("preview-title")) {
            const preview = target.closest(".preview-container") as HTMLElement;
            if (!preview) return;

            const content = preview.querySelector(".preview-content") as HTMLElement;
            const toggle = preview.querySelector(".preview-toggle") as HTMLElement;

            if (content.style.display === "none" || !content.style.display) {
                content.style.display = "block";
                toggle.textContent = "▼";
                toggle.classList.add("expanded");
            } else {
                content.style.display = "none";
                toggle.textContent = "▶";
                toggle.classList.remove("expanded");
            }
            return;
        }

        // Handle close button - stop propagation to prevent toggle
        if (target.classList.contains("preview-close") ||
            target.closest(".preview-close")) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            const previewContainer = target.closest(".preview-container") as HTMLElement;
            if (previewContainer) {
                const messageEditor = previewContainer.previousElementSibling as HTMLElement;
                if (messageEditor?.classList.contains("wwe-message-editor")) {
                    removePreview(messageEditor);
                }
            }
            return;
        }

        // Handle send and clear file buttons
        if (target.classList.contains("wwe-button-send-file") ||
            target.classList.contains("wwe-button-clear-file")) {
            const messageEditor = target.closest(".wwe-message-editor");
            if (messageEditor) removePreview(messageEditor);
        }
    };

    document.addEventListener("paste", handlePaste, true);
    document.addEventListener("change", handleFileChange, true);
    document.addEventListener("click", handleClick, true);
}
