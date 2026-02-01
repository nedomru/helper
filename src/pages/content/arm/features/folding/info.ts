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
