const STYLE_ID = "helper-arm-dark-theme";
const HTML_ATTR = "data-helper-dark-theme";
const SETTINGS_CACHE_KEY = "user_settings_cache";

const DARK_THEME_CSS = `
html[${HTML_ATTR}="on"] {
    background: #1a1a1a !important;
}
html[${HTML_ATTR}="on"] body {
    filter: invert(0.92) hue-rotate(180deg);
    background: #1a1a1a !important;
}
html[${HTML_ATTR}="on"] img,
html[${HTML_ATTR}="on"] picture,
html[${HTML_ATTR}="on"] video,
html[${HTML_ATTR}="on"] iframe,
html[${HTML_ATTR}="on"] embed,
html[${HTML_ATTR}="on"] canvas,
html[${HTML_ATTR}="on"] [style*="background-image"],
html[${HTML_ATTR}="on"] svg image {
    filter: invert(1) hue-rotate(180deg);
}
html[${HTML_ATTR}="on"] .helper-quick-appeals-container,
html[${HTML_ATTR}="on"] .helper-notify,
html[${HTML_ATTR}="on"] [data-helper-no-invert] {
    filter: invert(1) hue-rotate(180deg);
}
`;

async function isDarkThemeEnabled(): Promise<boolean> {
    return new Promise((resolve) => {
        chrome.storage.local.get([SETTINGS_CACHE_KEY], (result) => {
            const cached = result[SETTINGS_CACHE_KEY] as
                | {data?: Record<string, unknown>}
                | undefined;
            const arm = cached?.data?.arm as Record<string, unknown> | undefined;
            resolve(arm?.darkTheme === true);
        });
    });
}

function ensureStyleInjected(): void {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = DARK_THEME_CSS;
    (document.head || document.documentElement).appendChild(style);
}

function setActiveState(enabled: boolean): void {
    ensureStyleInjected();
    if (enabled) {
        document.documentElement.setAttribute(HTML_ATTR, "on");
    } else {
        document.documentElement.removeAttribute(HTML_ATTR);
    }
}

let listenerAttached = false;

function attachStorageListener(): void {
    if (listenerAttached) return;
    listenerAttached = true;
    chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName !== "local" || !changes[SETTINGS_CACHE_KEY]) return;
        const newCache = changes[SETTINGS_CACHE_KEY].newValue as
            | {data?: Record<string, unknown>}
            | undefined;
        const arm = newCache?.data?.arm as Record<string, unknown> | undefined;
        setActiveState(arm?.darkTheme === true);
    });
}

export async function applyDarkTheme(): Promise<void> {
    const enabled = await isDarkThemeEnabled();
    setActiveState(enabled);
    attachStorageListener();
}
