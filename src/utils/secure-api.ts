/**
 * Client wrapper for end-to-end encrypted API calls.
 *
 * Heavy lifting (RSA wrap + AES-GCM encrypt/decrypt + fetch) happens in the
 * background service worker via the "securePost" message. Content scripts
 * and popups stay realm-clean and don't need a secure context, so this
 * works on HTTP-served pages like ARM and avoids Firefox's cross-realm
 * "permission denied to access property constructor" trap on TypedArrays
 * produced by WebCrypto.
 */

import type {SecurePostResult} from "@pages/background/handlers/securePost";

export class SecureApiError extends Error {
    constructor(public status: number, message: string) {
        super(message);
    }
}

export async function securePost<TReq, TRes>(path: string, payload: TReq): Promise<TRes> {
    let response: SecurePostResult<TRes>;
    try {
        response = (await chrome.runtime.sendMessage({
            action: "securePost",
            path,
            payload,
        })) as SecurePostResult<TRes>;
    } catch (err) {
        throw new SecureApiError(0, `Background unreachable: ${String(err)}`);
    }

    if (!response) {
        throw new SecureApiError(0, "No response from background");
    }

    if (!response.ok) {
        throw new SecureApiError(response.status, response.error);
    }
    return response.data;
}
