export interface SendClientCardRequest {
    action: "sendClientCard";
    payload: {
        message: string;
    };
}

export interface LookupMACMessage {
    type: "LOOKUP_MAC";
    mac: string;
}

export interface FetchDiagnosticReportsMessage {
    action: "fetchDiagnosticReports";
    payload: {
        urls: string[];
    };
}

export interface FetchAppealsMessage {
    action: "fetchAppeals";
    payload: {
        cityId: string;
    };
}

export interface AppealDetail {
    id: string;
    agreementNumber: string;
    reqStop: string;
    problemClass: string;
    groupOrder: string;
    appealsCount: string;
    groupName: string;
    address: string;
    campusNumber: string;
    closed: string;
    info: string;
    isError: number;
}

export interface DiagnosticFile {
    name: string;
    url: string;
    source: string;
}

export interface MACLookupResult {
    company: string;
}

export interface Response<T = unknown> {
    ok: boolean;
    data?: T;
    err?: string;
}
