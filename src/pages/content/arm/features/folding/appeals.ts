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
                const searchWrapper = container!.querySelector('[style*="display: flex"][style*="align-items: center"]');
                const existingBtnGroup = container!.querySelector(".btn-group.helper-buttons");

                if (existingBtnGroup) {
                    existingBtnGroup.remove();
                }

                const btnGroup = document.createElement("div");
                btnGroup.className = "btn-group helper-buttons";
                btnGroup.setAttribute("role", "group");

                const toggleBtn = document.createElement("button");
                toggleBtn.id = "helper-toggle-appeals";
                toggleBtn.className = "btn btn-secondary helper";
                toggleBtn.type = "button";
                toggleBtn.textContent = "Шаги";
                toggleBtn.setAttribute("data-state", "hidden");

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

                    if (isHidden) {
                        toggleBtn.classList.remove("btn-secondary");
                        toggleBtn.classList.add("btn-success");
                    } else {
                        toggleBtn.classList.remove("btn-success");
                        toggleBtn.classList.add("btn-secondary");
                    }
                    toggleBtn.setAttribute("data-state", newState);
                });

                btnGroup.appendChild(toggleBtn);

                if (searchWrapper) {
                    searchWrapper.appendChild(btnGroup);
                } else {
                    const wrapper = document.createElement("div");
                    wrapper.style.cssText = "margin: 10px 0;";
                    wrapper.appendChild(btnGroup);
                    container!.insertBefore(wrapper, container!.firstChild);
                }
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
