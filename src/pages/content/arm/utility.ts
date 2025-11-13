export function allowCopy() {
    requestAnimationFrame(() => {
        const waiter = document.getElementById("waiter");
        if (!waiter) return;

        console.debug("[АРМ - Копирование] Найден элемент waiter");
        const parent = waiter.parentNode as HTMLElement;

        if (parent) {
            parent.removeAttribute("style");
            parent.removeAttribute("onselectstart");
            console.debug("[АРМ - Копирование] Удалили аттрибуты style и onselectstart");
        }

        const formform = document.getElementById("formform");

        [waiter, formform].filter(Boolean).forEach(element => {
            const stopPropagation = (event: Event) => event.stopPropagation();
            if (element) {
                element.onmousedown = stopPropagation;
                element.onselectstart = stopPropagation;
                console.debug("[АРМ - Копирование] Убрали ивенты");
            }
        });
    });
}

export function showAgreementOnRequestChange() {
    const headerText = document.querySelector(".text-primary");
    const agreement_num = document.querySelector('input[name="agr_num"]')

    if (headerText && agreement_num) {
        headerText.textContent = `Обращение по договору №${(agreement_num as HTMLInputElement).value}`;
        console.debug("[АРМ - Изменение обращения] Добавлен номер договора");
    }
}