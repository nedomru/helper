import {getUserSettings} from "@src/shared/user-settings";
import {foldSpas} from "@pages/content/arm/features/folding/spas";
import {foldTabInfo} from "@pages/content/arm/features/folding/info";
import {foldTabCRequests} from "@pages/content/arm/features/folding/connection_requests";
import {foldTabApplications} from "@pages/content/arm/features/folding/applications";
import {foldTabAppeals} from "@pages/content/arm/features/folding/appeals";
import {foldTabSRequests} from "@pages/content/arm/features/folding/service_requests";

type FoldTabKey =
    | "foldSpas"
    | "foldTabInfo"
    | "foldTabAppeals"
    | "foldTabApplications"
    | "foldTabCRequests"
    | "foldTabSRequests";

const FOLD_HANDLERS: Record<FoldTabKey, () => Promise<void>> = {
    foldSpas,
    foldTabInfo,
    foldTabAppeals,
    foldTabApplications,
    foldTabCRequests,
    foldTabSRequests,
};

/**
 * Gets the list of tabs to fold based on user settings
 */
async function getFoldingTabsList(): Promise<FoldTabKey[]> {
    try {
        const settings = await getUserSettings();
        if (!settings) {
            return [];
        }

        const armSettings = settings.arm as Record<string, unknown> | undefined;
        if (!armSettings) {
            return [];
        }

        const foldingTabs = armSettings.foldingTabs as string[] | undefined;
        if (!Array.isArray(foldingTabs)) {
            return [];
        }

        // Filter to only valid keys
        return foldingTabs.filter((key): key is FoldTabKey =>
            Object.keys(FOLD_HANDLERS).includes(key),
        );
    } catch (error) {
        console.error("[Helper] Error loading folding tabs settings:", error);
        return [];
    }
}

/**
 * Initializes the folding tabs feature
 */
async function initFoldingTabs(): Promise<void> {
    const foldingTabsList = await getFoldingTabsList();

    if (foldingTabsList.length === 0) {
        return; // No tabs to fold
    }

    // Check if already processed
    if (document.body.getAttribute("data-helper-folding-tabs-processed") === "true") {
        return;
    }

    document.body.setAttribute("data-helper-folding-tabs-processed", "true");

    // Execute each fold handler
    for (const tabKey of foldingTabsList) {
        try {
            const handler = FOLD_HANDLERS[tabKey];
            if (handler) {
                await handler();
            }
        } catch (error) {
            console.error(`[Helper] Error folding ${tabKey}:`, error);
        }
    }

    if (foldingTabsList.length > 0) {
        console.log(`[Helper] Processed ${foldingTabsList.length} folding tabs`);
    }
}

/**
 * Main function to fold tabs based on user settings
 */
export async function foldSelectedTabs(): Promise<void> {
    try {
        await initFoldingTabs();
    } catch (error) {
        console.error("[Helper] Error in foldSelectedTabs:", error);
    }
}
