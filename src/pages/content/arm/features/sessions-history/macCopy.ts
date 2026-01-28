import {notify} from "@src/utils";

/**
 * Adds click-to-copy functionality to MAC address span element
 */
function addCopyFunctionality(macElement: HTMLElement): void {
    const macText = macElement.textContent?.trim();
    if (!macText) return;

    // Check if already has copy functionality
    if (macElement.style.cursor === "pointer") return;

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
 * Targets the 5th column (index 4) of each table row
 */
function addCopyToAllMACs(): void {
    // Find all table rows and target the 5th column (index 4)
    const tableRows = document.querySelectorAll("tr");
    tableRows.forEach((row) => {
        const cells = row.querySelectorAll("td");
        if (cells.length >= 5) {
            const macCell = cells[4] as HTMLElement;
            const macElement = macCell.querySelector<HTMLElement>(".js-get-vendor-by-mac");
            if (macElement) {
                addCopyFunctionality(macElement);
            }
        }
    });
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
