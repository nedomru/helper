import {notify} from "@src/utils";

type ReasonCounts = Record<string, number>;

/**
 * Adds session history filtering by termination reason
 *
 * Creates filter dropdown and statistics table for client sessions
 */
export async function filterSessions(): Promise<void> {
    const container = document.querySelector(".container");
    const targetNode = document.getElementById("js-res-app");
    if (!container || !targetNode) return;

    let filterSelect: HTMLSelectElement;
    let countDisplay: HTMLDivElement;

    const createUI = (): void => {
        filterSelect = document.createElement("select");
        filterSelect.id = "reason-filter";
        filterSelect.style.marginRight = "10px";

        const label = document.createElement("label");
        label.htmlFor = "reason-filter";
        label.textContent = "Фильтр по причине завершения: ";
        label.style.marginRight = "5px";

        countDisplay = document.createElement("div");
        countDisplay.id = "reason-count-display";
        countDisplay.style.maxWidth = "300px";
        countDisplay.style.marginTop = "10px";

        const wrapper = document.createElement("div");
        wrapper.style.marginBottom = "15px";
        wrapper.appendChild(label);
        wrapper.appendChild(filterSelect);
        wrapper.appendChild(countDisplay);

        container.insertBefore(wrapper, targetNode);
        filterSelect.addEventListener("change", applyFilter);
    };

    const getReasonData = (): { reasons: string[]; counts: ReasonCounts } => {
        const rows = document.querySelectorAll<HTMLTableRowElement>("#js-res-app table tbody tr");
        const counts: ReasonCounts = {};

        rows.forEach((row) => {
            const reason = row.cells[6]?.textContent?.trim();
            if (reason) counts[reason] = (counts[reason] || 0) + 1;
        });

        return {reasons: Object.keys(counts), counts};
    };

    const updateFilterOptions = (reasons: string[]): void => {
        const options = ['<option value="all">Все</option>'];
        options.push(...reasons.map((r) => `<option value="${r}">${r}</option>`));
        filterSelect.innerHTML = options.join("");
    };

    const updateCountDisplay = (counts: ReasonCounts): void => {
        const total = Object.values(counts).reduce((sum, c) => sum + c, 0);
        const sorted = Object.entries(counts).sort(([, a], [, b]) => b - a);

        countDisplay.innerHTML = `
            <table style="width:100%; border-collapse: collapse; font-size: 12px;">
                <thead><tr>
                    <th style="border: 1px solid #ccc; padding: 4px;">Разрыв</th>
                    <th style="border: 1px solid #ccc; padding: 4px;">Кол-во</th>
                </tr></thead>
                <tbody>
                    ${sorted.map(([r, c]) => `
                        <tr>
                            <td style="border: 1px solid #ccc; padding: 4px;">${r}</td>
                            <td style="border: 1px solid #ccc; padding: 4px; text-align: center;">${c}</td>
                        </tr>
                    `).join("")}
                    <tr style="font-weight: bold;">
                        <td style="border: 1px solid #ccc; padding: 4px;">Всего</td>
                        <td style="border: 1px solid #ccc; padding: 4px; text-align: center;">${total}</td>
                    </tr>
                </tbody>
            </table>
        `;
    };

    const applyFilter = (): void => {
        const filter = filterSelect.value;
        const rows = document.querySelectorAll<HTMLTableRowElement>("#js-res-app table tbody tr");

        rows.forEach((row) => {
            const reason = row.cells[6]?.textContent;
            row.style.display = !reason || filter === "all" || reason.includes(filter) ? "" : "none";
        });
    };

    const refresh = (): void => {
        if (!document.querySelector("#js-res-app table tbody")) return;

        if (!filterSelect) createUI();

        const {reasons, counts} = getReasonData();
        updateFilterOptions(reasons);
        updateCountDisplay(counts);
        applyFilter();
    };

    const observer = new MutationObserver(refresh);
    observer.observe(targetNode, {childList: true, subtree: true});

    notify("🔍 Фильтры", "Фильтрация сессий инициализирована", "success");
}