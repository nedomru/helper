export async function removeAppealsColumns(): Promise<void> {
    const container = document.getElementById("lazy_content_2448");
    if (!container) return;

    // Check if the tab is currently active (visible)
    function isTabActive(): boolean {
        return (
            container!.style.display !== "none" &&
            !container!.classList.contains("hidden") &&
            container!.offsetParent !== null
        );
    }

    // Process the column removal only if tab is active
    function processColumnRemoval(): void {
        if (!isTabActive()) return;

        // Check if already processed
        if (container!.getAttribute("processed-columns-by-helper")) return;

        try {
            const tables =
                container!.querySelectorAll<HTMLTableElement>("table");

            // If no tables exist yet, don't mark as processed
            if (tables.length === 0) return;

            let columnsRemoved = false;

            tables.forEach((table) => {
                // Get all rows
                const rows = table.querySelectorAll<HTMLTableRowElement>("tr");
                if (!rows.length) return;

                // Get the header row (first row)
                const headerRow = rows[0];
                const headers = Array.from(
                    headerRow.querySelectorAll<HTMLTableHeaderCellElement>("th"),
                );

                // Find indexes of columns to remove by matching header text
                const columnsToRemove = [
                    "Оборудование",
                    "Продукт",
                    "Платформа",
                    "Исполнитель",
                ];
                const indexesToRemove: number[] = [];

                headers.forEach((header, index) => {
                    const headerText = header.textContent?.trim();
                    if (headerText && columnsToRemove.includes(headerText)) {
                        indexesToRemove.push(index);
                    }
                });

                // If no columns to remove, skip this table
                if (indexesToRemove.length === 0) return;

                columnsRemoved = true;

                // Sort indexes in descending order to avoid shifting issues
                indexesToRemove.sort((a, b) => b - a);

                // Remove the columns from each row
                rows.forEach((row) => {
                    const cells = Array.from(row.cells);
                    indexesToRemove.forEach((index) => {
                        if (cells[index]) {
                            cells[index].remove();
                        }
                    });
                });

                // Update colspan for any header rows that span the full table width
                const fullWidthHeaders = table.querySelectorAll<HTMLTableCellElement>(
                    'td[colspan="14"]',
                );
                fullWidthHeaders.forEach((header) => {
                    header.setAttribute(
                        "colspan",
                        (14 - indexesToRemove.length).toString(),
                    );
                });
            });

            // Only mark as processed if we actually removed columns
            if (columnsRemoved) {
                container!.setAttribute("processed-columns-by-helper", "true");
                console.info(
                    "[Хелпер] - [АРМ] - [Обращения] Удалены лишние колонки",
                );
            }
        } catch (error) {
            console.error(`[Хелпер] - [АРМ] - [Обращения] Ошибка:`, error);
        }
    }

    // Initial check if tab is already active
    if (isTabActive()) {
        processColumnRemoval();
    }

    // Observer for tab activation and content changes
    const observer = new MutationObserver((mutations) => {
        let shouldProcess = false;

        for (const mutation of mutations) {
            // Check if the tab itself became visible
            if (mutation.target === container) {
                if (
                    mutation.type === "attributes" &&
                    (mutation.attributeName === "class" ||
                        mutation.attributeName === "style")
                ) {
                    shouldProcess = true;
                    break;
                }
            }

            // Check if tab content changed while tab is active
            if (isTabActive() && mutation.type === "childList") {
                shouldProcess = true;
                break;
            }
        }

        if (shouldProcess) {
            processColumnRemoval();
        }
    });

    // Observe the tab for visibility changes and content changes
    observer.observe(container, {
        attributes: true,
        attributeFilter: ["class", "style"],
        childList: true,
        subtree: true,
    });

    // Also observe document body for tab switching
    const bodyObserver = new MutationObserver(() => {
        if (isTabActive()) {
            processColumnRemoval();
        }
    });

    bodyObserver.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["class", "style"],
    });
}