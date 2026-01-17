import {compensate} from "@pages/content/arm/helpers";

/**
 * Creates and inserts a button to copy client card from info tab to clipboard
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

/**
 * Creates and inserts a "Compensate" button
 * @returns {Promise<void>} A promise that resolves when the button is set up or if the process is skipped.
 */
export async function compensateButton(): Promise<void> {
    if (document.querySelector(".helper-compensate-btn") != null) {
        return;
    }

    const refreshBtn = document.querySelector(".refresh-frame");
    const top3Btn = document.querySelector(".top_3_butt");
    const container = document.getElementById("top-3-block");

    if (!refreshBtn || !top3Btn || !container) return;

    const agrWithTypeElement = document.getElementById("agr_with_type");
    const isIntercom = agrWithTypeElement?.textContent.includes("Домофон") ?? false;

    const compensateBtn = document.createElement("button");
    compensateBtn.className = `btn ${isIntercom ? "btn-danger" : "btn-success"} helper-compensate-btn float-right btn-xs`;
    compensateBtn.type = "button";
    compensateBtn.textContent = "Компенсировать";
    compensateBtn.style.marginRight = "5px";

    container.insertBefore(compensateBtn, top3Btn);

    if (isIntercom) {
        compensateBtn.addEventListener("click", () => {
            alert("На договоре домофония, навесь компенсацию вручную :(");
        });
        return;
    }

    // Regex for date format DD.MM
    const dateRegex = /^(0[1-9]|[12][0-9]|3[01])\.(0[1-9]|1[0-2])$/;
    const currentYear: number = new Date().getFullYear();

    /**
     * Validates if a string is a date in DD.MM format and is a real day of the month/year.
     * @param {string} dateString - The date string in DD.MM format.
     * @returns {boolean} True if the date is valid, false otherwise.
     */
    function isValidDate(dateString: string): boolean {
        if (!dateRegex.test(dateString)) return false;

        const [day, month] = dateString.split(".").map(Number);
        const date = new Date(currentYear, month - 1, day);

        return date.getDate() === day && date.getMonth() === month - 1 && date.getFullYear() === currentYear;
    }

    /**
     * Formats a DD.MM string into a DD.MM.YYYY string using the current year.
     * @param {string} dateString - The date string in DD.MM format.
     * @returns {string} The date string in DD.MM.YYYY format.
     */
    function formatDateWithYear(dateString: string): string {
        return `${dateString}.${currentYear}`;
    }

    /**
     * Generates an array of dates (DD.MM.YYYY strings) between a start and end date (inclusive).
     * @param {string} startDate - The start date in DD.MM.YYYY format.
     * @param {string} endDate - The end date in DD.MM.YYYY format.
     * @returns {string[]} An array of date strings.
     */
    function getDatesArray(startDate: string, endDate: string): string[] {
        const dates: string[] = [];

        const parseDateString = (dateStr: string): Date => {
            const [day, month, year] = dateStr.split(".").map(Number);
            return new Date(year, month - 1, day);
        };

        const currentDate = parseDateString(startDate);
        const lastDate = parseDateString(endDate);

        currentDate.setHours(0, 0, 0, 0);
        lastDate.setHours(0, 0, 0, 0);

        while (currentDate <= lastDate) {
            dates.push(currentDate.toLocaleDateString("ru-RU", {
                day: "2-digit", month: "2-digit", year: "numeric",
            }));
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return dates;
    }

    compensateBtn.addEventListener("click", async () => {
        const ssn: string | undefined = document.querySelector<HTMLInputElement>('input[class="js-ssn-prn"]')?.value;
        const user_id: string | undefined = document.querySelector<HTMLInputElement>('input[class="js-user-id-prn"]')?.value;
        const agreement_id: string | undefined = document.querySelector<HTMLInputElement>('input[class="js-agr-id-prn"]')?.value;

        if (!ssn || !user_id || !agreement_id) {
            // $.notify("Не удалось получить необходимые идентификаторы (SSN, User ID, Agreement ID).", "error");
            // TODO Add notification
            return;
        }

        const is_one_day: boolean = confirm("Компенсация за один день - ОК\nКомпенсация за несколько дней - Отмена");

        const currentDate = new Date();
        const day: string = String(currentDate.getDate()).padStart(2, "0");
        const month: string = String(currentDate.getMonth() + 1).padStart(2, "0");
        const currentDay: string = `${day}.${month}`;

        if (is_one_day) {
            const compensationDay: string | null = prompt("Введи дату (ДД.ММ)", currentDay);
            if (!compensationDay) return;

            if (!isValidDate(compensationDay)) {
                // TODO Add notification
                return;
            }

            const compensationDateWithYear: string = formatDateWithYear(compensationDay);
            await compensate(compensationDateWithYear, ssn, user_id, agreement_id);

        } else {
            const startDatePrompt: string | null = prompt("Введи начальную дату (ДД.ММ)", currentDay);
            if (!startDatePrompt) return;

            if (!isValidDate(startDatePrompt)) {
                // $.notify("Неверный формат начальной даты. Используйте формат ДД.ММ", "error");
                // TODO Add notification
                return;
            }
            const startDate: string = formatDateWithYear(startDatePrompt);

            const endDatePrompt: string | null = prompt("Введи конечную дату (ДД.ММ)");
            if (!endDatePrompt) return;

            if (!isValidDate(endDatePrompt)) {
                // $.notify("Неверный формат конечной даты. Используйте формат ДД.ММ", "error");
                // TODO Add notification
                return;
            }
            const endDate: string = formatDateWithYear(endDatePrompt);

            const parseDateStringForComparison = (dateStr: string): Date => {
                const [day, month, year] = dateStr.split(".").map(Number);
                return new Date(year, month - 1, day);
            };

            const startDateObject: Date = parseDateStringForComparison(startDate);
            const endDateObject: Date = parseDateStringForComparison(endDate);

            if (startDateObject > endDateObject) {
                // $.notify("Начальная дата не может быть позже конечной даты", "error");
                // TODO Add notification
                return;
            }

            try {
                const dates: string[] = getDatesArray(startDate, endDate);

                for (const date of dates) {
                    await compensate(date, ssn, user_id, agreement_id);

                    await new Promise<void>((resolve) => setTimeout(resolve, 100));
                }
                // $.notify(`Компенсация успешно отправлена за период с ${startDate} по ${endDate}`, "success");
                // TODO Add notification
            } catch (error) {
                console.error("Compensation processing error:", error);
                // $.notify("Произошла ошибка при обработке компенсаций", "error");
                // TODO Add notification
            }
        }
    });
}