/**
 * Client notes API client.
 *
 * Notes are stored on the backend, shared between all authenticated operators,
 * and auto-purged after 7 days. All requests are end-to-end encrypted via the
 * secure-api helper.
 */

import {securePost} from "@src/utils/secure-api";

export interface ClientNote {
    id: string;
    agreement: string;
    text: string;
    authorUserId: string;
    authorName: string;
    authorUsername: string | null;
    createdAt: string;
    updatedAt: string;
}

interface ListResponse {
    notes: ClientNote[];
}

interface CreateResponse {
    note: ClientNote;
}

interface DeleteResponse {
    deleted: boolean;
}

export async function getNotesForAgreement(agreement: string): Promise<ClientNote[]> {
    if (!agreement) return [];
    try {
        const res = await securePost<{agreement: string}, ListResponse>("/api/notes/list", {
            agreement,
        });
        return res.notes ?? [];
    } catch (err) {
        console.error("[client-notes] list failed:", err);
        return [];
    }
}

export async function addNote(
    agreement: string,
    text: string,
    authorName?: string,
    authorUsername?: string | null,
): Promise<ClientNote | null> {
    const trimmed = text.trim();
    if (!agreement || !trimmed) return null;
    try {
        const res = await securePost<
            {agreement: string; text: string; authorName?: string; authorUsername?: string},
            CreateResponse
        >("/api/notes/create", {
            agreement,
            text: trimmed,
            authorName,
            authorUsername: authorUsername ?? undefined,
        });
        return res.note;
    } catch (err) {
        console.error("[client-notes] create failed:", err);
        return null;
    }
}

export async function deleteNote(id: string): Promise<boolean> {
    try {
        const res = await securePost<{id: string}, DeleteResponse>("/api/notes/delete", {id});
        return res.deleted;
    } catch (err) {
        console.error("[client-notes] delete failed:", err);
        return false;
    }
}
