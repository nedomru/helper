import {copyText, notify} from "@src/utils";

const STYLE_ID = "helper-bulk-actions-styles";
const TOOLBAR_ID = "helper-bulk-actions-toolbar";
const CHECKBOX_CLASS = "helper-bulk-row-checkbox";
const HEADER_CHECKBOX_CLASS = "helper-bulk-header-checkbox";

const IP_REGEX = /^(?:\d{1,3}\.){3}\d{1,3}$/;
const MAC_REGEX = /^[0-9a-f]{2}([-:][0-9a-f]{2}){5}$/i;

function injectStyles(): void {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
        .${CHECKBOX_CLASS}, .${HEADER_CHECKBOX_CLASS} {
            cursor: pointer; transform: scale(1.1);
        }
        #${TOOLBAR_ID} {
            display: flex; flex-wrap: wrap; align-items: center; gap: 6px;
            padding: 8px 10px; margin: 8px 0;
            background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px;
            font-size: 12px;
        }
        #${TOOLBAR_ID} .helper-bulk-count {
            font-weight: 600; color: #0f172a; margin-right: 6px;
        }
        #${TOOLBAR_ID} button {
            background: #fff; border: 1px solid #cbd5e1; border-radius: 4px;
            padding: 3px 10px; font-size: 11px; cursor: pointer; color: #0f172a;
        }
        #${TOOLBAR_ID} button:hover {
            background: #dbeafe; border-color: #93c5fd;
        }
        #${TOOLBAR_ID} button:disabled {
            opacity: 0.5; cursor: not-allowed;
        }
    `;
    document.head.appendChild(style);
}

function getRows(): HTMLTableRowElement[] {
    return Array.from(
        document.querySelectorAll<HTMLTableRowElement>("#js-res-app table tbody tr"),
    );
}

function getSelectedRows(): HTMLTableRowElement[] {
    return getRows().filter((row) => {
        const cb = row.querySelector<HTMLInputElement>(`.${CHECKBOX_CLASS}`);
        return cb?.checked === true && row.style.display !== "none";
    });
}

function extractRowValues(row: HTMLTableRowElement): string[] {
    return Array.from(row.cells)
        .filter((cell) => !cell.querySelector(`.${CHECKBOX_CLASS}`))
        .map((cell) => cell.textContent?.trim().replace(/\s+/g, " ") ?? "");
}

function buildTSV(rows: HTMLTableRowElement[]): string {
    return rows.map((r) => extractRowValues(r).join("\t")).join("\n");
}

function buildCSV(rows: HTMLTableRowElement[]): string {
    return rows
        .map((r) =>
            extractRowValues(r)
                .map((v) => `"${v.replace(/"/g, '""')}"`)
                .join(","),
        )
        .join("\n");
}

function extractUnique(rows: HTMLTableRowElement[], pattern: RegExp): string[] {
    const set = new Set<string>();
    for (const row of rows) {
        for (const cell of Array.from(row.cells)) {
            const text = cell.textContent?.trim();
            if (text && pattern.test(text)) {
                set.add(text);
                break;
            }
        }
    }
    return Array.from(set);
}

function updateToolbarCount(): void {
    const toolbar = document.getElementById(TOOLBAR_ID);
    if (!toolbar) return;
    const selected = getSelectedRows().length;
    const countEl = toolbar.querySelector<HTMLElement>(".helper-bulk-count");
    if (countEl) countEl.textContent = `Выбрано: ${selected}`;
    toolbar.querySelectorAll<HTMLButtonElement>("button[data-needs-selection]").forEach((b) => {
        b.disabled = selected === 0;
    });
}

function addRowCheckboxes(): void {
    const rows = getRows();
    for (const row of rows) {
        if (row.querySelector(`.${CHECKBOX_CLASS}`)) continue;
        const cell = document.createElement("td");
        cell.style.cssText = "width:24px;text-align:center;";
        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.className = CHECKBOX_CLASS;
        cb.addEventListener("change", updateToolbarCount);
        cell.appendChild(cb);
        row.insertBefore(cell, row.firstChild);
    }
}

function addHeaderCheckbox(): void {
    const headerRow = document.querySelector<HTMLTableRowElement>(
        "#js-res-app table thead tr",
    );
    if (!headerRow || headerRow.querySelector(`.${HEADER_CHECKBOX_CLASS}`)) return;

    const th = document.createElement("th");
    th.style.cssText = "width:24px;text-align:center;";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.className = HEADER_CHECKBOX_CLASS;
    cb.title = "Выбрать все видимые";
    cb.addEventListener("change", () => {
        const checked = cb.checked;
        for (const row of getRows()) {
            if (row.style.display === "none") continue;
            const rowCb = row.querySelector<HTMLInputElement>(`.${CHECKBOX_CLASS}`);
            if (rowCb) rowCb.checked = checked;
        }
        updateToolbarCount();
    });
    th.appendChild(cb);
    headerRow.insertBefore(th, headerRow.firstChild);
}

function buildToolbar(container: Element, targetNode: Element): void {
    if (document.getElementById(TOOLBAR_ID)) return;

    const toolbar = document.createElement("div");
    toolbar.id = TOOLBAR_ID;
    toolbar.innerHTML = `
        <span class="helper-bulk-count">Выбрано: 0</span>
        <button type="button" data-needs-selection data-action="copy-tsv" title="Скопировать как TSV для Excel/Google Sheets">📋 Строки (TSV)</button>
        <button type="button" data-needs-selection data-action="copy-csv">📋 CSV</button>
        <button type="button" data-needs-selection data-action="copy-ips" title="Скопировать уникальные IP">📋 IP</button>
        <button type="button" data-needs-selection data-action="copy-macs" title="Скопировать уникальные MAC">📋 MAC</button>
        <button type="button" data-action="clear">Снять выбор</button>
    `;

    toolbar.querySelector('[data-action="copy-tsv"]')?.addEventListener("click", () => {
        const rows = getSelectedRows();
        if (rows.length === 0) return;
        copyText(buildTSV(rows))
            .then(() => notify("📋 Bulk", `Скопировано ${rows.length} строк (TSV)`, "success"))
            .catch(() => notify("📋 Bulk", "Не удалось скопировать", "error"));
    });

    toolbar.querySelector('[data-action="copy-csv"]')?.addEventListener("click", () => {
        const rows = getSelectedRows();
        if (rows.length === 0) return;
        copyText(buildCSV(rows))
            .then(() => notify("📋 Bulk", `Скопировано ${rows.length} строк (CSV)`, "success"))
            .catch(() => notify("📋 Bulk", "Не удалось скопировать", "error"));
    });

    toolbar.querySelector('[data-action="copy-ips"]')?.addEventListener("click", () => {
        const ips = extractUnique(getSelectedRows(), IP_REGEX);
        if (ips.length === 0) {
            notify("📋 Bulk", "В выбранных строках не найдено IP", "warning");
            return;
        }
        copyText(ips.join("\n"))
            .then(() => notify("📋 Bulk", `Скопировано IP: ${ips.length}`, "success"))
            .catch(() => notify("📋 Bulk", "Не удалось скопировать", "error"));
    });

    toolbar.querySelector('[data-action="copy-macs"]')?.addEventListener("click", () => {
        const macs = extractUnique(getSelectedRows(), MAC_REGEX);
        if (macs.length === 0) {
            notify("📋 Bulk", "В выбранных строках не найдено MAC", "warning");
            return;
        }
        copyText(macs.join("\n"))
            .then(() => notify("📋 Bulk", `Скопировано MAC: ${macs.length}`, "success"))
            .catch(() => notify("📋 Bulk", "Не удалось скопировать", "error"));
    });

    toolbar.querySelector('[data-action="clear"]')?.addEventListener("click", () => {
        for (const row of getRows()) {
            const cb = row.querySelector<HTMLInputElement>(`.${CHECKBOX_CLASS}`);
            if (cb) cb.checked = false;
        }
        const headerCb = document.querySelector<HTMLInputElement>(`.${HEADER_CHECKBOX_CLASS}`);
        if (headerCb) headerCb.checked = false;
        updateToolbarCount();
    });

    container.insertBefore(toolbar, targetNode);
}

let observerStarted = false;

export async function setupBulkActions(): Promise<void> {
    const container = document.querySelector(".container");
    const targetNode = document.getElementById("js-res-app");
    if (!container || !targetNode) return;

    injectStyles();
    buildToolbar(container, targetNode);

    const apply = (): void => {
        if (!document.querySelector("#js-res-app table tbody")) return;
        addHeaderCheckbox();
        addRowCheckboxes();
        updateToolbarCount();
    };
    apply();

    if (observerStarted) return;
    observerStarted = true;
    const observer = new MutationObserver(() => {
        apply();
    });
    observer.observe(targetNode, {childList: true, subtree: true});
}
