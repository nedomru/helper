/**
 * Adds quick-select buttons for SMS type dropdown
 *
 * Creates buttons for common SMS types to speed up selection
 */
export async function smsButtons(): Promise<void> {
    const smsSelector = document.querySelector<HTMLSelectElement>(".type_sms_a");
    if (!smsSelector) return;

    // Check if buttons already exist
    const existingButtons = smsSelector.parentElement?.querySelector(".helper-sms-buttons");
    if (existingButtons) return;

    const buttonContainer = document.createElement("div");
    buttonContainer.className = "helper-sms-buttons button-container";
    buttonContainer.style.cssText = "display: flex; flex-wrap: wrap; margin-top: 6px; gap: 6px;";

    const buttonConfig = [
        {label: "🔑 Static", value: "27"},
        {label: "🔑 PPPoE", value: "25"},
        {label: "🔐 ЛК", value: "26"},
        {label: "💸 Оплата", value: "24"},
    ];

    buttonConfig.forEach((config): void => {
        const optionExists = smsSelector.querySelector(`option[value="${config.value}"]`);
        if (!optionExists) return;

        const button = document.createElement("input");
        button.type = "button";
        button.value = config.label;
        button.className = "btn btn-primary btn-sm helper";

        button.onclick = (): void => {
            smsSelector.value = config.value;
            smsSelector.dispatchEvent(new Event("change", {bubbles: true}));
        };

        buttonContainer.appendChild(button);
    });

    smsSelector.after(buttonContainer);
}