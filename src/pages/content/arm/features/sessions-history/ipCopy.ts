import {notify} from "@src/utils";

/**
 * Adds click-to-copy functionality to IP address span element
 */
function addCopyFunctionality(ipSpan: HTMLElement): void {
    const ipText = ipSpan.textContent?.trim();
    if (!ipText) return;

    // Check if already has copy functionality
    if (ipSpan.style.cursor === "pointer") return;

    ipSpan.style.cursor = "pointer";
    ipSpan.style.display = "inline-block";
    ipSpan.style.verticalAlign = "middle";

    ipSpan.onclick = (event: PointerEvent): void => {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        navigator.clipboard.writeText(ipText).then((): void => {
            ipSpan.style.transition = "color 0.2s ease, background-color 0.2s ease";
            ipSpan.style.color = "#16a34a";
            ipSpan.style.backgroundColor = "#dcfce7";

            setTimeout(() => {
                ipSpan.style.color = "";
                ipSpan.style.backgroundColor = "";
            }, 600);
            notify("📋 Копирование", `IP-адрес скопирован: ${ipText}`, "success");
        }).catch((err): void => {
            console.error(
                "[АРМ - Копирование] Не удалось скопировать IP-адрес из сессии",
                err
            );
            notify("📋 Копирование", "Не удалось скопировать IP-адрес", "error");
        });
    };
}

/**
 * Adds IP copy functionality to all IP addresses on the page
 * Targets the 4th column (index 3) of each table row
 */
function addCopyToAllIPs(): void {
    // Find all table rows and target the 4th column (index 3)
    const tableRows = document.querySelectorAll("tr");
    tableRows.forEach((row) => {
        const cells = row.querySelectorAll("td");
        if (cells.length >= 4) {
            const ipCell = cells[3] as HTMLElement;

            // Check if IP address is already wrapped in a span
            let ipSpan = ipCell.querySelector<HTMLElement>(".helper-ip-copy");
            if (!ipSpan) {
                const ipText = ipCell.textContent?.trim();
                if (!ipText) return;

                // Wrap the IP address in a span
                ipSpan = document.createElement("span");
                ipSpan.classList.add("helper-ip-copy");
                ipSpan.textContent = ipText;
                ipCell.textContent = "";
                ipCell.appendChild(ipSpan);
            }

            addCopyFunctionality(ipSpan);
        }
    });
}

/**
 * Adds functionality to copy IP address from sessions history
 * Watches for page changes and dynamically updates copy functionality
 */
export async function copyIPAddress(): Promise<void> {
    const targetNode = document.getElementById("js-res-app");
    if (!targetNode) return;

    // Add copy functionality initially
    addCopyToAllIPs();

    // Watch for DOM changes and add copy functionality to new IP addresses
    const observer = new MutationObserver(addCopyToAllIPs);
    observer.observe(targetNode, {childList: true, subtree: true});
}
