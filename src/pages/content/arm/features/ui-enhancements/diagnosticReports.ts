import {notify} from "@src/utils";

const DIAGNOSTIC_URLS = [
    "http://octptest.corp.ertelecom.loc/diagnostic-results/mobile/",
    "http://octptest.corp.ertelecom.loc/diagnostic-results/perm/",
] as const;

interface DiagnosticFile {
    name: string;
    url: string;
    source: string;
    date?: Date | null;
}

interface Response<T = unknown> {
    ok: boolean;
    data?: T;
    err?: string;
}

/**
 * Fetches all diagnostic files from both mobile and perm sources via background worker
 */
async function fetchAllDiagnosticFiles(): Promise<DiagnosticFile[]> {
    try {
        const response = await chrome.runtime.sendMessage({
            action: "fetchDiagnosticReports",
            payload: {
                urls: DIAGNOSTIC_URLS,
            },
        }) as Response<DiagnosticFile[]>;

        if (!response.ok || !response.data) {
            return [];
        }

        return response.data;
    } catch (error) {
        console.error("Error fetching diagnostic files:", error);
        return [];
    }
}

/**
 * Extracts date from filename
 * Supports format: 12345_19_01_2026_23-54-55.txt (DD_MM_YYYY_HH-MM-SS)
 */
function parseFileDate(file: DiagnosticFile): Date | null {
    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, ""); // Remove extension

    // Try DD_MM_YYYY_HH-MM-SS pattern (e.g., 19_01_2026_23-54-55 from 360001795462_19_01_2026_23-54-55.txt)
    const dateTimeMatch = nameWithoutExt.match(/_(\d{2})_(\d{2})_(\d{4})_(\d{2})-(\d{2})-(\d{2})$/);
    if (dateTimeMatch) {
        const [, day, month, year, hour, minute, second] = dateTimeMatch;
        const date = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`);
        if (!isNaN(date.getTime())) {
            return date;
        }
    }

    // Try other patterns
    const patterns = [
        /(\d{4})-(\d{2})-(\d{2})/,           // 2025-01-28
        /(\d{4})(\d{2})(\d{2})/,             // 20250128
        /(\d{2})\.(\d{2})\.(\d{4})/,         // 28.01.2025
        /(\d{2})-(\d{2})-(\d{4})/,           // 28-01-2025
        /(\d{2})\/(\d{2})\/(\d{4})/,         // 28/01/2025
    ];

    for (const pattern of patterns) {
        const match = nameWithoutExt.match(pattern);
        if (match) {
            const [, first, second, third] = match;
            // Determine if format is YYYY-MM-DD or DD-MM-YYYY
            if (first.length === 4) {
                return new Date(`${first}-${second}-${third}`);
            } else {
                return new Date(`${third}-${second}-${first}`);
            }
        }
    }

    return null;
}

/**
 * Filters files by agreement number and returns the latest 5 by date
 */
function getLatestMatchingFiles(files: DiagnosticFile[], agreementNumber: string): DiagnosticFile[] {
    const matchingFiles = files
        .filter((file) => file.name.startsWith(agreementNumber))
        .map((file) => ({
            ...file,
            date: parseFileDate(file),
        }));

    // Sort by date descending (newest first), fallback to name if no date
    const sortedFiles = matchingFiles.sort((a, b) => {
        if (a.date && b.date) {
            return b.date.getTime() - a.date.getTime();
        }
        if (a.date) return -1;
        if (b.date) return 1;
        return b.name.localeCompare(a.name);
    });

    // Return latest 5
    return sortedFiles.slice(0, 5);
}

/**
 * Copies URL to clipboard and shows notification
 */
function copyUrlToClipboard(url: string, fileName: string): void {
    navigator.clipboard.writeText(url).then(() => {
        notify("📋 URL скопирован", `Ссылка на "${fileName}" скопирована в буфер обмена`, "success");
    }).catch((err) => {
        console.error("Failed to copy URL:", err);
        notify("❌ Ошибка копирования", "Не удалось скопировать ссылку", "error");
    });
}

/**
 * Formats date for display (time first, then date)
 */
function formatDate(date: Date | null | undefined): string {
    if (!date || isNaN(date.getTime())) {
        return "";
    }
    const time = date.toLocaleTimeString("ru-RU", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
    const dateStr = date.toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
    return `${time} ${dateStr}`;
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
 * Displays diagnostic results in a draggable window (like iframe window)
 */
function displayDiagnosticResults(
    files: DiagnosticFile[],
    agreementNumber: string,
    onReload: () => Promise<void>,
    savedPosition?: { top: string; left: string; transform: string },
): void {
    if (files.length === 0) {
        notify("🔍 Диагностические отчеты", "Не найдено отчетов для данного договора", "info");
        return;
    }

    // Create main container
    const container = document.createElement("div");
    container.className = "helper-diagnostic-container";
    Object.assign(container.style, {
        position: "fixed",
        top: savedPosition?.top ?? "50%",
        left: savedPosition?.left ?? "50%",
        transform: savedPosition?.transform ?? "translate(-50%, -50%)",
        // width: "700px",
        maxHeight: "80vh",
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
        textContent: `🔍 Диагностические отчеты (${files.length})`,
        style: "font-weight: 600; font-size: 13px; color: white; flex: 1;",
    });

    const controls = document.createElement("div");
    controls.style.cssText = "display: flex; align-items: center;";

    const reloadBtn = createWindowButton("↻", "Обновить", async () => {
        reloadBtn.disabled = true;
        reloadBtn.style.opacity = "0.5";
        reloadBtn.style.cursor = "not-allowed";
        try {
            await onReload();
        } finally {
            reloadBtn.disabled = false;
            reloadBtn.style.opacity = "1";
            reloadBtn.style.cursor = "pointer";
        }
    });
    controls.appendChild(reloadBtn);

    const closeBtn = createWindowButton("✕", "Закрыть", () => container.remove(), "#e74c3c");
    controls.appendChild(closeBtn);

    header.appendChild(titleEl);
    header.appendChild(controls);

    // Create content area
    const content = document.createElement("div");
    Object.assign(content.style, {
        padding: "16px",
        background: "#f5f5f5",
        overflowY: "auto",
        maxHeight: "calc(80vh - 44px)",
    });

    // File list
    const list = document.createElement("div");
    list.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 8px;
    `;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const isLatest = i === 0;
        const isMobile = file.source === "mobile";
        const item = document.createElement("div");
        item.style.cssText = `
            background: white;
            border: 1px solid ${isMobile ? "#b3d9ff" : "#ffe6a6"};
            border-left: 3px solid ${isMobile ? "#3b82f6" : "#f59e0b"};
            border-radius: 4px;
            padding: 10px 12px;
            display: flex;
            align-items: center;
            gap: 10px;
            transition: background 0.15s ease;
        `;
        item.onmouseenter = () => (item.style.background = isMobile ? "#f0f9ff" : "#fffbeb");
        item.onmouseleave = () => (item.style.background = "white");

        // Icon
        const icon = document.createElement("span");
        icon.textContent = isMobile ? "📱" : "💻";
        icon.style.cssText = "font-size: 18px; flex-shrink: 0;";

        // File info
        const fileInfo = document.createElement("div");
        fileInfo.style.cssText = "flex: 1; min-width: 0;";

        const fileName = document.createElement("div");
        fileName.style.cssText = `
            font-weight: 500;
            font-size: 13px;
            color: #333;
            margin-bottom: 2px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        `;

        const link = document.createElement("a");
        link.href = file.url;
        link.target = "_blank";
        link.textContent = file.name;
        link.style.cssText = "color: inherit; text-decoration: none;";
        link.onmouseenter = () => (link.style.color = isMobile ? "#2071c2" : "#d97706");
        link.onmouseleave = () => (link.style.color = "#333");
        fileName.appendChild(link);

        const meta = document.createElement("div");
        meta.style.cssText = "font-size: 11px; color: #666; display: flex; gap: 6px;";

        const sourceBadge = document.createElement("span");
        sourceBadge.textContent = isMobile ? "Телефон" : "ПК";
        sourceBadge.style.cssText = `
            background: ${isMobile ? "#dbeafe" : "#fef3c7"};
            color: ${isMobile ? "#1e40af" : "#92400e"};
            padding: 2px 6px;
            border-radius: 3px;
            font-weight: 500;
        `;
        meta.appendChild(sourceBadge);

        const formattedDate = formatDate(file.date);
        if (formattedDate) {
            const dateBadge = document.createElement("span");
            dateBadge.textContent = formattedDate;
            dateBadge.style.cssText = `
                background: #e5e7eb;
                color: #374151;
                padding: 2px 6px;
                border-radius: 3px;
                font-weight: 500;
            `;
            meta.appendChild(dateBadge);
        }

        if (isLatest) {
            const latestBadge = document.createElement("span");
            latestBadge.textContent = "Последний";
            latestBadge.style.cssText = `
                background: #10b981;
                color: white;
                padding: 2px 6px;
                border-radius: 3px;
                font-weight: 500;
            `;
            meta.appendChild(latestBadge);
        }

        fileInfo.appendChild(fileName);
        fileInfo.appendChild(meta);

        // Actions
        const actions = document.createElement("div");
        actions.style.cssText = "display: flex; gap: 4px; flex-shrink: 0;";

        const copyBtn = document.createElement("button");
        copyBtn.textContent = "📋";
        copyBtn.title = "Скопировать ссылку";
        Object.assign(copyBtn.style, {
            width: "28px",
            height: "24px",
            border: "1px solid #ddd",
            borderRadius: "4px",
            background: "#f5f5f5",
            cursor: "pointer",
            fontSize: "14px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0",
            color: "#666",
            transition: "background 0.15s ease",
        });
        copyBtn.onmouseenter = () => {
            copyBtn.style.background = "#e0e0e0";
            copyBtn.style.color = "#333";
        };
        copyBtn.onmouseleave = () => {
            copyBtn.style.background = "#f5f5f5";
            copyBtn.style.color = "#666";
        };
        copyBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            copyUrlToClipboard(file.url, file.name);
        };

        actions.appendChild(copyBtn);

        item.appendChild(icon);
        item.appendChild(fileInfo);
        item.appendChild(actions);
        list.appendChild(item);
    }

    content.appendChild(list);

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

    container.appendChild(header);
    container.appendChild(content);
    document.body.appendChild(container);
}

/**
 * Creates and inserts a "Check Diagnostic Reports" button
 */
export async function diagnosticReportsButton(): Promise<void> {
    if (document.querySelector(".helper-diagnostic-reports-btn") != null) {
        return;
    }

    const compensateBtn = document.querySelector(".helper-compensate-btn");

    if (!compensateBtn || !compensateBtn.parentNode) {
        return;
    }

    const diagnosticBtn = document.createElement("button");
    diagnosticBtn.className = "btn btn-info helper-diagnostic-reports-btn float-right btn-xs";
    diagnosticBtn.type = "button";
    diagnosticBtn.textContent = "Отчеты СПАС";
    diagnosticBtn.style.marginLeft = "5px";
    diagnosticBtn.style.marginRight = "5px";

    // Insert before the compensate button in DOM (appears to the right with float-right)
    compensateBtn.parentNode.insertBefore(diagnosticBtn, compensateBtn);

    let currentContainer: HTMLElement | null = null;

    const loadAndDisplayReports = async (showNotification: boolean = false) => {
        const spasDiv = document.querySelector("#spas_div");

        if (!spasDiv) {
            if (showNotification) {
                notify("🔍 Диагностические отчеты", "Не удалось найти элемент SPAS", "error");
            }
            return;
        }

        const agreementNumber = spasDiv.getAttribute("agr_num");

        if (!agreementNumber) {
            if (showNotification) {
                notify("🔍 Диагностические отчеты", "Не удалось получить номер договора", "error");
            }
            return;
        }

        try {
            const allFiles = await fetchAllDiagnosticFiles();
            const matchingFiles = getLatestMatchingFiles(allFiles, agreementNumber);

            // Save current window position before removing
            let savedPosition: { top: string; left: string; transform: string } | undefined;
            if (currentContainer) {
                savedPosition = {
                    top: currentContainer.style.top,
                    left: currentContainer.style.left,
                    transform: currentContainer.style.transform,
                };
                currentContainer.remove();
            }

            // Create reload function that will refresh and reopen the window
            const reload = async () => {
                await loadAndDisplayReports(false);
            };

            displayDiagnosticResults(matchingFiles, agreementNumber, reload, savedPosition);

            // Store reference to the new container
            currentContainer = document.querySelector(".helper-diagnostic-container");

            if (showNotification) {
                notify("🔍 Диагностические отчеты", `Найдено отчетов: ${matchingFiles.length}`, "success");
            }
        } catch (error) {
            console.error("Error checking diagnostic reports:", error);
            if (showNotification) {
                notify("🔍 Диагностические отчеты", "Произошла ошибка при поиске отчетов", "error");
            }
        }
    };

    diagnosticBtn.addEventListener("click", async () => {
        diagnosticBtn.disabled = true;
        diagnosticBtn.textContent = "⏳ Поиск...";

        try {
            await loadAndDisplayReports(true);
        } finally {
            diagnosticBtn.disabled = false;
            diagnosticBtn.textContent = "Отчеты СПАС";
        }
    });
}
