import {notify} from "@src/utils";

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
                    notify("📋 Копирование", `IP-адрес скопирован: ${ipText}`, "success");
                })
                .catch((err) => {
                    console.error(
                        "[АРМ - Копирование]: Не удалось скопировать IP-адрес из сессии",
                        err
                    );
                    notify("📋 Копирование", "Не удалось скопировать IP-адрес", "error");
                });
        };

        ipElement.style.cursor = "pointer";
    }
}
