/**
 * Adds button to copy client card from info tab to clipboard
 */
export function copyClientCardButton(): void {
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
    copyButton.textContent = "📋 Карточка";
    copyButton.classList.add("btn", "btn-primary", "btn-xs", "helper-copy-card-btn");

    copyButton.addEventListener("click", (event: Event) => {
        event.preventDefault();
        event.stopPropagation();

        navigator.clipboard.writeText(clientCardText).then(() => console.info("[ARM] - Client card copied"));
        //  # TODO Add notification
    });
    clientCard.appendChild(lineBreak);
    clientCard.appendChild(copyButton);
}

export async function sendClientCardButton() {
    const clientCardShowButton = document.getElementById("write_let");
    const clientCardRow = document.getElementById("namcl");

    if (document.querySelector(".helper-send-card-btn") != null || !clientCardShowButton || !clientCardRow) {
        return;
    }

    clientCardShowButton.click();
    const clientCardTextField = document.querySelector("#to_copy") as HTMLTextAreaElement
    const clientCardText = clientCardTextField.value as string;
    clientCardShowButton.click();

    const formattedClientCardText = clientCardText
        .replace(/&nbsp;/g, ' ')
        .split("\n")
        .join("<br>");

    const clientCard = clientCardRow.previousElementSibling;
    const lineBreak = document.createElement("br");

    const sendExampleButton = document.createElement("button");
    sendExampleButton.textContent = "📨 Отправить пример";
    sendExampleButton.classList.add("btn", "btn-warning", "btn-xs", "helper-send-card-btn",);
    sendExampleButton.style.marginTop = "5px";

    sendExampleButton.addEventListener("click", async (event) => {
        event.preventDefault();
        event.stopPropagation();

        const userMessage = prompt("Введи сообщение к примеру для отправки дежурному",);
        if (!userMessage || userMessage.length < 1) {
            //  # TODO Add notification
            return;
        }

        chrome.runtime.sendMessage({
            action: "sendClientCard",
            payload: {message: `${formattedClientCardText}<br><br>${userMessage}`}
        }, (response) => {
            if (response?.ok) {
                //  # TODO Add notification
                console.info("[ARM] — Client card successfully sent");
            } else {
                //  # TODO Add notification
                console.error("[ARM] — Error:", response?.err);
            }
        });

    })

    if (clientCard) {
        clientCard.appendChild(lineBreak);
        clientCard.appendChild(sendExampleButton);
    }
}