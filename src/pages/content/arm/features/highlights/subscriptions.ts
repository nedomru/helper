export async function showSubscriptionStatus(): Promise<void> {
    const container = document.getElementById("lazy_content_2446");
    if (!container) return;

    function isTabActive() {
        return (
            container!.style.display !== "none" &&
            !container!.classList.contains("hidden") &&
            container!.offsetParent !== null
        );
    }

    function processServiceStatus(container: Element): void {
        if (
            !container ||
            container.hasAttribute("data-helper-processed") ||
            !container.textContent
        ) {
            return;
        }

        const statusText = container.textContent?.trim() || "";
        if (!statusText.includes("Услуга в")) {
            container.setAttribute("data-helper-processed", "true");
            return;
        }

        // Preserve success message
        const successPart = container.querySelector("font")?.outerHTML || "";
        const textParts = container.innerHTML.split("<br>");

        if (textParts.length < 2) {
            container.setAttribute("data-helper-processed", "true");
            return;
        }

        const statusPart = textParts[1];
        const isClosed = statusPart.includes("закрыта");
        const color = isClosed ? "red" : "green";

        container.innerHTML = `${successPart}<br><span style="color: ${color}; font-weight: bold;">Услуга в Домru ${isClosed ? "закрыта" : "активна"}</span>. Проверка у поставщика не требуется.`;
        container.setAttribute("data-helper-processed", "true");
    }

    function process(): void {
        if (!isTabActive()) return;

        const serviceStatuses = document.querySelectorAll(
            '[id^="check_stat_"]:not([data-helper-processed])',
        );

        let highlighted = 0;
        for (const container of serviceStatuses) {
            try {
                processServiceStatus(container);
                highlighted++;
            } catch (error) {
                console.error("[Хелпер] Ошибка подсветки статуса:", error);
                container.setAttribute("data-helper-processed", "true");
            }
        }

        if (highlighted > 0) {
            console.info(`[Хелпер] - [АРМ] - [Подписки] Подсветка: ${highlighted} статусов`);
        }
    }

    if (isTabActive()) process();

    new MutationObserver(() => isTabActive() && process()).observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["class", "style"],
    });
}