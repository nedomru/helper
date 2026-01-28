import {notify} from "@src/utils";


async function lookupMAC(mac: string) {
    return chrome.runtime.sendMessage({
        type: "LOOKUP_MAC",
        mac
    });
}

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
 * Adds a "Check" button next to a single MAC address element
 */
function addLookupButton(macElement: HTMLElement): void {
    // Check if button already exists
    if (macElement.parentElement?.querySelector(".helper-mac-lookup-btn")) {
        return;
    }

    const macAddress = macElement.textContent?.trim();
    if (!macAddress) {
        return;
    }

    const lookupButton = document.createElement("button");
    lookupButton.textContent = "🔍";
    lookupButton.classList.add("btn", "btn-outline-primary", "btn-xs", "helper-mac-lookup-btn");
    lookupButton.type = "button";
    lookupButton.style.display = "inline-block";
    lookupButton.style.verticalAlign = "middle";

    lookupButton.addEventListener("click", async (event: Event) => {
        event.preventDefault();
        event.stopPropagation();

        // Show loading state
        lookupButton.textContent = "⏳";
        lookupButton.disabled = true;

        try {
            const response = await lookupMAC(macAddress);

            console.log("[ARM] MAC lookup response:", response);

            if (response?.ok && response?.data?.company) {
                notify("🔍 MAC-адрес", `Вендор: ${response.data.company}`, "success");
                console.info("[ARM] - MAC lookup successful:", macAddress, response.data.company);
            } else {
                notify("🔍 MAC-адрес", "Ничего не найдено :(", "error");
            }
        } catch (error) {
            console.error("[ARM] MAC lookup error:", error);
            const errorMessage = error instanceof Error && error.message === "429"
                ? "Rate limit exceeded (2 requests/sec)"
                : "Error looking up MAC address";

            notify("🔍 MAC-адрес", errorMessage, "error");
        } finally {
            lookupButton.textContent = "🔍";
            lookupButton.disabled = false;
        }
    });

    macElement.style.display = "inline-block";
    macElement.style.verticalAlign = "middle";
    macElement.parentElement?.appendChild(lookupButton);
}

/**
 * Adds MAC lookup buttons to all MAC addresses on the page
 */
function addLookupButtons(): void {
    const macElements = document.querySelectorAll<HTMLElement>(".js-get-vendor-by-mac");
    macElements.forEach(addLookupButton);
}

/**
 * Adds a "Check" button next to MAC addresses in sessions history
 * Watches for page changes and dynamically updates buttons
 */
export async function macLookupButton(): Promise<void> {
    const targetNode = document.getElementById("js-res-app");
    if (!targetNode) return;

    // Add buttons initially
    addLookupButtons();

    // Watch for DOM changes and add buttons to new MAC addresses
    const observer = new MutationObserver(addLookupButtons);
    observer.observe(targetNode, {childList: true, subtree: true});
}
