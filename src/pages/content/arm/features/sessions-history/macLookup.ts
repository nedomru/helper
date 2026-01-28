import {notify} from "@src/utils";


async function lookupMAC(mac: string) {
    return chrome.runtime.sendMessage({
        type: "LOOKUP_MAC",
        mac
    });
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

    // Ensure both elements are inline-block and stay on the same line
    macElement.style.display = "inline-block";
    macElement.style.verticalAlign = "middle";
    lookupButton.style.marginLeft = "4px";

    // Insert button right after the MAC element to keep them on same line
    macElement.insertAdjacentElement("afterend", lookupButton);
}

/**
 * Adds MAC lookup buttons to all MAC addresses on the page
 * Targets the 5th column (index 4) of each table row
 */
function addLookupButtons(): void {
    // Find all table rows and target the 5th column (index 4)
    const tableRows = document.querySelectorAll("tr");
    tableRows.forEach((row) => {
        const cells = row.querySelectorAll("td");
        if (cells.length >= 5) {
            const macCell = cells[4] as HTMLElement;

            // Make the MAC column wider to prevent button wrapping
            macCell.style.minWidth = "100px";
            macCell.style.whiteSpace = "nowrap";

            const macElement = macCell.querySelector<HTMLElement>(".js-get-vendor-by-mac");
            if (macElement) {
                addLookupButton(macElement);
            }
        }
    });
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
