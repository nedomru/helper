/**
 * Removes all <p> tags from page with "Время формирования" text
 *
 * There is no really useful info in this row, but it should be configurable in settings to show/hide
 */
export async function removeGenerationTimes(): Promise<void> {
    document.querySelectorAll("p").forEach((p: HTMLParagraphElement): void => {
        if (p.textContent.includes("Время формирования")) {
            p.remove();
        }
    });
}
