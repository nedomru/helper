import type {PageConfig} from "../core/types";

import {
    allowCopy,
    diagnosticReportsButton,
    removeGenerationTimes,
    showAgreementOnRequestChange
} from "./features/ui-enhancements";
import {macLookupButton} from "@pages/content/arm/features/network-info/macLookup";
import {hideDiagnosticTabs} from "./features/ui-enhancements/eqm";
import {addAppealIframeButtons, removeAppealsColumns} from "./features/ui-enhancements/appeals";
import {hideSelectedTabs} from "./features/ui-enhancements/hideTabs";
import {showWarrantyExpiration} from "@pages/content/arm/features/highlights/warranty";
import {showAppealsHighlights} from "@pages/content/arm/features/highlights/appeals";
import {showSubscriptionStatus} from "@pages/content/arm/features/highlights/subscriptions";
import {searchByAppeal, searchOpenedAppeals} from "@pages/content/arm/features/search/appeals";
import {searchByProperty} from "@pages/content/arm/features/search/properties";
import {searchByLog} from "@pages/content/arm/features/search/logs";
import {checkSpecialClient} from "@pages/content/arm/features/alerts/special_client";
import {smartAnticipation} from "@pages/content/arm/features/anticipation/smart";
import {copyClientCardButton} from "@pages/content/arm/features/client-card/copyButton";
import {sendClientCardButton} from "@pages/content/arm/features/client-card/sendButton";
import {copyClientAgreementButton} from "@pages/content/arm/features/client-agreement/copyButton";
import {copyClientAddressButton} from "@pages/content/arm/features/client-address/copyButton";
import {compensateButton} from "@pages/content/arm/features/compensation/button";
import {copyMACAddress} from "@pages/content/arm/features/network-info/macCopy";
import {copyIPAddress} from "@pages/content/arm/features/network-info/ipCopy";
import {filterSessions} from "@pages/content/arm/features/sessions-history/filters";
import {macLookupButton as sessionsMacLookupButton} from "@pages/content/arm/features/sessions-history/macLookup";
import {copyMACAddress as sessionsCopyMACAddress} from "@pages/content/arm/features/sessions-history/macCopy";
import {copyIPAddress as sessionsCopyIPAddress} from "@pages/content/arm/features/sessions-history/ipCopy";
import {loadLastDayClientSessions} from "@pages/content/arm/features/ui-enhancements/sessionsLastDay";
import {smsButtons} from "@pages/content/arm/features/sms/fast_choose";
import {copyClientNumber} from "@pages/content/arm/features/client-number/copyButton";
import quickAppeals from "@pages/content/arm/features/fast-appeals/buttons";
import {showClientAge} from "@pages/content/arm/features/ui-enhancements/client-age";
import {findAppealsButton} from "@pages/content/arm/features/client-guts/find-appeals";
import {setupAppealsCheck} from "@pages/content/arm/features/left-frame/check-appeals";
import {foldSpas} from "@pages/content/arm/features/folding/spas";
import {foldSelectedTabs} from "@pages/content/arm/features/ui-enhancements/foldTabs";

// URL patterns for ARM
export const URL_PATTERNS = {
    ARM_BASE: "ertelecom.ru/cgi-bin", // Whole ARM
    EXCELLS: "ertelecom.ru/cgi-bin/ppo/excells",
    CLIENT_SESSIONS:
        "ertelecom.ru/static_pages/private/wcc/client_session/?user_id", // Client sessions
    CLIENT_SESSION: "radius_accounting_info.login_detail?id_session",
    LEFT_FRAME: "wcc2_main.frame_left_reasons", // Left frame
    RETENTION: "ertelecom.ru/cgi-bin/ppo/excells/adv_act_retention", // Retentions
    CHANGE_REQUEST: "wcc_request_appl_support.change_request_appl", // Request edit
} as const;

export const armPageConfigs: PageConfig[] = [
    {
        pattern: URL_PATTERNS.EXCELLS,
        features: [
            {key: 'foldSpas', handler: foldSpas},
            {key: 'removeDiagnosticTabs', handler: hideDiagnosticTabs},
            {key: 'removeAppealsColumns', handler: removeAppealsColumns},
        ],
        alwaysRun: [
            allowCopy,
            smartAnticipation,
            checkSpecialClient,
            copyClientCardButton,
            sendClientCardButton,
            copyClientAgreementButton,
            copyClientAddressButton,
            compensateButton,
            diagnosticReportsButton,
            showWarrantyExpiration,
            showAppealsHighlights,
            showSubscriptionStatus,
            showClientAge,
            searchByAppeal,
            searchByLog,
            searchByProperty,
            searchOpenedAppeals,
            removeGenerationTimes,
            addAppealIframeButtons,
            smsButtons,
            copyClientNumber,
            findAppealsButton,
            hideSelectedTabs,
            foldSelectedTabs,
        ],
    },

    {
        pattern: URL_PATTERNS.CLIENT_SESSION,
        features: [],
        alwaysRun: [copyIPAddress, copyMACAddress, macLookupButton],
    },

    {
        pattern: URL_PATTERNS.CLIENT_SESSIONS,
        features: [],
        alwaysRun: [
            filterSessions,
            sessionsCopyIPAddress,
            sessionsCopyMACAddress,
            sessionsMacLookupButton,
            loadLastDayClientSessions
        ],
    },

    {
        pattern: URL_PATTERNS.LEFT_FRAME,
        features: [],
        alwaysRun: [
            setupAppealsCheck,
            quickAppeals
        ],
    },

    {
        pattern: URL_PATTERNS.RETENTION,
        alwaysRun: [],
        features: [],
    },

    {
        pattern: URL_PATTERNS.ARM_BASE,
        features: [],
        alwaysRun: [],
    },

    {
        pattern: URL_PATTERNS.CHANGE_REQUEST,
        features: [],
        alwaysRun: [showAgreementOnRequestChange],
    },
];
