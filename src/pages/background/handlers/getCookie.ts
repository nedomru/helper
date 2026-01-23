/**
 * Handler for getting cookies from the background script.
 * Content scripts cannot access chrome.cookies directly, so they send messages here.
 */

interface CookieRequest {
    url: string;
    name: string;
}

interface MultipleCookiesRequest {
    url: string;
    names: string[];
}

export async function handleGetCookie(request: CookieRequest): Promise<string | null> {
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

export async function handleGetMultipleCookies(request: MultipleCookiesRequest): Promise<Record<string, string | null>> {
    try {
        const cookies: Record<string, string | null> = {};

        for (const name of request.names) {
            const cookie = await new Promise<chrome.cookies.Cookie | null>((resolve) => {
                chrome.cookies.get(
                    {
                        url: request.url,
                        name,
                    },
                    (cookie) => resolve(cookie || null)
                );
            });

            if (cookie?.value) {
                console.info(`[Хелпер] - [Cookies] - Получен cookie ${name}:`, cookie.value);
                cookies[name] = cookie.value;
            } else {
                console.warn(`[Хелпер] - [Cookies] - Cookie ${name} не найден для URL: ${request.url}`);
                cookies[name] = null;
            }
        }

        return cookies;
    } catch (error) {
        console.error(`[Хелпер] - [Cookies] - Ошибка при получении cookies:`, error);
        // Return null for all cookies on error
        return request.names.reduce((acc, name) => ({...acc, [name]: null}), {});
    }
}