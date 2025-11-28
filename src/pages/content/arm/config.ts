import type {PageConfig} from "../core/types";
import {allowCopy, showAgreementOnRequestChange} from "./utility";

// URL паттерны для ARM
export const URL_PATTERNS = {
    ARM_BASE: "ertelecom.ru/cgi-bin", // Весь АРМ
    EXCELLS: "ertelecom.ru/cgi-bin/ppo/excells",
    CLIENT_SESSION:
        "ertelecom.ru/static_pages/private/wcc/client_session/?user_id", // Сессии клиента
    RADIUS_LOGIN:
        "ertelecom.ru/cgi-bin/ppo/excells/radius_accounting_info.login_detail?id_session",
    LEFT_FRAME: "wcc2_main.frame_left_reasons", // Левый фрейм
    RETENTION: "ertelecom.ru/cgi-bin/ppo/excells/adv_act_retention", // Акции на удержание
    CHANGE_REQUEST: "wcc_request_appl_support.change_request_appl", // Изменение обращения
} as const;

// Конфигурация страниц ARM
export const armPageConfigs: PageConfig[] = [
    {
        pattern: URL_PATTERNS.EXCELLS,
        features: [],
        alwaysRun: [allowCopy],
    },

    // Страница сессий клиента
    {
        pattern: URL_PATTERNS.CLIENT_SESSION,
        features: [
            // { key: 'ARM_filterClientSessions', handler: initFilterClientSessions },
            // { key: 'ARM_copySearchMAC', handler: copyMAC }
        ],
        alwaysRun: [
            // loadLastDayClientSessions
        ],
    },

    // Страница RADIUS логина
    {
        pattern: URL_PATTERNS.RADIUS_LOGIN,
        features: [
            // { key: 'ARM_copySearchMAC', handler: copyMAC }
        ],
        alwaysRun: [
            // copyIPAddress,
        ],
    },

    // Левый фрейм
    {
        pattern: URL_PATTERNS.LEFT_FRAME,
        features: [
            // { key: 'ARM_changeRequestFBLF', handler: leftFrame_fastAppeals },
            // { key: 'ARM_leftFrame_fastSR', handler: leftFrame_fastSR },
            // { key: 'ARM_setAppealItemToInternet', handler: changeAppealItemToInternet }
        ],
    },

    // Страница акций на удержание
    {
        pattern: URL_PATTERNS.RETENTION,
        alwaysRun: [
            // agrTransCompensationButton,
            // autoFormatCompensateButtons
        ],
        features: [],
    },

    // Базовая страница ARM (исключая страницу изменения обращения)
    {
        pattern: URL_PATTERNS.ARM_BASE,
        features: [
            // { key: 'ARM_hideSPAS', handler: hideSPAS },
            // { key: 'ARM_copyClientAddress', handler: copyClientAddress },
            // ... другие базовые функции ARM
        ],
        alwaysRun: [
            // async () => {
            //     // Удаление вкладок
            //     const tabSettings = await chrome.storage.sync.get(Object.keys(TABS_CONFIG));
            //     const tabsToDelete = Object.entries(tabSettings)
            //         .filter(([_, enabled]) => enabled)
            //         .map(([key]) => TABS_CONFIG[key as keyof typeof TABS_CONFIG]);
            //
            //     if (tabsToDelete.length) {
            //         await deleteTabs(tabsToDelete);
            //     }
            // }
        ],
    },

    // Страница изменения обращения
    {
        pattern: URL_PATTERNS.CHANGE_REQUEST,
        features: [],
        alwaysRun: [showAgreementOnRequestChange],
    },
];
