/**
 * Client for end-to-end encrypted API calls.
 *
 * Wire format matches the backend secure-route:
 *   request  → { encryptedKey, iv, ciphertext, authTag }
 *   response → { iv, ciphertext, authTag } (encrypted with the same AES key)
 *
 * Each call generates a fresh 256-bit AES key, encrypts it with the server's
 * RSA public key, encrypts the JSON payload with AES-GCM, and reuses the same
 * AES key to decrypt the response.
 */

import {getAccessToken} from "@src/utils/auth";

const API_BASE_URL = "https://helper.chrsnv.ru";
const PUBLIC_KEY_URL = `${API_BASE_URL}/api/public-key.json`;

let cachedRsaKey: CryptoKey | null = null;

async function getRsaPublicKey(): Promise<CryptoKey> {
    if (cachedRsaKey) return cachedRsaKey;

    const response = await fetch(PUBLIC_KEY_URL);
    const data = (await response.json()) as {publicKey?: string};
    if (!data.publicKey) {
        throw new Error("Failed to fetch RSA public key");
    }

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
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

function fromBase64(s: string): Uint8Array {
    const binary = atob(s);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
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

interface BackendSuccess<T> {
    success: true;
    data: T;
}

interface BackendError {
    success: false;
    error: string;
}

export class SecureApiError extends Error {
    constructor(public status: number, message: string) {
        super(message);
    }
}

async function encryptPayload(
    aesKey: CryptoKey,
    payload: unknown,
): Promise<SecureEnvelope> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const plaintext = new TextEncoder().encode(JSON.stringify(payload));
    const combined = new Uint8Array(
        await crypto.subtle.encrypt({name: "AES-GCM", iv}, aesKey, plaintext),
    );
    // WebCrypto concatenates ciphertext + 16-byte auth tag.
    const ciphertext = combined.slice(0, combined.length - 16);
    const authTag = combined.slice(combined.length - 16);
    return {
        iv: toBase64(iv),
        ciphertext: toBase64(ciphertext),
        authTag: toBase64(authTag),
    };
}

async function decryptPayload<T>(aesKey: CryptoKey, envelope: SecureEnvelope): Promise<T> {
    const ciphertext = fromBase64(envelope.ciphertext);
    const authTag = fromBase64(envelope.authTag);
    const iv = fromBase64(envelope.iv);
    const combined = new Uint8Array(ciphertext.length + authTag.length);
    combined.set(ciphertext);
    combined.set(authTag, ciphertext.length);
    const plaintext = await crypto.subtle.decrypt(
        {name: "AES-GCM", iv},
        aesKey,
        combined,
    );
    return JSON.parse(new TextDecoder().decode(plaintext)) as T;
}

/**
 * Make an encrypted POST request and decrypt the response. Throws SecureApiError
 * on transport or HTTP failure; rejects business errors with the same type but
 * after the response has been decrypted.
 */
export async function securePost<TReq, TRes>(path: string, payload: TReq): Promise<TRes> {
    const token = await getAccessToken();
    if (!token) {
        throw new SecureApiError(401, "Not authenticated");
    }

    const rawAesKey = crypto.getRandomValues(new Uint8Array(32));
    const aesKey = await crypto.subtle.importKey(
        "raw",
        rawAesKey,
        {name: "AES-GCM"},
        false,
        ["encrypt", "decrypt"],
    );

    const rsaKey = await getRsaPublicKey();
    const encryptedKey = new Uint8Array(
        await crypto.subtle.encrypt({name: "RSA-OAEP"}, rsaKey, rawAesKey),
    );

    const requestEnvelope: SecureEnvelope = await encryptPayload(aesKey, payload);
    const envelope: SecureRequestEnvelope = {
        encryptedKey: toBase64(encryptedKey),
        iv: requestEnvelope.iv,
        ciphertext: requestEnvelope.ciphertext,
        authTag: requestEnvelope.authTag,
    };

    const response = await fetch(`${API_BASE_URL}${path}`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(envelope),
    });

    if (response.status === 401) {
        throw new SecureApiError(401, "Unauthorized");
    }

    const text = await response.text();
    let body: SecureEnvelope | BackendError;
    try {
        body = JSON.parse(text);
    } catch {
        throw new SecureApiError(response.status, `Invalid response: ${text.slice(0, 100)}`);
    }

    if ("error" in body) {
        throw new SecureApiError(response.status, body.error);
    }

    const decoded = await decryptPayload<BackendSuccess<TRes> | BackendError>(aesKey, body);
    if (!decoded.success) {
        throw new SecureApiError(response.status, decoded.error);
    }
    return decoded.data;
}
