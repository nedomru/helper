import type {LookupMACMessage, MACLookupResult, Response} from "../types";

const macLookupCache = new Map<string, MACLookupResult>();

export async function handleMACLookup(message: LookupMACMessage): Promise<Response<MACLookupResult>> {
    try {
        // Check cache first
        if (macLookupCache.has(message.mac)) {
            return {ok: true, data: macLookupCache.get(message.mac)!};
        }

        // Use CORS proxy to bypass extension origin restrictions
        const apiUrl = `https://api.macvendors.com/${message.mac}`;
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(apiUrl)}`;

        const response = await fetch(proxyUrl);

        if (!response.ok) {
            throw new Error(String(response.status));
        }

        const text = await response.text();
        const result: MACLookupResult = {company: text || "Unknown"};

        // Cache the result
        macLookupCache.set(message.mac, result);

        return {ok: true, data: result};
    } catch (error) {
        return {ok: false, err: String(error)};
    }
}
