import type {AppealDetail, FetchAppealsMessage, Response} from "../types";

interface APIErrorResponse {
    error: string;
}

interface APIResponse extends AppealDetail[] {
}

type APIResult = APIResponse | APIErrorResponse;

/**
 * Fetches appeal details for a specific city from OKC API
 */
async function fetchAppealDetails(cityId: string, unit: number = 7): Promise<AppealDetail[]> {
    const response = await fetch("https://okc.ertelecom.ru/yii/appl/chart/get-details-by-city", {
        method: "POST",
        headers: {
            "Accept": "application/json, text/javascript, */*; q=0.01",
            "Accept-Language": "en-US,en;q=0.9",
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "X-Requested-With": "XMLHttpRequest",
        },
        body: `unit=${unit}&interval=240&city=${cityId}`,
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: APIResult = await response.json();

    // Check if the response contains an error
    if (!Array.isArray(data) && "error" in data) {
        throw new Error(data.error);
    }

    // Ensure it's an array
    if (!Array.isArray(data)) {
        throw new Error("Invalid response format from OKC API");
    }

    return data;
}

/**
 * Handles fetching appeals for a specific city
 */
export async function handleFetchAppeals(
    message: FetchAppealsMessage,
): Promise<Response<AppealDetail[]>> {
    try {
        const {cityId, unit = 7} = message.payload;

        if (!cityId) {
            return {ok: false, err: "cityId is required"};
        }

        const appeals = await fetchAppealDetails(cityId, unit);

        return {ok: true, data: appeals};
    } catch (error) {
        console.error("Error handling appeals fetch:", error);
        return {ok: false, err: String(error)};
    }
}
