import type {AppealDetail, FetchAppealsMessage, Response} from "../types";

/**
 * Fetches appeal details for a specific city from OKC API
 */
async function fetchAppealDetails(cityId: string): Promise<AppealDetail[]> {
    const response = await fetch("https://okc.ertelecom.ru/yii/appl/chart/get-details-by-city", {
        method: "POST",
        headers: {
            "Accept": "application/json, text/javascript, */*; q=0.01",
            "Accept-Language": "en-US,en;q=0.9",
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "X-Requested-With": "XMLHttpRequest",
        },
        body: `unit=7&interval=240&city=${cityId}`,
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
}

/**
 * Handles fetching appeals for a specific city
 */
export async function handleFetchAppeals(
    message: FetchAppealsMessage,
): Promise<Response<AppealDetail[]>> {
    try {
        const {cityId} = message.payload;

        if (!cityId) {
            return {ok: false, err: "cityId is required"};
        }

        const appeals = await fetchAppealDetails(cityId);

        return {ok: true, data: appeals};
    } catch (error) {
        console.error("Error handling appeals fetch:", error);
        return {ok: false, err: String(error)};
    }
}
