console.log("background script loaded");

import {handleSendClientCard} from "./handlers/sendClientCard";
import {handleMACLookup} from "./handlers/macLookup";

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
});
