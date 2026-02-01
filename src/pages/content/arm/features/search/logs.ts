export async function searchByLog(): Promise<void> {
    const container = document.getElementById("lazy_content_800");
    if (!container) return;

    const isTabActive = () =>
        container.style.display !== "none" &&
        !container.classList.contains("hidden") &&
        container.offsetParent !== null;

    const filterRows = (searchValue: string, table: HTMLTableElement) => {
        Array.from(table.rows).slice(1).forEach((row) => {
            const rowText = Array.from(row.cells)
                .map((cell) => cell.textContent?.toLowerCase() || "")
                .join(" ");

            row.style.display = rowText.includes(searchValue) ? "" : "none";
        });
    };

    const handleSearch = (e: Event) => {
        const searchValue = (e.target as HTMLInputElement).value.toLowerCase();
        const table = container.querySelector<HTMLTableElement>("table");
        if (table) filterRows(searchValue, table);
    };

    const setupSearch = () => {
        if (
            container.getAttribute("log-search-setup-complete") ||
            !isTabActive() ||
            !container.querySelector("table")
        )
            return;

        const searchField = document.createElement("input");
        Object.assign(searchField, {
            id: "logSearchField",
            type: "text",
            placeholder: "Поиск...",
            className: "form-control",
        });
        searchField.style.cssText =
            "margin: 10px 0; width: 15%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;";

        container.parentNode?.insertBefore(searchField, container);
        searchField.addEventListener("input", handleSearch);

        container.setAttribute("log-search-setup-complete", "true");
        console.info("[Хелпер] - [АРМ] - [Поиск логов] Поле поиска создано");
    };

    const process = () => {
        if (isTabActive() && container.querySelector("table")) {
            setupSearch();
        }
    };

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