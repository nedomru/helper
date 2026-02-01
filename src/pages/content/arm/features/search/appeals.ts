import {buildActionUrl, createIframeWindow, extractActionParams,} from "../../shared";

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

export async function searchOpenedAppeals(): Promise<void> {
    const container = document.getElementById("anticipation_form") || document.querySelector(".tab-content");
    if (!container) return;

    // Shared iframe close handler
    const onIframeClose = (e: MessageEvent) => {
        if (e.data === 'close-iframe') {
            document.querySelector('.appeal-iframe-container')?.remove();
        }
    };
    window.addEventListener('message', onIframeClose);

    const getParams = (): { agrId: string; ssn: string; userId: string } | null => {
        const getInput = (sel: string) => document.querySelector(sel) as HTMLInputElement | null;

        const agrId = getInput("#agreement_id")?.value;
        const ssn = getInput("#ssn")?.value;
        const userId = getInput("#user_id")?.value || getInput("#usr")?.value;

        if (agrId && ssn && userId) return {agrId, ssn, userId};

        const urlParams = new URLSearchParams(window.location.search);
        const getUrlParam = (keys: string[]) => keys.map(k => urlParams.get(k)).find(Boolean);

        const agrIdUrl = getUrlParam(['agr_id$c', 'agr_id']);
        const ssnUrl = getUrlParam(['ssn$c', 'ssn']);
        const userIdUrl = getUrlParam(['user_id$c', 'user_id', 'usr']);

        return (agrIdUrl && ssnUrl && userIdUrl) ? {agrId: agrIdUrl, ssn: ssnUrl, userId: userIdUrl} : null;
    };

    const createHeader = (text: string, className: string, withRefresh = false): HTMLElement => {
        const header = document.createElement("div");
        header.className = className;

        const textSpan = document.createElement("span");
        textSpan.textContent = text;
        header.appendChild(textSpan);

        if (withRefresh) {
            const refreshBtn = document.createElement("span");
            Object.assign(refreshBtn, {textContent: " ↻", title: "Проверить снова"});
            refreshBtn.style.cssText = "cursor: pointer; margin-left: 10px; font-size: 1.2em;";
            refreshBtn.onclick = (e) => {
                e.stopPropagation();
                container.removeAttribute("appeals-checked");
                container.querySelector(".appeals-check-block")?.remove();
                displayAppeals();
            };
            header.appendChild(refreshBtn);
        }

        return header;
    };

    const createRefreshBlock = (message: string, className: string): HTMLElement => {
        const block = document.createElement("div");
        block.className = "bl_antic appeals-check-block";
        block.appendChild(createHeader(message, className, true));
        return block;
    };

    const createActionsCell = (row: Element, infoCell: Element): HTMLElement => {
        const cell = document.createElement("td");
        const changeLink = infoCell.querySelector('a[onclick*="changeAppealInNewTab"]');
        const jiraLink = row.querySelector('a[onclick*="showCreateTiketJira"]');

        const params = changeLink ? extractActionParams(changeLink.getAttribute("onclick") || "") : null;
        if (params) {
            const openBtn = document.createElement("a");
            Object.assign(openBtn, {href: "#", textContent: "Изменить в окне", className: "appeal-iframe-btn"});
            openBtn.style.cssText = "display: block; cursor: pointer;";
            openBtn.onclick = (e) => {
                e.preventDefault();
                document.querySelector(".appeal-iframe-container")?.remove();
                createIframeWindow(buildActionUrl(params), "Изменить обращение");
            };
            cell.appendChild(openBtn);
        }

        if (jiraLink) {
            const jiraBtn = document.createElement("a");
            Object.assign(jiraBtn, {href: "#", textContent: "Создать тикет в JIRA"});
            jiraBtn.style.cssText = "display: block;";
            jiraBtn.onclick = () => eval(jiraLink.getAttribute("onclick") || "");
            cell.appendChild(jiraBtn);
        }

        return cell;
    };

    const createAppealsTable = (rows: NodeListOf<Element>): HTMLElement => {
        const wrapper = document.createElement("div");
        wrapper.className = "bl_antic appeals-check-block";

        const toggleHeader = createHeader(`Открытых обращений: ${rows.length}`, "bl_antic_head_r", true);
        toggleHeader.style.cursor = "pointer";

        const collapsible = document.createElement("div");
        collapsible.style.display = "none";

        toggleHeader.onclick = () => {
            collapsible.style.display = collapsible.style.display === "none" ? "block" : "none";
        };

        const thead = "<tr style='background:#f0f0f0'><th>№</th><th>Информация</th><th>Этап</th><th>Отв. группа</th><th>Начало</th><th>Окончание</th><th>Время</th><th>Инициатор</th><th>Канал</th><th>Класс</th><th>Действия</th></tr>";

        const tbody = document.createElement("tbody");
        const fragment = document.createDocumentFragment();

        rows.forEach((row, i) => {
            const cells = row.querySelectorAll("td");
            if (cells.length < 11) return;

            const tr = document.createElement("tr");
            tr.style.backgroundColor = i % 2 === 0 ? "#fff" : "#f9f9f9";

            const infoCell = cells[1];
            const getText = (idx: number) => cells[idx]?.textContent?.trim() || "";
            const comment = infoCell.querySelector(".comment")?.textContent.trim() || infoCell.textContent.trim();

            tr.innerHTML = `<td>${getText(0)}</td><td>${comment}</td><td>${getText(2)}</td><td>${getText(3)}</td><td>${getText(4)}</td><td>${getText(5)}</td><td>${getText(6)}</td><td>${getText(8)}</td><td>${getText(9)}</td><td>${getText(10)}</td>`;
            tr.appendChild(createActionsCell(row, infoCell));

            fragment.appendChild(tr);
        });

        tbody.appendChild(fragment);

        const table = document.createElement("table");
        table.className = "border";
        table.style.cssText = "width:100%; border-collapse:collapse; font-size:0.9em; margin-top:10px";
        table.innerHTML = thead;
        table.appendChild(tbody);

        collapsible.appendChild(table);
        wrapper.append(toggleHeader, collapsible);

        return wrapper;
    };

    const fetchAppeals = async (): Promise<NodeListOf<Element> | null> => {
        const params = getParams();
        if (!params) return null;

        const url = `https://${window.location.hostname}/cgi-bin/ppo/excells/wcc_new_web_arm.lazy_exec?proc_id%24c=2448&agr_id%24c=${params.agrId}&ssn%24c=${params.ssn}&user_id%24c=${params.userId}`;

        try {
            const response = await fetch(url, {
                credentials: "include",
                headers: {"X-Requested-With": "XMLHttpRequest"},
            });

            if (!response.ok) return null;

            const html = new TextDecoder("windows-1251").decode(await response.arrayBuffer());
            const doc = new DOMParser().parseFromString(html, "text/html");
            return doc.querySelector("#open")?.querySelectorAll('tr[bgcolor="white"]') ?? null;
        } catch {
            return null;
        }
    };

    const displayAppeals = async (): Promise<void> => {
        if (container.getAttribute("appeals-checked")) return;

        const loading = createHeader("Проверка наличия открытых обращений...", "bl_antic_head_n");
        const loadingWrapper = document.createElement("div");
        loadingWrapper.className = "bl_antic appeals-check-block";
        loadingWrapper.appendChild(loading);
        container.insertBefore(loadingWrapper, container.firstChild);

        const appeals = await fetchAppeals();
        loadingWrapper.remove();

        if (!appeals || appeals.length === 0) {
            container.insertBefore(createRefreshBlock("Нет открытых обращений", "bl_antic_head_g"), container.firstChild);
        } else {
            container.insertBefore(createAppealsTable(appeals), container.firstChild);
        }

        container.setAttribute("appeals-checked", "true");
    };

    const isVisible = () => container.offsetParent !== null;

    if (isVisible()) await displayAppeals();

    new MutationObserver(() => isVisible() && !container.getAttribute("appeals-checked") && displayAppeals())
        .observe(container, {attributes: true, attributeFilter: ["class", "style"]});
}