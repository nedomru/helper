import {notify} from "@src/utils";

/**
 * Adds click-to-copy functionality to MAC address elements
 */
function addCopyFunctionality(macElement: HTMLElement): void {
    const macText = macElement.textContent?.trim();
    if (!macText) return;

    macElement.style.cursor = "pointer";

    macElement.onclick = (event: PointerEvent): void => {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        navigator.clipboard.writeText(macText).then((): void => {
            macElement.style.transition = "color 0.2s ease, background-color 0.2s ease";
            macElement.style.color = "#16a34a";
            macElement.style.backgroundColor = "#dcfce7";

            setTimeout(() => {
                macElement.style.color = "";
                macElement.style.backgroundColor = "";
            }, 600);
            notify("📋 Копирование", `MAC-адрес скопирован: ${macText}`, "success");
        }).catch((err): void => {
            console.error(
                "[АРМ - Копирование] Не удалось скопировать MAC-адрес из сессии",
                err
            );
            notify("📋 Копирование", "Не удалось скопировать MAC-адрес", "error");
        });
    };
}

/**
 * Adds MAC copy functionality to all MAC addresses on the page
 */
function addCopyToAllMACs(): void {
    const macElements = document.querySelectorAll<HTMLElement>(".js-get-vendor-by-mac");
    macElements.forEach(addCopyFunctionality);
}

/**
 * Adds functionality to copy MAC address from sessions history
 * Watches for page changes and dynamically updates copy functionality
 */
export async function copyMACAddress(): Promise<void> {
    const targetNode = document.getElementById("js-res-app");
    if (!targetNode) return;

    // Add copy functionality initially
    addCopyToAllMACs();

    // Watch for DOM changes and add copy functionality to new MAC addresses
    const observer = new MutationObserver(addCopyToAllMACs);
    observer.observe(targetNode, {childList: true, subtree: true});
}
