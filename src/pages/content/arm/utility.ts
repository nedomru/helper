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

// * Remove that later, function was implemented on ARM side
// export function changeAppealItem() {
//     const changeEvent = new Event("change", {
//         bubbles: true, cancelable: true,
//     });
//
//     const product = document.querySelector(".uni_reas_prod") as HTMLSelectElement | null;
//
//     if (!product || !(product instanceof HTMLSelectElement)) {
//         return;
//     }
//
//     const values = Array.from(product.options).map((option) => option.value);
//
//     if (values.includes("70")) {
//         product.value = "70";
//         product.dispatchEvent(changeEvent);
//     }
// }


// @TODO Example, to be completed
// export function copyIPAddress() {
//     const current_ips = document.getElementsByClassName("ip")

//     for (let ip = 0; ip < current_ips.length; ip++) {
//         const ipElement = current_ips[ip] as HTMLDivElement;

//         const acronymElement = ipElement.querySelector('acronym');
//         const ipText = acronymElement?.innerText.trim() || '';

//         ipElement.onclick = () => {
//             navigator.clipboard.writeText(ipText).then(() => {
//                 console.log("[АРМ - Копирование] Скопировали IP-адрес из сессии")

//                 if (acronymElement) {
//                     acronymElement.classList.add('ip-copied');

//                     setTimeout(() => {
//                         acronymElement.classList.remove('ip-copied');
//                     }, 800);
//                 }
//             }).catch(err => {
//                 console.error('[АРМ - Копирование]: Не удалось скопировать IP-адрес из сессии', err);
//             });
//         };

//         ipElement.style.cursor = 'pointer';
//     }
// }
