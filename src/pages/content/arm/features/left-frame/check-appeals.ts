let appealsCheckInitialized = false;

function getAppealsParams(): { agrId: string; ssn: string; userId: string } | null {
    const input = (name: string) => document.querySelector<HTMLInputElement>(`input[name="${name}"]`)?.value;
    const urlParam = (keys: string[]) => keys.map(k => new URLSearchParams(window.location.search).get(k)).find(Boolean);

    const agrId = input("agr_id$i") || urlParam(['agr_id$c', 'agr_id']);
    const ssn = input("ssn$c") || urlParam(['ssn$c', 'ssn']);
    const userId = input("usr$i") || urlParam(['user_id$c', 'user_id', 'usr']);

    return (agrId && ssn && userId) ? {agrId, ssn, userId} : null;
}

async function getOpenAppealsCount(): Promise<number> {
    const params = getAppealsParams();
    if (!params) return 0;

    const url = `https://${window.location.hostname}/cgi-bin/ppo/excells/wcc_new_web_arm.lazy_exec?proc_id%24c=2448&agr_id%24c=${params.agrId}&ssn%24c=${params.ssn}&user_id%24c=${params.userId}`;

    try {
        const response = await fetch(url, {credentials: "include", headers: {"X-Requested-With": "XMLHttpRequest"}});
        if (!response.ok) return 0;

        const html = new TextDecoder("windows-1251").decode(await response.arrayBuffer());
        const doc = new DOMParser().parseFromString(html, "text/html");
        return doc.querySelector("#open")?.querySelectorAll('tr[bgcolor="white"]')?.length ?? 0;
    } catch {
        return 0;
    }
}

function createAppealsInfoBlock(): HTMLElement {
    const container = document.createElement("div");
    container.id = "helper-appeals-info";
    container.className = "td_white";
    container.style.cssText = "padding: 6px 10px; margin-bottom: 8px; border: 1px solid #AAAAAA; border-radius: 4px";

    const contentDiv = document.createElement("div");
    contentDiv.style.cssText = "display: flex; align-items: center; gap: 8px;";

    const icon = document.createElement("span");
    icon.id = "helper-appeals-icon";
    icon.textContent = "⏳";
    icon.style.cssText = "font-size: 1.1em;";

    const textSpan = document.createElement("span");
    textSpan.id = "helper-appeals-count-text";
    textSpan.textContent = "Проверка...";
    textSpan.style.cssText = "flex: 1;";

    const refreshBtn = document.createElement("span");
    Object.assign(refreshBtn, {
        textContent: "↻",
        title: "Проверить снова",
    });
    refreshBtn.style.cssText = "cursor: pointer; font-size: 1.1em; color: #0051A2;";
    refreshBtn.onclick = async () => {
        refreshBtn.style.opacity = "0.5";
        await updateAppealsInfo(container, icon, textSpan);
        refreshBtn.style.opacity = "1";
    };

    contentDiv.appendChild(icon);
    contentDiv.appendChild(textSpan);
    contentDiv.appendChild(refreshBtn);
    container.appendChild(contentDiv);

    return container;
}

async function updateAppealsInfo(
    container: HTMLElement,
    icon: HTMLElement,
    textEl: HTMLElement,
): Promise<void> {
    // Reset to loading state
    container.className = "td_white";
    icon.textContent = "⏳";
    textEl.textContent = "Проверка...";

    try {
        const count = await getOpenAppealsCount();

        if (count === 0) {
            container.className = "td_green";
            icon.textContent = "✅";
            textEl.textContent = "Нет открытых обращений";
        } else {
            container.className = "td_red";
            icon.textContent = "⚠️";
            textEl.textContent = `Открытых обращений: ${count}`;
        }

        console.info(`[Хелпер] - [АРМ] - [Проверка обращений] Найдено: ${count}`);
    } catch (error) {
        container.className = "td_yellow";
        icon.textContent = "❌";
        textEl.textContent = "Ошибка при проверке";
        console.error("[Хелпер] - [АРМ] - [Проверка обращений] Ошибка:", error);
    }
}

export async function setupAppealsCheck(): Promise<void> {
    // Check if already created
    if (document.getElementById("helper-appeals-info")) return;

    // Prevent concurrent runs
    if (appealsCheckInitialized) return;
    appealsCheckInitialized = true;

    const targetContent = document.querySelector("div.uni_reason_cc.ui-accordion-content");
    if (!targetContent) {
        appealsCheckInitialized = false;
        return;
    }

    const infoBlock = createAppealsInfoBlock();

    // Insert at the very beginning of create_request_block (before quick-appeals)
    const createRequestBlock = targetContent.querySelector(".create_request_block");
    if (createRequestBlock) {
        createRequestBlock.insertAdjacentElement("afterbegin", infoBlock);
    } else {
        targetContent.insertAdjacentElement("afterbegin", infoBlock);
    }

    // Initial check
    const icon = infoBlock.querySelector("#helper-appeals-icon") as HTMLElement;
    const textEl = infoBlock.querySelector("#helper-appeals-count-text") as HTMLElement;
    await updateAppealsInfo(infoBlock, icon, textEl);

    console.info("[Хелпер] - [АРМ] - [Проверка обращений] Блок добавлен");
}
