export async function getARMBaseUrl(): Promise<string | undefined> {
    const currentURL = window.location.href;

    if (currentURL) {
        const matchResult = currentURL.match(/(https:\/\/[^\/]+)/);
        if (matchResult && matchResult[1]) {
            return matchResult[1];
        }
    }
    return undefined;
}

/**
 * Executes the compensation API call for a single date.
 * @param {string} date - The date in DD.MM.YYYY format.
 * @param {string} ssn - The SSN identifier.
 * @param {string} user_id - The User ID identifier.
 * @param {string} agr_id - The Agreement ID identifier.
 * @returns {Promise<boolean>} A promise that resolves to true if compensation was successful, false otherwise.
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
        (window as any).$.notify(`Компенсация за ${date}: УСПЕШНО`, "success");
        return true;
    } else if (responseText.includes("Данный признак уже есть на приложении")) {
        (window as any).$.notify(`Компенсация за ${date}: Признак уже существует`, "warn");
        return false;
    } else {
        (window as any).$.notify(`Компенсация за ${date}: ОШИБКА`, "error");
        return false;
    }
}