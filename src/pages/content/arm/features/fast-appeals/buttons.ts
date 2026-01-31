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
    1762: "Видеоконтроль",
    69: "Без продукта",
};

interface PresetGroup {
    categoryId: string | null;
    categoryName: string;
    presets: QuickAppealsPreset[];
}

let quickAppealsInitialized = false;

/**
 * Quick Appeals Buttons Feature
 */
export default async function quickAppeals() {
    if (quickAppealsInitialized) return;
    quickAppealsInitialized = true;

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

    // Sort categories by order
    const sortedCategories = [...categories].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    for (const preset of presets) {
        const categoryId = preset.categoryId || "uncategorized";
        const categoryName = preset.categoryId
            ? sortedCategories.find((c) => c.id === preset.categoryId)?.name || preset.categoryId
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

    // Return groups in the order of sorted categories
    const result: PresetGroup[] = [];
    for (const category of sortedCategories) {
        const key = category.id;
        if (groups.has(key)) {
            result.push(groups.get(key)!);
        }
    }
    // Add uncategorized at the end if it exists
    if (groups.has("uncategorized")) {
        result.push(groups.get("uncategorized")!);
    }

    return result;
}

function renderFastAppealsUI(container: Element, groupedPresets: PresetGroup[]) {
    const wrapper = document.createElement("div");
    wrapper.className = "helper-quick-appeals-container";

    wrapper.innerHTML = `
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
                togglesContainer.classList.add("helper-fa-has-expanded");
            } else {
                togglesContainer.classList.remove("helper-fa-has-expanded");
            }
        });

        togglesContainer.appendChild(toggleBtn);
        presetsContainer.appendChild(presetSection);
    }

    // Insert after helper-appeals-info if it exists, otherwise at the beginning
    const appealsInfo = container.querySelector("#helper-appeals-info");
    if (appealsInfo) {
        appealsInfo.insertAdjacentElement("afterend", wrapper);
    } else {
        container.insertBefore(wrapper, container.firstChild);
    }
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

    button.addEventListener("mousedown", () => {
        button.classList.add("helper-fa-preset-clicked");
    });

    button.addEventListener("mouseup", () => {
        button.classList.remove("helper-fa-preset-clicked");
    });

    button.addEventListener("mouseleave", () => {
        button.classList.remove("helper-fa-preset-clicked");
    });

    button.addEventListener("click", async () => {
        await executePreset(preset);
    });
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
    dispatchEvent = true,
): boolean {
    const select = document.querySelector<HTMLSelectElement>(selector);
    if (!select) return false;

    const currentValue = select.value;
    if (currentValue === newValue) {
        console.log(`[Helper] ${label} already set to ${newValue}`);
        return false;
    }

    select.value = newValue;
    if (dispatchEvent) {
        select.dispatchEvent(new Event("change", {bubbles: true}));
    }
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
 * Execute a preset by setting form values
 */
async function executePreset(preset: QuickAppealsPreset) {
    console.log("[Helper] Executing preset:", preset.name);

    try {
        // Set product (skip if 69 - means "no product", don't touch the dropdown)
        const productChanged = preset.product !== 69 && setDropdownValue(
            ".uni_reas_prod",
            String(preset.product),
            "Product",
        );

        // Wait for category dropdown to reload if product changed (and not 69)
        if (productChanged) {
            console.log("[Helper] Waiting for category dropdown reload...");
            await new Promise((r) => setTimeout(r, 1000));
        }

        // Set step
        setDropdownValue(".uni_reas_step", preset.processing, "Step", true);

        // Set category
        await waitForElement(".uni_load_obj_reason", async () => {
            setDropdownValue(".uni_load_obj_reason", preset.category, "Category", true);

            // Set subcategory if needed
            if (preset.subcategory) {
                await waitForElement(".uni_load_main_reason", async () => {
                    setDropdownValue(
                        ".uni_load_main_reason",
                        preset.subcategory!,
                        "Subcategory",
                        true,
                    );

                    // Set child reason if needed
                    if (preset.childReason) {
                        await waitForElement(".uni_load_child_reason", async () => {
                            setDropdownValue(
                                ".uni_load_child_reason",
                                preset.childReason!,
                                "Child reason",
                                false,
                            );
                        });
                    }
                });
            }
        });

        // Set comment if exists
        if (preset.comment?.trim()) {
            await waitForElement<HTMLTextAreaElement>(".comment_text", (substep) => {
                substep.value = preset.comment!;
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
            background: #f5f5f5;
            border: 1px solid #666666;
            border-radius: 4px;
            padding: 8px;
            margin-bottom: 12px;
            font-family: Arial, sans-serif;
            font-size: 8pt;
        }

        .helper-fa-toggles {
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
            margin-bottom: 0;
        }

        .helper-fa-toggles.helper-fa-has-expanded {
            margin-bottom: 8px;
        }

        .helper-fa-toggle {
            background: #ffffff;
            border: 1px solid #cccccc;
            border-radius: 4px;
            padding: 4px 10px;
            color: #000000;
            cursor: pointer;
            font-size: 8pt;
            font-weight: normal;
            display: flex;
            align-items: center;
            gap: 4px;
        }

        .helper-fa-toggle:hover {
            border: 1px solid #339900;
        }

        .helper-fa-toggle-active {
            background: #CCFFCC;
            color: #000000;
            border: 1px solid #339900;
            font-weight: bold;
        }

        .helper-fa-toggle-count {
            background: #eeeeee;
            padding: 1px 5px;
            border-radius: 3px;
            font-size: 7pt;
            font-weight: bold;
            color: #000000;
        }

        .helper-fa-toggle-active .helper-fa-toggle-count {
            background: #339900;
            color: #ffffff;
        }

        .helper-fa-all-presets {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .helper-fa-preset-section {
            display: none;
            flex-direction: column;
            gap: 4px;
            background: #ffffff;
            border: 1px solid #aaaaaa;
            border-radius: 4px;
            padding: 4px;
        }

        .helper-fa-preset-btn {
            width: 100%;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 6px 8px;
            background: #ffffff;
            border: 1px solid #cccccc;
            border-radius: 4px;
            cursor: pointer;
            text-align: left;
            font-family: Arial, sans-serif;
            font-size: 8pt;
        }

        .helper-fa-preset-btn:hover {
            border: 1px solid #339900;
        }

        .helper-fa-preset-btn:active,
        .helper-fa-preset-btn.helper-fa-preset-clicked {
            background: #CCFFCC;
            border: 1px solid #339900;
            font-weight: bold;
        }

        .helper-fa-preset-content {
            display: flex;
            flex-direction: column;
            gap: 2px;
            flex: 1;
        }

        .helper-fa-preset-name {
            font-size: 8pt;
            font-weight: bold;
            color: #000000;
        }

        .helper-fa-preset-path {
            font-size: 7pt;
            color: #666666;
        }

        .helper-fa-preset-arrow {
            color: #888888;
            flex-shrink: 0;
        }

        .helper-fa-preset-btn:hover .helper-fa-preset-arrow {
            color: #F6921E;
        }

        @media (max-width: 600px) {
            .helper-quick-appeals-container {
                padding: 6px;
            }

            .helper-fa-preset-btn {
                padding: 5px 6px;
            }
        }
    `;

    document.head.appendChild(style);
}
