export async function foldTabSRequests(): Promise<void> {
    const COMPLETION_STATUSES = [
        "Выполнено (Отправить в Call-центр)",
        "Заявка выполнена",
        "Выполнено",
        "Помощь оказана",
    ];

    const serviceContainer = document.getElementById("lazy_content_2445");
    if (!serviceContainer) return;

    // Check if the tab is currently active (visible)
    function isTabActive(): boolean {
        return (
            serviceContainer!.style.display !== "none" &&
            !serviceContainer!.classList.contains("hidden") &&
            serviceContainer!.offsetParent !== null
        );
    }

    // Process the table only if tab is active
    function processTable(): void {
        if (!isTabActive()) return;

        const requestsContainer = serviceContainer!.querySelector(
            "#tc_ppd_tp_cz",
        ) as HTMLElement | null;

        // Check if already processed
        if (
            requestsContainer &&
            requestsContainer.getAttribute("processed-by-helper")
        )
            return;

        // If container doesn't exist yet, don't process
        if (!requestsContainer) return;

        try {
            let totalHidden = 0;
            const tables =
                requestsContainer.querySelectorAll<HTMLTableElement>(
                    "table.border",
                );

            // If no tables exist yet, don't mark as processed
            if (tables.length === 0) return;

            tables.forEach((table) => {
                const rows = Array.from(
                    table.querySelectorAll<HTMLTableRowElement>("tr"),
                ).slice(1);
                if (rows.length < 2) return;

                const lastContentRow = rows[rows.length - 2];
                const lastRowStatus = lastContentRow?.cells[2]?.textContent?.trim();

                if (lastRowStatus && COMPLETION_STATUSES.includes(lastRowStatus)) {
                    const requestId = Math.random().toString(36).substr(2, 9);
                    const firstRow = rows[0];
                    const detailRow = rows[rows.length - 1];
                    const middleRows = rows.slice(1, -2);
                    totalHidden += middleRows.length;

                    firstRow.style.display = "table-row";
                    lastContentRow.style.display = "table-row";
                    detailRow.style.display = "table-row";

                    middleRows.forEach((row) => {
                        row.style.display = "none";
                        row.setAttribute("data-request-id", requestId);
                    });

                    if (middleRows.length > 0) {
                        const toggleRow = document.createElement("tr");
                        toggleRow.style.backgroundColor = "#E5E1DA";

                        const toggleCell = document.createElement("td");
                        toggleCell.colSpan = firstRow.cells.length;
                        (toggleCell as HTMLTableCellElement).style.padding = "0";

                        const toggleButton = document.createElement("a");
                        toggleButton.href = "#";
                        toggleButton.style.cssText =
                            "cursor:pointer; color:#ff0000; text-decoration:none; padding:5px; display:block; text-align:center;";
                        toggleButton.setAttribute("data-state", "hidden");
                        toggleButton.textContent = `▶️ Шаги скрыты (${middleRows.length})`;

                        toggleButton.addEventListener("click", (e) => {
                            e.preventDefault();
                            const isHidden =
                                toggleButton.getAttribute("data-state") ===
                                "hidden";
                            const newState = isHidden ? "visible" : "hidden";

                            const rows = document.querySelectorAll(
                                `[data-request-id="${requestId}"]`,
                            );
                            rows.forEach((row) => {
                                (row as HTMLElement).style.display = isHidden
                                    ? "table-row"
                                    : "none";
                            });

                            toggleButton.textContent = isHidden
                                ? `🔽 Шаги отображены`
                                : `▶️ Шаги скрыты (${middleRows.length})`;
                            toggleButton.setAttribute("data-state", newState);
                            toggleButton.style.color = isHidden
                                ? "#006400"
                                : "#ff0000";
                        });

                        toggleCell.appendChild(toggleButton);
                        toggleRow.appendChild(toggleCell);
                        firstRow.parentNode?.insertBefore(
                            toggleRow,
                            firstRow.nextSibling,
                        );
                    }
                }
            });

            if (totalHidden > 0) {
                const btnContainer = document.createElement("div");
                btnContainer.style.cssText =
                    "display: flex; align-items: center; margin: 10px 0;";

                const toggleBtn = document.createElement("button");
                toggleBtn.id = "helper-toggle-requests";
                toggleBtn.className = "btn btn-xs btn-primary helper";
                toggleBtn.style.cssText =
                    "cursor: pointer; margin-right: 10px;";
                toggleBtn.textContent = `▶️ Шаги скрыты`;
                toggleBtn.setAttribute("data-state", "hidden");
                toggleBtn.setAttribute("type", "button");

                const status = document.createElement("span");
                status.textContent = "Промежуточные шаги скрыты";
                status.style.color = "#dc3545";

                toggleBtn.addEventListener("click", (e) => {
                    e.preventDefault();
                    const isHidden =
                        toggleBtn.getAttribute("data-state") === "hidden";
                    const newState = isHidden ? "visible" : "hidden";

                    const toggleButtons =
                        requestsContainer.querySelectorAll("a[data-state]");
                    toggleButtons.forEach((btn) => {
                        // Get the hidden rows count by finding next row with data-request-id
                        const buttonRow = (btn as HTMLElement).closest("tr");
                        const nextRow = buttonRow?.nextElementSibling;
                        if (nextRow) {
                            const requestId = (nextRow as HTMLElement).getAttribute(
                                "data-request-id",
                            );
                            // Get original count of hidden rows for this request
                            const hiddenCount = document.querySelectorAll(
                                `[data-request-id="${requestId}"]`,
                            ).length;
                            btn.textContent = isHidden
                                ? "🔽 Шаги отображены"
                                : `▶️ Шаги скрыты (${hiddenCount})`;
                            btn.setAttribute("data-state", newState);
                            (btn as HTMLElement).style.color = isHidden
                                ? "#006400"
                                : "#ff0000";
                        }
                    });

                    document
                        .querySelectorAll("[data-request-id]")
                        .forEach(
                            (row) =>
                                ((row as HTMLElement).style.display = isHidden
                                    ? "table-row"
                                    : "none"),
                        );

                    toggleBtn.textContent = isHidden
                        ? "🔽 Шаги отображены"
                        : `▶️ Шаги скрыты`;
                    toggleBtn.setAttribute("data-state", newState);

                    status.textContent = isHidden
                        ? "Отображены все шаги"
                        : "Промежуточные шаги скрыты";
                    status.style.color = isHidden ? "#198754" : "#dc3545";
                });

                btnContainer.appendChild(toggleBtn);
                btnContainer.appendChild(status);
                serviceContainer!.insertBefore(
                    btnContainer,
                    serviceContainer!.firstChild,
                );
            }

            // Only mark as processed if we actually found and processed tables
            if (tables.length > 0) {
                requestsContainer.setAttribute("processed-by-helper", "true");
                console.info(
                    `[Хелпер] - [АРМ] - [Сервисные заявки] Обработано скрытых шагов: ${totalHidden}`,
                );
            }
        } catch (error) {
            console.error(
                `[Хелпер] - [АРМ] - [Сервисные заявки] Ошибка:`,
                error,
            );
        }
    }

    // Initial check if tab is already active
    if (isTabActive()) {
        processTable();
    }

    // Observer for tab activation and content changes
    const observer = new MutationObserver((mutations) => {
        let shouldProcess = false;

        for (const mutation of mutations) {
            // Check if the tab itself became visible
            if (mutation.target === serviceContainer) {
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
            processTable();
        }
    });

    // Observe the tab for visibility changes and content changes
    observer.observe(serviceContainer, {
        attributes: true,
        attributeFilter: ["class", "style"],
        childList: true,
        subtree: true,
    });

    // Also observe document body for tab switching
    const bodyObserver = new MutationObserver(() => {
        if (isTabActive()) {
            processTable();
        }
    });

    bodyObserver.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["class", "style"],
    });
}
