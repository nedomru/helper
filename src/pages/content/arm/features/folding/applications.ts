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
