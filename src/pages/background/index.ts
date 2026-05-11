console.log("background script loaded");

import {drainPendingSettings} from "@src/shared/user-settings";
import {handleSendClientCard} from "./handlers/sendClientCard";
import {handleMACLookup} from "./handlers/macLookup";
import {handleGetCookie, handleGetMultipleCookies} from "./handlers/getCookie";
import {handleFetchDiagnosticReports} from "./handlers/fetchDiagnosticReports";
import {handleFetchAppeals} from "./handlers/fetchAppeals";
import {
    createSpeechPhrasesMenu,
    handleSpeechPhraseClick,
    rebuildSpeechPhrasesMenu,
} from "./handlers/speechPhrasesMenu";
import {createExtensionIconMenu, handleExtensionIconClick,} from "./handlers/extensionIconMenu";
import {handleSecurePost} from "./handlers/securePost";

// Handle all messages from content scripts
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    // Send client card action
    if (request.action === "sendClientCard") {
        handleSendClientCard(request)
            .then(result => sendResponse(result))
            .catch(err => sendResponse({ok: false, err: String(err)}));
        return true;
    }

    // MAC lookup action
    if (request.type === "LOOKUP_MAC") {
        handleMACLookup(request)
            .then(result => sendResponse(result))
            .catch(err => sendResponse({ok: false, err: String(err)}));
        return true;
    }

    // Get cookie action
    if (request.action === "getCookie") {
        handleGetCookie(request)
            .then(result => sendResponse({ok: true, data: result}))
            .catch(err => sendResponse({ok: false, err: String(err)}));
        return true;
    }

    // Get multiple cookies action
    if (request.action === "getMultipleCookies") {
        handleGetMultipleCookies(request)
            .then(result => sendResponse({ok: true, data: result}))
            .catch(err => sendResponse({ok: false, err: String(err)}));
        return true;
    }

    // Fetch diagnostic reports action
    if (request.action === "fetchDiagnosticReports") {
        handleFetchDiagnosticReports(request)
            .then(result => sendResponse(result))
            .catch(err => sendResponse({ok: false, err: String(err)}));
        return true;
    }

    // Fetch appeals action
    if (request.action === "fetchAppeals") {
        handleFetchAppeals(request)
            .then(result => sendResponse(result))
            .catch(err => sendResponse({ok: false, err: String(err)}));
        return true;
    }

    // Open speech phrases manager
    if (request.action === "openSpeechPhrasesManager") {
        handleExtensionIconClick()
            .then(() => sendResponse({ok: true}))
            .catch(err => sendResponse({ok: false, err: String(err)}));
        return true;
    }

    // E2E-encrypted POST proxy (heavy crypto stays in the SW realm)
    if (request.action === "securePost") {
        handleSecurePost(request)
            .then(result => sendResponse(result))
            .catch(err => sendResponse({ok: false, status: 0, error: String(err)}));
        return true;
    }
});

// Initialize speech phrases context menu on extension install or startup
chrome.runtime.onInstalled.addListener(async () => {
    await createSpeechPhrasesMenu();
    await createExtensionIconMenu();
});

// Initialize context menu on startup (in case it wasn't created)
chrome.runtime.onStartup.addListener(async () => {
    await createSpeechPhrasesMenu();
    await createExtensionIconMenu();
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId && typeof info.menuItemId === 'string' && info.menuItemId.startsWith('speech-phrase-')) {
        handleSpeechPhraseClick(info, tab).catch(console.error);
    }
    if (info.menuItemId === 'edit-speech-phrases') {
        handleExtensionIconClick().catch(console.error);
    }
});

// Rebuild menu when phrases or categories change
chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && (changes.speechPhrases || changes.speechPhraseCategories)) {
        rebuildSpeechPhrasesMenu().catch(console.error);
    }
});

// Periodic drain of any pending settings updates queued while offline
const SETTINGS_DRAIN_ALARM = "helper-drain-settings";
chrome.runtime.onInstalled.addListener(() => {
    chrome.alarms.create(SETTINGS_DRAIN_ALARM, {periodInMinutes: 5});
});
chrome.runtime.onStartup.addListener(() => {
    chrome.alarms.create(SETTINGS_DRAIN_ALARM, {periodInMinutes: 5});
    drainPendingSettings().catch((err) =>
        console.debug("[Helper] drain on startup failed:", err),
    );
});
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === SETTINGS_DRAIN_ALARM) {
        drainPendingSettings().catch((err) =>
            console.debug("[Helper] drain on alarm failed:", err),
        );
    }
});

// Global keyboard shortcuts (chrome.commands)
chrome.commands.onCommand.addListener(async (command) => {
    if (command === "open-helper-options") {
        chrome.runtime.openOptionsPage();
        return;
    }

    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
    if (!tab?.id) return;

    try {
        await chrome.tabs.sendMessage(tab.id, {action: "helperCommand", command});
    } catch (err) {
        console.debug("[Helper] No content script on active tab for command:", command, err);
    }
});
