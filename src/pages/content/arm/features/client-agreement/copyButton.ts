import {notify} from "@src/utils";

/**
 * Creates and inserts a button to copy client agreement from info tab to clipboard
 */
export async function copyClientAgreementButton(): Promise<void> {
    const agreementTab = document.getElementById("agr_with_type") as HTMLElement | null;

    if (document.querySelector(".helper-copy-agreement-btn") != null || !agreementTab) {
        return;
    }

    const agreementNumber = agreementTab.getElementsByTagName("b")[0]?.textContent?.trim() ?? "";
    const agreementBeforeTab = agreementTab.previousElementSibling as HTMLElement | null;

    if (!agreementBeforeTab) {
        console.error("Agreement label column not found");
        return;
    }

    const lineBreak = document.createElement("br") as HTMLBRElement;

    const copyButton = document.createElement("button") as HTMLButtonElement;
    copyButton.textContent = "📋 Договор";
    copyButton.classList.add("btn", "btn-primary", "btn-xs", "helper-copy-agreement-btn");

    copyButton.addEventListener("click", (event: Event) => {
        event.preventDefault();
        event.stopPropagation();

        navigator.clipboard.writeText(agreementNumber).then(() => {
            notify("📋 Договор", "Номер договора скопирован", "success");
            console.info("[ARM] - Client agreement copied");
        }).catch(() => {
            notify("📋 Договор", "Не удалось скопировать номер договора", "error");
        });
    });
    agreementBeforeTab.appendChild(lineBreak);
    agreementBeforeTab.appendChild(copyButton);
}
