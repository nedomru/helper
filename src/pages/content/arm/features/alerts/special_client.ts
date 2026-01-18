const log = (msg: string) => console.info(`[Хелпер] - [АРМ] - [Особый клиент] ${msg}`);

const isServiceEngineer = (): boolean => {
    const namcl = document.querySelector<HTMLHeadingElement>("#namcl b");
    return namcl?.textContent.trim().toLowerCase() === "сервисный инженер для кц";
};

const showAlert = (msg: string) => {
    alert(`Внимание! ${msg}`);
};

export async function checkSpecialClient(): Promise<void> {
    if (isServiceEngineer()) {
        showAlert("Сервисный инженер!");
        log("Найден сервисный инженер");
        return;
    }

    const check = (el: HTMLElement) => {
        if (el.textContent?.trim().toLowerCase() === "особый клиент") {
            showAlert("Особый клиент!");
            log("Найден особый клиент");
            observer.disconnect();
        }
    };

    const observer = new MutationObserver((mutations) => {
        for (const {addedNodes} of mutations) {
            addedNodes.forEach((node) => {
                if (
                    node.nodeType === Node.ELEMENT_NODE &&
                    (node as HTMLElement).classList.contains("bl_antic_head_w")
                ) {
                    check(node as HTMLElement);
                }
            });
        }
    });

    const existing = document.querySelectorAll<HTMLDivElement>(".bl_antic_head_w");
    if (existing.length) {
        existing.forEach(check);
    } else {
        observer.observe(document.body, {childList: true, subtree: true});
    }

    setTimeout(() => observer.disconnect(), 3000);
}