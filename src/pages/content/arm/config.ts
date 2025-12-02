import type {PageConfig} from "../core/types";
import {allowCopy, showAgreementOnRequestChange} from "./utility";
import {copyClientCard} from "@pages/content/genesys/buttons";

// URL patterns for ARM
export const URL_PATTERNS = {
    ARM_BASE: "ertelecom.ru/cgi-bin", // Whole ARM
    EXCELLS: "ertelecom.ru/cgi-bin/ppo/excells",
    CLIENT_SESSION:
        "ertelecom.ru/static_pages/private/wcc/client_session/?user_id", // Client sessions
    RADIUS_LOGIN:
        "ertelecom.ru/cgi-bin/ppo/excells/radius_accounting_info.login_detail?id_session",
    LEFT_FRAME: "wcc2_main.frame_left_reasons", // Left frame
    RETENTION: "ertelecom.ru/cgi-bin/ppo/excells/adv_act_retention", // Retentions
    CHANGE_REQUEST: "wcc_request_appl_support.change_request_appl", // Request edit
} as const;

export const armPageConfigs: PageConfig[] = [
    {
        pattern: URL_PATTERNS.EXCELLS,
        features: [],
        alwaysRun: [allowCopy, copyClientCard],
    },

    {
        pattern: URL_PATTERNS.CLIENT_SESSION,
        features: [],
        alwaysRun: [],
    },

    {
        pattern: URL_PATTERNS.RADIUS_LOGIN,
        features: [],
        alwaysRun: [],
    },

    {
        pattern: URL_PATTERNS.LEFT_FRAME,
        features: [],
        alwaysRun: []
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
