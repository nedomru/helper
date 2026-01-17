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
