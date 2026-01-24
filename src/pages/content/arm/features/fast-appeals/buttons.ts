import {
    getQuickAppealsPresetCategories,
    getQuickAppealsPresets,
    type QuickAppealsPreset,
    type QuickAppealsPresetCategory
} from '@src/shared/user-settings';

// Product mapping for ARM system
const PRODUCT_MAP: Record<number, string> = {
    70: 'Интернет',
    101: 'Цифровое TV',
    71: 'Кабельное TV',
    1451: 'Домофония',
    72: 'Телефония',
    69: 'Без продукта',
};

interface PresetGroup {
    categoryId: string | null;
    categoryName: string;
    presets: QuickAppealsPreset[];
}

/**
 * Quick Appeals Buttons Feature
 * Adds quick appeal preset buttons to the left frame
 */
export default async function quickAppeals() {
    // Prevent duplicate initialization
    if (document.querySelector('.helper-quick-appeals-container')) {
        return;
    }

    const container = document.querySelector('.create_request_block');
    if (!container) return;

    // Get available product IDs from the left frame
    const availableProductIds = getAvailableProductIds();
    if (availableProductIds.length === 0) {
        console.log('[Helper] No available products found in left frame');
        return;
    }

    // Get all presets
    const allPresets = await getQuickAppealsPresets();
    if (allPresets.length === 0) {
        console.log('[Helper] No quick appeals presets configured');
        return;
    }

    // Get categories
    const categories = await getQuickAppealsPresetCategories();

    // Filter presets for available products
    // Product 69 (Без продукта) is always shown regardless of frame availability
    const relevantPresets = allPresets.filter(preset =>
        preset.product === 69 || availableProductIds.includes(preset.product)
    );

    if (relevantPresets.length === 0) {
        console.log('[Helper] No presets found for available products');
        return;
    }

    // Group presets by category
    const groupedPresets = groupPresetsByCategory(relevantPresets, categories);

    // Render the UI
    renderFastAppealsUI(container, groupedPresets);
    injectStyles();
}

/**
 * Get available product IDs from the left frame
 */
function getAvailableProductIds(): number[] {
    const productSelect = document.querySelector<HTMLSelectElement>('.uni_reas_prod');
    if (!productSelect) return [];

    return Array.from(productSelect.options)
        .map(option => parseInt(option.value, 10))
        .filter(id => !isNaN(id) && PRODUCT_MAP[id]);
}

/**
 * Group presets by category
 */
function groupPresetsByCategory(presets: QuickAppealsPreset[], categories: QuickAppealsPresetCategory[]): PresetGroup[] {
    const groups = new Map<string | null, PresetGroup>();

    presets.forEach(preset => {
        const categoryId = preset.categoryId || 'uncategorized';
        const categoryName = preset.categoryId
            ? getCategoryName(preset.categoryId, categories)
            : 'Без категории';

        if (!groups.has(categoryId)) {
            groups.set(categoryId, {
                categoryId: preset.categoryId || null,
                categoryName,
                presets: [],
            });
        }

        groups.get(categoryId)!.presets.push(preset);
    });

    return Array.from(groups.values());
}

/**
 * Get category name from categories list
 */
function getCategoryName(categoryId: string, categories: QuickAppealsPresetCategory[]): string {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.name || categoryId;
}

/**
 * Render the Quick Appeals UI
 */
function renderFastAppealsUI(
    container: Element,
    groupedPresets: PresetGroup[],
) {
    const wrapper = document.createElement('div');
    wrapper.className = 'helper-quick-appeals-container';

    // Header
    const header = document.createElement('div');
    header.className = 'helper-fa-header';
    header.innerHTML = `
        <div class="helper-fa-header-left">
            <span class="helper-fa-icon">⚡</span>
            <span class="helper-fa-title">Быстрые обращения</span>
        </div>
        <div class="helper-fa-header-right">
            <span class="helper-fa-count">${groupedPresets.reduce((sum, g) => sum + g.presets.length, 0)} пресетов</span>
        </div>
    `;

    // Category toggles (horizontal row at top)
    const togglesContainer = document.createElement('div');
    togglesContainer.className = 'helper-fa-toggles';

    // Presets container (below toggles)
    const presetsContainer = document.createElement('div');
    presetsContainer.className = 'helper-fa-all-presets';

    groupedPresets.forEach(group => {
        // Create category toggle button
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'helper-fa-toggle';
        toggleBtn.innerHTML = `
            <span class="helper-fa-toggle-name">${group.categoryName}</span>
            <span class="helper-fa-toggle-count">${group.presets.length}</span>
        `;

        // Create presets section for this category
        const presetSection = document.createElement('div');
        presetSection.className = 'helper-fa-preset-section';
        presetSection.style.display = 'none';

        // Add preset buttons to section
        group.presets.forEach(preset => {
            const button = createPresetButton(preset);
            presetSection.appendChild(button);
        });

        // Toggle click handler - open this section, close others
        toggleBtn.addEventListener('click', () => {
            const isOpen = presetSection.style.display !== 'none';

            // Close all sections
            document.querySelectorAll<HTMLDivElement>('.helper-fa-preset-section').forEach(section => {
                section.style.display = 'none';
            });
            document.querySelectorAll<HTMLButtonElement>('.helper-fa-toggle').forEach(btn => {
                btn.classList.remove('helper-fa-toggle-active');
            });

            // Toggle current section
            if (!isOpen) {
                presetSection.style.display = 'flex';
                toggleBtn.classList.add('helper-fa-toggle-active');
            }
        });

        togglesContainer.appendChild(toggleBtn);
        presetsContainer.appendChild(presetSection);
    });

    wrapper.appendChild(header);
    wrapper.appendChild(togglesContainer);
    wrapper.appendChild(presetsContainer);

    container.insertBefore(wrapper, container.firstChild);
}

/**
 * Create a preset button
 */
function createPresetButton(preset: QuickAppealsPreset): HTMLButtonElement {
    const button = document.createElement('button');
    button.className = 'helper-fa-preset-btn';
    let title = `${preset.processingLabel} → ${preset.categoryLabel}`;
    if (preset.subcategoryLabel) {
        title += ` → ${preset.subcategoryLabel}`;
    }
    if (preset.childReasonLabel) {
        title += ` → ${preset.childReasonLabel}`;
    }
    button.title = title;

    const productName = PRODUCT_MAP[preset.product] || 'Продукт';

    button.innerHTML = `
        <div class="helper-fa-preset-content">
            <span class="helper-fa-preset-name">${preset.name}</span>
            <span class="helper-fa-preset-path">${productName} → ${preset.processingLabel}</span>
        </div>
        <svg class="helper-fa-preset-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 18l6-6-6-6"/>
        </svg>
    `;

    button.addEventListener('click', () => executePreset(preset));

    return button;
}

/**
 * Execute a preset by setting form values
 */
async function executePreset(preset: QuickAppealsPreset) {
    console.log('[Helper] Executing preset:', preset.name);

    try {
        // Create change event (like the old implementation)
        const changeEvent = new Event('change', {
            bubbles: true,
            cancelable: true,
        });

        // Set product
        const productSelect = document.querySelector<HTMLSelectElement>('.uni_reas_prod');
        if (productSelect) {
            const productOption = Array.from(productSelect.options).find(
                opt => parseInt(opt.value, 10) === preset.product
            );
            if (productOption) {
                productSelect.value = productOption.value;
                productSelect.dispatchEvent(changeEvent);
                console.log('[Helper] Product set to', preset.product);
            }
        }

        // Wait for DOM update after product change
        await new Promise(resolve => setTimeout(resolve, 100));

        // Set processing group (step)
        const stepSelect = document.querySelector<HTMLSelectElement>('.uni_reas_step');
        if (stepSelect) {
            stepSelect.value = preset.processing;
            stepSelect.dispatchEvent(changeEvent);
            console.log('[Helper] Step set to', preset.processing);
        }

        // Wait for category element to appear, then set it
        await waitForElementAsync('.uni_load_obj_reason', (categorySelect: HTMLSelectElement) => {
            categorySelect.value = preset.category;
            categorySelect.dispatchEvent(changeEvent);
            console.log('[Helper] Category set to', preset.category);
        });

        // Wait for subcategory element to appear, then set it
        if (preset.subcategory) {
            await waitForElementAsync('.uni_load_main_reason', (subcategorySelect: HTMLSelectElement) => {
                subcategorySelect.value = preset.subcategory!;
                subcategorySelect.dispatchEvent(changeEvent);
                console.log('[Helper] Subcategory set to', preset.subcategory);
            });

            // Wait for child reason element to appear, then set it
            if (preset.childReason) {
                await waitForElementAsync('.uni_load_child_reason', (childReasonSelect: HTMLSelectElement) => {
                    childReasonSelect.value = preset.childReason!;
                    childReasonSelect.dispatchEvent(changeEvent);
                    console.log('[Helper] Child reason set to', preset.childReason);
                });
            }
        }

        // Fill comment textarea if comment exists
        if (preset.comment && preset.comment.trim()) {
            await waitForElementAsync('.comment_text', (commentTextarea: HTMLTextAreaElement) => {
                commentTextarea.value = preset.comment!;
                // Trigger input event to ensure any listeners are notified
                const inputEvent = new Event('input', {
                    bubbles: true,
                    cancelable: true,
                });
                commentTextarea.dispatchEvent(inputEvent);
                console.log('[Helper] Comment set to', preset.comment);
            });
        }

        console.log('[Helper] Preset executed successfully');
    } catch (error) {
        console.error('[Helper] Error executing preset:', error);
    }
}

/**
 * Wait for an element to appear in the DOM (async version)
 */
function waitForElementAsync<T extends HTMLElement>(
    selector: string,
    callback: (element: T) => void
): Promise<void> {
    return new Promise((resolve) => {
        const element = document.querySelector<T>(selector);
        if (element) {
            callback(element);
            resolve();
            return;
        }

        const observer = new MutationObserver(() => {
            const el = document.querySelector<T>(selector);
            if (el) {
                observer.disconnect();
                callback(el);
                resolve();
            }
        });

        observer.observe(document.body, {childList: true, subtree: true});
    });
}

/**
 * Inject custom styles
 */
function injectStyles() {
    if (document.querySelector('#helper-quick-appeals-styles')) return;

    const style = document.createElement('style');
    style.id = 'helper-quick-appeals-styles';
    style.textContent = `
        /* Main Container */
        .helper-quick-appeals-container {
            background: linear-gradient(135deg, #000000 0%, #e8d8c0 100%);
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 12px;
            box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
        }

        /* Header */
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

        /* Product Badges */
        .helper-fa-products {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            margin-bottom: 12px;
        }

        .helper-fa-product-badge {
            background: rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(10px);
            color: #ffffff;
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 1em;
            font-weight: 600;
            border: 1px solid rgba(255, 255, 255, 0.3);
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }

        /* Category Toggles (horizontal row at top) */
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

        .helper-fa-toggle-name {
            font-size: 1em;
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

        /* All Presets Container */
        .helper-fa-all-presets {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        /* Preset Section */
        .helper-fa-preset-section {
            display: none;
            flex-direction: column;
            gap: 6px;
            animation: slideDown 0.2s ease;
        }

        /* Presets Container */
        .helper-fa-presets {
            display: none;
            flex-direction: column;
            gap: 4px;
            padding: 0 8px 8px 8px;
        }

        /* Preset Button */
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

        /* Animation */
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

        .helper-fa-presets[style*="flex"] {
            animation: slideDown 0.2s ease;
        }

        /* Responsive */
        @media (max-width: 600px) {
            .helper-quick-appeals-container {
                padding: 12px;
            }

            .helper-fa-title {
                font-size: 1em;
            }

            .helper-fa-preset-btn {
                padding: 8px 10px;
            }
        }
    `;

    document.head.appendChild(style);
}
