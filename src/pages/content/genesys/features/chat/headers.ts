/**
 * Automatically collapses chat headers for all Genesys chats
 *
 * Finds all chat case information headers and collapses them by default,
 * reducing UI clutter and maximizing chat area space
 */
export async function autoCollapseChatHeader(): Promise<void> {
    const HEADER_CLASS = "hided-by-helper";

    const collapseHeader = (header: Element): void => {
        if (header.classList.contains(HEADER_CLASS)) return;

        header.setAttribute("aria-expanded", "false");
        header.classList.add(HEADER_CLASS);

        const content = header.nextElementSibling;
        if (content) {
            (content as HTMLElement).style.display = "none";
        }
    };

    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType !== Node.ELEMENT_NODE) continue;
                const element = node as Element;

                if (element.classList.contains("wwe-case-information-header")) {
                    collapseHeader(element);
                }
                element
                    .querySelectorAll(".wwe-case-information-header")
                    .forEach(collapseHeader);
            }
        }
    });

    observer.observe(document.body, {childList: true, subtree: true});

    document.querySelectorAll(".wwe-case-information-header").forEach(collapseHeader);
}
