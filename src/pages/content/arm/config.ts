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
        features: [],
        alwaysRun: [
            allowCopy,
            copyClientCardButton,
            sendClientCardButton,
            copyClientAgreementButton,
            copyClientAddressButton,
            compensateButton,
            removeGenerationTimes,
        ],
    },

    {
        pattern: URL_PATTERNS.CLIENT_SESSION,
        features: [],
        alwaysRun: [copyIPAddress, copyMACAddress],
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
