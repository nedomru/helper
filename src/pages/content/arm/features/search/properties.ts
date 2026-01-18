export async function searchByProperty(): Promise<void> {
    const container = document.getElementById("lazy_content_2416");
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
        const table = container
            .querySelector<HTMLElement>(".table-flag-agr")
            ?.querySelector<HTMLTableElement>("table");
        if (table) filterRows(searchValue, table);
    };

    const setupSearch = () => {
        if (
            container.getAttribute("flag-search-setup-complete") ||
            !isTabActive() ||
            !container.querySelector(".table-flag-agr table")
        )
            return;

        const searchWrapper = document.createElement("div");
        searchWrapper.style.cssText =
            "margin: 10px 0; display: flex; align-items: center; gap: 10px;";

        const searchField = document.createElement("input");
        Object.assign(searchField, {
            id: "flagSearchField",
            type: "text",
            placeholder: "Поиск...",
            className: "form-control",
        });
        searchField.style.cssText =
            "width: 15%; padding: 6px; border: 1px solid #ddd; border-radius: 4px;";

        searchWrapper.appendChild(searchField);

        const buttonContainer =
            container.querySelector<HTMLElement>(".dialog_agr_flag")
                ?.parentNode as HTMLElement;
        buttonContainer?.appendChild(searchWrapper);

        searchField.addEventListener("input", handleSearch);

        container.setAttribute("flag-search-setup-complete", "true");
        console.info("[Хелпер] - [АРМ] - [Поиск признаков] Поле поиска создано");
    };

    const process = () => {
        if (
            isTabActive() &&
            container.querySelector(".table-flag-agr table")
        ) {
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
