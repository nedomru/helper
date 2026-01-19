/**
 * Session ID utilities for Genesys features.
 * Handles extraction and storage of PHPSESSID from cookies via background script.
 */

interface CookieResponse {
    ok: boolean;
    data?: string | null;
    err?: string;
}

/**
 * Extract and store PHPSESSID from okc.ertelecom.ru via background script
 */
export async function extractSessionId(): Promise<string | null> {
    try {
        const response = await new Promise<CookieResponse>((resolve) => {
            chrome.runtime.sendMessage(
                {
                    action: 'getCookie',
                    url: 'https://okc.ertelecom.ru',
                    name: 'PHPSESSID',
                },
                (response) => resolve(response as CookieResponse)
            );
        });

        if (response.ok && response.data) {
            await new Promise<void>((resolve) => {
                chrome.storage.sync.set({okc_phpSessionId: response.data}, () => resolve());
            });
            console.info('[Хелпер] - [Настройки] - Обновлен актуальный PHPSESSID:', response.data);
            return response.data;
        }

        return null;
    } catch (error) {
        console.error('[Хелпер] - [Настройки] - Ошибка при получении PHPSESSID из cookies:', error);
        return null;
    }
}

/**
 * Get OKC PHP Session ID from storage or cookies
 */
export async function getOKCSessionId(): Promise<string | null> {
    try {
        // First try to get from storage
        const result = await new Promise<{ okc_phpSessionId?: string }>((resolve) => {
            chrome.storage.sync.get('okc_phpSessionId', (data) => resolve(data));
        });

        if (result.okc_phpSessionId) {
            console.info('[Хелпер] - [Настройки] - Получен PHPSESSID из storage:', result.okc_phpSessionId);
            return result.okc_phpSessionId;
        }

        // If not in storage, try to extract from cookies via background script
        console.info('[Хелпер] - [Настройки] - PHPSESSID не найден в storage, пробуем получить из cookies...');
        const sessionId = await extractSessionId();

        if (sessionId) {
            console.info('[Хелпер] - [Настройки] - Получен PHPSESSID из cookies:', sessionId);
            return sessionId;
        }

        console.warn('[Хелпер] - [Настройки] - PHPSESSID не найден ни в storage, ни в cookies');
        console.warn('[Хелпер] - [Настройки] - Убедитесь, что вы авторизованы на okc.ertelecom.ru');
        return null;
    } catch (error) {
        console.error('[Хелпер] - [Настройки] - Ошибка при получении PHPSESSID:', error);
        return null;
    }
}