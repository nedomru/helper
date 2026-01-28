interface TabInfo {
    element: HTMLAnchorElement;
    originalDisplay: string;
}

const hiddenTabs = new Map<string, TabInfo>();
let isVisible = false;
let toggleButton: HTMLAnchorElement | null = null;

const SELECTORS = [
    'a[href="#dataRecovery"]',
    'a[href="#diagSpas"]',
    'a[href="#diagDeviceIzet"]',
    'a[href="#diagIptv"]',
    'a[href*="novotelecom"][href*="aboncard"]',
];

function hideTabs(): void {
    hiddenTabs.forEach((tab) => {
        tab.element.style.display = "none";
    });
}

function showTabs(): void {
    hiddenTabs.forEach((tab) => {
        tab.element.style.display = tab.originalDisplay;
    });
}

function toggleTabs(): void {
    if (!toggleButton) return;
    isVisible = !isVisible;

    if (isVisible) {
        showTabs();
        toggleButton.querySelector("svg")?.setAttribute("points", "15 18 9 12 15 6");
        toggleButton.title = "Свернуть";
    } else {
        hideTabs();
        toggleButton.querySelector("svg")?.setAttribute("points", "9 18 15 12 9 6");
        toggleButton.title = "Развернуть";
    }
}

function createToggleBtn(container: HTMLElement): void {
    const tabsNav = container.querySelector<HTMLUListElement>("ul.nav.nav-tabs");
    if (!tabsNav) return;

    const firstTab = tabsNav.querySelector<HTMLLIElement>("li.tabs_new");
    const firstLink = firstTab?.querySelector<HTMLAnchorElement>("a.tabs_pad_mar");

    const li = document.createElement("li");
    li.className = "tabs_new helper-toggle-diagnostic-tab";

    const link = document.createElement("a");
    link.href = "#";
    link.className = "tabs_pad_mar";
    link.style.cssText = "cursor:pointer;display:flex;align-items:center;justify-content:center;gap:4px;color:#333";
    if (firstLink) {
        link.style.height = firstLink.style.height || getComputedStyle(firstLink).height;
        link.style.padding = firstLink.style.padding || getComputedStyle(firstLink).padding;
        link.style.lineHeight = firstLink.style.lineHeight || getComputedStyle(firstLink).lineHeight;
    }
    link.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>`;
    link.title = "Развернуть диагностические вкладки";

    link.addEventListener("click", (e) => {
        e.preventDefault();
        toggleTabs();
    });

    li.addEventListener("mouseenter", () => {
        link.style.backgroundColor = "#f0f0f0";
    });

    li.addEventListener("mouseleave", () => {
        link.style.backgroundColor = "";
    });

    li.appendChild(link);
    toggleButton = link;
    tabsNav.insertBefore(li, tabsNav.firstChild);
}

function processTabs(container: HTMLElement): void {
    if (container.getAttribute("data-processed") === "true") return;
    if (container.style.display === "none" || container.offsetParent === null) return;

    hiddenTabs.clear();
    SELECTORS.forEach((sel) => {
        container.querySelectorAll<HTMLAnchorElement>(sel).forEach((link) => {
            const key = link.getAttribute("href") || sel;
            hiddenTabs.set(key, {
                element: link,
                originalDisplay: link.style.display || "",
            });
            link.style.display = "none";
        });
    });

    if (hiddenTabs.size > 0) {
        container.setAttribute("data-processed", "true");
        createToggleBtn(container);
        console.info(`[Хелпер] Скрыто ${hiddenTabs.size} диагностических вкладок`);
    }
}

export async function hideDiagnosticTabs(): Promise<void> {
    const container = document.getElementById("lazy_content_2507");
    if (!container) return;

    const observer = new MutationObserver(() => processTabs(container));
    observer.observe(container, {
        attributes: true,
        attributeFilter: ["style", "class"],
        childList: true,
        subtree: true,
    });

    processTabs(container);
}
