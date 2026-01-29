import {notify} from "@src/utils";
import {getCookies} from "@pages/options/utils/arm-api";

// City IDs mapping from the select options
const CITY_IDS: Record<string, string> = {
    "OTT": "10100",
    "Ангарск": "100",
    "Архангельск": "1024",
    "Барнаул": "554",
    "Березники": "1163",
    "Брянск": "900",
    "Волгоград": "215",
    "Волжский": "243",
    "Воронеж": "553",
    "Воткинск": "368",
    "Дзержинск": "1101",
    "Димитровград": "4009",
    "Донецк (Ростовская обл)": "2488",
    "Екатеринбург": "557",
    "Ижевск": "233",
    "Иркутск": "903",
    "Йошкар-Ола": "236",
    "Казань": "237",
    "Камышин": "2168",
    "Киров": "232",
    "Краснодар": "1010",
    "Красноярск": "555",
    "Кунгур": "1165",
    "Курган": "801",
    "Курск": "907",
    "Липецк": "551",
    "Магнитогорск": "802",
    "Мичуринск": "3916",
    "Москва": "49",
    "Москва (Комкор)": "52555",
    "Москва (Кроникс Плюс)": "27700",
    "Москва (Телеком центр)": "48333",
    "Набережные Челны": "231",
    "Нижнекамск": "230",
    "Нижнеудинск": "1787",
    "Нижний Новгород": "136",
    "Новосибирск": "178",
    "Омск": "244",
    "Оренбург": "242",
    "Пенза": "238",
    "Пермь": "1",
    "Ростов-на-Дону": "1100",
    "Рязань": "800",
    "Самара": "2",
    "Санкт-Петербург": "556",
    "Саратов": "552",
    "Северск": "35",
    "Селенгинск": "3397",
    "Соликамск": "102",
    "Сосновый Бор": "4031",
    "Сызрань": "1102",
    "Тайшет": "4087",
    "Тверь": "906",
    "Томск": "902",
    "Томск (НТС)": "46060",
    "Тула": "803",
    "Тюмень": "228",
    "Улан-Удэ": "447",
    "Ульяновск": "805",
    "Усолье-Сибирское": "358",
    "Уфа": "804",
    "Холдинг (Айхоум)": "48444",
    "Чебоксары": "901",
    "Челябинск": "241",
    "Чусовой": "1167",
    "Энгельс": "528",
    "Энфорта": "11660",
    "Ярославль": "558",
};

interface AppealDetail {
    id: string;
    agreementNumber: string;
    reqStop: string;
    problemClass: string;
    groupOrder: string;
    appealsCount: string;
    groupName: string;
    address: string;
    campusNumber: string;
    closed: string;
    info: string;
    isError: number;
}

interface Response<T = unknown> {
    ok: boolean;
    data?: T;
    err?: string;
}

/**
 * Extracts city name from address string
 * Handles formats like "625037, г.Тюмень, ул. Таврическая, 10, 99"
 */
function extractCityName(address: string): string | null {
    // Match pattern: г.Город or г. Город (with or without space)
    const cityMatch = address.match(/г\.\s*([А-Яа-яЁёA-Za-z\s-]+)/);
    if (cityMatch) {
        return cityMatch[1].trim();
    }
    return null;
}

/**
 * Gets city ID from city name
 */
function getCityId(cityName: string): string | null {
    return CITY_IDS[cityName] || null;
}


/**
 * Fetches appeal details via background service worker
 */
async function getDetailsByCity(cityId: string): Promise<AppealDetail[]> {
    const response = await chrome.runtime.sendMessage({
        action: "fetchAppeals",
        payload: {cityId},
    }) as Response<AppealDetail[]>;

    if (!response.ok) {
        throw new Error(response.err || "Failed to fetch appeals");
    }

    return response.data || [];
}

/**
 * Extracts session parameters from hidden input fields
 */
function getSessionParams(): { ssn: string; usr: string } | null {
    const ssnInput = document.querySelector('input[name="ssn$c"]') as HTMLInputElement;
    const usrInput = document.querySelector('input[name="usr$i"]') as HTMLInputElement;

    if (ssnInput?.value && usrInput?.value) {
        return {
            ssn: ssnInput.value,
            usr: usrInput.value
        };
    }

    return null;
}

/**
 * Creates URL for opening agreement
 */
async function createAgreementUrl(agreementNumber: string, cityId: string): Promise<string> {
    try {
        // Try to get session params from current URL first
        const sessionParams = getSessionParams();

        const hostname = window.location.hostname;
        const cityMatch = hostname.match(/^([^.]+)\.db\.ertelecom\.ru$/);
        const cityPrefix = cityMatch ? cityMatch[1] : 'perm';

        if (sessionParams) {
            const {ssn, usr} = sessionParams;
            const url = `https://${cityPrefix}.db.ertelecom.ru/cgi-bin/ppo/excells/wcc2_main.open_wa?ssn$c=${ssn}&usr$i=${usr}&agr_num$n=${agreementNumber}&city_id$i=${cityId}`;
            console.log("[ARM] Generated agreement URL from URL params:", url);
            return url;
        }

        // Fall back to cookies
        const cookieResponse = await getCookies();
        console.log("[ARM] Cookie response:", cookieResponse);

        if (!cookieResponse.ok || !cookieResponse.data?.wccUsrName || !cookieResponse.data?.wccSsnName) {
            console.error("[ARM] Failed to get auth cookies for agreement URL:", cookieResponse);
            return "";
        }

        const {wccSsnName: ssn, wccUsrName: usr} = cookieResponse.data;
        const url = `https://${cityPrefix}.db.ertelecom.ru/cgi-bin/ppo/excells/wcc2_main.open_wa?ssn$c=${ssn}&usr$i=${usr}&agr_num$n=${agreementNumber}&city_id$i=${cityId}`;

        console.log("[ARM] Generated agreement URL from cookies:", url);
        return url;
    } catch (error) {
        console.error("[ARM] Error creating agreement URL:", error);
        return "";
    }
}

/**
 * Creates a draggable window button
 */
function createWindowButton(
    icon: string,
    title: string,
    onClick: () => void,
    hoverColor: string = "rgba(255,255,255,0.2)",
): HTMLButtonElement {
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
    btn.onclick = onClick;
    return btn;
}

/**
 * Parses Russian date format (DD.MM.YYYY HH:MM:SS)
 */
function parseRussianDate(dateStr: string): Date | null {
    const match = dateStr.match(/(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2}):(\d{2})/);
    if (match) {
        const [, day, month, year, hour, minute, second] = match;
        return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`);
    }
    return null;
}

type SortField = 'date' | 'agreement' | 'problem' | 'address' | 'executor';
type SortOrder = 'asc' | 'desc';

interface AgreementGroup {
    agreementNumber: string;
    appeals: AppealDetail[];
}

/**
 * Displays appeal details in a draggable window with search, sort, and filter
 */
function displayAppealDetails(
    appeals: AppealDetail[],
    cityName: string,
    cityId: string,
): void {
    if (appeals.length === 0) {
        notify("🔍 Обращения", "Не найдено обращений для данного города", "info");
        return;
    }

    // State for sorting and filtering
    let currentSortField: SortField = 'date';
    let currentSortOrder: SortOrder = 'desc' as SortOrder;
    let currentSearchQuery = '';

    // Sort and filter function
    function getProcessedAppeals(): AppealDetail[] {
        let result = [...appeals];

        // Filter by search query
        if (currentSearchQuery) {
            const query = currentSearchQuery.toLowerCase();
            result = result.filter(appeal =>
                appeal.agreementNumber.toLowerCase().includes(query) ||
                appeal.reqStop.toLowerCase().includes(query) ||
                appeal.problemClass.toLowerCase().includes(query) ||
                appeal.address.toLowerCase().includes(query) ||
                appeal.campusNumber.toLowerCase().includes(query) ||
                appeal.closed.toLowerCase().includes(query) ||
                appeal.info.toLowerCase().includes(query) ||
                appeal.groupName.toLowerCase().includes(query)
            );
        }

        // Sort
        result.sort((a, b) => {
            let comparison = 0;

            switch (currentSortField) {
                case 'date': {
                    const dateA = parseRussianDate(a.reqStop);
                    const dateB = parseRussianDate(b.reqStop);
                    if (dateA && dateB) comparison = dateA.getTime() - dateB.getTime();
                    else if (dateA) comparison = -1;
                    else if (dateB) comparison = 1;
                    break;
                }
                case 'agreement':
                    comparison = a.agreementNumber.localeCompare(b.agreementNumber);
                    break;
                case 'problem':
                    comparison = a.problemClass.localeCompare(b.problemClass);
                    break;
                case 'address':
                    comparison = a.address.localeCompare(b.address);
                    break;
                case 'executor':
                    comparison = a.closed.localeCompare(b.closed);
                    break;
            }

            return currentSortOrder === 'asc' ? comparison : -comparison;
        });

        return result;
    }

    // Group appeals by agreement number
    function groupAppeals(appealsList: AppealDetail[]): AgreementGroup[] {
        const groups = new Map<string, AppealDetail[]>();

        appealsList.forEach(appeal => {
            if (!groups.has(appeal.agreementNumber)) {
                groups.set(appeal.agreementNumber, []);
            }
            groups.get(appeal.agreementNumber)!.push(appeal);
        });

        // Sort appeals within each group by date (newest first)
        const sortedGroups: AgreementGroup[] = [];
        groups.forEach((appealsList, agreementNumber) => {
            appealsList.sort((a, b) => {
                const dateA = parseRussianDate(a.reqStop);
                const dateB = parseRussianDate(b.reqStop);
                if (dateA && dateB) return dateB.getTime() - dateA.getTime();
                if (dateA) return -1;
                if (dateB) return 1;
                return 0;
            });

            sortedGroups.push({
                agreementNumber,
                appeals: appealsList,
            });
        });

        // Sort groups by the newest appeal date
        sortedGroups.sort((a, b) => {
            const newestA = parseRussianDate(a.appeals[0].reqStop);
            const newestB = parseRussianDate(b.appeals[0].reqStop);
            if (newestA && newestB) return newestB.getTime() - newestA.getTime();
            if (newestA) return -1;
            if (newestB) return 1;
            return 0;
        });

        return sortedGroups;
    }

    // Create main container
    const container = document.createElement("div");
    container.className = "helper-appeals-container";
    Object.assign(container.style, {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "1000px",
        maxHeight: "85vh",
        background: "white",
        border: "1px solid #aaa",
        borderRadius: "8px",
        boxShadow: "0 10px 40px rgba(0,0,0,0.4)",
        zIndex: "10000",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
    });

    let isDragging = false;
    let dragOffset = {x: 0, y: 0};

    // Create header
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

    const titleEl = document.createElement("span");
    Object.assign(titleEl, {
        textContent: `🔍 Обращения по городу ${cityName}`,
        style: "font-weight: 600; font-size: 13px; color: white; flex: 1;",
    });

    const controls = document.createElement("div");
    controls.style.cssText = "display: flex; align-items: center;";

    const closeBtn = createWindowButton("✕", "Закрыть", () => container.remove(), "#e74c3c");
    controls.appendChild(closeBtn);

    header.appendChild(titleEl);
    header.appendChild(controls);

    // Create toolbar with search
    const toolbar = document.createElement("div");
    toolbar.style.cssText = `
        padding: 12px 16px;
        background: #f8fafc;
        border-bottom: 1px solid #e2e8f0;
        display: flex;
        gap: 12px;
        align-items: center;
    `;

    // Search input
    const searchContainer = document.createElement("div");
    searchContainer.style.cssText = "display: flex; align-items: center; gap: 8px; flex: 1;";

    const searchLabel = document.createElement("span");
    searchLabel.textContent = "🔍";
    searchLabel.style.cssText = "font-size: 14px;";

    const searchInput = document.createElement("input");
    searchInput.type = "text";
    searchInput.placeholder = "Поиск по всем полям...";
    Object.assign(searchInput.style, {
        flex: "1",
        padding: "6px 10px",
        border: "1px solid #d1d5db",
        borderRadius: "4px",
        fontSize: "13px",
        outline: "none",
    });
    searchInput.onfocus = () => (searchInput.style.borderColor = "#3b82f6");
    searchInput.onblur = () => (searchInput.style.borderColor = "#d1d5db");

    const resultCount = document.createElement("span");
    resultCount.style.cssText = "font-size: 12px; color: #6b7280; white-space: nowrap;";

    searchContainer.appendChild(searchLabel);
    searchContainer.appendChild(searchInput);
    searchContainer.appendChild(resultCount);

    // Sort controls
    const sortContainer = document.createElement("div");
    sortContainer.style.cssText = "display: flex; align-items: center; gap: 8px;";

    const sortLabel = document.createElement("span");
    sortLabel.textContent = "Сортировка:";
    sortLabel.style.cssText = "font-size: 12px; color: #6b7280;";

    const sortSelect = document.createElement("select");
    const sortOptions: { value: SortField; label: string }[] = [
        {value: 'date', label: 'Дате'},
        {value: 'agreement', label: 'Договору'},
        {value: 'problem', label: 'Проблеме'},
        {value: 'address', label: 'Адресу'},
        {value: 'executor', label: 'Исполнителю'},
    ];

    sortOptions.forEach(option => {
        const opt = document.createElement("option");
        opt.value = option.value;
        opt.textContent = option.label;
        sortSelect.appendChild(opt);
    });

    Object.assign(sortSelect.style, {
        padding: "5px 8px",
        border: "1px solid #d1d5db",
        borderRadius: "4px",
        fontSize: "12px",
        cursor: "pointer",
    });

    const sortOrderBtn = document.createElement("button");
    sortOrderBtn.textContent = currentSortOrder === 'asc' ? "↑" : "↓";
    sortOrderBtn.title = currentSortOrder === 'asc' ? "По возрастанию" : "По убыванию";
    Object.assign(sortOrderBtn.style, {
        padding: "5px 10px",
        border: "1px solid #d1d5db",
        borderRadius: "4px",
        background: "white",
        cursor: "pointer",
        fontSize: "14px",
        fontWeight: "bold",
    });
    sortOrderBtn.onmouseenter = () => (sortOrderBtn.style.background = "#f3f4f6");
    sortOrderBtn.onmouseleave = () => (sortOrderBtn.style.background = "white");

    sortContainer.appendChild(sortLabel);
    sortContainer.appendChild(sortSelect);
    sortContainer.appendChild(sortOrderBtn);

    toolbar.appendChild(searchContainer);
    toolbar.appendChild(sortContainer);

    // Create content area
    const content = document.createElement("div");
    Object.assign(content.style, {
        padding: "0",
        background: "#f5f5f5",
        overflowY: "auto",
        maxHeight: "calc(85vh - 100px)",
    });

    // Appeals list container
    const list = document.createElement("div");
    list.style.cssText = `
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 8px;
    `;

    // Render function
    function renderAppeals(): void {
        const processedAppeals = getProcessedAppeals();
        resultCount.textContent = `${processedAppeals.length} из ${appeals.length}`;
        list.innerHTML = '';

        if (processedAppeals.length === 0) {
            const emptyState = document.createElement("div");
            emptyState.style.cssText = `
                text-align: center;
                padding: 40px;
                color: #9ca3af;
                font-size: 14px;
            `;
            emptyState.textContent = "Не найдено обращений, соответствующих критериям поиска";
            list.appendChild(emptyState);
            return;
        }

        // Group appeals by agreement number
        const groups = groupAppeals(processedAppeals);

        // Render each group
        groups.forEach((group, groupIndex) => {
            const isLatestGroup = groupIndex === 0 && currentSortField === 'date' && currentSortOrder === 'desc' && !currentSearchQuery;

            // Group container
            const groupItem = document.createElement("div");
            groupItem.style.cssText = `
                background: white;
                border: 1px solid #ddd;
                border-left: 3px solid ${isLatestGroup ? "#10b981" : "#6b7280"};
                border-radius: 4px;
                margin-bottom: 8px;
                overflow: hidden;
                transition: background 0.15s ease;
            `;
            groupItem.onmouseenter = () => (groupItem.style.background = "#f9fafb");
            groupItem.onmouseleave = () => (groupItem.style.background = "white");

            // Group header (always visible)
            const groupHeader = document.createElement("div");
            groupHeader.style.cssText = `
                padding: 12px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 12px;
            `;

            const groupLeft = document.createElement("div");
            groupLeft.style.cssText = "display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0;";

            // Agreement link container
            const agreementContainer = document.createElement("div");
            agreementContainer.style.cssText = "display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0;";

            const agreementLabel = document.createElement("span");
            agreementLabel.textContent = "Договор:";
            agreementLabel.style.cssText = "font-weight: 500; font-size: 12px; color: #666;";

            const agreementLink = document.createElement("a");
            agreementLink.href = "#";
            agreementLink.target = "_blank";
            agreementLink.textContent = group.agreementNumber;
            agreementLink.style.cssText = `
                font-weight: 600;
                font-size: 14px;
                color: #2071c2;
                text-decoration: none;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            `;
            agreementLink.onmouseenter = () => (agreementLink.style.color = "#1a5c9e");
            agreementLink.onmouseleave = () => (agreementLink.style.color = "#2071c2");

            // Store the promise for click handling
            const urlPromise = createAgreementUrl(group.agreementNumber, cityId);
            urlPromise.then(url => {
                if (url) {
                    agreementLink.href = url;
                }
            });

            // Handle click - wait for URL to be loaded
            agreementLink.onclick = async (e) => {
                e.preventDefault();
                e.stopPropagation();
                const url = await urlPromise;
                if (url) {
                    window.open(url, '_blank');
                } else {
                    console.error("[ARM] Failed to load agreement URL");
                }
            };

            agreementContainer.appendChild(agreementLabel);
            agreementContainer.appendChild(agreementLink);

            // Copy agreement button
            const copyAgreementBtn = document.createElement("button");
            copyAgreementBtn.textContent = "📋";
            copyAgreementBtn.title = "Скопировать договор";
            Object.assign(copyAgreementBtn.style, {
                padding: "4px 6px",
                border: "1px solid #d1d5db",
                borderRadius: "4px",
                background: "white",
                cursor: "pointer",
                fontSize: "12px",
                marginLeft: "8px",
                flexShrink: "0",
                transition: "background 0.15s ease",
            });
            copyAgreementBtn.onmouseenter = () => (copyAgreementBtn.style.background = "#f3f4f6");
            copyAgreementBtn.onmouseleave = () => (copyAgreementBtn.style.background = "white");
            copyAgreementBtn.onclick = async (e) => {
                e.preventDefault();
                e.stopPropagation();
                try {
                    await navigator.clipboard.writeText(group.agreementNumber);
                    notify('Договор', "Договор скопирован в буфер обмена", "success");
                } catch (error) {
                    console.error("[ARM] Failed to copy agreement:", error);
                    notify('Договор', "Не удалось скопировать договор", "error");
                }
            };

            agreementContainer.appendChild(copyAgreementBtn);

            const groupRight = document.createElement("div");
            groupRight.style.cssText = "display: flex; align-items: center; gap: 8px; flex-shrink: 0;";

            // Count badge
            const countBadge = document.createElement("span");
            countBadge.textContent = `${group.appeals.length} обращ.`;
            countBadge.style.cssText = `
                background: #fef3c7;
                color: #92400e;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 11px;
                font-weight: 500;
            `;

            // Latest badge
            if (isLatestGroup) {
                const latestBadge = document.createElement("span");
                latestBadge.textContent = "Последнее";
                latestBadge.style.cssText = `
                    background: #10b981;
                    color: white;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 11px;
                    font-weight: 500;
                `;
                groupRight.appendChild(latestBadge);
            }

            // Newest date
            if (group.appeals.length > 0) {
                const dateBadge = document.createElement("span");
                dateBadge.textContent = group.appeals[0].reqStop;
                dateBadge.style.cssText = `
                    background: #e5e7eb;
                    color: #374151;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 11px;
                    font-weight: 500;
                    white-space: nowrap;
                `;
                groupRight.appendChild(dateBadge);
            }

            groupRight.appendChild(countBadge);

            groupLeft.appendChild(agreementContainer);
            groupHeader.appendChild(groupLeft);
            groupHeader.appendChild(groupRight);

            // Appeals container (always visible)
            const appealsContainer = document.createElement("div");
            appealsContainer.style.cssText = `
                display: block;
                border-top: 1px solid #e5e7eb;
                padding: 12px;
                background: #f9fafb;
            `;

            // Render individual appeals within group
            group.appeals.forEach((appeal, index) => {
                const appealItem = document.createElement("div");
                appealItem.style.cssText = `
                    background: white;
                    border: 1px solid #e5e7eb;
                    border-radius: 4px;
                    padding: 12px;
                    margin-bottom: 8px;
                    margin-left: 20px;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                `;

                // Skip last element's bottom margin
                if (index === group.appeals.length - 1) {
                    appealItem.style.marginBottom = "0";
                }

                // Date and executor row
                const metaRow = document.createElement("div");
                metaRow.style.cssText = "display: flex; justify-content: space-between; align-items: center; gap: 12px;";

                const dateSpan = document.createElement("span");
                dateSpan.textContent = appeal.reqStop;
                dateSpan.style.cssText = `
                    background: #e5e7eb;
                    color: #374151;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 11px;
                    font-weight: 500;
                    white-space: nowrap;
                `;

                const executorSpan = document.createElement("span");
                executorSpan.innerHTML = `
                    <span style="font-weight: 500; font-size: 11px; color: #666;">Исп:</span>
                    <span style="font-size: 12px; color: #333;">${appeal.closed}</span>
                `;

                metaRow.appendChild(dateSpan);
                metaRow.appendChild(executorSpan);

                // Problem class
                const problemDiv = document.createElement("div");
                problemDiv.style.cssText = "display: flex; align-items: flex-start; gap: 8px;";

                const problemLabel = document.createElement("span");
                problemLabel.textContent = "Проблема:";
                problemLabel.style.cssText = "font-weight: 500; font-size: 12px; color: #666; flex-shrink: 0;";

                const problemText = document.createElement("div");
                problemText.textContent = appeal.problemClass;
                problemText.style.cssText = `
                    font-size: 13px;
                    color: #333;
                    flex: 1;
                    line-height: 1.4;
                `;

                problemDiv.appendChild(problemLabel);
                problemDiv.appendChild(problemText);

                // Info
                const infoDiv = document.createElement("div");
                infoDiv.style.cssText = "display: flex; align-items: flex-start; gap: 8px;";

                const infoLabel = document.createElement("span");
                infoLabel.textContent = "Инфо:";
                infoLabel.style.cssText = "font-weight: 500; font-size: 12px; color: #666; flex-shrink: 0;";

                const infoText = document.createElement("div");
                infoText.textContent = appeal.info;
                infoText.style.cssText = `
                    font-size: 12px;
                    color: #666;
                    flex: 1;
                    line-height: 1.4;
                    font-style: italic;
                `;

                infoDiv.appendChild(infoLabel);
                infoDiv.appendChild(infoText);

                // Address and campus row
                const bottomRow = document.createElement("div");
                bottomRow.style.cssText = "display: flex; gap: 16px; flex-wrap: wrap;";

                const addressDiv = document.createElement("div");
                addressDiv.style.cssText = "display: flex; align-items: center; gap: 4px;";
                addressDiv.innerHTML = `
                    <span style="font-weight: 500; font-size: 11px; color: #666;">Адрес:</span>
                    <span style="font-size: 12px; color: #333;">${appeal.address}</span>
                `;

                const campusDiv = document.createElement("div");
                campusDiv.style.cssText = "display: flex; align-items: center; gap: 4px;";
                campusDiv.innerHTML = `
                    <span style="font-weight: 500; font-size: 11px; color: #666;">ГУТС:</span>
                    <span style="font-size: 12px; color: #333;">${appeal.campusNumber}</span>
                `;

                bottomRow.appendChild(addressDiv);
                bottomRow.appendChild(campusDiv);

                appealItem.appendChild(metaRow);
                appealItem.appendChild(problemDiv);
                appealItem.appendChild(infoDiv);
                appealItem.appendChild(bottomRow);
                appealsContainer.appendChild(appealItem);
            });

            groupItem.appendChild(groupHeader);
            groupItem.appendChild(appealsContainer);
            list.appendChild(groupItem);
        });
    }

    // Event listeners
    searchInput.addEventListener('input', (e) => {
        currentSearchQuery = (e.target as HTMLInputElement).value;
        renderAppeals();
    });

    sortSelect.addEventListener('change', (e) => {
        currentSortField = (e.target as HTMLSelectElement).value as SortField;
        renderAppeals();
    });

    sortOrderBtn.addEventListener('click', () => {
        currentSortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
        sortOrderBtn.textContent = currentSortOrder === 'asc' ? "↑" : "↓";
        sortOrderBtn.title = currentSortOrder === 'asc' ? "По возрастанию" : "По убыванию";
        renderAppeals();
    });

    content.appendChild(list);

    // Initial render
    renderAppeals();

    container.appendChild(header);
    container.appendChild(toolbar);
    container.appendChild(content);

    // Drag functionality
    const handleDrag = (e: MouseEvent) => {
        if (!isDragging) return;
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

    // Close on Escape key
    const escapeHandler = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
            container.remove();
            document.removeEventListener("keydown", escapeHandler);
        }
    };
    document.addEventListener("keydown", escapeHandler);

    document.body.appendChild(container);
}

/**
 * Creates and inserts a button to find appeals for the client's city
 */
export async function findAppealsButton(): Promise<void> {
    // Check if button already exists
    if (document.querySelector(".helper-find-appeals-btn") != null) {
        return;
    }

    const diagnosticBtn = document.querySelector(".helper-diagnostic-reports-btn");

    if (!diagnosticBtn || !diagnosticBtn.parentNode) {
        return;
    }

    const findAppealsButton = document.createElement("button");
    findAppealsButton.className = "btn btn-info helper-find-appeals-btn float-right btn-xs";
    findAppealsButton.type = "button";
    findAppealsButton.textContent = "Обращения";
    findAppealsButton.style.marginRight = "5px";

    // Insert before the diagnostic button in DOM (appears to the right with float-right)
    diagnosticBtn.parentNode.insertBefore(findAppealsButton, diagnosticBtn);

    findAppealsButton.addEventListener("click", async (event: Event) => {
        event.preventDefault();
        event.stopPropagation();

        // Show loading state
        const originalText = findAppealsButton.textContent;
        findAppealsButton.textContent = "⏳ Поиск...";
        findAppealsButton.disabled = true;

        try {
            // Get address from the dr element
            const addressCell = document.getElementById("dr") as HTMLElement | null;
            if (!addressCell) {
                notify("🔍 Обращения", "Адрес не найден", "error");
                return;
            }

            const addressText = addressCell.textContent?.trim() || "";
            const cityName = extractCityName(addressText);

            if (!cityName) {
                notify("🔍 Обращения", "Город не найден в адресе", "error");
                return;
            }

            const cityId = getCityId(cityName);
            if (!cityId) {
                notify("🔍 Обращения", `Город "${cityName}" не найден в списке`, "error");
                return;
            }

            // Fetch appeal details
            const appeals = await getDetailsByCity(cityId);
            displayAppealDetails(appeals, cityName, cityId);

            console.info(`[ARM] Found ${appeals.length} appeals for city ${cityName}`);
        } catch (error) {
            console.error("[ARM] Error fetching appeals:", error);
            notify("🔍 Обращения", "Ошибка при поиске обращений", "error");
        } finally {
            findAppealsButton.textContent = originalText;
            findAppealsButton.disabled = false;
        }
    });
}
