import type {AppealsCategory, SelectOption} from '../types';
import {notify} from '@src/utils/notify';

export async function getCookies(): Promise<{
    ok: boolean;
    data?: { wccUsrName: string; wccSsnName: string };
    err?: string;
}> {
    // Build cookie URL dynamically based on current hostname
    const hostname = window.location.hostname;
    // Extract the city prefix (e.g., "tmn" from "tmn.db.ertelecom.ru")
    const cityMatch = hostname.match(/^([^.]+)\.db\.ertelecom\.ru$/);
    const cityPrefix = cityMatch ? cityMatch[1] : 'perm';
    const cookieUrl = `https://${cityPrefix}.db.ertelecom.ru/cgi-bin/ppo/excells`;

    return new Promise((resolve) => {
        chrome.runtime.sendMessage(
            {
                action: 'getMultipleCookies',
                url: cookieUrl,
                names: ['wccUsrName', 'wccSsnName'],
            },
            (response) => resolve(response as any)
        );
    });
}

function getAgrId(productId: number): number {
    return productId === 69 ? 0 : 2453379;
}

async function fetchFromArm(endpoint: string, formData: string): Promise<string> {
    const response = await fetch(`https://perm.db.ertelecom.ru${endpoint}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Requested-With': 'XMLHttpRequest',
        },
        body: formData,
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch from ${endpoint}`);
    }

    const buffer = await response.arrayBuffer();
    const decoder = new TextDecoder('windows-1251');
    return decoder.decode(buffer);
}

function parseHtmlOptions(htmlText: string, selector: string): SelectOption[] {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');
    const selectElement = doc.querySelector(selector);

    if (!selectElement) {
        return [];
    }

    const options = selectElement.querySelectorAll('option');
    const result: SelectOption[] = [];

    options.forEach((option) => {
        const value = option.getAttribute('value');
        const label = option.textContent?.trim() || '';
        const title = option.getAttribute('title') || '';

        if (value && value !== '-1' && label) {
            result.push({value, label, title});
        }
    });

    return result;
}

export async function loadAppealsCategories(
    productId: number,
    processingGroupId: string
): Promise<AppealsCategory[]> {
    try {
        const cookieResponse = await getCookies();
        if (!cookieResponse.ok || !cookieResponse.data?.wccUsrName || !cookieResponse.data?.wccSsnName) {
            notify(
                'Быстрые обращения',
                'Для настройки пресетов необходимо авторизоваться в ARM',
                'error'
            );
            return [];
        }

        const {wccUsrName, wccSsnName} = cookieResponse.data;
        const agrId = getAgrId(productId);
        const formData = `ssn$c=${encodeURIComponent(wccSsnName)}&usr$i=${encodeURIComponent(
            wccUsrName
        )}&prod_id$i=${productId}&step_id$i=${processingGroupId}&agr_id$i=${agrId}`;

        console.log('[Хелпер] - [Быстрые обращения] - Загрузка категорий:', {
            product: productId,
            processingGroup: processingGroupId,
            ssn: wccSsnName,
            usr: wccUsrName,
        });

        const htmlText = await fetchFromArm(
            '/cgi-bin/ppo/excells/wcc_unified_classifier_reasons.ajax_get_uni_obj_reasons',
            formData
        );

        const categories = parseHtmlOptions(htmlText, '.uni_load_obj_reason');

        if (categories.length === 0) {
            throw new Error('Invalid response format: select element not found');
        }

        console.log('[Хелпер] - [Быстрые обращения] - Загружено категорий:', categories);
        return categories;
    } catch (error) {
        console.error('[Хелпер] - [Быстрые обращения] - Ошибка при загрузке категорий:', error);
        notify(
            'Быстрые обращения',
            'Настраивать пресеты можно только с браузера на VDI',
            'error'
        );
        return [];
    }
}

export async function loadAppealsSubcategories(
    productId: number,
    processingGroupId: string,
    categoryId: string
): Promise<SelectOption[]> {
    try {
        const cookieResponse = await getCookies();
        if (!cookieResponse.ok || !cookieResponse.data?.wccUsrName || !cookieResponse.data?.wccSsnName) {
            notify(
                'Быстрые обращения',
                'Для настройки пресетов необходимо авторизоваться в ARM',
                'error'
            );
            return [];
        }

        const {wccUsrName, wccSsnName} = cookieResponse.data;
        const agrId = getAgrId(productId);
        const formData = `ssn$c=${encodeURIComponent(wccSsnName)}&usr$i=${encodeURIComponent(
            wccUsrName
        )}&prod_id$i=${productId}&step_id$i=${processingGroupId}&object_id$i=${categoryId}&agr_id$i=${agrId}`;

        console.log('[Хелпер] - [Быстрые обращения] - Загрузка подкатегорий:', {
            product: productId,
            processingGroup: processingGroupId,
            category: categoryId,
            ssn: wccSsnName,
            usr: wccUsrName,
        });

        const htmlText = await fetchFromArm(
            '/cgi-bin/ppo/excells/wcc_unified_classifier_reasons.ajax_get_uni_main_reasons',
            formData
        );

        const subcategories = parseHtmlOptions(htmlText, '.uni_load_main_reason');

        console.log('[Хелпер] - [Быстрые обращения] - Загружено подкатегорий:', subcategories);
        return subcategories;
    } catch (error) {
        console.error('[Хелпер] - [Быстрые обращения] - Ошибка при загрузке подкатегорий:', error);
        notify(
            'Быстрые обращения',
            'Настраивать пресеты можно только с браузера на VDI',
            'error'
        );
        return [];
    }
}

export async function hasChildReasons(
    productId: number,
    processingGroupId: string,
    subcategoryId: string
): Promise<boolean> {
    try {
        const cookieResponse = await getCookies();
        if (!cookieResponse.ok || !cookieResponse.data?.wccUsrName || !cookieResponse.data?.wccSsnName) {
            return false;
        }

        const {wccUsrName, wccSsnName} = cookieResponse.data;
        const agrId = getAgrId(productId);
        const formData = `ssn$c=${encodeURIComponent(wccSsnName)}&usr$i=${encodeURIComponent(
            wccUsrName
        )}&step_id$i=${processingGroupId}&prob_class_id$i=${subcategoryId}&agr_id$i=${agrId}`;

        const htmlText = await fetchFromArm(
            '/cgi-bin/ppo/excells/wcc_unified_classifier_reasons.ajax_get_uni_child_reasons',
            formData
        );

        return htmlText.includes('<select') && htmlText.includes('uni_load_child_reason');
    } catch {
        return false;
    }
}

export async function loadChildReasons(
    productId: number,
    processingGroupId: string,
    subcategoryId: string
): Promise<SelectOption[]> {
    try {
        const cookieResponse = await getCookies();
        if (!cookieResponse.ok || !cookieResponse.data?.wccUsrName || !cookieResponse.data?.wccSsnName) {
            notify(
                'Быстрые обращения',
                'Для настройки пресетов необходимо авторизоваться в ARM',
                'error'
            );
            return [];
        }

        const {wccUsrName, wccSsnName} = cookieResponse.data;
        const agrId = getAgrId(productId);
        const formData = `ssn$c=${encodeURIComponent(wccSsnName)}&usr$i=${encodeURIComponent(
            wccUsrName
        )}&step_id$i=${processingGroupId}&prob_class_id$i=${subcategoryId}&agr_id$i=${agrId}`;

        console.log('[Хелпер] - [Быстрые обращения] - Загрузка причин-детей:', {
            product: productId,
            processingGroup: processingGroupId,
            subcategory: subcategoryId,
            ssn: wccSsnName,
            usr: wccUsrName,
        });

        const htmlText = await fetchFromArm(
            '/cgi-bin/ppo/excells/wcc_unified_classifier_reasons.ajax_get_uni_child_reasons',
            formData
        );

        const childReasons = parseHtmlOptions(htmlText, '.uni_load_child_reason');

        console.log('[Хелпер] - [Быстрые обращения] - Загружено причин-детей:', childReasons);
        return childReasons;
    } catch (error) {
        console.error('[Хелпер] - [Быстрые обращения] - Ошибка при загрузке причин-детей:', error);
        notify(
            'Быстрые обращения',
            'Настраивать пресеты можно только с браузера на VDI',
            'error'
        );
        return [];
    }
}
