/**
 * Adds functionality to copy MAC address from client session
 *
 * Finds all available MAC address rows and replace onclick event
 */
export function copyMACAddress(): void {
    const macElements: NodeListOf<HTMLSpanElement> = document.querySelectorAll("span.mac");

    macElements.forEach((macElement: HTMLSpanElement): void => {
        const macText: string = macElement.textContent?.trim();
        if (!macText) return;

        macElement.style.cursor = "pointer";

        macElement.onclick = (event: PointerEvent): void => {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();

            navigator.clipboard.writeText(macText).then((): void => {
                macElement.style.transition = "color 0.2s ease, background-color 0.2s ease";
                macElement.style.color = "#16a34a";
                macElement.style.backgroundColor = "#dcfce7";

                setTimeout(() => {
                    macElement.style.color = "";
                    macElement.style.backgroundColor = "";
                }, 600);
                console.log("[АРМ - Копирование] Скопировали MAC-адрес из сессии");
            }).catch((err): void => {
                console.error(
                    "[АРМ - Копирование] Не удалось скопировать MAC-адрес из сессии",
                    err
                );
            });
        };
    });
}
