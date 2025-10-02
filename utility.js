/**
 * Removes restrictions on the "waiter" element's parent to allow text selection and copying.
 * If the "waiter" and "formform" elements exist, it assigns event handlers to prevent event propagation,
 * allowing text within these elements to be selectable without interference.
 */
function allowCopy() {
    requestAnimationFrame(() => {
        const waiter = document.getElementById("waiter");
        if (!waiter) return;

        const parent = waiter.parentNode;

        if (parent) {
            parent.removeAttribute("style");
            parent.removeAttribute("onselectstart");
        }

        const formform = document.getElementById("formform");

        // Apply event handlers only if elements exist
        [waiter, formform].filter(Boolean).forEach(element => {
            // Use a more efficient event handler assignment
            const stopPropagation = event => event.stopPropagation();
            element.onmousedown = stopPropagation;
            element.onselectstart = stopPropagation();
        });
    });
}

/**
 * Get client agreement number from page code, and display it in the header
 */
async function showClientAgreementOnChangeRequest() {
    let headerText = document.querySelector(".text-primary");
    headerText.innerText = `Обращение по договору №${document.querySelector('input[name="agr_num"]').value}`;
}

/**
 * Anticipation checker and replacement for arm top3 button
 */
async function setHelperAnticipation() {
    const button = document.querySelector(".top_3_butt");
    if (!button || button.textContent.includes("Хелпер")) return;

    button.textContent = "Хелпер";
    let problems = 0;

    // Проверка на "Сервисный Инженер Для Кц"
    const isServiceEngineer = () => {
        const namcl = document.querySelector("#namcl b");
        return namcl && namcl.textContent.trim() === "Сервисный Инженер Для Кц";
    };

    const foundTypes = new Set();

    // Объявляем типы проблем
    const problemTypes = [
        {
            name: "СПАС",
            selector: ".spas_body",
            textCheck: null,
            logMessage: "Найден СПАС"
        },
        {
            name: "Доступ",
            selector: ".bl_antic_head_w",
            textCheck: "Доступ отсутствует",
            logMessage: "Найден закрытый доступ"
        },
        {
            name: "Авария",
            selector: ".bl_antic_head_w",
            textCheck: "Аварии на адресе",
            logMessage: "Найдена авария"
        },
        {
            name: "ППР",
            selector: ".bl_antic_head_w",
            textCheck: "ППР на адресе",
            logMessage: "Найден ППР"
        },
        {
            name: "Особик",
            selector: ".bl_antic_head_w",
            textCheck: "Особый Клиент",
            logMessage: "Найден особый клиент",
            skipIfServiceEngineer: true
        }
    ];

    const markProblem = (type) => {
        if (foundTypes.has(type.name)) return false;
        foundTypes.add(type.name);
        button.innerHTML += ` | ${type.name}`;
        button.style.backgroundColor = "#cc3300";
        problems++;
        info(`[Хелпер] - [АРМ] - [Предвосхищение] ${type.logMessage}`);
        return true;
    };

    // Отдельно обрабатываем Сервисного Инженера
    if (isServiceEngineer()) {
        button.innerHTML += ` | Инженер`;
        button.style.backgroundColor = "#cc3300";
        problems++;
        info(`[Хелпер] - [АРМ] - [Сервисный инженер] Найден сервисный инженер`);
    }

    // Проверка существующих элементов
    problemTypes.forEach(type => {
        if (type.skipIfServiceEngineer && isServiceEngineer()) return;

        const elements = document.querySelectorAll(type.selector);
        if (elements.length > 0) {
            if (!type.textCheck) {
                markProblem(type);
            } else {
                elements.forEach(el => {
                    if (el.textContent.trim() === type.textCheck) {
                        markProblem(type);
                    }
                });
            }
        }
    });

    // Наблюдение за появляющимися элементами
    const observer = new MutationObserver(mutations => {
        for (const mutation of mutations) {
            if (mutation.type === "childList") {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType !== Node.ELEMENT_NODE) return;

                    problemTypes.forEach(type => {
                        if (type.skipIfServiceEngineer && isServiceEngineer()) return;

                        if (node.classList && node.classList.contains(type.selector.substring(1))) {
                            if (!type.textCheck) {
                                markProblem(type);
                            } else if (node.textContent.trim() === type.textCheck) {
                                markProblem(type);
                            }
                        }
                    });
                });
            }
        }
    });

    observer.observe(document.body, {childList: true, subtree: true});

    setTimeout(() => {
        observer.disconnect();
    }, 3000);

    if (problems === 0) {
        button.style.backgroundColor = "#008000";
    }

    info(`[Хелпер] - [АРМ] - [Предвосхищение] Предвосхищение загружено`);
}


/**
 * Initialize the filter and count display for client sessions
 */
async function initFilterClientSessions() {
    const container = document.querySelector(".container");
    const targetNode = document.getElementById("js-res-app");
    let filterContainer, countDisplay;

    const createFilterAndCountElements = () => {
        filterContainer = document.createElement("div");
        filterContainer.innerHTML = `
            <label for="reason-filter">Фильтр по причине завершения:</label>
            <select id="reason-filter"></select>
            <div id="reason-count-display" style="max-width: 200px; margin-top: 10px;"></div>
        `;
        container.insertBefore(filterContainer, targetNode);

        const reasonFilter = filterContainer.querySelector("#reason-filter");
        reasonFilter.addEventListener("change", filterClientSessions);

        countDisplay = filterContainer.querySelector("#reason-count-display");
    };

    const updateFilterAndCount = () => {
        const {uniqueReasons, reasonCounts} = getUniqueReasonsAndCounts();
        updateFilter(uniqueReasons);
        updateCountDisplay(reasonCounts);
    };

    const updateFilter = (uniqueReasons) => {
        const reasonFilter = document.getElementById("reason-filter");
        reasonFilter.innerHTML = `<option value="all">Все</option>${uniqueReasons
            .map((reason) => `<option value="${reason}">${reason}</option>`)
            .join("")}`;
    };

    const updateCountDisplay = (reasonCounts) => {
        if (!countDisplay) return;

        // Sorting by date of session end
        const sortedReasons = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1],);

        const totalCount = Object.values(reasonCounts).reduce((sum, count) => sum + count, 0,);

        countDisplay.innerHTML = `
        <table style="width:100%; border-collapse: collapse;">
            <thead>
                <tr>
                    <th style="border: 1px solid black; padding: 5px; text-align: center;">Разрыв</th>
                    <th style="border: 1px solid black; padding: 5px; text-align: center;">Кол-во</th>
                </tr>
            </thead>
            <tbody>
                ${sortedReasons
            .map(([reason, count]) => `
                            <tr>
                                <td style="border: 1px solid black; padding: 5px;">${reason}</td>
                                <td style="border: 1px solid black; padding: 5px;">${count}</td>
                            </tr>
                        `,)
            .join("")}
                <tr>
                    <td style="border: 1px solid black; padding: 5px; font-weight: bold;">Всего разрывов</td>
                    <td style="border: 1px solid black; padding: 5px; font-weight: bold;">${totalCount}</td>
                </tr>
            </tbody>
        </table>
    `;
    };

    const filterClientSessions = () => {
        const filter = document.getElementById("reason-filter").value;
        const rows = document.querySelectorAll("#js-res-app table tbody tr");
        rows.forEach((row) => {
            const reasonCell = row.cells[6];
            if (reasonCell) {
                row.style.display = filter === "all" || reasonCell.textContent.includes(filter) ? "" : "none";
            }
        });
    };

    const getUniqueReasonsAndCounts = () => {
        const rows = document.querySelectorAll("#js-res-app table tbody tr");
        const reasonCounts = {};
        rows.forEach((row) => {
            const reason = row.cells[6]?.textContent.trim();
            if (reason) {
                reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
            }
        });
        return {
            uniqueReasons: Object.keys(reasonCounts), reasonCounts,
        };
    };

    const observerCallback = () => {
        if (document.querySelector("#js-res-app table tbody")) {
            if (!filterContainer) createFilterAndCountElements();
            updateFilterAndCount();
            filterClientSessions();
        }
    };

    if (targetNode) {
        const observer = new MutationObserver(observerCallback);
        observer.observe(targetNode, {childList: true, subtree: true});
    } else {
        observerCallback();
    }
}

/**
 * Removes tabs from agreement page
 * @param tabList List of enabled to delete tabs from agreement
 */
async function deleteTabs(tabList) {
    const listItems = document.querySelectorAll(".tabs_new");

    const removePromises = Array.from(listItems).map(async (item) => {
        if (tabList.includes(item.textContent.trim())) {
            item.remove();
        }
    });

    await Promise.all(removePromises);
}

/**
 * Checks for special client, send alert if found
 */
async function checkForSpecialClient() {
    // Проверка на "Сервисный Инженер Для Кц"
    const isServiceEngineer = () => {
        const namcl = document.querySelector("#namcl b");
        return namcl && namcl.textContent.trim() === "Сервисный Инженер Для Кц";
    };

    // Если найден "Сервисный Инженер Для Кц", выводим предупреждение и не проверяем дальше
    if (isServiceEngineer()) {
        alert("Внимание! Сервисный инженер!");
        info(`[Хелпер] - [АРМ] - [Сервисный инженер] Найден сервисный инженер`);
        return;
    }

    const observerSpecial = new MutationObserver((mutationsList) => {
        for (const mutation of mutationsList) {
            if (mutation.type === "childList") {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE && node.classList.contains("bl_antic_head_w")) {
                        checkSpecialClient(node);
                    }
                });
            }
        }
    });

    const checkSpecialClient = (element) => {
        if (element.textContent.trim() === "Особый Клиент") {
            alert("Внимание! Особый клиент!");
            info(`[Хелпер] - [АРМ] - [Особый клиент] Найден особый клиент`);
            observerSpecial.disconnect();
        }
    };

    const special = document.querySelectorAll(".bl_antic_head_w");
    if (special.length > 0) {
        special.forEach(checkSpecialClient);
    } else {
        observerSpecial.observe(document.body, {childList: true, subtree: true});
        setTimeout(() => {
            observerSpecial.disconnect();
        }, 3000);

        const existingNodes = document.body.querySelectorAll(".bl_antic_head_w");
        existingNodes.forEach(checkSpecialClient);
    }
}

/**
 * Automatic formatting of EQM data.
 * Reformat MAC address to XX:XX:XX:XX:XX:XX
 * Removes EQM diag button
 */
async function autoFormatEQM() {
    new MutationObserver((mutations) => {
        const container = document.getElementById("lazy_content_2507");
        if (!container?.textContent) return;

        let manualSearchBtn = document.querySelector("#btnHandStartCalc")
        if (manualSearchBtn) manualSearchBtn.remove()

        let startEqmDiag = document.querySelector(".start_eqm_diag")
        if (startEqmDiag) startEqmDiag.remove()

        try {
            const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
                acceptNode: (node) => {
                    return /[0-9A-F]{2}[-:][0-9A-F]{2}[-:][0-9A-F]{2}[-:][0-9A-F]{2}[-:][0-9A-F]{2}[-:][0-9A-F]{2}/i.test(node.textContent,) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
                },
            }, false,);

            let currentNode;
            while ((currentNode = walker.nextNode())) {
                const originalText = currentNode.textContent;

                const newText = originalText.replace(/([0-9A-F]{2})[-:]([0-9A-F]{2})[-:]([0-9A-F]{2})[-:]([0-9A-F]{2})[-:]([0-9A-F]{2})[-:]([0-9A-F]{2})/gi, (match, p1, p2, p3, p4, p5, p6) => {
                    return `${p1}:${p2}:${p3}:${p4}:${p5}:${p6}`;
                },);

                if (originalText !== newText) {
                    currentNode.textContent = newText;
                }
            }

            const macInputs = container.querySelectorAll('input[readonly][value*="-"]',);
            macInputs.forEach((input) => {
                const macValue = input.value;
                if (macValue.includes("-")) {
                    input.value = macValue.replace(/-/g, ":");
                }
            });
        } catch (error) {
            error(`[Хелпер] - [АРМ] - [Обращения] Ошибка:`, error);
        }
    }).observe(document.body, {
        childList: true, subtree: true, characterData: true, attributeFilter: ["value"],
    });
}

/**
 * Format compensate button to be more visible
 */
async function autoFormatCompensateButtons() {
    const compensationLinks = document.querySelectorAll("a.compensation");

    compensationLinks.forEach((link) => {
        if (link.textContent.trim().toLowerCase() === "ok") {
            link.textContent = "Применить";
        }
    });
}

/**
 * Change appeal item of left frame to "Интернет"
 */
async function changeAppealItemToInternet() {
    const changeEvent = new Event("change", {
        bubbles: true, cancelable: true,
    });

    const product = document.querySelector(".uni_reas_prod");
    const values = Array.from(product.options).map((option) => option.value);

    if (values.includes("70")) {
        product.value = "70";
        product.dispatchEvent(changeEvent);
    }
}

/**
 * Search for open appeal on agreement
 * @returns {Promise<void>}
 */
async function searchForOpenAppeals() {
    try {
        const ssn = document.querySelector('#ssn')?.value;
        const user_id = document.querySelector('#user_id')?.value;
        const agr_id = document.querySelector('#agreement_id')?.value;

        if (!ssn || !user_id || !agr_id) return;

        const anticipationForm = document.querySelector('#anticipation_form');
        if (!anticipationForm) return;

        // Показываем надпись "Проверка..."
        const loadingBlock = document.createElement('div');
        loadingBlock.className = 'bl_antic';
        loadingBlock.innerHTML = '<div class="bl_antic_head_n">Проверка наличия открытых обращений...</div>';
        anticipationForm.insertBefore(loadingBlock, anticipationForm.firstChild);

        const currentDomain = window.location.hostname;
        const url = `https://${currentDomain}/cgi-bin/ppo/excells/wcc_new_web_arm.lazy_exec?proc_id$c=2448&agr_id$c=${agr_id}&ssn$c=${ssn}&user_id$c=${user_id}`;

        const response = await fetch(url, {
            credentials: 'include',
            headers: {
                'User-Agent': 'Mozilla/5.0',
                'Accept': 'text/html, */*; q=0.01',
                'X-Requested-With': 'XMLHttpRequest',
            },
            referrer: window.location.href,
            method: 'GET',
            mode: 'cors'
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const arrayBuffer = await response.arrayBuffer();
        const decoder = new TextDecoder('windows-1251');
        const html = decoder.decode(arrayBuffer);

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const openTab = doc.querySelector('#open');
        if (!openTab) return;

        const appealRows = openTab.querySelectorAll('tr[bgcolor="white"]');

        anticipationForm.removeChild(loadingBlock);

        const appealsBlock = document.createElement('div');
        appealsBlock.className = 'bl_antic';

        if (appealRows.length === 0) {
            appealsBlock.innerHTML = '<div class="bl_antic_head_g">Нет открытых обращений</div>';
        } else {
            // Заголовок с возможностью свернуть/развернуть
            const toggleHeader = document.createElement('div');
            toggleHeader.className = 'bl_antic_head_r';
            toggleHeader.textContent = 'Открытые обращения (развернуть)';
            toggleHeader.style.cursor = 'pointer';
            appealsBlock.appendChild(toggleHeader);

            const collapsibleContainer = document.createElement('div');
            collapsibleContainer.style.display = 'none';
            appealsBlock.appendChild(collapsibleContainer);

            toggleHeader.addEventListener('click', () => {
                const visible = collapsibleContainer.style.display === 'block';
                collapsibleContainer.style.display = visible ? 'none' : 'block';
                toggleHeader.textContent = visible
                    ? 'Открытые обращения (развернуть)'
                    : 'Открытые обращения (свернуть)';
            });

            const table = document.createElement('table');
            table.classList.add('border');
            table.style.cssText = 'margin-top: 10px; width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 0.9em;';

            const thead = document.createElement('thead');
            thead.innerHTML = `
                <tr style="background-color: #f0f0f0;">
                    <th>№</th><th>Информация</th><th>Этап</th><th>Отв. группа</th><th>Начало</th><th>Окончание</th>
                    <th>Время</th><th>Инициатор</th><th>Канал обращения</th><th>Класс проблемы</th><th>Действия</th>
                </tr>`;
            table.appendChild(thead);

            const tbody = document.createElement('tbody');

            appealRows.forEach((row, index) => {
                const cells = row.querySelectorAll('td');
                if (cells.length >= 12) {
                    const tr = document.createElement('tr');
                    tr.style.backgroundColor = index % 2 === 0 ? '#ffffff' : '#f9f9f9';

                    const number = cells[0].textContent.trim();
                    const infoCell = cells[1];
                    const info = infoCell.querySelector('.comment')?.textContent.trim() || infoCell.textContent.trim();
                    const stage = cells[2].textContent.trim();
                    const responsibleGroup = cells[3].textContent.trim();
                    const start = cells[4].textContent.trim();
                    const end = cells[5].textContent.trim();
                    const time = cells[6].textContent.trim();
                    const initiator = cells[8].textContent.trim();
                    const channel = cells[9].textContent.trim();
                    const problemClass = cells[10].textContent.trim();

                    const actionsCell = document.createElement('td');
                    actionsCell.style.cssText = 'padding: 5px;';

                    // Найдём возможные действия
                    const changeLink = infoCell.querySelector('a[onclick*="changeAppealInNewTab"]');
                    const jiraLink = row.querySelector('a[onclick*="showCreateTiketJira"]');
                    const iframeLink = row.querySelector('.appeal-iframe-btn');

                    if (changeLink) {
                        const [_, session, user, requestId] = changeLink.getAttribute('onclick')
                            .match(/changeAppealInNewTab\('([^']+)',\s*(\d+),\s*(\d+)\)/) || [];

                        if (session && user && requestId) {
                            // Изменить в окне
                            const openInWindow = document.createElement('a');
                            openInWindow.href = '#';
                            openInWindow.style.display = 'block';
                            openInWindow.style.cssText = 'display: block; cursor: pointer;';
                            openInWindow.textContent = 'Изменить в окне';
                            openInWindow.className = 'appeal-iframe-btn';

                            openInWindow.onclick = (e) => {
                                e.preventDefault();
                                e.stopPropagation();

                                // Повтор использования твоей функции
                                const params = {param1: session, param2: user, param3: requestId};

                                // Удалим предыдущее окно, если открыто
                                const existingIframe = document.querySelector('.appeal-iframe-container');
                                if (existingIframe) {
                                    existingIframe.remove();
                                }

                                // Construct URL with correct path and parameter format
                                let url = window.location.origin + '/cgi-bin/ppo/excells/wcc_request_appl_support.change_request_appl?'
                                    + 'ssn$c=' + params.param1
                                    + '&usr$i=' + params.param2
                                    + '&request_id$i=' + params.param3;

                                // Add global parameters if they exist
                                if (typeof globalParams !== 'undefined') {
                                    if (globalParams.rck) url += '&rck$c=' + globalParams.rck;
                                    if (globalParams.rcd) url += '&rcd$c=' + globalParams.rcd;
                                    if (globalParams.interaction_id) url += '&interaction_id$i=' + globalParams.interaction_id;
                                }

                                // Create iframe container with window functionality
                                const iframeContainer = document.createElement('div');
                                iframeContainer.className = 'appeal-iframe-container';
                                iframeContainer.style.cssText = `
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 800px;
                    height: 600px;
                    min-width: 100px;
                    min-height: 100px;
                    background: white;
                    border: 2px solid #ccc;
                    border-radius: 8px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                    z-index: 10000;
                    display: flex;
                    flex-direction: column;
                    resize: both;
                    overflow: hidden;
                `;

                                // Window state management
                                let isMinimized = false;
                                let isMaximized = false;
                                let originalStyles = {};
                                let isDragging = false;
                                let dragOffset = {x: 0, y: 0};

                                // Create header with window controls
                                const header = document.createElement('div');
                                header.className = 'window-header';
                                header.style.cssText = `
                    padding: 8px 15px;
                    background: linear-gradient(to bottom, #f8f8f8, #e8e8e8);
                    border-bottom: 1px solid #ddd;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-radius: 6px 6px 0 0;
                    cursor: move;
                    user-select: none;
                    height: 30px;
                    box-sizing: border-box;
                `;

                                const title = document.createElement('span');
                                title.textContent = 'Изменить обращение';
                                title.style.cssText = `
                    font-weight: bold;
                    font-size: 13px;
                    color: #333;
                    flex: 1;
                `;

                                // Window control buttons container
                                const controls = document.createElement('div');
                                controls.style.cssText = `
                    display: flex;
                    gap: 2px;
                `;

                                // Minimize button
                                const minimizeButton = document.createElement('button');
                                minimizeButton.innerHTML = '─';
                                minimizeButton.title = 'Minimize';
                                minimizeButton.style.cssText = `
                    width: 20px;
                    height: 20px;
                    border: 1px solid #bbb;
                    background: linear-gradient(to bottom, #fff, #e0e0e0);
                    cursor: pointer;
                    font-size: 12px;
                    line-height: 1;
                    border-radius: 2px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                `;

                                // Maximize/Restore button
                                const maximizeButton = document.createElement('button');
                                maximizeButton.innerHTML = '□';
                                maximizeButton.title = 'Maximize';
                                maximizeButton.style.cssText = `
                    width: 20px;
                    height: 20px;
                    border: 1px solid #bbb;
                    background: linear-gradient(to bottom, #fff, #e0e0e0);
                    cursor: pointer;
                    font-size: 12px;
                    line-height: 1;
                    border-radius: 2px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                `;

                                // Close button
                                const closeButton = document.createElement('button');
                                closeButton.innerHTML = '✕';
                                closeButton.title = 'Close';
                                closeButton.style.cssText = `
                    width: 20px;
                    height: 20px;
                    border: 1px solid #bbb;
                    background: linear-gradient(to bottom, #fff, #e0e0e0);
                    cursor: pointer;
                    font-size: 12px;
                    line-height: 1;
                    border-radius: 2px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #666;
                `;

                                // Button hover effects
                                [minimizeButton, maximizeButton, closeButton].forEach(btn => {
                                    btn.addEventListener('mouseenter', () => {
                                        btn.style.background = 'linear-gradient(to bottom, #fff, #d0d0d0)';
                                    });
                                    btn.addEventListener('mouseleave', () => {
                                        btn.style.background = 'linear-gradient(to bottom, #fff, #e0e0e0)';
                                    });
                                });

                                // Close button special hover
                                closeButton.addEventListener('mouseenter', () => {
                                    closeButton.style.background = 'linear-gradient(to bottom, #ff6b6b, #e63946)';
                                    closeButton.style.color = 'white';
                                });
                                closeButton.addEventListener('mouseleave', () => {
                                    closeButton.style.background = 'linear-gradient(to bottom, #fff, #e0e0e0)';
                                    closeButton.style.color = '#666';
                                });

                                // Create minimized state container
                                const minimizedContent = document.createElement('div');
                                minimizedContent.style.cssText = `
                    display: none;
                    flex: 1;
                    align-items: center;
                    justify-content: center;
                    font-size: 12px;
                    color: #666;
                    font-style: italic;
                `;
                                minimizedContent.textContent = 'Обращение свернуто';

                                // Window control functions
                                minimizeButton.onclick = (e) => {
                                    e.stopPropagation();
                                    if (isMinimized) {
                                        // Restore from minimize
                                        iframeContainer.style.height = originalStyles.height || '600px';
                                        iframeContainer.style.width = originalStyles.width || '800px';
                                        contentArea.style.display = 'flex';
                                        minimizedContent.style.display = 'none';
                                        minimizeButton.innerHTML = '─';
                                        minimizeButton.title = 'Minimize';
                                        isMinimized = false;
                                    } else {
                                        // Minimize
                                        originalStyles.height = iframeContainer.style.height;
                                        originalStyles.width = iframeContainer.style.width;
                                        iframeContainer.style.height = '38px';
                                        iframeContainer.style.width = '300px';
                                        contentArea.style.display = 'none';
                                        minimizedContent.style.display = 'flex';
                                        minimizeButton.innerHTML = '□';
                                        minimizeButton.title = 'Restore';
                                        isMinimized = true;
                                    }
                                };

                                maximizeButton.onclick = (e) => {
                                    e.stopPropagation();
                                    if (isMaximized) {
                                        // Restore from maximize
                                        iframeContainer.style.top = originalStyles.top || '50%';
                                        iframeContainer.style.left = originalStyles.left || '50%';
                                        iframeContainer.style.width = originalStyles.width || '800px';
                                        iframeContainer.style.height = originalStyles.height || '600px';
                                        iframeContainer.style.transform = originalStyles.transform || 'translate(-50%, -50%)';
                                        maximizeButton.innerHTML = '□';
                                        maximizeButton.title = 'Maximize';
                                        isMaximized = false;
                                    } else {
                                        // Maximize
                                        originalStyles = {
                                            top: iframeContainer.style.top,
                                            left: iframeContainer.style.left,
                                            width: iframeContainer.style.width,
                                            height: iframeContainer.style.height,
                                            transform: iframeContainer.style.transform
                                        };
                                        iframeContainer.style.top = '0';
                                        iframeContainer.style.left = '0';
                                        iframeContainer.style.width = '100vw';
                                        iframeContainer.style.height = '100vh';
                                        iframeContainer.style.transform = 'none';
                                        maximizeButton.innerHTML = '❐';
                                        maximizeButton.title = 'Restore';
                                        isMaximized = true;
                                        isMinimized = false;
                                    }
                                };

                                closeButton.onclick = (e) => {
                                    e.stopPropagation();
                                    iframeContainer.remove();
                                };

                                // Dragging functionality
                                header.addEventListener('mousedown', (e) => {
                                    if (e.target === minimizeButton || e.target === maximizeButton || e.target === closeButton) {
                                        return;
                                    }
                                    if (isMaximized) return;

                                    isDragging = true;
                                    const rect = iframeContainer.getBoundingClientRect();
                                    dragOffset.x = e.clientX - rect.left;
                                    dragOffset.y = e.clientY - rect.top;

                                    document.addEventListener('mousemove', handleDrag);
                                    document.addEventListener('mouseup', stopDrag);
                                    e.preventDefault();
                                });

                                function handleDrag(e) {
                                    if (!isDragging || isMaximized) return;

                                    const newLeft = e.clientX - dragOffset.x;
                                    const newTop = e.clientY - dragOffset.y;

                                    iframeContainer.style.left = newLeft + 'px';
                                    iframeContainer.style.top = newTop + 'px';
                                    iframeContainer.style.transform = 'none';
                                }

                                function stopDrag() {
                                    isDragging = false;
                                    document.removeEventListener('mousemove', handleDrag);
                                    document.removeEventListener('mouseup', stopDrag);
                                }

                                // Double-click header to maximize/restore
                                header.addEventListener('dblclick', (e) => {
                                    if (e.target === minimizeButton || e.target === maximizeButton || e.target === closeButton) {
                                        return;
                                    }
                                    maximizeButton.click();
                                });

                                // Assemble controls
                                controls.appendChild(minimizeButton);
                                controls.appendChild(maximizeButton);
                                controls.appendChild(closeButton);

                                header.appendChild(title);
                                header.appendChild(controls);

                                // Create content area
                                const contentArea = document.createElement('div');
                                contentArea.style.cssText = `
                    flex: 1;
                    position: relative;
                    overflow: hidden;
                `;

                                // Create iframe
                                const iframe = document.createElement('iframe');
                                iframe.src = url;
                                iframe.style.cssText = `
                    width: 100%;
                    height: 100%;
                    border: none;
                `;

                                // Create loading indicator
                                const loading = document.createElement('div');
                                loading.textContent = 'Загрузка...';
                                loading.style.cssText = `
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    font-size: 16px;
                    color: #666;
                    z-index: 1;
                `;

                                // Hide loading when iframe loads
                                let isIframeLoaded = false;
                                iframe.onload = () => {
                                    loading.style.display = 'none';
                                    isIframeLoaded = true;
                                };

                                // Assemble iframe container
                                contentArea.appendChild(loading);
                                contentArea.appendChild(iframe);
                                iframeContainer.appendChild(header);
                                iframeContainer.appendChild(contentArea);
                                iframeContainer.appendChild(minimizedContent);

                                // Add to page
                                document.body.appendChild(iframeContainer);

                                // Prevent default resize behavior conflicts
                                iframeContainer.addEventListener('mousedown', (e) => {
                                    e.stopPropagation();
                                });
                            };

                            actionsCell.appendChild(openInWindow);
                        }
                    }


                    if (jiraLink) {
                        const createJira = document.createElement('a');
                        createJira.href = '#';
                        createJira.textContent = 'Создать тикет в JIRA';
                        createJira.style.display = 'block';
                        createJira.addEventListener('click', () => eval(jiraLink.getAttribute('onclick')));
                        actionsCell.appendChild(createJira);
                    }

                    tr.innerHTML = `
                        <td>${number}</td>
                        <td>${info}</td>
                        <td>${stage}</td>
                        <td>${responsibleGroup}</td>
                        <td>${start}</td>
                        <td>${end}</td>
                        <td>${time}</td>
                        <td>${initiator}</td>
                        <td>${channel}</td>
                        <td>${problemClass}</td>
                    `;

                    tr.appendChild(actionsCell);
                    tbody.appendChild(tr);
                }
            });

            table.appendChild(tbody);
            collapsibleContainer.appendChild(table);
        }

        anticipationForm.insertBefore(appealsBlock, anticipationForm.firstChild);
        console.log(`Found ${appealRows.length} open appeals`);

    } catch (error) {
        console.error('Error checking open appeals:', error);
        const anticipationForm = document.querySelector('#anticipation_form');
        if (anticipationForm) {
            const errorBlock = document.createElement('div');
            errorBlock.className = 'bl_antic';
            errorBlock.innerHTML = '<div class="bl_antic_head_r">Ошибка при загрузке открытых обращений</div>';
            anticipationForm.insertBefore(errorBlock, anticipationForm.firstChild);
        }
    }
}
