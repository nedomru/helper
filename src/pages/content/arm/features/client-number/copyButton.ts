import {copyText, notify} from "@src/utils";

/**
 * Adds functionality to copy phone numbers from client session
 *
 * Finds all phone number elements and adds click functionality:
 * - Click on full number: copies complete phone number
 * - Click on last 4 digits: copies only last 4 digits
 */
export async function copyClientNumber(): Promise<void> {
    const phoneElements: HTMLCollectionOf<Element> = document.getElementsByClassName("tele_finesse");

    for (let i: number = 0; i < phoneElements.length; i++) {
        const phoneElement = phoneElements[i] as HTMLSpanElement;
        const phoneNumber: string = phoneElement.getAttribute("value") || phoneElement.innerText.trim();
        const lastFourDigits: string = phoneNumber.slice(-4);

        phoneElement.style.cursor = "pointer";

        // Wrap last 4 digits in a separate span for individual clicking
        const fullText = phoneElement.innerText;
        const lastFourIndex = fullText.length - 4;

        if (lastFourIndex > 0) {
            const prefix = fullText.slice(0, lastFourIndex);
            const suffix = fullText.slice(lastFourIndex);

            phoneElement.innerHTML = `${prefix}<span class="last-four" style="cursor: pointer; border-bottom: 1px dotted currentColor;">${suffix}</span>`;

            const lastFourElement = phoneElement.querySelector(".last-four") as HTMLSpanElement;

            if (lastFourElement) {
                // Click on last 4 digits - copy only last 4
                lastFourElement.onclick = (e: Event): void => {
                    e.stopPropagation();
                    copyText(lastFourDigits)
                        .then(() => {
                            lastFourElement.style.transition = "color 0.2s ease, background-color 0.2s ease";
                            lastFourElement.style.color = "#16a34a";
                            lastFourElement.style.backgroundColor = "#dcfce7";

                            setTimeout(() => {
                                lastFourElement.style.color = "";
                                lastFourElement.style.backgroundColor = "";
                            }, 600);
                            notify("📋 Копирование", `Последние 4 цифры скопированы: ${lastFourDigits}`, "success");
                        })
                        .catch((err) => {
                            console.error(
                                "[АРМ - Копирование]: Не удалось скопировать последние 4 цифры номера",
                                err
                            );
                            notify("📋 Копирование", "Не удалось скопировать последние 4 цифры", "error");
                        });
                };
            }
        }

        // Click on full element - copy complete phone number
        phoneElement.onclick = (): void => {
            copyText(phoneNumber)
                .then(() => {
                    phoneElement.style.transition = "color 0.2s ease, background-color 0.2s ease";
                    phoneElement.style.color = "#16a34a";
                    phoneElement.style.backgroundColor = "#dcfce7";

                    setTimeout(() => {
                        phoneElement.style.color = "";
                        phoneElement.style.backgroundColor = "";
                    }, 600);
                    notify("📋 Копирование", `Номер телефона скопирован: ${phoneNumber}`, "success");
                })
                .catch((err) => {
                    console.error(
                        "[АРМ - Копирование]: Не удалось скопировать номер телефона",
                        err
                    );
                    notify("📋 Копирование", "Не удалось скопировать номер телефона", "error");
                });
        };
    }
}