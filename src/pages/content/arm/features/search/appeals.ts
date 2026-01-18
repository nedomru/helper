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

    const createLoadingBlock = (message: string): HTMLElement => {
        const block = document.createElement("div");
        block.className = "bl_antic";
        block.innerHTML = `<div class="bl_antic_head_n">${message}</div>`;
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

    const createIframeWindow = (url: string, title: string) => {
        const container = document.createElement("div");
        container.className = "appeal-iframe-container";
        Object.assign(container.style, {
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "900px",
            height: "700px",
            minWidth: "300px",
            minHeight: "200px",
            background: "white",
            border: "1px solid #aaa",
            borderRadius: "8px",
            boxShadow: "0 10px 40px rgba(0,0,0,0.4)",
            zIndex: "10000",
            display: "flex",
            flexDirection: "column",
            resize: "both",
            overflow: "hidden",
        });

        let isDragging = false;
        let isMaximized = false;
        let isMinimized = false;
        let dragOffset = {x: 0, y: 0};
        let originalState = {top: "", left: "", width: "", height: "", transform: ""};

        const header = document.createElement("div");
        Object.assign(header.style, {
            padding: "8px 12px",
            background: "#2071c2",
            borderBottom: "1px solid #1a5c9e",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            cursor: "move",
            borderRadius: "8px 8px 0 0",
            userSelect: "none",
        });

        const createButton = (
            icon: string,
            title: string,
            onClick: () => void,
            hoverColor: string = "rgba(255,255,255,0.2)"
        ) => {
            const btn = document.createElement("button");
            Object.assign(btn, {
                textContent: icon,
                title,
                ariaLabel: title,
            });
            Object.assign(btn.style, {
                width: "32px",
                height: "28px",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                fontSize: "16px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "4px",
                margin: "0 2px",
                color: "white",
                transition: "background 0.15s ease",
                padding: "0",
            });
            btn.onmouseenter = () => (btn.style.background = hoverColor);
            btn.onmouseleave = () => (btn.style.background = "transparent");
            btn.onclick = (e) => {
                e.stopPropagation();
                onClick();
            };
            return btn;
        };

        const controls = document.createElement("div");
        controls.style.cssText = "display: flex; align-items: center;";

        const minimizeBtn = createButton("−", "Свернуть", () => {
            isMinimized = !isMinimized;
            if (isMinimized) {
                container.style.height = "44px";
                content.style.display = "none";
                container.style.resize = "none";
            } else {
                container.style.height = originalState.height || "700px";
                content.style.display = "flex";
                container.style.resize = "both";
            }
        });

        const maximizeBtn = createButton("□", "На весь экран", () => {
            if (!isMaximized) {
                originalState = {
                    top: container.style.top,
                    left: container.style.left,
                    width: container.style.width,
                    height: container.style.height,
                    transform: container.style.transform,
                };
                Object.assign(container.style, {
                    top: "0",
                    left: "0",
                    width: "100vw",
                    height: "100vh",
                    transform: "none",
                    borderRadius: "0",
                });
                header.style.borderRadius = "0";
                maximizeBtn.textContent = "⤡";
                maximizeBtn.title = "Восстановить";
                isMaximized = true;
            } else {
                Object.assign(container.style, {
                    ...originalState,
                    borderRadius: "8px",
                });
                header.style.borderRadius = "8px 8px 0 0";
                maximizeBtn.textContent = "□";
                maximizeBtn.title = "На весь экран";
                isMaximized = false;
            }
        });

        const closeBtn = createButton("✕", "Закрыть", () => container.remove(), "#e74c3c");

        controls.appendChild(minimizeBtn);
        controls.appendChild(maximizeBtn);
        controls.appendChild(closeBtn);

        const titleEl = document.createElement("span");
        Object.assign(titleEl, {
            textContent: title,
            style: "font-weight: 600; font-size: 13px; color: white; flex: 1;",
        });

        header.appendChild(titleEl);
        header.appendChild(controls);

        const content = document.createElement("div");
        Object.assign(content.style, {
            flex: "1",
            position: "relative",
            display: "flex",
            flexDirection: "column",
        });

        const loadingEl = document.createElement("div");
        Object.assign(loadingEl, {
            textContent: "⏳ Загрузка...",
            style:
                "position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 16px; color: #666; background: #f5f5f5; z-index: 1;",
        });

        const iframe = document.createElement("iframe");
        Object.assign(iframe, {src: url});
        Object.assign(iframe.style, {
            width: "100%",
            height: "100%",
            border: "none",
            opacity: "0",
            transition: "opacity 0.3s",
        });

        iframe.onload = () => {
            loadingEl.remove();
            iframe.style.opacity = "1";
        };

        content.appendChild(loadingEl);
        content.appendChild(iframe);

        const handleDrag = (e: MouseEvent) => {
            if (!isDragging || isMaximized) return;
            container.style.left = e.clientX - dragOffset.x + "px";
            container.style.top = e.clientY - dragOffset.y + "px";
            container.style.transform = "none";
        };

        header.addEventListener("mousedown", (e) => {
            const target = e.target as HTMLElement;
            if (target.tagName === "BUTTON") return;
            isDragging = true;
            const rect = container.getBoundingClientRect();
            dragOffset = {x: e.clientX - rect.left, y: e.clientY - rect.top};
            e.preventDefault();
        });

        document.addEventListener("mousemove", handleDrag);
        document.addEventListener("mouseup", () => (isDragging = false));

        header.addEventListener("dblclick", (e) => {
            const target = e.target as HTMLElement;
            if (target.tagName === "BUTTON") return;
            maximizeBtn.click();
        });

        container.addEventListener("mousedown", (e) => e.stopPropagation());
        container.appendChild(header);
        container.appendChild(content);
        document.body.appendChild(container);
    };

    const extractActionParams = (onclick: string) => {
        const match = onclick.match(/changeAppealInNewTab\('([^']+)',\s*(\d+),\s*(\d+)\)/);
        return match ? {session: match[1], user: match[2], requestId: match[3]} : null;
    };

    const buildActionUrl = (params: { session: string; user: string; requestId: string }) => {
        let url = `${window.location.origin}/cgi-bin/ppo/excells/wcc_request_appl_support.change_request_appl?ssn$c=${params.session}&usr$i=${params.user}&request_id$i=${params.requestId}`;
        const globalParams = (window as { globalParams?: Record<string, string> }).globalParams;
        if (globalParams) {
            if (globalParams.rck) url += `&rck$c=${globalParams.rck}`;
            if (globalParams.rcd) url += `&rcd$c=${globalParams.rcd}`;
            if (globalParams.interaction_id) url += `&interaction_id$i=${globalParams.interaction_id}`;
        }
        return url;
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

    const createAppealsTable = (rows: NodeListOf<Element>): HTMLElement => {
        const wrapper = document.createElement("div");
        wrapper.className = "bl_antic";

        const toggleHeader = document.createElement("div");
        Object.assign(toggleHeader, {
            className: "bl_antic_head_r",
            textContent: `Открытые обращения (${rows.length})`,
            style: "cursor: pointer;",
        });

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
                const noAppeals = createLoadingBlock("Нет открытых обращений");
                noAppeals.querySelector("div")!.className = "bl_antic_head_g";
                container.insertBefore(noAppeals, container.firstChild);
            } else {
                container.insertBefore(createAppealsTable(appeals), container.firstChild);
            }

            container.setAttribute("appeals-checked", "true");
            console.info(`[Хелпер] - [АРМ] - [Открытые обращения] Найдено: ${appeals?.length || 0}`);
        } catch (error) {
            loading.remove();
            const errorBlock = createLoadingBlock("Ошибка при загрузке обращений");
            errorBlock.querySelector("div")!.className = "bl_antic_head_r";
            container.insertBefore(errorBlock, container.firstChild);
            console.error("[Хелпер] - [АРМ] - [Открытые обращения] Ошибка:", error);
        }
    };

    if (container.offsetParent !== null) displayAppeals();

    new MutationObserver(() => {
        if (container.offsetParent !== null && !container.getAttribute("appeals-checked")) {
            displayAppeals();
        }
    }).observe(container, {attributes: true, attributeFilter: ["class", "style"]});
}