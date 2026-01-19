/**
 * Handler for getting cookies from the background script.
 * Content scripts cannot access chrome.cookies directly, so they send messages here.
 */

export async function handleGetCookie(request: {
    url: string;
    name: string;
}): Promise<string | null> {
    try {
        const cookie = await new Promise<chrome.cookies.Cookie | null>((resolve) => {
            chrome.cookies.get(
                {
                    url: request.url,
                    name: request.name,
                },
                (cookie) => resolve(cookie || null)
            );
        });

        if (cookie?.value) {
            console.info(`[Хелпер] - [Cookies] - Получен cookie ${request.name}:`, cookie.value);
            return cookie.value;
        }

        console.warn(`[Хелпер] - [Cookies] - Cookie ${request.name} не найден для URL: ${request.url}`);
        return null;
    } catch (error) {
        console.error(`[Хелпер] - [Cookies] - Ошибка при получении cookie ${request.name}:`, error);
        return null;
    }
}