/**
 * Allows copy any text in ARM.
 *
 * Working by removing element, that places over page.
 */
export function allowCopy(): void {
    requestAnimationFrame((): void => {
        const waiter: HTMLElement | null = document.getElementById("waiter");
        if (!waiter) return;

        const parent = waiter.parentNode as HTMLElement;

        if (parent) {
            parent.removeAttribute("style");
            parent.removeAttribute("onselectstart");
        }

        const form: HTMLElement | null = document.getElementById("formform");

        [waiter, form].filter(Boolean).forEach((element: HTMLElement | null): void => {
            const stopPropagation: (event: Event) => void = (event: Event): void => event.stopPropagation();
            if (element) {
                element.onmousedown = stopPropagation;
                element.onselectstart = stopPropagation;
            }
        });
    });
}

/**
 * Shows client agreement number on request change page.
 *
 * Gets agreement number from agr_num input.
 * There is no other elements containing agreement number on this page.
 */
export function showAgreementOnRequestChange(): void {
    const headerText: HTMLElement | null = document.querySelector(".text-primary");
    const agreement_num: HTMLInputElement | null = document.querySelector('input[name="agr_num"]');

    if (headerText && agreement_num) {
        headerText.textContent = `Обращение по договору №${agreement_num.value}`;
    }
}

/**
 * Removes all <p> tags from page with "Время формирования" text
 *
 * There is no really useful info in this row, but it should be configurable in settings to show/hide
 */
export function removeGenerationTimes(): void {
    document.querySelectorAll("p").forEach((p: HTMLParagraphElement): void => {
        if (p.textContent.includes("Время формирования")) {
            p.remove();
        }
    });
}

/**
 * Adds functionality to copy IP address from client session
 *
 * Finds all available IP address rows and add onclick event
 */
export function copyIPAddress(): void {
    const current_ips: HTMLCollectionOf<Element> = document.getElementsByClassName("ip");

    for (let ip: number = 0; ip < current_ips.length; ip++) {
        const ipElement = current_ips[ip] as HTMLDivElement;

        const acronymElement: HTMLElement | null = ipElement.querySelector("acronym");
        const ipText: string = acronymElement?.innerText.trim() || "";

        ipElement.onclick = (): void => {
            navigator.clipboard
                .writeText(ipText)
                .then(() => {
                    ipElement.style.transition = "color 0.2s ease, background-color 0.2s ease";
                    ipElement.style.color = "#16a34a";
                    ipElement.style.backgroundColor = "#dcfce7";

                    setTimeout(() => {
                        ipElement.style.color = "";
                        ipElement.style.backgroundColor = "";
                    }, 600);
                    console.log("[АРМ - Копирование] Скопировали IP-адрес из сессии");
                })
                .catch((err) => {
                    console.error(
                        "[АРМ - Копирование]: Не удалось скопировать IP-адрес из сессии",
                        err
                    );
                });
        };

        ipElement.style.cursor = "pointer";
    }
}

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


