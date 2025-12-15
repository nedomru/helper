console.log('background script loaded');

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request.action === "sendClientCard") {
        fetch("https://okc2.ertelecom.ru/yii/api/line-mail-example/send-example-mail", {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            },
            body: `message=${request.payload.message}&lineAppId=3`
        })
            .then(r => r.json())
            .then(data => sendResponse({ok: true, data}))
            .catch(err => sendResponse({ok: false, err}));

        return true
    }
});
