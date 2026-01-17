/**
 * Shared API utilities for ARM module
 */

/**
 * Extracts the base URL from the current page location
 * @returns Promise resolving to the base URL or undefined if not found
 */
export async function getARMBaseUrl(): Promise<string | undefined> {
    const currentURL = window.location.href;

    if (currentURL) {
        const matchResult = currentURL.match(/(https:\/\/[^/]+)/);
        if (matchResult && matchResult[1]) {
            return matchResult[1];
        }
    }
    return undefined;
}
