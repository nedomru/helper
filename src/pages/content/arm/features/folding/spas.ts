export async function foldSpas(): Promise<void> {
    const spas = document.getElementById("collapse-top-3");
    if (spas) spas.className = "collapse";

    const cvm = document.getElementById("anticipation_cvm") as HTMLIFrameElement | null;
    if (!cvm || !cvm.contentDocument) return;

    if (cvm.contentDocument?.getElementById("anticipationCvmWiz")) {
        cvm.style.removeProperty("height");
    }
}
