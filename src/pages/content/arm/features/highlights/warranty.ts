export async function showWarrantyExpiration(): Promise<void> {
    const container = document.getElementById("lazy_content_801");
    if (!container) return;

    function isTabActive() {
        return (
            container!.style.display !== "none" &&
            !container!.classList.contains("hidden") &&
            container!.offsetParent !== null
        );
    }

    function highlight(text: string): string {
        const match = text.match(/гарантийный срок до (\d{2}\.\d{2}\.\d{4})/);
        if (!match) return text;
        const [, dateStr] = match;
        const [day, month, year] = dateStr!.split(".");
        const warrantyDate = new Date(`${year}-${month}-${day}`);
        const now = new Date();
        const expired = warrantyDate < now;
        const daysLeft = Math.ceil((warrantyDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const daysText = expired ? `Просрочено на ${Math.abs(daysLeft)} дн.` : `Осталось ${daysLeft} дн.`;
        return text.replace(
            dateStr!,
            `<span style="color: ${expired ? "red" : "green"}; font-weight: bold;">${dateStr} (${daysText})</span>`,
        );
    }

    function process(): void {
        if (!isTabActive() || container!.getAttribute("processed-by-helper"))
            return;

        const tables = container!.querySelectorAll<HTMLTableElement>("table");
        if (tables.length === 0) return;

        let highlighted = 0;
        tables.forEach((table) =>
            table.querySelectorAll<HTMLTableRowElement>("tr").forEach((row) => {
                if (row.hasAttribute("data-warranty-highlighted")) return;
                row.querySelectorAll<HTMLTableCellElement>("td").forEach(
                    (cell) => {
                        const text = cell.textContent?.trim() || "";
                        const newHTML = highlight(text);
                        if (newHTML !== text) {
                            cell.innerHTML = newHTML;
                            highlighted++;
                        }
                    },
                );
                row.setAttribute("data-warranty-highlighted", "true");
            }),
        );

        container!.setAttribute("processed-by-helper", "true");
        console.info(`[Хелпер] - [АРМ] - [Гарантия] Подсветка: ${highlighted} сроков`);
    }

    if (isTabActive()) process();

    new MutationObserver(() => isTabActive() && process()).observe(container, {
        attributes: true,
        attributeFilter: ["class", "style"],
        childList: true,
        subtree: true,
    });

    new MutationObserver(() => isTabActive() && process()).observe(
        document.body,
        {childList: true, subtree: true, attributes: true, attributeFilter: ["class", "style"]},
    );
}