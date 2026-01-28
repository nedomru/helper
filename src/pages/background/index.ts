console.log("background script loaded");

import {handleSendClientCard} from "./handlers/sendClientCard";
import {handleMACLookup} from "./handlers/macLookup";
import {handleGetCookie, handleGetMultipleCookies} from "./handlers/getCookie";
import {handleFetchDiagnosticReports} from "./handlers/fetchDiagnosticReports";
import {
    createSpeechPhrasesMenu,
    handleSpeechPhraseClick,
    rebuildSpeechPhrasesMenu,
} from "./handlers/speechPhrasesMenu";
import {createExtensionIconMenu, handleExtensionIconClick,} from "./handlers/extensionIconMenu";

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
