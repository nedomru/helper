/**
 * Removes unnecessary buttons and elements from Genesys UI
 *
 * Uses MutationObserver to wait for buttons to load, then removes them
 */
export async function hideButtons(): Promise<void> {
    const buttonsToRemove = [
        "Facebook In Progress",
        "Facebook Draft",
        "Twitter In Progress",
        "Twitter Draft",
    ];

    const observer = new MutationObserver(() => {
        const triggerButton = document.querySelector('a[aria-label="Facebook In Progress"]');

        if (!triggerButton) return;

        buttonsToRemove.forEach((label) => {
            const button = document.querySelector(`a[aria-label="${label}"]`);
            button?.remove();
        });

        document.querySelector(".dropdown.account-help")?.remove();
        document.querySelector(".rebranding-logo")?.remove();

        observer.disconnect();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });
}