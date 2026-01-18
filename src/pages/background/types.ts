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

export interface MACLookupResult {
    company: string;
}

export interface Response<T = unknown> {
    ok: boolean;
    data?: T;
    err?: string;
}
