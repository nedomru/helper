const HIGHLIGHT_COLORS = {
    "Контакт сорвался": "#ff0000",
    "Обращение из Email": "#006400",
    "ОЦТП - Входящая связь": "#008080",
    "Компенсация за аварию": "#66CDAA",
};

export async function showAppealsHighlights(): Promise<void> {
    const container = document.getElementById("lazy_content_2448");
    if (!container) return;

    function isTabActive() {
        return (
            container!.style.display !== "none" &&
            !container!.classList.contains("hidden") &&
            container!.offsetParent !== null
        );
    }

    function highlightKeywords(text: string): string {
        let result = text;
        for (const [keyword, color] of Object.entries(HIGHLIGHT_COLORS)) {
            if (text.includes(keyword)) {
                result = result.replace(
                    new RegExp(keyword, "g"),
                    `<span style="color: ${color}; font-weight: bold;">${keyword}</span>`
                );
            }
        }
        return result;
    }

    function processTableCell(cell: HTMLElement): void {
        if (cell.classList.contains("helper-highlighted")) return;

        const text = cell.textContent?.trim() || "";
        const newHTML = highlightKeywords(text);

        if (newHTML !== text) {
            cell.innerHTML = newHTML;
            cell.classList.add("helper-highlighted");
        }
    }

    function process(): void {
        if (!isTabActive() || container!.getAttribute("processed-by-helper")) return;

        const tables = container!.querySelectorAll<HTMLTableElement>("table");
        if (tables.length === 0) return;

        let highlighted = 0;

        tables.forEach((table) =>
            table.querySelectorAll<HTMLTableRowElement>("tr").forEach((row) => {
                if (row.hasAttribute("data-highlighted")) return;

                const cells = row.querySelectorAll<HTMLTableCellElement>("td");
                if (cells.length < 9) return;

                // Process all cells
                cells.forEach((cell) => processTableCell(cell));

                row.setAttribute("data-highlighted", "true");
                highlighted++;
            }),
        );

        container!.setAttribute("processed-by-helper", "true");
        console.info(`[Хелпер] - [АРМ] - [Подсветка обращений] Подсветка: ${highlighted} строк`);
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