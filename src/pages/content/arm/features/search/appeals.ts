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

export async function searchOpenedAppeals(): Promise<void> {
    const container = document.getElementById("anticipation_form");
    if (!container) return;

    const getParams = () => ({
        ssn: document.querySelector("#ssn")?.getAttribute("value"),
        userId: document.querySelector("#user_id")?.getAttribute("value"),
        agrId: document.querySelector("#agreement_id")?.getAttribute("value"),
    });

    const createLoadingBlock = (message: string, withRefresh = false): HTMLElement => {
        const block = document.createElement("div");
        block.className = "bl_antic appeals-check-block";

        const headerDiv = document.createElement("div");
        headerDiv.className = "bl_antic_head_n";
        headerDiv.textContent = message;

        if (withRefresh) {
            const refreshBtn = document.createElement("span");
            Object.assign(refreshBtn, {
                textContent: "↻",
                style: "cursor: pointer; margin-left: 5px",
                title: "Проверить снова",
            });
            refreshBtn.onclick = async () => {
                container.removeAttribute("appeals-checked");
                const existingAppealsBlock = container.querySelector(".appeals-check-block");
                existingAppealsBlock?.remove();
                await displayAppeals();
            };
            headerDiv.appendChild(refreshBtn);
        }

        block.appendChild(headerDiv);
        return block;
    };

    const fetchAppeals = async (params: ReturnType<typeof getParams>) => {
        if (!params.ssn || !params.userId || !params.agrId) return null;

        const url = `https://${window.location.hostname}/cgi-bin/ppo/excells/wcc_new_web_arm.lazy_exec?proc_id$c=2448&agr_id$c=${params.agrId}&ssn$c=${params.ssn}&user_id$c=${params.userId}`;

        const response = await fetch(url, {
            credentials: "include",
            headers: {
                "User-Agent": "Mozilla/5.0",
                Accept: "text/html, */*; q=0.01",
                "X-Requested-With": "XMLHttpRequest",
            },
            referrer: window.location.href,
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const html = new TextDecoder("windows-1251").decode(await response.arrayBuffer());
        const doc = new DOMParser().parseFromString(html, "text/html");
        return doc.querySelector("#open")?.querySelectorAll('tr[bgcolor="white"]');
    };

    const createActionsCell = (row: Element, infoCell: Element): HTMLElement => {
        const cell = document.createElement("td");
        const changeLink = infoCell.querySelector('a[onclick*="changeAppealInNewTab"]');
        const jiraLink = row.querySelector('a[onclick*="showCreateTiketJira"]');

        if (changeLink) {
            const params = extractActionParams(changeLink.getAttribute("onclick") || "");
            if (params) {
                const openBtn = document.createElement("a");
                Object.assign(openBtn, {
                    href: "#",
                    textContent: "Изменить в окне",
                    className: "appeal-iframe-btn",
                    style: "display: block; cursor: pointer;",
                });
                openBtn.onclick = (e) => {
                    e.preventDefault();
                    document.querySelector(".appeal-iframe-container")?.remove();
                    createIframeWindow(buildActionUrl(params), "Изменить обращение");
                    setupIframeCloseHandler();
                };
                cell.appendChild(openBtn);
            }
        }

        if (jiraLink) {
            const jiraBtn = document.createElement("a");
            Object.assign(jiraBtn, {
                href: "#",
                textContent: "Создать тикет в JIRA",
                style: "display: block;",
            });
            jiraBtn.onclick = () => eval(jiraLink.getAttribute("onclick") || "");
            cell.appendChild(jiraBtn);
        }

        return cell;
    };

    const setupIframeCloseHandler = () => {
        // Listen for messages from the iframe
        const messageHandler = (event: MessageEvent) => {
            if (event.data === 'close-iframe') {
                document.querySelector('.appeal-iframe-container')?.remove();
                window.removeEventListener('message', messageHandler);
            }
        };
        window.addEventListener('message', messageHandler);

        // Inject script into iframe to detect button click
        const iframe = document.querySelector('.appeal-iframe-container iframe') as HTMLIFrameElement;
        if (iframe) {
            // Use addEventListener to avoid overwriting existing onload handler
            iframe.addEventListener('load', () => {
                try {
                    const script = document.createElement('script');
                    script.textContent = `
                        (function() {
                            const observer = new MutationObserver(() => {
                                const applyButton = document.querySelector('button[data-bb-handler="confirm"]');
                                if (applyButton && !applyButton.hasAttribute('data-handler-added')) {
                                    applyButton.setAttribute('data-handler-added', 'true');
                                    applyButton.addEventListener('click', () => {
                                        window.parent.postMessage('close-iframe', '*');
                                    });
                                }
                            });
                            observer.observe(document.body, { childList: true, subtree: true });
                        })();
                    `;
                    iframe.contentDocument?.head.appendChild(script);
                } catch (error) {
                    console.warn('[Хелпер] - [АРМ] - [Открытые обращения] Не удалось внедрить скрипт в iframe:', error);
                }
            }, {once: true});
        }
    };

    const createAppealsTable = (rows: NodeListOf<Element>): HTMLElement => {
        const wrapper = document.createElement("div");
        wrapper.className = "bl_antic appeals-check-block";

        const toggleHeader = document.createElement("div");
        toggleHeader.className = "bl_antic_head_r";
        toggleHeader.style.cursor = "pointer";

        const countSpan = document.createElement("span");
        countSpan.textContent = `Открытые обращения (${rows.length})`;
        toggleHeader.appendChild(countSpan);

        const refreshBtn = document.createElement("span");
        Object.assign(refreshBtn, {
            textContent: " ↻",
            style: "cursor: pointer; margin-left: 10px; font-size: 1.2em;",
            title: "Проверить снова",
        });
        refreshBtn.onclick = async (e) => {
            e.stopPropagation();
            container.removeAttribute("appeals-checked");
            const existingAppealsBlock = container.querySelector(".appeals-check-block");
            existingAppealsBlock?.remove();
            await displayAppeals();
        };
        toggleHeader.appendChild(refreshBtn);

        const collapsible = document.createElement("div");
        collapsible.style.display = "none";

        toggleHeader.onclick = () => {
            const isHidden = collapsible.style.display === "none";
            collapsible.style.display = isHidden ? "block" : "none";
        };

        const table = document.createElement("table");
        table.classList.add("border");
        Object.assign(table.style, {
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "0.9em",
            marginTop: "10px",
        });

        const thead = document.createElement("thead");
        thead.innerHTML =
            "<tr style='background: #f0f0f0;'><th>№</th><th>Информация</th><th>Этап</th><th>Отв. группа</th><th>Начало</th><th>Окончание</th><th>Время</th><th>Инициатор</th><th>Канал</th><th>Класс</th><th>Действия</th></tr>";

        const tbody = document.createElement("tbody");

        rows.forEach((row, i) => {
            const cells = row.querySelectorAll("td");
            if (cells.length < 11) return;

            const tr = document.createElement("tr");
            tr.style.backgroundColor = i % 2 === 0 ? "#fff" : "#f9f9f9";

            const infoCell = cells[1];
            const td = (idx: number) => cells[idx]?.textContent.trim() || "";

            tr.innerHTML = `
                <td>${td(0)}</td>
                <td>${infoCell.querySelector(".comment")?.textContent.trim() || infoCell.textContent.trim()}</td>
                <td>${td(2)}</td>
                <td>${td(3)}</td>
                <td>${td(4)}</td>
                <td>${td(5)}</td>
                <td>${td(6)}</td>
                <td>${td(8)}</td>
                <td>${td(9)}</td>
                <td>${td(10)}</td>
            `;

            tr.appendChild(createActionsCell(row, infoCell));
            tbody.appendChild(tr);
        });

        table.appendChild(thead);
        table.appendChild(tbody);
        collapsible.appendChild(table);
        wrapper.appendChild(toggleHeader);
        wrapper.appendChild(collapsible);

        return wrapper;
    };

    const displayAppeals = async () => {
        if (container.getAttribute("appeals-checked")) return;

        const loading = createLoadingBlock("Проверка наличия открытых обращений...");
        container.insertBefore(loading, container.firstChild);

        try {
            const appeals = await fetchAppeals(getParams());
            loading.remove();

            if (!appeals || appeals.length === 0) {
                const noAppeals = createLoadingBlock("Нет открытых обращений", true);
                noAppeals.querySelector("div")!.className = "bl_antic_head_g";
                container.insertBefore(noAppeals, container.firstChild);
            } else {
                container.insertBefore(createAppealsTable(appeals), container.firstChild);
            }

            container.setAttribute("appeals-checked", "true");
            console.info(`[Хелпер] - [АРМ] - [Открытые обращения] Найдено: ${appeals?.length || 0}`);
        } catch (error) {
            loading.remove();
            const errorBlock = createLoadingBlock("Ошибка при загрузке обращений", true);
            errorBlock.querySelector("div")!.className = "bl_antic_head_r";
            container.insertBefore(errorBlock, container.firstChild);

            console.error("[Хелпер] - [АРМ] - [Открытые обращения] Ошибка:", error);
        }
    };

    if (container.offsetParent !== null) await displayAppeals();

    new MutationObserver(() => {
        if (container.offsetParent !== null && !container.getAttribute("appeals-checked")) {
            displayAppeals();
        }
    }).observe(container, {attributes: true, attributeFilter: ["class", "style"]});
}