import {getARMBaseUrl} from "../../shared/api";
import {notify} from "@src/utils";

/**
 * Executes the compensation API call for a single date.
 * @param date - The date in DD.MM.YYYY format.
 * @param ssn - The SSN identifier.
 * @param user_id - The User ID identifier.
 * @param agr_id - The Agreement ID identifier.
 * @returns A promise that resolves to true if compensation was successful, false otherwise.
 */
export async function compensate(date: string, ssn: string, user_id: string, agr_id: string): Promise<boolean> {
    const baseUrl: string | undefined = await getARMBaseUrl();
    const endpoint: string = "/cgi-bin/ppo/excells/adv_act_retention.add_compensate_from_antic";

    const formData = new URLSearchParams({
        "ssn$c": ssn,
        "user_id$c": user_id,
        "agr_id$c": agr_id,
        "compens_date$c": date,
    });

    const response: Response = await fetch(`${baseUrl}${endpoint}`, {
        method: "POST",
        credentials: "include",
        headers: {
            "Accept": "*/*",
            "Accept-Language": "en-US,en;q=0.5",
            "Content-Type": "application/x-www-form-urlencoded",
            "Priority": "u=0",
        },
        body: formData.toString(),
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    // The original code uses windows-1251 decoding, which is preserved
    const buffer: ArrayBuffer = await response.arrayBuffer();
    const decoder = new TextDecoder("windows-1251");
    const responseText: string = decoder.decode(buffer);

    // Notify based on response content
    if (responseText.includes("УСПЕШНОЕ") || responseText.includes("Флаг успешно добавлен")) {
        notify("💸 Компенсация", `Компенсация за ${date}: УСПЕШНО`, "success");
        return true;
    } else if (responseText.includes("Данный признак уже есть на приложении")) {
        notify("💸 Компенсация", `Компенсация за ${date}: Признак уже существует`, "warning");
        return false;
    } else {
        notify("💸 Компенсация", `Компенсация за ${date}: ОШИБКА`, "error");
        return false;
    }
}
