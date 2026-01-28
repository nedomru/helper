import {buildActionUrl, createIframeWindow, extractActionParams,} from "../../shared";

interface CellInfo {
    element: HTMLTableCellElement;
    originalDisplay: string;
}

const hiddenColumns = new Map<string, CellInfo[]>();
let isColumnsVisible = false;

const COLUMNS_TO_HIDE = ["Оборудование", "Продукт", "Платформа", "Исполнитель"];

function hideColumns(): void {
    hiddenColumns.forEach((cells) => {
        cells.forEach((cell) => {
            cell.element.style.display = "none";
        });
    });
}

function showColumns(): void {
    hiddenColumns.forEach((cells) => {
        cells.forEach((cell) => {
            cell.element.style.display = cell.originalDisplay;
        });
    });
}

function processColumns(container: HTMLElement): void {
    if (container.getAttribute("data-processed-columns") === "true") return;
    if (container.style.display === "none" || container.offsetParent === null) return;

    const tables = container.querySelectorAll<HTMLTableElement>("table");
    if (tables.length === 0) return;

    hiddenColumns.clear();
    let totalHidden = 0;

    tables.forEach((table) => {
        const rows = table.querySelectorAll<HTMLTableRowElement>("tr");
        if (!rows.length) return;

        const headerRow = rows[0];
        const headers = Array.from(headerRow.querySelectorAll<HTMLTableHeaderCellElement>("th"));

        const indexesToHide: number[] = [];
        headers.forEach((header, index) => {
            const headerText = header.textContent?.trim();
            if (headerText && COLUMNS_TO_HIDE.includes(headerText)) {
                indexesToHide.push(index);
            }
        });

        if (indexesToHide.length === 0) return;

        indexesToHide.forEach((colIndex) => {
            const cells: CellInfo[] = [];
            const headerText = headers[colIndex].textContent?.trim() || `col-${colIndex}`;

            rows.forEach((row) => {
                const cell = row.cells[colIndex];
                if (cell) {
                    cells.push({
                        element: cell,
                        originalDisplay: cell.style.display || "",
                    });
                    cell.style.display = "none";
                }
            });

            if (cells.length > 0) {
                hiddenColumns.set(headerText, cells);
                totalHidden += cells.length;
            }
        });

        // Update colspan for full-width headers
        const fullWidthHeaders = table.querySelectorAll<HTMLTableCellElement>(
            'td[colspan="14"]',
        );
        fullWidthHeaders.forEach((header) => {
            const currentColspan = parseInt(header.getAttribute("colspan") || "14", 10);
            header.setAttribute("colspan", (currentColspan - indexesToHide.length).toString());
        });
    });

    if (totalHidden > 0) {
        container.setAttribute("data-processed-columns", "true");
        createToggleBtn(container);
        console.info(`[Хелпер] Скрыто ячеек в ${hiddenColumns.size} колонках`);
    }
}

function createToggleBtn(container: HTMLElement): void {
    const existingBtnGroup = container.querySelector(".btn-group.helper-buttons");

    if (existingBtnGroup) {
        // Add to existing button group
        const toggleBtn = document.createElement("button");
        toggleBtn.id = "helper-toggle-columns";
        toggleBtn.className = "btn btn-secondary helper";
        toggleBtn.type = "button";
        toggleBtn.textContent = "Колонки";
        toggleBtn.setAttribute("data-state", "hidden");

        toggleBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();

            isColumnsVisible = !isColumnsVisible;

            if (isColumnsVisible) {
                showColumns();
                toggleBtn.classList.remove("btn-secondary");
                toggleBtn.classList.add("btn-success");
            } else {
                hideColumns();
                toggleBtn.classList.remove("btn-success");
                toggleBtn.classList.add("btn-secondary");
            }
            toggleBtn.setAttribute("data-state", isColumnsVisible ? "visible" : "hidden");
        });

        existingBtnGroup.appendChild(toggleBtn);
    } else {
        // Find search wrapper or create new
        const searchWrapper = container.querySelector('[style*="display: flex"][style*="align-items: center"]');

        const btnGroup = document.createElement("div");
        btnGroup.className = "btn-group helper-buttons";
        btnGroup.setAttribute("role", "group");

        const toggleBtn = document.createElement("button");
        toggleBtn.id = "helper-toggle-columns";
        toggleBtn.className = "btn btn-secondary helper";
        toggleBtn.type = "button";
        toggleBtn.textContent = "Колонки";
        toggleBtn.setAttribute("data-state", "hidden");

        toggleBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();

            isColumnsVisible = !isColumnsVisible;

            if (isColumnsVisible) {
                showColumns();
                toggleBtn.classList.remove("btn-secondary");
                toggleBtn.classList.add("btn-success");
            } else {
                hideColumns();
                toggleBtn.classList.remove("btn-success");
                toggleBtn.classList.add("btn-secondary");
            }
            toggleBtn.setAttribute("data-state", isColumnsVisible ? "visible" : "hidden");
        });

        btnGroup.appendChild(toggleBtn);

        if (searchWrapper) {
            searchWrapper.appendChild(btnGroup);
        } else {
            const wrapper = document.createElement("div");
            wrapper.style.cssText = "margin:10px 0;";
            wrapper.appendChild(btnGroup);
            container.insertBefore(wrapper, container.firstChild);
        }
    }
}

export async function removeAppealsColumns(): Promise<void> {
    const container = document.getElementById("lazy_content_2448");
    if (!container) return;

    const observer = new MutationObserver(() => processColumns(container));
    observer.observe(container, {
        attributes: true,
        attributeFilter: ["style", "class"],
        childList: true,
        subtree: true,
    });

    processColumns(container);
}

/**
 * Adds "Change in window" buttons to appeal links
 */
export async function addAppealIframeButtons(): Promise<void> {
    new MutationObserver(() => {
        const container = document.getElementById("lazy_content_2448");
        if (!container?.textContent) return;

        // Check if already processed to avoid duplicate processing
        if (container.getAttribute("appeal-buttons-processed")) return;

        // Find all anchor elements with the specific pattern within the container
        const appealLinks = container.querySelectorAll(
            'a[onclick*="changeAppealInNewTab"]',
        );

        if (appealLinks.length === 0) return;

        appealLinks.forEach((link) => {
            // Skip if button already added
            if (link.parentElement?.querySelector(".appeal-iframe-btn")) {
                return;
            }

            // Extract parameters from onclick attribute
            const onclickAttr = link.getAttribute("onclick");
            if (!onclickAttr) return;

            const params = extractActionParams(onclickAttr);
            if (!params) return;

            // Create new iframe button styled as a link
            const newButton = document.createElement("a");
            newButton.textContent = "Изменить в окне";
            newButton.className = "appeal-iframe-btn";
            newButton.href = "#";
            newButton.style.cssText = `
                display: block;
                cursor: pointer;
            `;

            // Add click handler
            newButton.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();

                // Check if iframe already exists for this button
                const existingIframe = document.querySelector(
                    ".appeal-iframe-container",
                );
                if (existingIframe) {
                    existingIframe.remove();
                }

                // Create iframe window using the shared utility
                createIframeWindow(
                    buildActionUrl(params),
                    "Изменить обращение",
                );
            };

            // Insert the new button after the original link (positioned under it)
            link.parentNode?.insertBefore(newButton, link.nextSibling);
        });

        // Mark container as processed
        container.setAttribute("appeal-buttons-processed", "true");
        console.info(
            `[Хелпер] - [АРМ] - [Обращения] Добавлено кнопок редактирования обращений в окне: ${appealLinks.length}`,
        );
    }).observe(document.body, {childList: true, subtree: true});
}