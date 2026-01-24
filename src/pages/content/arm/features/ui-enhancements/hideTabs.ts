import {getUserSettings} from "@src/shared/user-settings";

interface TabInfo {
    element: HTMLLIElement;
    textContent: string;
    dataProcId: string;
    originalDisplay: string;
}

const TOGGLE_BUTTON_ID = "helper-toggle-hidden-tabs";
const HIDDEN_TAB_CLASS = "helper-tab-hidden";

const hiddenTabsMap = new Map<string, TabInfo>();
let isHiddenTabsVisible = false;
let toggleButton: HTMLLIElement | null = null;

/**
 * Gets the list of tabs to hide based on user settings
 */
async function getHiddenTabsList(): Promise<string[]> {
    try {
        const settings = await getUserSettings();
        if (!settings) {
            return [];
        }

        const armSettings = settings.arm as Record<string, unknown> | undefined;
        if (!armSettings) {
            return [];
        }

        const hiddenTabs = armSettings.hiddenTabs as string[] | undefined;
        return Array.isArray(hiddenTabs) ? hiddenTabs : [];
    } catch (error) {
        console.error("[Helper] Error loading hidden tabs settings:", error);
        return [];
    }
}

/**
 * Hides tabs based on user settings
 */
function hideTabs(tabList: string[]): void {
    const listItems = document.querySelectorAll<HTMLLIElement>(".tabs_new");

    listItems.forEach((item) => {
        const link = item.querySelector<HTMLAnchorElement>("a.tabs_pad_mar");
        if (!link) return;

        const tabText = link.textContent?.trim();
        if (!tabText) return;

        if (tabList.includes(tabText)) {
            // Store tab info for restoration
            hiddenTabsMap.set(tabText, {
                element: item,
                textContent: tabText,
                dataProcId: link.getAttribute("data-proc-id") || "",
                originalDisplay: item.style.display || "",
            });

            // Mark element as hidden by helper
            item.classList.add(HIDDEN_TAB_CLASS);
            item.style.display = "none";
        }
    });

    if (hiddenTabsMap.size > 0) {
        console.log(`[Helper] Hidden ${hiddenTabsMap.size} tabs`);
    }
}

/**
 * Shows all hidden tabs
 */
function showHiddenTabs(): void {
    hiddenTabsMap.forEach((tabInfo) => {
        tabInfo.element.classList.remove(HIDDEN_TAB_CLASS);
        tabInfo.element.style.display = tabInfo.originalDisplay || "";
    });
}

/**
 * Hides all previously hidden tabs again
 */
function hideTabsAgain(): void {
    hiddenTabsMap.forEach((tabInfo) => {
        tabInfo.element.classList.add(HIDDEN_TAB_CLASS);
        tabInfo.element.style.display = "none";
    });
}

/**
 * Creates the toggle button for showing/hiding hidden tabs
 * Returns an LI element that looks like a tab
 */
function createToggleButton(): HTMLLIElement {
    const li = document.createElement("li");
    li.id = TOGGLE_BUTTON_ID;
    li.className = "tabs_new helper-toggle-tab";

    const link = document.createElement("a");
    link.href = "#";
    link.className = "tabs_pad_mar";
    link.style.cssText = `
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 4px;
        color: #333;
    `;

    link.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
    `;

    link.addEventListener("click", (e) => {
        e.preventDefault();
        toggleHiddenTabs();
    });

    li.appendChild(link);

    // Add hover effect
    li.addEventListener("mouseenter", () => {
        link.style.backgroundColor = "#f0f0f0";
    });

    li.addEventListener("mouseleave", () => {
        link.style.backgroundColor = "";
    });

    return li;
}

/**
 * Toggles the visibility of hidden tabs
 */
function toggleHiddenTabs(): void {
    if (!toggleButton) return;

    isHiddenTabsVisible = !isHiddenTabsVisible;

    const link = toggleButton.querySelector<HTMLAnchorElement>("a");
    if (!link) return;

    if (isHiddenTabsVisible) {
        showHiddenTabs();
        link.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
        `;
        link.title = "Свернуть вкладки";
    } else {
        hideTabsAgain();
        link.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
        `;
        link.title = "Развернуть вкладки";
    }
}

/**
 * Removes the toggle button
 */
function removeToggleButton(): void {
    toggleButton?.remove();
    toggleButton = null;
}

/**
 * Initializes the tab hiding feature
 */
async function initHideTabs(): Promise<void> {
    const hiddenTabsList = await getHiddenTabsList();

    if (hiddenTabsList.length === 0) {
        return; // No tabs to hide
    }

    // Find the tabs navigation
    const tabsNav = document.querySelector<HTMLUListElement>("ul.nav.nav-tabs");
    if (!tabsNav) {
        return;
    }

    // Check if already processed
    if (tabsNav.getAttribute("data-helper-hide-tabs-processed") === "true") {
        return;
    }

    tabsNav.setAttribute("data-helper-hide-tabs-processed", "true");

    // Clear previous state
    hiddenTabsMap.clear();
    isHiddenTabsVisible = false;
    removeToggleButton();

    // Hide the specified tabs
    hideTabs(hiddenTabsList);

    // Only show toggle button if we actually hid something
    if (hiddenTabsMap.size > 0) {
        // Create and insert toggle button as the first tab
        toggleButton = createToggleButton();
        tabsNav.insertBefore(toggleButton, tabsNav.firstChild);
    }
}

/**
 * Main function to hide tabs based on user settings
 */
export async function hideSelectedTabs(): Promise<void> {
    try {
        await initHideTabs();
    } catch (error) {
        console.error("[Helper] Error in hideSelectedTabs:", error);
    }
}

/**
 * Sets up a MutationObserver to watch for tab navigation changes
 */
export function observeTabsNavigation(): void {
    const observer = new MutationObserver(async (mutations) => {
        for (const mutation of mutations) {
            if (mutation.type === "childList") {
                const addedNodes = Array.from(mutation.addedNodes);
                const hasTabsNav = addedNodes.some(
                    (node) =>
                        node instanceof HTMLElement &&
                        (node.classList.contains("nav-tabs") ||
                            node.querySelector?.("ul.nav.nav-tabs"))
                );

                if (hasTabsNav) {
                    // Wait a bit for the DOM to settle
                    setTimeout(() => {
                        initHideTabs();
                    }, 100);
                }
            }
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });
}
