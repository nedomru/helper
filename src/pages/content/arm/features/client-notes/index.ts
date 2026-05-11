import {addNote, type ClientNote, deleteNote, getNotesForAgreement} from "@src/shared/client-notes";
import {getAuthState} from "@src/utils/auth";
import {notify} from "@src/utils/notify";

const PANEL_ID = "helper-client-notes-panel";
const BUTTON_ID = "helper-client-notes-button";
const STYLE_ID = "helper-client-notes-styles";

let currentAgreement: string | null = null;
let currentUserId: string | null = null;
let panelOpen = false;
let isLoading = false;

function extractAgreement(): string | null {
    const value = document
        .getElementById("agr_with_type")
        ?.getElementsByTagName("b")[0]
        ?.textContent?.trim();
    return value || null;
}

function injectStyles(): void {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
        #${BUTTON_ID} {
            position: fixed; right: 20px; bottom: 20px; z-index: 99999;
            display: flex; align-items: center; gap: 6px;
            background: #2563eb; color: white; border: none; border-radius: 999px;
            padding: 8px 14px; font-size: 13px; font-weight: 500; cursor: pointer;
            box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        #${BUTTON_ID}:hover { background: #1d4ed8; }
        #${BUTTON_ID} .badge {
            background: white; color: #2563eb; border-radius: 999px;
            min-width: 18px; height: 18px; padding: 0 5px;
            font-size: 11px; font-weight: 700;
            display: inline-flex; align-items: center; justify-content: center;
        }
        #${PANEL_ID} {
            position: fixed; right: 20px; bottom: 70px; z-index: 99999;
            width: 340px; max-height: 480px;
            background: white; border: 1px solid #e2e8f0; border-radius: 12px;
            box-shadow: 0 12px 32px rgba(0,0,0,0.18);
            display: flex; flex-direction: column;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            font-size: 13px; color: #0f172a;
        }
        #${PANEL_ID} .helper-notes-header {
            padding: 10px 14px; border-bottom: 1px solid #f1f5f9;
            display: flex; align-items: center; justify-content: space-between;
            font-weight: 600;
        }
        #${PANEL_ID} .helper-notes-body {
            padding: 10px 14px; overflow-y: auto; flex: 1;
            display: flex; flex-direction: column; gap: 6px;
        }
        #${PANEL_ID} .helper-notes-empty {
            color: #64748b; text-align: center; padding: 20px 0;
        }
        #${PANEL_ID} .helper-note {
            background: #fefce8; border: 1px solid #fde68a; border-radius: 8px;
            padding: 8px 10px; position: relative;
        }
        #${PANEL_ID} .helper-note-text {
            white-space: pre-wrap; word-break: break-word;
        }
        #${PANEL_ID} .helper-note-meta {
            color: #92400e; font-size: 11px; margin-top: 4px;
            display: flex; justify-content: space-between; gap: 8px;
        }
        #${PANEL_ID} .helper-note-author {
            color: #1d4ed8; text-decoration: none;
        }
        #${PANEL_ID} .helper-note-author:hover {
            text-decoration: underline;
        }
        #${PANEL_ID} .helper-note-delete {
            background: transparent; border: none; color: #b91c1c;
            cursor: pointer; font-size: 14px; padding: 0;
        }
        #${PANEL_ID} .helper-notes-form {
            padding: 10px 14px; border-top: 1px solid #f1f5f9;
            display: flex; flex-direction: column; gap: 6px;
        }
        #${PANEL_ID} textarea {
            width: 100%; min-height: 60px; padding: 6px 8px;
            border: 1px solid #e2e8f0; border-radius: 6px;
            font-family: inherit; font-size: 13px; resize: vertical;
            box-sizing: border-box;
        }
        #${PANEL_ID} .helper-notes-actions {
            display: flex; gap: 6px; justify-content: flex-end;
        }
        #${PANEL_ID} button.helper-notes-btn {
            background: #2563eb; color: white; border: none; border-radius: 6px;
            padding: 5px 12px; font-size: 12px; cursor: pointer;
        }
        #${PANEL_ID} button.helper-notes-btn:hover { background: #1d4ed8; }
        #${PANEL_ID} button.helper-notes-btn-secondary {
            background: #f1f5f9; color: #0f172a;
        }
        #${PANEL_ID} button.helper-notes-btn-secondary:hover { background: #e2e8f0; }
        #${PANEL_ID} .helper-notes-close {
            background: transparent; border: none; cursor: pointer;
            font-size: 18px; line-height: 1; color: #64748b;
        }
    `;
    document.head.appendChild(style);
}

function formatTime(ts: number): string {
    const d = new Date(ts);
    return `${d.getDate().toString().padStart(2, "0")}.${(d.getMonth() + 1).toString().padStart(2, "0")} ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

async function getOperatorName(): Promise<string | undefined> {
    const auth = await getAuthState();
    const u = auth?.user;
    if (!u) return undefined;
    return [u.first_name, u.last_name].filter(Boolean).join(" ") || u.username;
}

async function getOperatorUsername(): Promise<string | undefined> {
    const auth = await getAuthState();
    return auth?.user?.username || undefined;
}

async function getOperatorId(): Promise<string | null> {
    if (currentUserId) return currentUserId;
    const auth = await getAuthState();
    currentUserId = auth?.user?.userId ?? null;
    return currentUserId;
}

function renderButton(agreement: string, count: number): void {
    let btn = document.getElementById(BUTTON_ID);
    if (!btn) {
        btn = document.createElement("button");
        btn.id = BUTTON_ID;
        btn.type = "button";
        btn.addEventListener("click", togglePanel);
        document.body.appendChild(btn);
    }
    btn.innerHTML = `📝 Заметки <span class="badge">${count}</span>`;
    btn.title = `Заметки по договору ${agreement}`;
}

async function renderPanel(): Promise<void> {
    if (!currentAgreement) return;
    let panel = document.getElementById(PANEL_ID);
    if (!panel) {
        panel = document.createElement("div");
        panel.id = PANEL_ID;
        document.body.appendChild(panel);
    }

    panel.innerHTML = `
        <div class="helper-notes-header">
            <span>📝 Заметки · ${currentAgreement}</span>
            <button class="helper-notes-close" type="button" aria-label="Закрыть">×</button>
        </div>
        <div class="helper-notes-body">
            <div class="helper-notes-empty">Загрузка...</div>
        </div>
        <div class="helper-notes-form">
            <textarea placeholder="Новая заметка..." maxlength="2000"></textarea>
            <div class="helper-notes-actions">
                <button class="helper-notes-btn helper-notes-btn-secondary" type="button" data-action="cancel">Отмена</button>
                <button class="helper-notes-btn" type="button" data-action="save">Сохранить</button>
            </div>
        </div>
    `;

    panel.querySelector(".helper-notes-close")?.addEventListener("click", closePanel);
    panel.querySelector('[data-action="cancel"]')?.addEventListener("click", () => {
        const ta = panel?.querySelector("textarea");
        if (ta) (ta as HTMLTextAreaElement).value = "";
    });
    panel.querySelector('[data-action="save"]')?.addEventListener("click", handleSave);

    const notes = await getNotesForAgreement(currentAgreement);
    const userId = await getOperatorId();

    const body = panel.querySelector(".helper-notes-body");
    if (body) {
        body.innerHTML =
            notes.length === 0
                ? '<div class="helper-notes-empty">Заметок ещё нет. Добавьте первую снизу.</div>'
                : notes.map((n) => renderNote(n, userId)).join("");

        body.querySelectorAll<HTMLButtonElement>("[data-delete-id]").forEach((b) => {
            b.addEventListener("click", () => {
                const id = b.getAttribute("data-delete-id");
                if (id) void handleDelete(id);
            });
        });
    }
}

function renderNote(note: ClientNote, currentUserId: string | null): string {
    const text = escapeHtml(note.text);
    const authorName = note.authorName ? escapeHtml(note.authorName) : "—";
    const authorMarkup = note.authorUsername
        ? `<a class="helper-note-author" href="https://t.me/${escapeHtml(note.authorUsername)}" target="_blank" rel="noopener noreferrer" title="@${escapeHtml(note.authorUsername)} — открыть в Telegram">${authorName}</a>`
        : `<span>${authorName}</span>`;
    const isOwn = currentUserId !== null && note.authorUserId === currentUserId;
    const deleteBtn = isOwn
        ? `<button class="helper-note-delete" type="button" data-delete-id="${note.id}" title="Удалить">🗑</button>`
        : "";
    return `
        <div class="helper-note">
            <div class="helper-note-text">${text}</div>
            <div class="helper-note-meta">
                <span>${formatTime(note.createdAt)} · ${authorMarkup}</span>
                ${deleteBtn}
            </div>
        </div>
    `;
}

function escapeHtml(s: string): string {
    return s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

async function handleSave(): Promise<void> {
    if (!currentAgreement || isLoading) return;
    const panel = document.getElementById(PANEL_ID);
    const ta = panel?.querySelector("textarea") as HTMLTextAreaElement | null;
    const value = ta?.value.trim();
    if (!value) return;
    const [author, username] = await Promise.all([
        getOperatorName(),
        getOperatorUsername(),
    ]);

    isLoading = true;
    const saved = await addNote(currentAgreement, value, author, username);
    isLoading = false;

    if (!saved) {
        notify("📝 Заметки", "Не удалось сохранить заметку. Проверьте соединение.", "error");
        return;
    }
    if (ta) ta.value = "";
    await refresh();
}

async function handleDelete(id: string): Promise<void> {
    if (isLoading) return;
    isLoading = true;
    const ok = await deleteNote(id);
    isLoading = false;
    if (!ok) {
        notify("📝 Заметки", "Удалить можно только свою заметку", "warning");
        return;
    }
    await refresh();
}

function togglePanel(): void {
    panelOpen ? closePanel() : openPanel();
}

function openPanel(): void {
    panelOpen = true;
    void renderPanel();
}

function closePanel(): void {
    panelOpen = false;
    document.getElementById(PANEL_ID)?.remove();
}

async function refresh(): Promise<void> {
    if (!currentAgreement) return;
    const notes = await getNotesForAgreement(currentAgreement);
    renderButton(currentAgreement, notes.length);
    if (panelOpen) await renderPanel();
}

async function sync(): Promise<void> {
    const agreement = extractAgreement();
    if (!agreement) return;
    if (agreement === currentAgreement) return;
    currentAgreement = agreement;
    injectStyles();
    await refresh();
}

let observerStarted = false;

export async function setupClientNotes(): Promise<void> {
    await sync();

    if (observerStarted) return;
    observerStarted = true;

    let scheduled = false;
    const observer = new MutationObserver(() => {
        if (scheduled) return;
        scheduled = true;
        setTimeout(() => {
            scheduled = false;
            void sync();
        }, 500);
    });
    observer.observe(document.body, {childList: true, subtree: true});
}
