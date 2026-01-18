import {notify} from "@src/utils";


async function lookupMAC(mac: string) {
    return chrome.runtime.sendMessage({
        type: "LOOKUP_MAC",
        mac
    });
}

/**
 * Adds a "Check" button next to MAC addresses in tables
 */
export async function macLookupButton(): Promise<void> {
    const macElements = document.querySelectorAll<HTMLElement>(".mac, .js-get-vender-by-mac .mac");

    macElements.forEach((macElement) => {
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
        lookupButton.classList.add("btn", "btn-primary", "btn-xs", "helper-mac-lookup-btn");
        lookupButton.type = "button";

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

        macElement.parentElement?.appendChild(lookupButton);
    });
}
