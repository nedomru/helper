export async function foldSpas(): Promise<void> {
    const spas = document.getElementById("collapse-top-3");
    if (spas) spas.className = "collapse";

    const cvm = document.getElementById("anticipation_cvm") as HTMLIFrameElement | null;
    if (!cvm || !cvm.contentDocument) return;

    if (cvm.contentDocument?.getElementById("anticipationCvmWiz")) {
        cvm.style.removeProperty("height");
    }
}

export async function foldTabInfo(): Promise<void> {
    const informationTab = document.getElementById("tabs-2444");
    if (!informationTab) return;

    // Check if the tab is currently active (visible)
    function isTabActive(): boolean {
        return (
            informationTab!.style.display !== "none" &&
            !informationTab!.classList.contains("hidden") &&
            informationTab!.offsetParent !== null
        );
    }

    // Process the table only if tab is active
    function processTable(): void {
        if (!isTabActive()) return;

        const tableContainer = informationTab!.querySelector(
            ".col-sm-8",
        ) as HTMLElement | null;
        const table = tableContainer?.querySelector(
            ".table-condensed",
        ) as HTMLTableElement | null;
        if (!table || table.getAttribute("processed-by-helper")) return;

        try {
            const rowsToHide = [
                "Статус:",
                "Схема оплаты:",
                "",
                "Категория:",
                "Контактные e-mail:",
                "Место рождения",
                "Активные приложения",
                "Промо-пакет",
                "Идентификационные данные",
                "Автоплатеж",
            ];

            let totalHidden = 0;

            // Process rows
            Array.from(table.rows)
                .slice(2)
                .forEach((row: HTMLTableRowElement) => {
                    const firstCell = row.cells[0]?.textContent;
                    if (rowsToHide.includes(firstCell || "")) {
                        row.style.display = "none";
                        row.setAttribute("helper-hidden-row", "true");
                        totalHidden++;
                    }
                });

            if (totalHidden > 0) {
                const buttonContainer = document.createElement("div");
                buttonContainer.style.cssText =
                    "display: flex; margin-bottom: 10px; align-items: center;";

                const toggleButton = document.createElement("button");
                toggleButton.id = "helper-toggle-info";
                toggleButton.className = "btn btn-xs btn-primary helper";
                toggleButton.style.cssText =
                    "cursor: pointer; margin-right: 10px;";
                toggleButton.textContent = `▶️ Развернуть строки`;
                toggleButton.setAttribute("data-state", "hidden");
                toggleButton.setAttribute("type", "button");
                toggleButton.title = `Скрыты следующие поля: ${rowsToHide.filter((r) => r).join(", ")}`;

                const status = document.createElement("span");
                status.textContent = "Дополнительные поля скрыты";
                status.style.color = "#dc3545";

                // Handle toggle click
                toggleButton.addEventListener("click", (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    const isHidden =
                        toggleButton.getAttribute("data-state") === "hidden";
                    const newState = isHidden ? "visible" : "hidden";

                    // Update rows visibility
                    document
                        .querySelectorAll('[helper-hidden-row="true"]')
                        .forEach(
                            (row) =>
                                ((row as HTMLElement).style.display = isHidden
                                    ? "table-row"
                                    : "none"),
                        );

                    // Update button and status text
                    toggleButton.textContent = isHidden
                        ? "🔽 Свернуть строки"
                        : `▶️ Развернуть строки`;
                    toggleButton.setAttribute("data-state", newState);

                    status.textContent = isHidden
                        ? "Отображены все поля"
                        : "Дополнительные поля скрыты";
                    status.style.color = isHidden ? "#198754" : "#dc3545";
                });

                // Add links if they exist
                ["#lk", "#lk_sso"].forEach((selector) => {
                    const link = document.querySelector(
                        `a.not_mobil_tech${selector}`,
                    ) as HTMLAnchorElement | null;
                    if (link) {
                        link.textContent =
                            selector === "#lk"
                                ? "🚪 ЛК клиента"
                                : "🚪 ЛК клиента (SSO)";
                        link.classList.add("btn", "btn-primary", "btn-xs");
                        link.style.cssText =
                            "margin-right: 10px; text-decoration: none;";
                        buttonContainer.appendChild(link);
                    }
                });

                buttonContainer.appendChild(toggleButton);
                buttonContainer.appendChild(status);
                tableContainer?.insertBefore(buttonContainer, tableContainer.firstChild);

                // Remove standalone pipe symbols
                Array.from(tableContainer?.childNodes || [])
                    .filter(
                        (node) =>
                            node.nodeType === Node.TEXT_NODE &&
                            node.textContent?.trim() === "|",
                    )
                    .forEach((node) => node.remove());
            }

            // Mark table as processed
            table.setAttribute("processed-by-helper", "true");
            console.info(
                `[Хелпер] - [АРМ] - [Клиентская информация] Обработано скрытых строк: ${totalHidden}`,
            );
        } catch (error) {
            console.error(
                `[Хелпер] - [АРМ] - [Клиентская информация] Ошибка:`,
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
            if (mutation.target === informationTab) {
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
    observer.observe(informationTab, {
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

export async function foldTabApplications(): Promise<void> {
    const appsTab = document.getElementById("tabs-2120");
    if (!appsTab) return;

    // Check if the tab is currently active (visible)
    function isTabActive(): boolean {
        return (
            appsTab!.style.display !== "none" &&
            !appsTab!.classList.contains("hidden") &&
            appsTab!.offsetParent !== null
        );
    }

    // Process the table only if tab is active
    function processTable(): void {
        if (!isTabActive()) return;

        const table = appsTab!.querySelector(
            ".table-condensed",
        ) as HTMLTableElement | null;
        if (!table || table.getAttribute("processed-by-helper")) return;

        try {
            let totalHidden = 0;

            // Process each row starting from index 1 (skip header)
            Array.from(table.rows)
                .slice(1)
                .forEach((row: HTMLTableRowElement) => {
                    try {
                        const status = row.cells[4]?.textContent;
                        if (
                            status === "Закрыт" ||
                            status === "Не активен"
                        ) {
                            row.style.display = "none";
                            row.setAttribute("helper-hidden-row", "true");
                            totalHidden++;
                        }
                    } catch (rowError) {
                        console.error(
                            `[Хелпер] - [АРМ] - [Приложения] Ошибка обработки строки:`,
                            rowError,
                        );
                    }
                });

            // Add toggle controls if we have hidden rows
            if (
                totalHidden > 0 &&
                !appsTab!.querySelector("#helper-toggle-apps")
            ) {
                const buttonContainer = document.createElement("div");
                buttonContainer.style.cssText =
                    "display: flex; align-items: center; margin-bottom: 10px;";

                const toggleButton = document.createElement("button");
                toggleButton.id = "helper-toggle-apps";
                toggleButton.className = "btn btn-xs btn-primary helper";
                toggleButton.style.cssText =
                    "cursor: pointer; margin-right: 10px;";
                toggleButton.textContent = `▶️ Развернуть приложения (${totalHidden})`;
                toggleButton.setAttribute("data-state", "hidden");
                toggleButton.setAttribute("type", "button");

                const status = document.createElement("span");
                status.textContent = "Неактивные и закрытые приложения скрыты";
                status.style.color = "#dc3545";

                toggleButton.addEventListener("click", (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    const isHidden =
                        toggleButton.getAttribute("data-state") === "hidden";
                    const newState = isHidden ? "visible" : "hidden";

                    // Update rows visibility
                    document
                        .querySelectorAll('[helper-hidden-row="true"]')
                        .forEach(
                            (row) =>
                                ((row as HTMLElement).style.display = isHidden
                                    ? "table-row"
                                    : "none"),
                        );

                    // Update button and status text
                    toggleButton.textContent = isHidden
                        ? "🔽 Свернуть приложения"
                        : `▶️ Развернуть приложения (${totalHidden})`;
                    toggleButton.setAttribute("data-state", newState);

                    status.textContent = isHidden
                        ? "Отображены все приложения"
                        : "Неактивные и закрытые приложения скрыты";
                    status.style.color = isHidden ? "#198754" : "#dc3545";
                });

                buttonContainer.appendChild(toggleButton);
                buttonContainer.appendChild(status);

                const lineBreak = document.createElement("br");
                appsTab!.insertBefore(lineBreak, appsTab!.firstChild);
                appsTab!.insertBefore(buttonContainer, lineBreak);
            }

            // Mark table as processed
            table.setAttribute("processed-by-helper", "true");
            console.info(
                `[Хелпер] - [АРМ] - [Приложения] Обработано скрытых строк: ${totalHidden}`,
            );
        } catch (error) {
            console.error(
                `[Хелпер] - [АРМ] - [Приложения] Ошибка:`,
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
            if (mutation.target === appsTab) {
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
    observer.observe(appsTab, {
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

export async function foldTabAppeals(): Promise<void> {
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

    // Process the table only if tab is active
    function processTable(): void {
        if (!isTabActive()) return;

        const table = container!.querySelector(
            "table.border",
        ) as HTMLTableElement | null;
        if (!table || table.getAttribute("processed-by-helper")) return;

        try {
            let totalHidden = 0;
            const rows = Array.from(table.rows).slice(2); // Skip headers
            const appeals: HTMLTableRowElement[][] = [];
            let currentAppeal: HTMLTableRowElement[] = [];

            // Group rows into appeals
            rows.forEach((row: HTMLTableRowElement) => {
                if (row.cells[0]?.textContent === "1") {
                    if (currentAppeal.length) appeals.push(currentAppeal);
                    currentAppeal = [row];
                } else {
                    currentAppeal.push(row);
                }
            });
            if (currentAppeal.length) appeals.push(currentAppeal);

            appeals.forEach((appeal, index) => {
                const effectiveLength =
                    index === 0 ? appeal.length - 1 : appeal.length;

                const minSteps = 3;
                if (effectiveLength < minSteps) return;

                const appealNum = index + 1;
                const hiddenSteps = effectiveLength - 2;
                totalHidden += hiddenSteps;

                appeal.forEach((row, stepIndex) => {
                    row.setAttribute("appeal-number", appealNum.toString());

                    // Check for edit_comment class to identify last step
                    const hasEditComment =
                        row.querySelector(".edit_comment") !== null;

                    if (stepIndex === 0) {
                        row.setAttribute("appeal-step", "first");
                    } else if (
                        hasEditComment ||
                        stepIndex === appeal.length - 1
                    ) {
                        // Mark as last step if it has edit_comment or is the last row
                        row.setAttribute("appeal-step", "last");
                        row.style.display = ""; // Ensure it's visible
                    } else {
                        row.setAttribute("appeal-step", "intermediate");
                        row.style.display = "none";
                    }
                });

                const toggleRow = document.createElement("tr");
                toggleRow.style.backgroundColor = "#E5E1DA";

                const toggleCell = document.createElement("td");
                toggleCell.colSpan = table.rows[0].cells.length;
                (toggleCell as HTMLTableCellElement).style.padding = "0";

                const toggleButton = document.createElement("a");
                toggleButton.href = "#";
                toggleButton.style.cssText =
                    "cursor:pointer; color:#ff0000; text-decoration:none; padding:5px; display:block; text-align:center;";
                toggleButton.setAttribute("data-state", "hidden");
                toggleButton.textContent = `▶️ Шаги скрыты (${hiddenSteps})`;

                toggleButton.addEventListener("click", (e) => {
                    e.preventDefault();
                    const isHidden =
                        toggleButton.getAttribute("data-state") === "hidden";
                    const newState = isHidden ? "visible" : "hidden";

                    document
                        .querySelectorAll(
                            `[appeal-number="${appealNum}"][appeal-step="intermediate"]`,
                        )
                        .forEach(
                            (row) =>
                                ((row as HTMLElement).style.display = isHidden
                                    ? "table-row"
                                    : "none"),
                        );

                    toggleButton.textContent = isHidden
                        ? `🔽 Шаги отображены`
                        : `▶️ Шаги скрыты (${hiddenSteps})`;
                    toggleButton.setAttribute("data-state", newState);
                    toggleButton.style.color = isHidden ? "#006400" : "#ff0000";
                });

                toggleCell.appendChild(toggleButton);
                toggleRow.appendChild(toggleCell);
                appeal[0].parentNode?.insertBefore(
                    toggleRow,
                    appeal[0].nextSibling,
                );
            });

            if (totalHidden > 0) {
                const btnContainer = document.createElement("div");
                btnContainer.style.cssText =
                    "display: flex; align-items: center; margin: 10px 0;";

                const toggleBtn = document.createElement("button");
                toggleBtn.id = "helper-toggle-appeals";
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
                    e.stopPropagation();

                    const isHidden =
                        toggleBtn.getAttribute("data-state") === "hidden";
                    const newState = isHidden ? "visible" : "hidden";

                    const toggleButtons = table.querySelectorAll(
                        "a[data-state]",
                    );
                    toggleButtons.forEach((btn) => {
                        const appealNum = ((btn as HTMLElement)
                            .closest("tr")
                            ?.previousSibling as HTMLElement | null)?.getAttribute(
                            "appeal-number",
                        );
                        const hiddenCount = document.querySelectorAll(
                            `[appeal-number="${appealNum}"][appeal-step="intermediate"]`,
                        ).length;
                        btn.textContent = isHidden
                            ? "🔽 Шаги отображены"
                            : `▶️ Шаги скрыты (${hiddenCount})`;
                        btn.setAttribute("data-state", newState);
                        (btn as HTMLElement).style.color = isHidden
                            ? "#006400"
                            : "#ff0000";
                    });

                    document
                        .querySelectorAll('[appeal-step="intermediate"]')
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
                container!.insertBefore(btnContainer, container!.firstChild);
            }

            table.setAttribute("processed-by-helper", "true");
            console.info(
                `[Хелпер] - [АРМ] - [Обращения] Обработано скрытых шагов: ${totalHidden}`,
            );
        } catch (error) {
            console.error(`[Хелпер] - [АРМ] - [Обращения] Ошибка:`, error);
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
            processTable();
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

export async function foldTabCRequests(): Promise<void> {
    const requestsContainer = document.getElementById("lazy_content_802");
    if (!requestsContainer) return;

    // Check if the tab is currently active (visible)
    function isTabActive(): boolean {
        return (
            requestsContainer!.style.display !== "none" &&
            !requestsContainer!.classList.contains("hidden") &&
            requestsContainer!.offsetParent !== null
        );
    }

    // Process the table only if tab is active
    function processTable(): void {
        if (!isTabActive()) return;

        // Check if already processed
        if (requestsContainer!.getAttribute("processed-by-helper")) return;

        try {
            let totalHidden = 0;
            const tables =
                requestsContainer!.querySelectorAll<HTMLTableElement>(
                    "table.border",
                );

            // If no tables exist yet, don't mark as processed
            if (tables.length === 0) return;

            tables.forEach((table) => {
                const rows = Array.from(
                    table.querySelectorAll<HTMLTableRowElement>("tbody tr"),
                );
                if (rows.length < 2) return;

                const firstRow = rows[0];
                const lastRow = rows[rows.length - 1];
                const middleRows = rows.slice(1, -1);
                totalHidden += middleRows.length;

                firstRow.style.display = "table-row";
                lastRow.style.display = "table-row";

                const requestId = Math.random().toString(36).substr(2, 9);

                middleRows.forEach((row) => {
                    row.style.display = "none";
                    row.setAttribute("data-request-id", requestId);
                });

                if (middleRows.length > 0) {
                    const toggleRow = document.createElement("tr");
                    toggleRow.style.backgroundColor = "#E5E1DA";

                    const toggleCell = document.createElement("td");
                    toggleCell.colSpan = table.rows[0].cells.length;
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
                            toggleButton.getAttribute("data-state") === "hidden";
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
            });

            if (totalHidden > 0) {
                const btnContainer = document.createElement("div");
                btnContainer.style.cssText =
                    "display: flex; align-items: center; margin: 10px 0;";

                const toggleBtn = document.createElement("button");
                toggleBtn.id = "helper-toggle-connections";
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
                        requestsContainer!.querySelectorAll("a[data-state]");
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
                requestsContainer!.insertBefore(
                    btnContainer,
                    requestsContainer!.firstChild,
                );
            }

            // Only mark as processed if we actually found and processed tables
            if (tables.length > 0) {
                requestsContainer!.setAttribute("processed-by-helper", "true");
                console.info(
                    `[Хелпер] - [АРМ] - [Заявки] Обработано скрытых шагов: ${totalHidden}`,
                );
            }
        } catch (error) {
            console.error(`[Хелпер] - [АРМ] - [Заявки] Ошибка:`, error);
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
            if (mutation.target === requestsContainer) {
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
    observer.observe(requestsContainer, {
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

/**
 * Removes unnecessary tabs from EQM page
 */
export async function removeDiagnosticTabs(): Promise<void> {
    const container = document.getElementById("lazy_content_2507");
    if (!container) return;

    // Check if the tab is currently active (visible)
    function isTabActive(): boolean {
        return (
            container!.style.display !== "none" &&
            !container!.classList.contains("hidden") &&
            container!.offsetParent !== null
        );
    }

    // Process the tab removal only if tab is active
    function processTabRemoval(): void {
        if (!isTabActive()) return;

        if (container!.getAttribute("processed-by-helper")) return;

        try {
            const linksToRemove = [
                'a[href="#dataRecovery"]',
                'a[href="#diagSpas"]',
                'a[href="#diagDeviceIzet"]',
                'a[href="#diagIptv"]',
                'a[href*="novotelecom"][href*="aboncard"]',
            ];

            linksToRemove.forEach((selector) => {
                const links =
                    container!.querySelectorAll<HTMLAnchorElement>(selector);
                links.forEach((link) => link.remove());
            });

            container!.setAttribute("processed-by-helper", "true");
            console.info(
                "[Хелпер] - [АРМ] - [Диагностика] Удалены ненужные вкладки",
            );
        } catch (error) {
            console.error(`[Хелпер] - [АРМ] - [Диагностика] Ошибка:`, error);
        }
    }

    // Initial check if tab is already active
    if (isTabActive()) {
        processTabRemoval();
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
            processTabRemoval();
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
            processTabRemoval();
        }
    });

    bodyObserver.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["class", "style"],
    });
}

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