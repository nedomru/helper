import type {PageConfig} from "../core/types";

// Client Card Features
import {copyClientCardButton, sendClientCardButton} from "./features/client-card";

// Compensation Features
import {compensateButton} from "./features/compensation";

// Network Info Features
import {copyIPAddress, copyMACAddress} from "./features/network-info";

// UI Enhancement Features
import {allowCopy, removeGenerationTimes, showAgreementOnRequestChange} from "./features/ui-enhancements";
import {copyClientAgreementButton} from "@pages/content/arm/features/client-agreement";
import {copyClientAddressButton} from "@pages/content/arm/features/client-address";
import {macLookupButton} from "@pages/content/arm/features/network-info/macLookup";
import {foldSpas} from "@pages/content/arm/features/folding/spas";
import {foldTabInfo} from "@pages/content/arm/features/folding/info";
import {foldTabCRequests} from "@pages/content/arm/features/folding/connection_requests";
import {foldTabApplications} from "@pages/content/arm/features/folding/applications";
import {foldTabAppeals} from "@pages/content/arm/features/folding/appeals";
import {foldTabSRequests} from "@pages/content/arm/features/folding/service_requests";
import {removeDiagnosticTabs} from "@pages/content/arm/features/ui-enhancements/eqm";
import {removeAppealsColumns} from "@pages/content/arm/features/ui-enhancements/appeals";
import {showWarrantyExpiration} from "@pages/content/arm/features/highlights/warranty";
import {showAppealsHighlights} from "@pages/content/arm/features/highlights/appeals";
import {showSubscriptionStatus} from "@pages/content/arm/features/highlights/subscriptions";

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
            {key: 'arm_foldSpas', handler: foldSpas},
            {key: 'arm_foldTabInfo', handler: foldTabInfo},
            {key: 'arm_foldTabApplications', handler: foldTabApplications},
            {key: 'arm_foldTabAppeals', handler: foldTabAppeals},
            {key: 'arm_foldTabSRequests', handler: foldTabSRequests},
            {key: 'arm_foldTabCRequests', handler: foldTabCRequests},
            {key: 'arm_removeDiagnosticTabs', handler: removeDiagnosticTabs},
            {key: 'arm_removeAppealsColumns', handler: removeAppealsColumns},
        ],
        alwaysRun: [
            allowCopy,
            copyClientCardButton,
            sendClientCardButton,
            copyClientAgreementButton,
            copyClientAddressButton,
            compensateButton,
            removeGenerationTimes,
            showWarrantyExpiration,
            showAppealsHighlights,
            showSubscriptionStatus
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
        alwaysRun: [],
    },

    {
        pattern: URL_PATTERNS.LEFT_FRAME,
        features: [],
        alwaysRun: [],
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
