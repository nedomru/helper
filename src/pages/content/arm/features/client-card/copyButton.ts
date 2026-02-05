import {copyText, notify} from "@src/utils";

/**
 * Creates and inserts a button to copy client card from info tab to clipboard
 */
export async function copyClientCardButton(): Promise<void> {
    const clientCardShowButton = document.getElementById("write_let") as HTMLButtonElement | null;
    const clientCardRow = document.getElementById("namcl") as HTMLElement | null;

    if (document.querySelector(".helper-copy-card-btn") != null || !clientCardShowButton) {
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
    copyButton.textContent = "🪪 Карточка";
    copyButton.classList.add("btn", "btn-primary", "btn-xs", "helper-copy-card-btn");

    copyButton.addEventListener("click", (event: Event) => {
        event.preventDefault();
        event.stopPropagation();

        copyText(clientCardText)
            .then(() => {
                notify("🪪 Карточка", "Карточка клиента скопирована", "success");
                console.info("[ARM] - Client card copied");
            })
            .catch(() => {
                notify("🪪 Карточка", "Не удалось скопировать карточку клиента", "error");
            });
    });
    clientCard.appendChild(lineBreak);
    clientCard.appendChild(copyButton);
}
