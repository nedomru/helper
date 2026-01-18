export async function removeDiagnosticTabs(): Promise<void> {
    const container = document.getElementById("lazy_content_2507");
    if (!container) return;

    // Check if the tab is currently active (visible)
    function isTabActive(): boolean {
        return (
            container!.style.display !== "none" &&
            !container!.classList.contains("hidden") &&
            container!.offsetParent !== null
        );
    }

    // Process the tab removal only if tab is active
    function processTabRemoval(): void {
        if (!isTabActive()) return;

        if (container!.getAttribute("processed-by-helper")) return;

        try {
            const linksToRemove = [
                'a[href="#dataRecovery"]',
                'a[href="#diagSpas"]',
                'a[href="#diagDeviceIzet"]',
                'a[href="#diagIptv"]',
                'a[href*="novotelecom"][href*="aboncard"]',
            ];

            let totalRemoved = 0;
            linksToRemove.forEach((selector) => {
                const links =
                    container!.querySelectorAll<HTMLAnchorElement>(selector);
                totalRemoved += links.length;
                links.forEach((link) => link.remove());
            });

            // Only mark as processed if we actually found and removed links
            if (totalRemoved > 0) {
                container!.setAttribute("processed-by-helper", "true");
                console.info(
                    "[Хелпер] - [АРМ] - [Диагностика] Удалены ненужные вкладки",
                );
            }
        } catch (error) {
            console.error(`[Хелпер] - [АРМ] - [Диагностика] Ошибка:`, error);
        }
    }

    // Initial check if tab is already active
    if (isTabActive()) {
        processTabRemoval();
    }

    // Observer for tab activation and content changes
    const observer = new MutationObserver((mutations) => {
        let shouldProcess = false;

        for (const mutation of mutations) {
            // Check if the tab itself became visible
            if (mutation.target === container) {
                if (
                    mutation.type === "attributes" &&
                    (mutation.attributeName === "class" ||
                        mutation.attributeName === "style")
                ) {
                    shouldProcess = true;
                    break;
                }
            }

            // Check if tab content changed while tab is active
            if (isTabActive() && mutation.type === "childList") {
                shouldProcess = true;
                break;
            }
        }

        if (shouldProcess) {
            processTabRemoval();
        }
    });

    // Observe the tab for visibility changes and content changes
    observer.observe(container, {
        attributes: true,
        attributeFilter: ["class", "style"],
        childList: true,
        subtree: true,
    });

    // Also observe document body for tab switching
    const bodyObserver = new MutationObserver(() => {
        if (isTabActive()) {
            processTabRemoval();
        }
    });

    bodyObserver.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["class", "style"],
    });
}
