import {notify} from "@src/utils";

/**
 * Adds "Last 24 hours" quick filter button
 *
 * Creates button that sets date range to previous day and triggers data load
 */
export async function loadLastDayClientSessions(): Promise<void> {
    if (document.querySelector(".helper-button")) return;

    const loadDataButton = document.getElementById("js-get-data");
    if (!loadDataButton?.parentNode) return;

    const button = document.createElement("input");
    button.type = "button";
    button.value = "Последние сутки";
    button.className = "btn btn-secondary helper-button";
    button.style.marginTop = "10px";

    button.onclick = (): void => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        const dateInput = document.querySelector<HTMLInputElement>(".js-active-from");
        if (!dateInput) {
            notify("⚠️ Дата", "Поле даты не найдено", "error");
            return;
        }

        const formattedDate = yesterday.toLocaleDateString("ru-RU", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        });

        dateInput.value = formattedDate;
        loadDataButton.click();

        notify("📅 Дата", `Установлена дата: ${formattedDate}`, "success");

        const tableBody = document.querySelector("#js-res-app table tbody");
        if (tableBody) {
            new MutationObserver(() => {
                const rows = tableBody.querySelectorAll("tr").length;
                notify("📊 Результат", `Найдено сессий: ${rows}`, "success");
            }).observe(tableBody, {childList: true, subtree: true});
        }
    };

    loadDataButton.parentNode.insertBefore(button, loadDataButton.nextSibling);
}