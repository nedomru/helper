/**
 * Adds button to copy client card from info tab to clipboard
 */
export function copyClientCard(): void {
    const clientCardShowButton = document.getElementById("write_let") as HTMLButtonElement | null;
    const clientCardRow = document.getElementById("namcl") as HTMLElement | null;

    if (document.querySelector(".helper-card") != null || !clientCardShowButton) {
        return;
    }

    clientCardShowButton.click();
    const clientCardTextField = document.querySelector("#to_copy") as HTMLTextAreaElement
    const clientCardText = clientCardTextField.value as string;
    clientCardShowButton.click();

    const clientCard = clientCardRow?.previousElementSibling as HTMLElement | null;
    if (!clientCard) {
        console.error("Client card element not found");
        return;
    }

    const lineBreak = document.createElement("br") as HTMLBRElement;

    const copyButton = document.createElement("button") as HTMLButtonElement;
    copyButton.textContent = "📋 Карточка";
    copyButton.classList.add("btn", "btn-primary", "btn-xs", "helper-card");

    copyButton.addEventListener("click", (event: Event) => {
        event.preventDefault();
        event.stopPropagation();

        navigator.clipboard.writeText(clientCardText).then(r => console.info("[ARM] - Client card copied"));
    });
    clientCard.appendChild(lineBreak);
    clientCard.appendChild(copyButton);
}