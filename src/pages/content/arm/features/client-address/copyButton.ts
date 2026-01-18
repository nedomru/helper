import {notify} from "@src/utils";

/**
 * Creates and inserts a button to copy client address from info tab to clipboard
 */
export function copyClientAddressButton(): void {
    const addressTab = document.getElementById("dr") as HTMLElement | null;

    if (document.querySelector(".helper-copy-address-btn") != null || !addressTab) {
        return;
    }

    let addressText = addressTab.textContent?.trim() ?? "";

    // Checking for index existing in address string
    const postcodeRegex = /\d{6}|\d{3}/;
    const substringToCheck = addressText.substring(0, 6); // Getting 6 first symbols from address
    const match = substringToCheck.match(postcodeRegex);
    if (match) {
        const postalCode = match[0] + ", ";
        addressText = addressText.replace(postalCode, "").trim();
    }

    // Remove city part
    const cityRegex = /.*ул\./i;
    addressText = addressText.replace(cityRegex, "").trim();

    const addressLabel = addressTab.previousElementSibling as HTMLElement | null;

    if (!addressLabel) {
        console.error("Address label column not found");
        return;
    }

    const lineBreak = document.createElement("br") as HTMLBRElement;

    const copyButton = document.createElement("button") as HTMLButtonElement;
    copyButton.textContent = "📋 Адрес";
    copyButton.classList.add("btn", "btn-primary", "btn-xs", "helper-copy-address-btn");

    copyButton.addEventListener("click", (event: Event) => {
        event.preventDefault();
        event.stopPropagation();

        navigator.clipboard.writeText(addressText).then(() => {
            notify("📋 Адрес", "Адрес скопирован", "success");
            console.info("[ARM] - Client address copied");
        }).catch(() => {
            notify("📋 Адрес", "Не удалось скопировать адрес", "error");
        });
    });
    addressLabel.appendChild(lineBreak);
    addressLabel.appendChild(copyButton);
}
