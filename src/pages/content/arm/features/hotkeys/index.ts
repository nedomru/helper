import {copyText, notify} from "@src/utils";

type HelperCommand =
    | "copy-client-agreement"
    | "copy-client-number"
    | "copy-session-ip"
    | "copy-session-mac";

interface HelperCommandMessage {
    action: "helperCommand";
    command: HelperCommand;
}

function isHelperCommandMessage(msg: unknown): msg is HelperCommandMessage {
    return (
        typeof msg === "object" &&
        msg !== null &&
        (msg as {action?: unknown}).action === "helperCommand" &&
        typeof (msg as {command?: unknown}).command === "string"
    );
}

function extractClientAgreement(): string | null {
    const agreementTab = document.getElementById("agr_with_type");
    const value = agreementTab?.getElementsByTagName("b")[0]?.textContent?.trim();
    return value || null;
}

function extractClientNumber(): string | null {
    const phoneElement = document.querySelector<HTMLSpanElement>(".tele_finesse");
    if (!phoneElement) return null;
    const value = phoneElement.getAttribute("value") || phoneElement.innerText.trim();
    return value || null;
}

function extractSessionIp(): string | null {
    const ipElement = document.querySelector<HTMLElement>(".ip acronym");
    const value = ipElement?.innerText.trim();
    return value || null;
}

function extractSessionMac(): string | null {
    const macElement = document.querySelector<HTMLElement>("span.mac");
    const value = macElement?.textContent?.trim();
    return value || null;
}

interface CommandSpec {
    extract: () => string | null;
    label: string;
    success: (value: string) => string;
}

const COMMANDS: Record<HelperCommand, CommandSpec> = {
    "copy-client-agreement": {
        extract: extractClientAgreement,
        label: "📋 Договор",
        success: (v) => `Номер договора скопирован: ${v}`,
    },
    "copy-client-number": {
        extract: extractClientNumber,
        label: "📋 Телефон",
        success: (v) => `Номер телефона скопирован: ${v}`,
    },
    "copy-session-ip": {
        extract: extractSessionIp,
        label: "📋 IP",
        success: (v) => `IP-адрес скопирован: ${v}`,
    },
    "copy-session-mac": {
        extract: extractSessionMac,
        label: "📋 MAC",
        success: (v) => `MAC-адрес скопирован: ${v}`,
    },
};

let listenerAttached = false;

export async function setupHotkeys(): Promise<void> {
    if (listenerAttached) return;
    listenerAttached = true;

    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
        if (!isHelperCommandMessage(message)) return;
        const spec = COMMANDS[message.command];
        if (!spec) {
            sendResponse({handled: false});
            return;
        }
        const value = spec.extract();
        if (!value) {
            sendResponse({handled: false});
            return;
        }
        copyText(value)
            .then(() => notify(spec.label, spec.success(value), "success"))
            .catch(() => notify(spec.label, "Не удалось скопировать", "error"));
        sendResponse({handled: true, value});
    });
}
