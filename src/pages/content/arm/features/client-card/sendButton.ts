/**
 * Creates and inserts a button to send client card to duty person
 */
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
