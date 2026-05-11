const STYLE_ID = "helper-arm-dark-theme";
const HTML_ATTR = "data-helper-dark-theme";
const SETTINGS_CACHE_KEY = "user_settings_cache";

const BG_PAGE = "#1e1e1e";
const BG_ELEVATED = "#262626";
const BG_INPUT = "#2a2a2a";
const BG_HOVER = "#333";
const BORDER = "#3a3a3a";
const TEXT = "#d4d4d4";
const TEXT_MUTED = "#9a9a9a";
const LINK = "#6ab0ff";
const LINK_VISITED = "#b39ddb";

const DARK_THEME_CSS = `
html[${HTML_ATTR}="on"],
html[${HTML_ATTR}="on"] body {
    background-color: ${BG_PAGE} !important;
    color: ${TEXT};
    color-scheme: dark;
}

html[${HTML_ATTR}="on"] body {
    color: ${TEXT};
}

html[${HTML_ATTR}="on"] td,
html[${HTML_ATTR}="on"] th,
html[${HTML_ATTR}="on"] div,
html[${HTML_ATTR}="on"] span,
html[${HTML_ATTR}="on"] p,
html[${HTML_ATTR}="on"] li,
html[${HTML_ATTR}="on"] label,
html[${HTML_ATTR}="on"] legend,
html[${HTML_ATTR}="on"] dt,
html[${HTML_ATTR}="on"] dd,
html[${HTML_ATTR}="on"] font {
    color: inherit;
}

html[${HTML_ATTR}="on"] h1,
html[${HTML_ATTR}="on"] h2,
html[${HTML_ATTR}="on"] h3,
html[${HTML_ATTR}="on"] h4,
html[${HTML_ATTR}="on"] h5,
html[${HTML_ATTR}="on"] h6 {
    color: #f0f0f0;
}

html[${HTML_ATTR}="on"] hr {
    border-color: ${BORDER};
    background-color: ${BORDER};
}

html[${HTML_ATTR}="on"] a,
html[${HTML_ATTR}="on"] a:link {
    color: ${LINK};
}
html[${HTML_ATTR}="on"] a:visited {
    color: ${LINK_VISITED};
}
html[${HTML_ATTR}="on"] a:hover {
    color: #8cc4ff;
}

html[${HTML_ATTR}="on"] [bgcolor="white"],
html[${HTML_ATTR}="on"] [bgcolor="#ffffff"],
html[${HTML_ATTR}="on"] [bgcolor="#FFFFFF"],
html[${HTML_ATTR}="on"] [bgcolor="#fff"],
html[${HTML_ATTR}="on"] [bgcolor="#FFF"] {
    background-color: ${BG_ELEVATED} !important;
}
html[${HTML_ATTR}="on"] [bgcolor="#f0f0f0"],
html[${HTML_ATTR}="on"] [bgcolor="#e0e0e0"],
html[${HTML_ATTR}="on"] [bgcolor="#eeeeee"],
html[${HTML_ATTR}="on"] [bgcolor="#cccccc"],
html[${HTML_ATTR}="on"] [bgcolor="silver"],
html[${HTML_ATTR}="on"] [bgcolor="gainsboro"] {
    background-color: ${BG_HOVER} !important;
}

html[${HTML_ATTR}="on"] table,
html[${HTML_ATTR}="on"] tbody,
html[${HTML_ATTR}="on"] thead,
html[${HTML_ATTR}="on"] tfoot,
html[${HTML_ATTR}="on"] tr {
    background-color: transparent !important;
    border-color: ${BORDER};
}
html[${HTML_ATTR}="on"] table {
    border-color: ${BORDER};
}
html[${HTML_ATTR}="on"] td,
html[${HTML_ATTR}="on"] th {
    border-color: ${BORDER};
}
html[${HTML_ATTR}="on"] th {
    background-color: ${BG_ELEVATED};
}
html[${HTML_ATTR}="on"] table.border > tbody > tr:nth-child(even),
html[${HTML_ATTR}="on"] table.table-condensed > tbody > tr:nth-child(even),
html[${HTML_ATTR}="on"] table.table-flag-agr > tbody > tr:nth-child(even) {
    background-color: rgba(255, 255, 255, 0.03) !important;
}

html[${HTML_ATTR}="on"] input,
html[${HTML_ATTR}="on"] textarea,
html[${HTML_ATTR}="on"] select,
html[${HTML_ATTR}="on"] .form-control {
    background-color: ${BG_INPUT} !important;
    background-image: none !important;
    color: ${TEXT} !important;
    border: 1px solid ${BORDER} !important;
    color-scheme: dark;
}
html[${HTML_ATTR}="on"] select option,
html[${HTML_ATTR}="on"] select optgroup {
    background-color: ${BG_INPUT} !important;
    color: ${TEXT} !important;
}
html[${HTML_ATTR}="on"] select option:checked,
html[${HTML_ATTR}="on"] select option:hover {
    background-color: ${BG_HOVER} !important;
    color: #ffffff !important;
}
html[${HTML_ATTR}="on"] input[type="checkbox"],
html[${HTML_ATTR}="on"] input[type="radio"] {
    accent-color: ${LINK};
    background-color: transparent !important;
    border: none !important;
}
html[${HTML_ATTR}="on"] input::placeholder,
html[${HTML_ATTR}="on"] textarea::placeholder {
    color: ${TEXT_MUTED};
}
html[${HTML_ATTR}="on"] button,
html[${HTML_ATTR}="on"] input[type="button"],
html[${HTML_ATTR}="on"] input[type="submit"],
html[${HTML_ATTR}="on"] input[type="reset"] {
    background-color: ${BG_INPUT} !important;
    background-image: none !important;
    color: ${TEXT} !important;
    border: 1px solid ${BORDER} !important;
    color-scheme: dark;
}
html[${HTML_ATTR}="on"] button:hover:not(:disabled),
html[${HTML_ATTR}="on"] input[type="button"]:hover:not(:disabled),
html[${HTML_ATTR}="on"] input[type="submit"]:hover:not(:disabled),
html[${HTML_ATTR}="on"] input[type="reset"]:hover:not(:disabled) {
    background-color: ${BG_HOVER} !important;
    border-color: #4ea0ff !important;
}
html[${HTML_ATTR}="on"] button:disabled,
html[${HTML_ATTR}="on"] input[type="button"]:disabled,
html[${HTML_ATTR}="on"] input[type="submit"]:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

html[${HTML_ATTR}="on"] .nav-tabs {
    border-bottom-color: ${BORDER};
}
html[${HTML_ATTR}="on"] .nav-tabs > li > a {
    color: ${TEXT};
    background-color: transparent;
    border-color: transparent;
}
html[${HTML_ATTR}="on"] .nav-tabs > li > a:hover {
    background-color: ${BG_ELEVATED};
    border-color: ${BORDER};
}
html[${HTML_ATTR}="on"] .nav-tabs > li.active > a,
html[${HTML_ATTR}="on"] .nav-tabs > li.active > a:hover,
html[${HTML_ATTR}="on"] .nav-tabs > li.active > a:focus {
    background-color: ${BG_ELEVATED} !important;
    border-color: ${BORDER} ${BORDER} transparent !important;
    color: #ffffff !important;
}

html[${HTML_ATTR}="on"] .panel,
html[${HTML_ATTR}="on"] .panel-default,
html[${HTML_ATTR}="on"] .panel-body,
html[${HTML_ATTR}="on"] .well {
    background-color: ${BG_ELEVATED};
    border-color: ${BORDER};
    color: ${TEXT};
}
html[${HTML_ATTR}="on"] .panel-heading {
    background-color: ${BG_HOVER};
    border-color: ${BORDER};
    color: ${TEXT};
}

html[${HTML_ATTR}="on"] .btn-default,
html[${HTML_ATTR}="on"] .btn-secondary {
    background-color: ${BG_ELEVATED};
    border-color: ${BORDER};
    color: ${TEXT};
}
html[${HTML_ATTR}="on"] .btn-default:hover,
html[${HTML_ATTR}="on"] .btn-secondary:hover {
    background-color: ${BG_HOVER};
    color: #ffffff;
}

html[${HTML_ATTR}="on"] code,
html[${HTML_ATTR}="on"] pre,
html[${HTML_ATTR}="on"] kbd,
html[${HTML_ATTR}="on"] samp {
    background-color: ${BG_INPUT};
    color: ${TEXT};
    border-color: ${BORDER};
}

html[${HTML_ATTR}="on"] iframe {
    background-color: ${BG_PAGE};
    color-scheme: dark;
}

html[${HTML_ATTR}="on"] [style*="background-color: white"],
html[${HTML_ATTR}="on"] [style*="background-color:#fff"],
html[${HTML_ATTR}="on"] [style*="background-color: #fff"],
html[${HTML_ATTR}="on"] [style*="background-color:#FFF"],
html[${HTML_ATTR}="on"] [style*="background-color: #FFF"],
html[${HTML_ATTR}="on"] [style*="background:#fff"],
html[${HTML_ATTR}="on"] [style*="background: #fff"],
html[${HTML_ATTR}="on"] [style*="background:#FFF"],
html[${HTML_ATTR}="on"] [style*="background: #FFF"],
html[${HTML_ATTR}="on"] [style*="background:white"],
html[${HTML_ATTR}="on"] [style*="background: white"] {
    background-color: ${BG_ELEVATED} !important;
}
html[${HTML_ATTR}="on"] [style*="background-color:#fef"],
html[${HTML_ATTR}="on"] [style*="background-color: #fef"],
html[${HTML_ATTR}="on"] [style*="background-color:#fff"],
html[${HTML_ATTR}="on"] [style*="background-color: #fff"],
html[${HTML_ATTR}="on"] [style*="background-color:#fdf"],
html[${HTML_ATTR}="on"] [style*="background-color: #fdf"],
html[${HTML_ATTR}="on"] [style*="background-color:#faf"],
html[${HTML_ATTR}="on"] [style*="background-color: #faf"],
html[${HTML_ATTR}="on"] [style*="background-color:#f8f"],
html[${HTML_ATTR}="on"] [style*="background-color: #f8f"],
html[${HTML_ATTR}="on"] [style*="background-color:#f5f"],
html[${HTML_ATTR}="on"] [style*="background-color: #f5f"],
html[${HTML_ATTR}="on"] [style*="background-color:#eee"],
html[${HTML_ATTR}="on"] [style*="background-color: #eee"],
html[${HTML_ATTR}="on"] [style*="background-color:#e0e"],
html[${HTML_ATTR}="on"] [style*="background-color: #e0e"],
html[${HTML_ATTR}="on"] [style*="background-color:#ddd"],
html[${HTML_ATTR}="on"] [style*="background-color: #ddd"],
html[${HTML_ATTR}="on"] [style*="background:#fef"],
html[${HTML_ATTR}="on"] [style*="background: #fef"],
html[${HTML_ATTR}="on"] [style*="background:#fdf"],
html[${HTML_ATTR}="on"] [style*="background: #fdf"],
html[${HTML_ATTR}="on"] [style*="background:#faf"],
html[${HTML_ATTR}="on"] [style*="background: #faf"],
html[${HTML_ATTR}="on"] [style*="background:#f8f"],
html[${HTML_ATTR}="on"] [style*="background: #f8f"],
html[${HTML_ATTR}="on"] [style*="background:#f5f"],
html[${HTML_ATTR}="on"] [style*="background: #f5f"],
html[${HTML_ATTR}="on"] [style*="background:#eee"],
html[${HTML_ATTR}="on"] [style*="background: #eee"],
html[${HTML_ATTR}="on"] [style*="background:#ddd"],
html[${HTML_ATTR}="on"] [style*="background: #ddd"],
html[${HTML_ATTR}="on"] [style*="background-color:lightyellow"],
html[${HTML_ATTR}="on"] [style*="background-color: lightyellow"],
html[${HTML_ATTR}="on"] [style*="background-color:lemonchiffon"],
html[${HTML_ATTR}="on"] [style*="background-color: lemonchiffon"],
html[${HTML_ATTR}="on"] [style*="background-color:beige"],
html[${HTML_ATTR}="on"] [style*="background-color: beige"],
html[${HTML_ATTR}="on"] [style*="background-color:cornsilk"],
html[${HTML_ATTR}="on"] [style*="background-color: cornsilk"] {
    background-color: ${BG_HOVER} !important;
}

html[${HTML_ATTR}="on"] font[color="black"],
html[${HTML_ATTR}="on"] font[color="#000"],
html[${HTML_ATTR}="on"] font[color="#000000"],
html[${HTML_ATTR}="on"] [style*="color: black"],
html[${HTML_ATTR}="on"] [style*="color:black"],
html[${HTML_ATTR}="on"] [style*="color: #000"],
html[${HTML_ATTR}="on"] [style*="color:#000"],
html[${HTML_ATTR}="on"] [style*="color: navy"],
html[${HTML_ATTR}="on"] [style*="color:navy"] {
    color: ${TEXT} !important;
}

html[${HTML_ATTR}="on"] .ui-widget-content,
html[${HTML_ATTR}="on"] .ui-dialog,
html[${HTML_ATTR}="on"] .ui-dialog-content {
    background-color: ${BG_ELEVATED} !important;
    color: ${TEXT} !important;
    border-color: ${BORDER} !important;
}
html[${HTML_ATTR}="on"] .ui-widget-header,
html[${HTML_ATTR}="on"] .ui-dialog-titlebar,
html[${HTML_ATTR}="on"] .ui-dialog-buttonpane {
    background: ${BG_HOVER} !important;
    color: ${TEXT} !important;
    border-color: ${BORDER} !important;
}
html[${HTML_ATTR}="on"] .ui-widget-overlay {
    background: rgba(0, 0, 0, 0.6) !important;
    opacity: 1 !important;
}
html[${HTML_ATTR}="on"] .modal-content,
html[${HTML_ATTR}="on"] .modal-header,
html[${HTML_ATTR}="on"] .modal-footer,
html[${HTML_ATTR}="on"] .modal-body {
    background-color: ${BG_ELEVATED} !important;
    color: ${TEXT};
    border-color: ${BORDER} !important;
}
html[${HTML_ATTR}="on"] .modal-backdrop {
    background-color: #000;
}

html[${HTML_ATTR}="on"] .alert {
    border-color: ${BORDER};
}
html[${HTML_ATTR}="on"] .alert-info {
    background-color: #1a2f3d;
    color: #b7e0ff;
    border-color: #2a4a63;
}
html[${HTML_ATTR}="on"] .alert-warning {
    background-color: #3d2f15;
    color: #ffd99a;
    border-color: #634a2a;
}
html[${HTML_ATTR}="on"] .alert-success {
    background-color: #1a3d2a;
    color: #a8e0b8;
    border-color: #2a634a;
}
html[${HTML_ATTR}="on"] .alert-danger {
    background-color: #3d1a1a;
    color: #ffb0b0;
    border-color: #632a2a;
}

html[${HTML_ATTR}="on"] .helper-quick-appeals-container {
    background-color: ${BG_ELEVATED} !important;
    border-color: ${BORDER} !important;
    color: ${TEXT};
}
html[${HTML_ATTR}="on"] .helper-fa-toggle {
    background-color: ${BG_INPUT} !important;
    border-color: ${BORDER} !important;
    color: ${TEXT} !important;
}
html[${HTML_ATTR}="on"] .helper-fa-toggle:hover {
    border-color: #4ea84e !important;
}
html[${HTML_ATTR}="on"] .helper-fa-toggle-active {
    background-color: #1a3d2a !important;
    color: #a8e0b8 !important;
    border-color: #4ea84e !important;
}
html[${HTML_ATTR}="on"] .helper-fa-toggle-count {
    background-color: ${BG_HOVER} !important;
    color: ${TEXT} !important;
}
html[${HTML_ATTR}="on"] .helper-fa-toggle-active .helper-fa-toggle-count {
    background-color: #4ea84e !important;
    color: #ffffff !important;
}
html[${HTML_ATTR}="on"] .helper-fa-preset-section {
    background-color: ${BG_PAGE} !important;
    border-color: ${BORDER} !important;
}
html[${HTML_ATTR}="on"] .helper-fa-preset-btn {
    background-color: ${BG_INPUT} !important;
    border-color: ${BORDER} !important;
    color: ${TEXT} !important;
}
html[${HTML_ATTR}="on"] .helper-fa-preset-btn:hover {
    border-color: #4ea84e !important;
}
html[${HTML_ATTR}="on"] .helper-fa-preset-btn:active,
html[${HTML_ATTR}="on"] .helper-fa-preset-btn.helper-fa-preset-clicked {
    background-color: #1a3d2a !important;
    border-color: #4ea84e !important;
    color: #a8e0b8 !important;
}
html[${HTML_ATTR}="on"] .helper-fa-preset-name {
    color: ${TEXT} !important;
}
html[${HTML_ATTR}="on"] .helper-fa-preset-path {
    color: ${TEXT_MUTED} !important;
}

html[${HTML_ATTR}="on"] #helper-notes-panel {
    background-color: ${BG_ELEVATED} !important;
    border-color: ${BORDER} !important;
    color: ${TEXT} !important;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5) !important;
}
html[${HTML_ATTR}="on"] #helper-notes-panel .helper-notes-header {
    border-bottom-color: ${BORDER} !important;
}
html[${HTML_ATTR}="on"] #helper-notes-panel .helper-notes-form {
    border-top-color: ${BORDER} !important;
}
html[${HTML_ATTR}="on"] #helper-notes-panel .helper-notes-empty {
    color: ${TEXT_MUTED} !important;
}
html[${HTML_ATTR}="on"] #helper-notes-panel .helper-note {
    background-color: #2d2818 !important;
    border-color: #4a4022 !important;
    color: #fef3c7 !important;
}
html[${HTML_ATTR}="on"] #helper-notes-panel .helper-note-meta {
    color: #d29a4a !important;
}
html[${HTML_ATTR}="on"] #helper-notes-panel .helper-note-author {
    color: ${LINK} !important;
}
html[${HTML_ATTR}="on"] #helper-notes-panel .helper-note-delete {
    color: #f87171 !important;
}
html[${HTML_ATTR}="on"] #helper-notes-panel textarea {
    background-color: ${BG_INPUT} !important;
    border-color: ${BORDER} !important;
    color: ${TEXT} !important;
}
html[${HTML_ATTR}="on"] #helper-notes-panel button.helper-notes-btn-secondary {
    background-color: ${BG_HOVER} !important;
    color: ${TEXT} !important;
}
html[${HTML_ATTR}="on"] #helper-notes-panel button.helper-notes-btn-secondary:hover {
    background-color: #444 !important;
}
html[${HTML_ATTR}="on"] #helper-notes-panel .helper-notes-close {
    color: ${TEXT_MUTED} !important;
}

html[${HTML_ATTR}="on"] #helper-bulk-actions-toolbar {
    background-color: ${BG_ELEVATED} !important;
    border-color: ${BORDER} !important;
    color: ${TEXT} !important;
}
html[${HTML_ATTR}="on"] #helper-bulk-actions-toolbar .helper-bulk-count {
    color: ${TEXT} !important;
}
html[${HTML_ATTR}="on"] #helper-bulk-actions-toolbar button {
    background-color: ${BG_INPUT} !important;
    border-color: ${BORDER} !important;
    color: ${TEXT} !important;
}
html[${HTML_ATTR}="on"] #helper-bulk-actions-toolbar button:hover {
    background-color: ${BG_HOVER} !important;
    border-color: #4ea0ff !important;
}

html[${HTML_ATTR}="on"] .ui-widget,
html[${HTML_ATTR}="on"] .ui-widget-content {
    color: ${TEXT};
}
html[${HTML_ATTR}="on"] .ui-state-default,
html[${HTML_ATTR}="on"] .ui-widget-content .ui-state-default,
html[${HTML_ATTR}="on"] .ui-widget-header .ui-state-default {
    background: ${BG_INPUT} !important;
    background-image: none !important;
    border-color: ${BORDER} !important;
    color: ${TEXT} !important;
}
html[${HTML_ATTR}="on"] .ui-state-hover,
html[${HTML_ATTR}="on"] .ui-widget-content .ui-state-hover,
html[${HTML_ATTR}="on"] .ui-widget-header .ui-state-hover,
html[${HTML_ATTR}="on"] .ui-state-focus,
html[${HTML_ATTR}="on"] .ui-widget-content .ui-state-focus,
html[${HTML_ATTR}="on"] .ui-widget-header .ui-state-focus {
    background: ${BG_HOVER} !important;
    background-image: none !important;
    border-color: #4ea0ff !important;
    color: ${TEXT} !important;
}
html[${HTML_ATTR}="on"] .ui-state-active,
html[${HTML_ATTR}="on"] .ui-widget-content .ui-state-active,
html[${HTML_ATTR}="on"] .ui-widget-header .ui-state-active {
    background: ${BG_HOVER} !important;
    background-image: none !important;
    border-color: #4ea0ff !important;
    color: ${TEXT} !important;
}
html[${HTML_ATTR}="on"] .ui-state-highlight,
html[${HTML_ATTR}="on"] .ui-widget-content .ui-state-highlight,
html[${HTML_ATTR}="on"] .ui-widget-header .ui-state-highlight {
    background: #3d3415 !important;
    background-image: none !important;
    border-color: #634a2a !important;
    color: #ffd99a !important;
}
html[${HTML_ATTR}="on"] .ui-state-error,
html[${HTML_ATTR}="on"] .ui-widget-content .ui-state-error,
html[${HTML_ATTR}="on"] .ui-widget-header .ui-state-error {
    background: #3d1a1a !important;
    background-image: none !important;
    border-color: #632a2a !important;
    color: #ffb0b0 !important;
}
html[${HTML_ATTR}="on"] .ui-accordion-header {
    color: ${TEXT} !important;
}
html[${HTML_ATTR}="on"] .ui-accordion-header a,
html[${HTML_ATTR}="on"] .ui-accordion-header a:link {
    color: ${TEXT} !important;
}
html[${HTML_ATTR}="on"] .ui-icon {
    filter: invert(0.85) hue-rotate(180deg);
}

html[${HTML_ATTR}="on"] [style*="color: indigo"],
html[${HTML_ATTR}="on"] [style*="color:indigo"] {
    color: #b39ddb !important;
}
html[${HTML_ATTR}="on"] [style*="color: #3070B0"],
html[${HTML_ATTR}="on"] [style*="color:#3070B0"],
html[${HTML_ATTR}="on"] [style*="color: #0051A2"],
html[${HTML_ATTR}="on"] [style*="color:#0051A2"],
html[${HTML_ATTR}="on"] [style*="color: rgb(0, 81, 162)"],
html[${HTML_ATTR}="on"] [style*="color:rgb(0,81,162)"],
html[${HTML_ATTR}="on"] [style*="color: rgb(48, 112, 176)"],
html[${HTML_ATTR}="on"] [style*="color:rgb(48,112,176)"] {
    color: ${LINK} !important;
}

html[${HTML_ATTR}="on"] .td_green {
    background-color: #1a3d2a !important;
    color: #a8e0b8 !important;
}
html[${HTML_ATTR}="on"] .td_red {
    background-color: #3d1a1a !important;
    color: #ffb0b0 !important;
}
html[${HTML_ATTR}="on"] .td_font_red {
    color: #ff8a8a !important;
}
html[${HTML_ATTR}="on"] .td_font_green {
    color: #8ae0a0 !important;
}
html[${HTML_ATTR}="on"] .td_yellow {
    background-color: #3d2f15 !important;
    color: #ffd99a !important;
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
