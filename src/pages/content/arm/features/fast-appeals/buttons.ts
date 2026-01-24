import {
    getQuickAppealsPresetCategories,
    getQuickAppealsPresets,
    type QuickAppealsPreset,
    type QuickAppealsPresetCategory,
} from "@src/shared/user-settings";

const PRODUCT_MAP: Record<number, string> = {
    70: "Интернет",
    101: "Цифровое TV",
    71: "Кабельное TV",
    1451: "Домофония",
    72: "Телефония",
    69: "Без продукта",
};

interface PresetGroup {
    categoryId: string | null;
    categoryName: string;
    presets: QuickAppealsPreset[];
}

/**
 * Quick Appeals Buttons Feature
 */
export default async function quickAppeals() {
    if (document.querySelector(".helper-quick-appeals-container")) return;

    const container = document.querySelector(".create_request_block");
    if (!container) return;

    const availableProductIds = getAvailableProductIds();
    if (availableProductIds.length === 0) {
        console.log("[Helper] No available products found");
        return;
    }

    const allPresets = await getQuickAppealsPresets();
    if (allPresets.length === 0) {
        console.log("[Helper] No presets configured");
        return;
    }

    const relevantPresets = allPresets.filter(
        (p) => p.product === 69 || availableProductIds.includes(p.product),
    );

    if (relevantPresets.length === 0) {
        console.log("[Helper] No presets for available products");
        return;
    }

    const categories = await getQuickAppealsPresetCategories();
    const groupedPresets = groupPresetsByCategory(relevantPresets, categories);
    renderFastAppealsUI(container, groupedPresets);
    injectStyles();
}

function getAvailableProductIds(): number[] {
    const productSelect = document.querySelector<HTMLSelectElement>(".uni_reas_prod");
    if (!productSelect) return [];

    return Array.from(productSelect.options)
        .map((opt) => parseInt(opt.value, 10))
        .filter((id) => !isNaN(id) && PRODUCT_MAP[id]);
}

function groupPresetsByCategory(
    presets: QuickAppealsPreset[],
    categories: QuickAppealsPresetCategory[],
): PresetGroup[] {
    const groups = new Map<string | null, PresetGroup>();

    for (const preset of presets) {
        const categoryId = preset.categoryId || "uncategorized";
        const categoryName = preset.categoryId
            ? categories.find((c) => c.id === preset.categoryId)?.name || preset.categoryId
            : "Без категории";

        if (!groups.has(categoryId)) {
            groups.set(categoryId, {
                categoryId: preset.categoryId || null,
                categoryName,
                presets: [],
            });
        }

        groups.get(categoryId)!.presets.push(preset);
    }

    return Array.from(groups.values());
}

function renderFastAppealsUI(container: Element, groupedPresets: PresetGroup[]) {
    const wrapper = document.createElement("div");
    wrapper.className = "helper-quick-appeals-container";

    const totalPresets = groupedPresets.reduce((sum, g) => sum + g.presets.length, 0);

    wrapper.innerHTML = `
        <div class="helper-fa-header">
            <div class="helper-fa-header-left">
                <span class="helper-fa-icon">⚡</span>
                <span class="helper-fa-title">Быстрые обращения</span>
            </div>
            <div class="helper-fa-header-right">
                <span class="helper-fa-count">${totalPresets} пресетов</span>
            </div>
        </div>
        <div class="helper-fa-toggles"></div>
        <div class="helper-fa-all-presets"></div>
    `;

    const togglesContainer = wrapper.querySelector(".helper-fa-toggles")!;
    const presetsContainer = wrapper.querySelector(".helper-fa-all-presets")!;

    for (const group of groupedPresets) {
        const toggleBtn = document.createElement("button");
        toggleBtn.className = "helper-fa-toggle";
        toggleBtn.innerHTML = `
            <span class="helper-fa-toggle-name">${group.categoryName}</span>
            <span class="helper-fa-toggle-count">${group.presets.length}</span>
        `;

        const presetSection = document.createElement("div");
        presetSection.className = "helper-fa-preset-section";
        presetSection.style.display = "none";

        for (const preset of group.presets) {
            presetSection.appendChild(createPresetButton(preset));
        }

        toggleBtn.addEventListener("click", () => {
            const isOpen = presetSection.style.display !== "none";

            document.querySelectorAll(".helper-fa-preset-section").forEach((s) => {
                (s as HTMLElement).style.display = "none";
            });
            document.querySelectorAll(".helper-fa-toggle").forEach((b) => {
                b.classList.remove("helper-fa-toggle-active");
            });

            if (!isOpen) {
                (presetSection as HTMLElement).style.display = "flex";
                toggleBtn.classList.add("helper-fa-toggle-active");
            }
        });

        togglesContainer.appendChild(toggleBtn);
        presetsContainer.appendChild(presetSection);
    }

    container.insertBefore(wrapper, container.firstChild);
}

function createPresetButton(preset: QuickAppealsPreset): HTMLButtonElement {
    const button = document.createElement("button");
    button.className = "helper-fa-preset-btn";

    let title = `${preset.processingLabel} → ${preset.categoryLabel}`;
    if (preset.subcategoryLabel) title += ` → ${preset.subcategoryLabel}`;
    if (preset.childReasonLabel) title += ` → ${preset.childReasonLabel}`;
    button.title = title;

    const productName = PRODUCT_MAP[preset.product] || "Продукт";

    button.innerHTML = `
        <div class="helper-fa-preset-content">
            <span class="helper-fa-preset-name">${preset.name}</span>
            <span class="helper-fa-preset-path">${productName} → ${preset.processingLabel}</span>
        </div>
        <svg class="helper-fa-preset-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 18l6-6-6-6"/>
        </svg>
    `;

    button.addEventListener("click", () => executePreset(preset));
    return button;
}

/**
 * Set dropdown value only if it needs to change
 * Returns true if value was changed
 */
function setDropdownValue(
    selector: string,
    newValue: string,
    label: string,
): boolean {
    const select = document.querySelector<HTMLSelectElement>(selector);
    if (!select) return false;

    const currentValue = select.value;
    if (currentValue === newValue) {
        console.log(`[Helper] ${label} already set to ${newValue}`);
        return false;
    }

    select.value = newValue;
    select.dispatchEvent(new Event("change", {bubbles: true}));
    console.log(`[Helper] ${label} changed from ${currentValue} to ${newValue}`);
    return true;
}

/**
 * Wait for element and execute callback
 */
function waitForElement<T extends HTMLElement>(
    selector: string,
    callback: (element: T) => void | Promise<void>,
): Promise<void> {
    return new Promise((resolve) => {
        const element = document.querySelector<T>(selector);
        if (element) {
            Promise.resolve(callback(element)).then(() => resolve());
            return;
        }

        const observer = new MutationObserver(() => {
            const el = document.querySelector<T>(selector);
            if (el) {
                observer.disconnect();
                Promise.resolve(callback(el)).then(() => resolve());
            }
        });

        observer.observe(document.body, {childList: true, subtree: true});
    });
}

/**
 * Verify and retry setting textarea value
 */
async function verifyAndSetTextarea(
    selector: string,
    value: string,
    label: string,
    retries = 2,
): Promise<boolean> {
    const textarea = document.querySelector<HTMLTextAreaElement>(selector);
    if (!textarea) return false;

    const setValue = () => {
        textarea.value = value;
        textarea.dispatchEvent(new Event("input", {bubbles: true}));
    };

    for (let attempt = 0; attempt <= retries; attempt++) {
        setValue();

        // Wait and verify
        await new Promise((r) => setTimeout(r, 100));

        if (textarea.value === value) {
            console.log(`[Helper] ${label}${attempt > 0 ? " reapplied" : " set successfully"}`);
            return true;
        }

        if (attempt < retries) {
            console.warn(`[Helper] ${label} verification failed, retrying...`);
        }
    }

    console.error(`[Helper] ${label} failed after ${retries + 1} attempts`);
    return false;
}

/**
 * Execute a preset by setting form values
 */
async function executePreset(preset: QuickAppealsPreset) {
    console.log("[Helper] Executing preset:", preset.name);

    try {
        // Set product
        const productChanged = setDropdownValue(
            ".uni_reas_prod",
            String(preset.product),
            "Product",
        );

        // Wait for category dropdown to reload if product changed (and not 69)
        if (productChanged && preset.product !== 69) {
            console.log("[Helper] Waiting for category dropdown reload...");
            await new Promise((r) => setTimeout(r, 1000));
        }

        // Set step
        setDropdownValue(".uni_reas_step", preset.processing, "Step");

        // Set category
        await waitForElement(".uni_load_obj_reason", async () => {
            setDropdownValue(".uni_load_obj_reason", preset.category, "Category");

            // Set subcategory if needed
            if (preset.subcategory) {
                await waitForElement(".uni_load_main_reason", async () => {
                    setDropdownValue(
                        ".uni_load_main_reason",
                        preset.subcategory!,
                        "Subcategory",
                    );

                    // Set child reason if needed
                    if (preset.childReason) {
                        await waitForElement(".uni_load_child_reason", async () => {
                            setDropdownValue(
                                ".uni_load_child_reason",
                                preset.childReason!,
                                "Child reason",
                            );
                        });
                    }
                });
            }
        });

        // Set comment if exists
        if (preset.comment?.trim()) {
            await waitForElement(".comment_text", async () => {
                await verifyAndSetTextarea(
                    ".comment_text",
                    preset.comment!,
                    "Comment",
                );
            });
        }

        console.log("[Helper] Preset executed successfully");
    } catch (error) {
        console.error("[Helper] Error executing preset:", error);
    }
}

/**
 * Inject custom styles
 */
function injectStyles() {
    if (document.querySelector("#helper-quick-appeals-styles")) return;

    const style = document.createElement("style");
    style.id = "helper-quick-appeals-styles";
    style.textContent = `
        .helper-quick-appeals-container {
            background: linear-gradient(135deg, #000000 0%, #e8d8c0 100%);
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 12px;
            box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
        }

        .helper-fa-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
            padding-bottom: 12px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        }

        .helper-fa-header-left {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .helper-fa-icon {
            font-size: 1em;
            filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
        }

        .helper-fa-title {
            font-size: 1em;
            font-weight: 700;
            color: #ffffff;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .helper-fa-header-right {
            font-size: 1em;
            color: rgba(255, 255, 255, 0.9);
            font-weight: 500;
        }

        .helper-fa-toggles {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            margin-bottom: 12px;
        }

        .helper-fa-toggle {
            background: rgba(255, 255, 255, 0.15);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 20px;
            padding: 6px 14px;
            color: #ffffff;
            cursor: pointer;
            font-size: 1em;
            font-weight: 600;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .helper-fa-toggle:hover {
            background: rgba(255, 255, 255, 0.25);
            transform: translateY(-1px);
        }

        .helper-fa-toggle-active {
            background: rgba(255, 255, 255, 0.9);
            color: #667eea;
            border-color: rgba(255, 255, 255, 0.9);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }

        .helper-fa-toggle-count {
            background: rgba(255, 255, 255, 0.3);
            padding: 2px 6px;
            border-radius: 10px;
            font-size: 1em;
            font-weight: 700;
        }

        .helper-fa-toggle-active .helper-fa-toggle-count {
            background: rgba(102, 126, 234, 0.2);
            color: #667eea;
        }

        .helper-fa-all-presets {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .helper-fa-preset-section {
            display: none;
            flex-direction: column;
            gap: 6px;
            animation: slideDown 0.2s ease;
        }

        .helper-fa-preset-btn {
            width: 100%;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 12px;
            background: rgba(255, 255, 255, 0.95);
            border: none;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s ease;
            text-align: left;
        }

        .helper-fa-preset-btn:hover {
            background: #ffffff;
            transform: translateX(4px);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }

        .helper-fa-preset-btn:active {
            transform: translateX(4px) scale(0.98);
        }

        .helper-fa-preset-content {
            display: flex;
            flex-direction: column;
            gap: 2px;
            flex: 1;
        }

        .helper-fa-preset-name {
            font-size: 1em;
            font-weight: 600;
            color: #2d3748;
        }

        .helper-fa-preset-path {
            font-size: 1em;
            color: #718096;
        }

        .helper-fa-preset-arrow {
            color: #a0aec0;
            transition: transform 0.2s ease;
        }

        .helper-fa-preset-btn:hover .helper-fa-preset-arrow {
            color: #667eea;
            transform: translateX(2px);
        }

        @keyframes slideDown {
            from {
                opacity: 0;
                transform: translateY(-10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        @media (max-width: 600px) {
            .helper-quick-appeals-container {
                padding: 12px;
            }

            .helper-fa-preset-btn {
                padding: 8px 10px;
            }
        }
    `;

    document.head.appendChild(style);
}
