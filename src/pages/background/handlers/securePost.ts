/**
 * Hybrid RSA+AES-GCM encrypted POST runner.
 *
 * Runs entirely inside the background service worker so we never have to
 * hand WebCrypto objects across realms (a content-script TypedArray would
 * trip Firefox's "permission denied to access property constructor" guard
 * and would not work at all on HTTP pages, since crypto.subtle is gated on
 * a secure context). The content script and popup talk to this handler via
 * chrome.runtime.sendMessage.
 */

const API_BASE_URL = "https://helper.chrsnv.ru";
const PUBLIC_KEY_URL = `${API_BASE_URL}/api/public-key.json`;

let cachedRsaKey: CryptoKey | null = null;

async function getRsaPublicKey(): Promise<CryptoKey> {
    if (cachedRsaKey) return cachedRsaKey;

    const response = await fetch(PUBLIC_KEY_URL);
    const data = (await response.json()) as {publicKey?: string};
    if (!data.publicKey) throw new Error("Failed to fetch RSA public key");

    const pem = data.publicKey.replace(/\\n/g, "\n");
    const body = pem
        .replace("-----BEGIN PUBLIC KEY-----", "")
        .replace("-----END PUBLIC KEY-----", "")
        .replace(/\s/g, "");

    const der = Uint8Array.from(atob(body), (c) => c.charCodeAt(0));
    cachedRsaKey = await crypto.subtle.importKey(
        "spki",
        der,
        {name: "RSA-OAEP", hash: "SHA-256"},
        false,
        ["encrypt"],
    );
    return cachedRsaKey;
}

function toBase64(buf: ArrayBuffer | Uint8Array): string {
    const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
}

function fromBase64(s: string): Uint8Array {
    const binary = atob(s);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
}

interface SecureEnvelope {
    iv: string;
    ciphertext: string;
    authTag: string;
}

interface SecureRequestEnvelope extends SecureEnvelope {
    encryptedKey: string;
}

interface BackendError {
    success: false;
    error: string;
}

interface BackendSuccess<T> {
    success: true;
    data: T;
}

async function getAccessToken(): Promise<string | null> {
    return new Promise((resolve) => {
        chrome.storage.local.get(["auth_state"], (result) => {
            const state = result.auth_state as {accessToken?: string} | undefined;
            resolve(state?.accessToken ?? null);
        });
    });
}

export interface SecurePostMessage {
    action: "securePost";
    path: string;
    payload: unknown;
}

export type SecurePostResult<T = unknown> =
    | {ok: true; data: T}
    | {ok: false; status: number; error: string};

export async function handleSecurePost<T = unknown>(
    message: SecurePostMessage,
): Promise<SecurePostResult<T>> {
    try {
        const token = await getAccessToken();
        if (!token) return {ok: false, status: 401, error: "Not authenticated"};

        const rawAesKey = crypto.getRandomValues(new Uint8Array(32));
        const aesKey = await crypto.subtle.importKey(
            "raw",
            rawAesKey,
            {name: "AES-GCM"},
            false,
            ["encrypt", "decrypt"],
        );

        const rsaKey = await getRsaPublicKey();
        const wrappedKey = new Uint8Array(
            await crypto.subtle.encrypt({name: "RSA-OAEP"}, rsaKey, rawAesKey),
        );

        const iv = crypto.getRandomValues(new Uint8Array(12));
        const plaintext = new TextEncoder().encode(JSON.stringify(message.payload));
        const combined = new Uint8Array(
            await crypto.subtle.encrypt({name: "AES-GCM", iv}, aesKey, plaintext),
        );
        const ciphertext = combined.slice(0, combined.length - 16);
        const authTag = combined.slice(combined.length - 16);

        const envelope: SecureRequestEnvelope = {
            encryptedKey: toBase64(wrappedKey),
            iv: toBase64(iv),
            ciphertext: toBase64(ciphertext),
            authTag: toBase64(authTag),
        };

        const response = await fetch(`${API_BASE_URL}${message.path}`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(envelope),
        });

        if (response.status === 401) {
            return {ok: false, status: 401, error: "Unauthorized"};
        }

        const text = await response.text();
        let body: SecureEnvelope | BackendError;
        try {
            body = JSON.parse(text);
        } catch {
            return {
                ok: false,
                status: response.status,
                error: `Invalid response: ${text.slice(0, 120)}`,
            };
        }

        if ("error" in body && body.success === false) {
            return {ok: false, status: response.status, error: body.error};
        }

        const respEnvelope = body as SecureEnvelope;
        const respIv = fromBase64(respEnvelope.iv);
        const respCiphertext = fromBase64(respEnvelope.ciphertext);
        const respAuthTag = fromBase64(respEnvelope.authTag);
        const respCombined = new Uint8Array(respCiphertext.length + respAuthTag.length);
        respCombined.set(respCiphertext);
        respCombined.set(respAuthTag, respCiphertext.length);
        const decrypted = await crypto.subtle.decrypt(
            {name: "AES-GCM", iv: respIv},
            aesKey,
            respCombined,
        );
        const decoded = JSON.parse(new TextDecoder().decode(decrypted)) as
            | BackendSuccess<T>
            | BackendError;

        if (!decoded.success) {
            return {ok: false, status: response.status, error: decoded.error};
        }
        return {ok: true, data: decoded.data};
    } catch (err) {
        console.error("[securePost] failed:", err);
        return {ok: false, status: 0, error: String(err)};
    }
}
