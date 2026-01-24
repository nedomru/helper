import {compensate} from "./api";
import {formatDateWithYear, getCurrentDay, getDatesArray, isValidDate, parseDateString} from "./validation";
import {notify} from "@src/utils";
import {getCookies} from "@src/pages/options/utils/arm-api";

/**
 * Creates and inserts a "Compensate" button
 * @returns A promise that resolves when the button is set up or if the process is skipped.
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

    compensateBtn.addEventListener("click", async () => {
        const agreement_id: string | undefined = document.querySelector<HTMLInputElement>('input[class="js-agr-id-prn"]')?.value;

        if (!agreement_id) {
            notify("💸 Компенсация", "Не удалось получить ID договора.", "error");
            return;
        }

        const cookieResponse = await getCookies();
        if (!cookieResponse.ok || !cookieResponse.data?.wccUsrName || !cookieResponse.data?.wccSsnName) {
            notify("💸 Компенсация", "Не удалось получить данные авторизации (SSN, User ID).", "error");
            return;
        }

        const {wccSsnName: ssn, wccUsrName: user_id} = cookieResponse.data;

        const is_one_day: boolean = confirm("Компенсация за один день - ОК\nКомпенсация за несколько дней - Отмена");
        const currentDay = getCurrentDay();

        if (is_one_day) {
            const compensationDay: string | null = prompt("Введи дату (ДД.ММ)", currentDay);
            if (!compensationDay) return;

            if (!isValidDate(compensationDay)) {
                notify("💸 Компенсация", "Выбрана некорректная дата. Используй формат ДД.ММ", "error");
                return;
            }

            const compensationDateWithYear: string = formatDateWithYear(compensationDay);
            await compensate(compensationDateWithYear, ssn, user_id, agreement_id);

        } else {
            const startDatePrompt: string | null = prompt("Введи начальную дату (ДД.ММ)", currentDay);
            if (!startDatePrompt) return;

            if (!isValidDate(startDatePrompt)) {
                notify("💸 Компенсация", "Неверный формат начальной даты. Используй формат ДД.ММ", "error");
                return;
            }
            const startDate: string = formatDateWithYear(startDatePrompt);

            const endDatePrompt: string | null = prompt("Введи конечную дату (ДД.ММ)");
            if (!endDatePrompt) return;

            if (!isValidDate(endDatePrompt)) {
                notify("💸 Компенсация", "Неверный формат конечной даты. Используй формат ДД.ММ", "error");
                return;
            }
            const endDate: string = formatDateWithYear(endDatePrompt);

            const startDateObject: Date = parseDateString(startDate);
            const endDateObject: Date = parseDateString(endDate);

            if (startDateObject > endDateObject) {
                notify("💸 Компенсация", "Начальная дата не может быть позже конечной даты", "error");
                return;
            }

            try {
                const dates: string[] = getDatesArray(startDate, endDate);

                for (const date of dates) {
                    await compensate(date, ssn, user_id, agreement_id);

                    await new Promise<void>((resolve) => setTimeout(resolve, 100));
                }
                notify("💸 Компенсация", `Компенсация успешно отправлена за период с ${startDate} по ${endDate}`, "success");
            } catch (error) {
                console.error("Compensation processing error:", error);
                notify("💸 Компенсация", "Произошла ошибка при обработке компенсаций", "error");
            }
        }
    });
}
