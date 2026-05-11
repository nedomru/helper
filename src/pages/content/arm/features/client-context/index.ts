import {type ClientContext, saveClientContext} from "@src/shared/placeholders";

function trimmed(value: string | null | undefined): string | undefined {
    if (!value) return undefined;
    const t = value.trim();
    return t.length > 0 ? t : undefined;
}

function extractContext(): Partial<ClientContext> {
    const agreement = trimmed(
        document.getElementById("agr_with_type")?.getElementsByTagName("b")[0]?.textContent,
    );

    const phoneEl = document.querySelector<HTMLSpanElement>(".tele_finesse");
    const phone =
        trimmed(phoneEl?.getAttribute("value")) ?? trimmed(phoneEl?.innerText);

    const ip = trimmed(document.querySelector<HTMLElement>(".ip acronym")?.innerText);
    const mac = trimmed(document.querySelector<HTMLElement>("span.mac")?.textContent);

    const update: Partial<ClientContext> = {};
    if (agreement) update.agreement = agreement;
    if (phone) update.phone = phone;
    if (ip) update.ip = ip;
    if (mac) update.mac = mac;
    return update;
}

let lastSerialized = "";

function syncContext(): void {
    const update = extractContext();
    if (Object.keys(update).length === 0) return;
    const serialized = JSON.stringify(update);
    if (serialized === lastSerialized) return;
    lastSerialized = serialized;
    saveClientContext(update).catch((err) =>
        console.error("[ARM] - Failed to save client context:", err),
    );
}

let observerStarted = false;

export async function broadcastClientContext(): Promise<void> {
    syncContext();

    if (observerStarted) return;
    observerStarted = true;

    let scheduled = false;
    const observer = new MutationObserver(() => {
        if (scheduled) return;
        scheduled = true;
        setTimeout(() => {
            scheduled = false;
            syncContext();
        }, 500);
    });
    observer.observe(document.body, {childList: true, subtree: true});
}
