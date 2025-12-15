/**
 * Allows copy any text in ARM.
 *
 * Working by removing element, that places over page.
 */
export function allowCopy() {
    requestAnimationFrame(() => {
        const waiter = document.getElementById("waiter");
        if (!waiter) return;

        const parent = waiter.parentNode as HTMLElement;

        if (parent) {
            parent.removeAttribute("style");
            parent.removeAttribute("onselectstart");
        }

        const formform = document.getElementById("formform");

        [waiter, formform].filter(Boolean).forEach((element) => {
            const stopPropagation = (event: Event) => event.stopPropagation();
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
export function showAgreementOnRequestChange() {
    const headerText = document.querySelector(".text-primary");
    const agreement_num = document.querySelector('input[name="agr_num"]');

    if (headerText && agreement_num) {
        headerText.textContent = `Обращение по договору №${
            (agreement_num as HTMLInputElement).value
        }`;
    }
}

/**
 * Removes all <p> tags from page with "Время формирования" text
 *
 * There is no really useful info in this row, but it should be configurable in settings to show/hide
 */
export function removeGenerationTimes() {
    document.querySelectorAll("p").forEach((p) => {
        if (p.textContent.includes("Время формирования")) {
            p.remove();
        }
    });
}

// @TODO Example, to be completed
export function copyIPAddress() {
    const current_ips = document.getElementsByClassName("ip");

    for (let ip = 0; ip < current_ips.length; ip++) {
        const ipElement = current_ips[ip] as HTMLDivElement;

        const acronymElement = ipElement.querySelector("acronym");
        const ipText = acronymElement?.innerText.trim() || "";

        ipElement.onclick = () => {
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

export function copyMACAddress() {
    const macElements = document.querySelectorAll<HTMLSpanElement>("span.mac");

    macElements.forEach((macElement) => {
        const macText = macElement.textContent?.trim();
        if (!macText) return;

        macElement.style.cursor = "pointer";

        macElement.onclick = (event) => {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();

            navigator.clipboard.writeText(macText).then(() => {
                macElement.style.transition = "color 0.2s ease, background-color 0.2s ease";
                macElement.style.color = "#16a34a";
                macElement.style.backgroundColor = "#dcfce7";

                setTimeout(() => {
                    macElement.style.color = "";
                    macElement.style.backgroundColor = "";
                }, 600);
                console.log("[АРМ - Копирование] Скопировали MAC-адрес из сессии");
            }).catch((err) => {
                console.error(
                    "[АРМ - Копирование] Не удалось скопировать MAC-адрес из сессии",
                    err
                );
            });
        };
    });
}


