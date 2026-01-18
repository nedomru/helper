export async function searchByAppeal(): Promise<void> {
    const container = document.getElementById("lazy_content_2448");
    if (!container) return;

    const isTabActive = () =>
        container.style.display !== "none" &&
        !container.classList.contains("hidden") &&
        container.offsetParent !== null;

    const filterRows = (searchValue: string, table: HTMLTableElement) => {
        const rows = Array.from(table.rows).slice(1); // Skip header
        const globalState =
            document.getElementById("helper-toggle-appeals")?.getAttribute(
                "data-state",
            ) || "hidden";

        // Hide toggle rows when searching
        if (searchValue) {
            table
                .querySelectorAll<HTMLElement>('tr[style*="background-color: rgb(229, 225, 218)"]')
                .forEach((row) => (row.style.display = "none"));
        }

        // Filter data rows
        rows.forEach((row) => {
            if (
                row.cells.length === 1 ||
                row.style.backgroundColor === "rgb(229, 225, 218)"
            )
                return;

            const rowText = Array.from(row.cells)
                .map((cell) => cell.textContent?.toLowerCase() || "")
                .join(" ");

            if (searchValue) {
                row.style.display = rowText.includes(searchValue)
                    ? "table-row"
                    : "none";
            } else {
                row.style.display =
                    row.getAttribute("appeal-step") === "intermediate"
                        ? globalState === "visible"
                            ? "table-row"
                            : "none"
                        : "table-row";
            }
        });
    };

    const handleSearch = (e: Event) => {
        const searchValue = (e.target as HTMLInputElement).value.toLowerCase();
        container
            .querySelectorAll<HTMLTableElement>(".tab-pane table")
            .forEach((table) => filterRows(searchValue, table));

        const display = searchValue ? "none" : "";
        document
            .getElementById("helper-toggle-appeals")
            ?.style.setProperty("display", display);
        const statusText = document
            .getElementById("helper-toggle-appeals")
            ?.nextElementSibling as HTMLElement;
        statusText?.style.setProperty("display", display);
    };

    const setupSearch = () => {
        if (
            !isTabActive() ||
            container.getAttribute("search-setup-complete") ||
            container.querySelectorAll(".tab-pane table").length === 0
        )
            return;

        const searchWrapper = document.createElement("div");
        searchWrapper.style.cssText =
            "margin-bottom: 10px; display: flex; align-items: center; gap: 10px;";

        const searchField = document.createElement("input");
        Object.assign(searchField, {
            id: "appealsSearchField",
            type: "text",
            placeholder: "Поиск...",
            className: "form-control",
        });
        searchField.style.cssText =
            "width: 15%; padding: 6px; border: 1px solid #ddd; border-radius: 4px;";

        searchWrapper.appendChild(searchField);
        container
            .querySelector(".tab-content")
            ?.parentNode?.insertBefore(searchWrapper, container.querySelector(".tab-content"));
        searchField.addEventListener("input", handleSearch);

        container.setAttribute("search-setup-complete", "true");
        console.info("[Хелпер] - [АРМ] - [Поиск обращений] Поле поиска создано");
    };

    const process = () => isTabActive() && setupSearch();

    if (isTabActive()) process();

    const observerConfig = {
        attributes: true,
        attributeFilter: ["class", "style"],
        childList: true,
        subtree: true,
    };

    new MutationObserver(process).observe(container, observerConfig);
    new MutationObserver(process).observe(document.body, observerConfig);
}
