import {
    getServiceRequestPresetCategories,
    getServiceRequestPresets,
    saveServiceRequestPresetCategories,
    saveServiceRequestPresets,
    type ServiceRequestPreset,
    type ServiceRequestPresetCategory,
    type ServiceRequestReasonStep,
} from "@src/shared/user-settings";

const PRODUCT_MAP: Record<number, string> = {
    5: "Интернет",
    7: "КТВ",
    53: "Дом.ru TV",
    101: "Цифровое TV",
    71: "Кабельное TV",
    12: "Кабельное телевидение",
};

interface PresetGroup {
    categoryId: string | null;
    categoryName: string;
    presets: ServiceRequestPreset[];
}

let quickServiceRequestsInitialized = false;

export default async function quickServiceRequests() {
    if (quickServiceRequestsInitialized) return;
    quickServiceRequestsInitialized = true;

    const accordionContent = await waitForSelector<HTMLElement>(
        "div.req_sz.ui-accordion-content",
        5000,
    );
    if (!accordionContent) return;

    if (accordionContent.querySelector(".helper-fsr-container")) return;

    await render(accordionContent);
}

async function render(accordionContent: HTMLElement) {
    const allPresets = await getServiceRequestPresets();
    const categories = await getServiceRequestPresetCategories();

    const wrapper = document.createElement("div");
    wrapper.className = "helper-quick-appeals-container helper-fsr-container";
    wrapper.innerHTML = `
        <div class="helper-fa-toggles helper-fsr-toggles"></div>
        <div class="helper-fa-all-presets helper-fsr-all-presets"></div>
        <div class="helper-fsr-actions" style="display:flex;gap:4px;margin-top:6px;">
            <button class="helper-fsr-capture-btn" type="button">💾 Сохранить как пресет</button>
            <button class="helper-fsr-refresh-btn" type="button" title="Обновить список">↻</button>
        </div>
    `;

    const togglesContainer = wrapper.querySelector<HTMLElement>(".helper-fsr-toggles")!;
    const presetsContainer = wrapper.querySelector<HTMLElement>(".helper-fsr-all-presets")!;
    const captureBtn = wrapper.querySelector<HTMLButtonElement>(".helper-fsr-capture-btn")!;
    const refreshBtn = wrapper.querySelector<HTMLButtonElement>(".helper-fsr-refresh-btn")!;

    const availableProductIds = getAvailableProductIds();
    const relevantPresets = availableProductIds.length
        ? allPresets.filter((p) => availableProductIds.includes(p.product))
        : allPresets;

    const groups = groupPresetsByCategory(relevantPresets, categories);
    renderGroups(togglesContainer, presetsContainer, groups);

    captureBtn.addEventListener("click", async () => {
        await captureCurrentState();
    });

    refreshBtn.addEventListener("click", async () => {
        quickServiceRequestsInitialized = false;
        wrapper.remove();
        await quickServiceRequests();
    });

    accordionContent.insertBefore(wrapper, accordionContent.firstChild);
}

function getAvailableProductIds(): number[] {
    const select = document.querySelector<HTMLSelectElement>("#proc_id");
    if (!select) return [];
    return Array.from(select.options)
        .map((o) => parseInt(o.value, 10))
        .filter((id) => !isNaN(id) && id > 0);
}

function groupPresetsByCategory(
    presets: ServiceRequestPreset[],
    categories: ServiceRequestPresetCategory[],
): PresetGroup[] {
    const sortedCategories = [...categories].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const groups = new Map<string | null, PresetGroup>();

    for (const preset of presets) {
        const key = preset.categoryId || "uncategorized";
        const name = preset.categoryId
            ? sortedCategories.find((c) => c.id === preset.categoryId)?.name || preset.categoryId
            : "Без категории";
        if (!groups.has(key)) {
            groups.set(key, {categoryId: preset.categoryId || null, categoryName: name, presets: []});
        }
        groups.get(key)!.presets.push(preset);
    }

    const result: PresetGroup[] = [];
    for (const cat of sortedCategories) {
        if (groups.has(cat.id)) result.push(groups.get(cat.id)!);
    }
    if (groups.has("uncategorized")) result.push(groups.get("uncategorized")!);
    return result;
}

function renderGroups(
    togglesContainer: HTMLElement,
    presetsContainer: HTMLElement,
    groups: PresetGroup[],
) {
    togglesContainer.innerHTML = "";
    presetsContainer.innerHTML = "";

    if (groups.length === 0) {
        const empty = document.createElement("div");
        empty.style.cssText = "padding:6px 4px;color:#666;font-size:8pt;";
        empty.textContent = "Пресетов пока нет. Заполни форму и нажми 💾.";
        presetsContainer.appendChild(empty);
        return;
    }

    for (const group of groups) {
        const toggleBtn = document.createElement("button");
        toggleBtn.type = "button";
        toggleBtn.className = "helper-fa-toggle";
        toggleBtn.innerHTML = `
            <span class="helper-fa-toggle-name">${escapeHtml(group.categoryName)}</span>
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
            presetsContainer
                .querySelectorAll<HTMLElement>(".helper-fa-preset-section")
                .forEach((s) => (s.style.display = "none"));
            togglesContainer
                .querySelectorAll(".helper-fa-toggle")
                .forEach((b) => b.classList.remove("helper-fa-toggle-active"));
            if (!isOpen) {
                presetSection.style.display = "flex";
                toggleBtn.classList.add("helper-fa-toggle-active");
                togglesContainer.classList.add("helper-fa-has-expanded");
            } else {
                togglesContainer.classList.remove("helper-fa-has-expanded");
            }
        });

        togglesContainer.appendChild(toggleBtn);
        presetsContainer.appendChild(presetSection);
    }
}

function createPresetButton(preset: ServiceRequestPreset): HTMLButtonElement {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "helper-fa-preset-btn";

    const chain = preset.reasonChain.map((s) => s.label).join(" → ");
    button.title = chain || preset.name;

    const productName = preset.productLabel || PRODUCT_MAP[preset.product] || "Продукт";

    button.innerHTML = `
        <div class="helper-fa-preset-content">
            <span class="helper-fa-preset-name">${escapeHtml(preset.name)}</span>
            <span class="helper-fa-preset-path">${escapeHtml(productName)}${chain ? " → " + escapeHtml(chain) : ""}</span>
        </div>
        <svg class="helper-fa-preset-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 18l6-6-6-6"/>
        </svg>
    `;

    button.addEventListener("mousedown", () => button.classList.add("helper-fa-preset-clicked"));
    button.addEventListener("mouseup", () => button.classList.remove("helper-fa-preset-clicked"));
    button.addEventListener("mouseleave", () => button.classList.remove("helper-fa-preset-clicked"));

    button.addEventListener("click", async () => {
        await applyPreset(preset);
    });
    return button;
}

async function applyPreset(preset: ServiceRequestPreset) {
    console.log("[Helper] Применение пресета СЗ:", preset.name);
    try {
        expandSzPanel();

        const proc = document.querySelector<HTMLSelectElement>("#proc_id");
        if (!proc) {
            console.warn("[Helper] #proc_id не найден");
            return;
        }
        setSelect(proc, String(preset.product), "Продукт");

        for (const step of preset.reasonChain) {
            const sel = await waitForSelector<HTMLSelectElement>(
                `#service-appeal-class-${step.level}`,
                4000,
            );
            if (!sel) {
                console.warn(`[Helper] Не дождались #service-appeal-class-${step.level}`);
                break;
            }
            setSelect(sel, step.value, `Причина класс-${step.level}`);
        }

        if (preset.step) {
            const stepSel = await waitForSelector<HTMLSelectElement>("#req_step", 3000);
            if (stepSel) setSelect(stepSel, preset.step, "Обработка");
        }

        if (preset.technology) {
            const techSel = await waitForSelector<HTMLSelectElement>("#technology_id", 2000);
            if (techSel) setSelect(techSel, preset.technology, "Технология");
        }

        if (preset.comment && preset.comment.trim()) {
            const com = await waitForSelector<HTMLTextAreaElement>("#com_ser", 2000);
            if (com) com.value = preset.comment;
        }

        console.log("[Helper] Пресет СЗ применён");
    } catch (e) {
        console.error("[Helper] Ошибка применения пресета СЗ:", e);
    }
}

async function captureCurrentState() {
    expandSzPanel();

    const proc = document.querySelector<HTMLSelectElement>("#proc_id");
    if (!proc || !proc.value || proc.value === "0") {
        alert("Сначала выбери продукт в форме сервисной заявки.");
        return;
    }
    const productValue = parseInt(proc.value, 10);
    const productLabel = proc.options[proc.selectedIndex]?.text?.trim() || PRODUCT_MAP[productValue] || "Продукт";

    const reasonChain: ServiceRequestReasonStep[] = [];
    for (let level = 1; level <= 6; level++) {
        const sel = document.querySelector<HTMLSelectElement>(`#service-appeal-class-${level}`);
        if (!sel) break;
        if (!sel.value || sel.value === "-1") break;
        reasonChain.push({
            level,
            value: sel.value,
            label: sel.options[sel.selectedIndex]?.text?.trim() || sel.value,
        });
    }

    if (reasonChain.length === 0) {
        alert("Сначала выбери причину обращения в форме.");
        return;
    }

    const stepSel = document.querySelector<HTMLSelectElement>("#req_step");
    const step = stepSel && stepSel.value ? stepSel.value : undefined;
    const stepLabel = stepSel && step ? stepSel.options[stepSel.selectedIndex]?.text?.trim() : undefined;

    const techSel = document.querySelector<HTMLSelectElement>("#technology_id");
    const technology = techSel && techSel.value ? techSel.value : undefined;
    const technologyLabel = techSel && technology ? techSel.options[techSel.selectedIndex]?.text?.trim() : undefined;

    const comTextarea = document.querySelector<HTMLTextAreaElement>("#com_ser");
    const comment = comTextarea ? comTextarea.value : "";

    const draft: Omit<ServiceRequestPreset, "id" | "name" | "categoryId"> = {
        product: productValue,
        productLabel,
        reasonChain,
        step,
        stepLabel,
        technology,
        technologyLabel,
        comment: comment?.trim() ? comment : undefined,
    };

    openCaptureModal(draft);
}

async function openCaptureModal(draft: Omit<ServiceRequestPreset, "id" | "name" | "categoryId">) {
    const categories = await getServiceRequestPresetCategories();

    const overlay = document.createElement("div");
    overlay.style.cssText = `
        position: fixed; inset: 0; background: rgba(0,0,0,0.45); z-index: 2147483640;
        display: flex; align-items: center; justify-content: center;
    `;

    const modal = document.createElement("div");
    modal.style.cssText = `
        background: #fff; border-radius: 8px; padding: 14px; min-width: 320px; max-width: 90vw;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3); font-family: Arial, sans-serif; font-size: 12px; color: #000;
    `;

    const chainText = draft.reasonChain.map((s) => s.label).join(" → ");
    const optionsHtml = categories
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((c) => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.name)}</option>`)
        .join("");

    modal.innerHTML = `
        <div style="font-weight:bold;font-size:14px;margin-bottom:8px;">Сохранить как пресет</div>
        <div style="font-size:11px;color:#444;margin-bottom:10px;line-height:1.4;">
            <div><b>Продукт:</b> ${escapeHtml(draft.productLabel)}</div>
            <div><b>Причина:</b> ${escapeHtml(chainText)}</div>
            ${draft.stepLabel ? `<div><b>Обработка:</b> ${escapeHtml(draft.stepLabel)}</div>` : ""}
            ${draft.technologyLabel ? `<div><b>Технология:</b> ${escapeHtml(draft.technologyLabel)}</div>` : ""}
            ${draft.comment ? `<div><b>Комментарий:</b> ${escapeHtml(draft.comment.slice(0, 80))}${draft.comment.length > 80 ? "…" : ""}</div>` : ""}
        </div>
        <label style="display:block;margin-bottom:8px;">
            <div style="margin-bottom:2px;">Название</div>
            <input class="helper-fsr-name" type="text" style="width:100%;padding:5px;border:1px solid #aaa;border-radius:4px;" placeholder="Например: Нет интернета — техники">
        </label>
        <label style="display:block;margin-bottom:8px;">
            <div style="margin-bottom:2px;">Категория</div>
            <select class="helper-fsr-cat" style="width:100%;padding:5px;border:1px solid #aaa;border-radius:4px;">
                <option value="">(без категории)</option>
                ${optionsHtml}
                <option value="__new__">+ Создать новую…</option>
            </select>
        </label>
        <label style="display:none;margin-bottom:8px;" class="helper-fsr-new-cat-row">
            <div style="margin-bottom:2px;">Имя новой категории</div>
            <input class="helper-fsr-new-cat" type="text" style="width:100%;padding:5px;border:1px solid #aaa;border-radius:4px;">
        </label>
        <label style="display:block;margin-bottom:10px;">
            <div style="margin-bottom:2px;">Комментарий пресета (необязательно)</div>
            <textarea class="helper-fsr-comment" rows="3" style="width:100%;padding:5px;border:1px solid #aaa;border-radius:4px;resize:vertical;">${escapeHtml(draft.comment ?? "")}</textarea>
        </label>
        <div style="display:flex;gap:6px;justify-content:flex-end;">
            <button type="button" class="helper-fsr-cancel" style="padding:5px 10px;">Отмена</button>
            <button type="button" class="helper-fsr-save" style="padding:5px 10px;background:#339900;color:#fff;border:none;border-radius:4px;">Сохранить</button>
        </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const nameInput = modal.querySelector<HTMLInputElement>(".helper-fsr-name")!;
    const catSel = modal.querySelector<HTMLSelectElement>(".helper-fsr-cat")!;
    const newCatRow = modal.querySelector<HTMLElement>(".helper-fsr-new-cat-row")!;
    const newCatInput = modal.querySelector<HTMLInputElement>(".helper-fsr-new-cat")!;
    const commentInput = modal.querySelector<HTMLTextAreaElement>(".helper-fsr-comment")!;

    nameInput.focus();

    catSel.addEventListener("change", () => {
        newCatRow.style.display = catSel.value === "__new__" ? "block" : "none";
        if (catSel.value === "__new__") newCatInput.focus();
    });

    const close = () => overlay.remove();

    modal.querySelector(".helper-fsr-cancel")!.addEventListener("click", close);
    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) close();
    });

    modal.querySelector(".helper-fsr-save")!.addEventListener("click", async () => {
        const name = nameInput.value.trim();
        if (!name) {
            nameInput.focus();
            return;
        }

        let categoryId: string | null = null;
        if (catSel.value === "__new__") {
            const newName = newCatInput.value.trim();
            if (!newName) {
                newCatInput.focus();
                return;
            }
            const newCat: ServiceRequestPresetCategory = {
                id: Date.now().toString(),
                name: newName,
                order: categories.length,
            };
            await saveServiceRequestPresetCategories([...categories, newCat]);
            categoryId = newCat.id;
        } else if (catSel.value) {
            categoryId = catSel.value;
        }

        const updatedComment = commentInput.value.trim();
        const preset: ServiceRequestPreset = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            name,
            categoryId,
            product: draft.product,
            productLabel: draft.productLabel,
            reasonChain: draft.reasonChain,
            step: draft.step,
            stepLabel: draft.stepLabel,
            technology: draft.technology,
            technologyLabel: draft.technologyLabel,
            comment: updatedComment || undefined,
        };

        const existing = await getServiceRequestPresets();
        await saveServiceRequestPresets([...existing, preset]);
        close();

        quickServiceRequestsInitialized = false;
        document.querySelector(".helper-fsr-container")?.remove();
        await quickServiceRequests();
    });
}

function expandSzPanel() {
    const content = document.querySelector<HTMLElement>("div.req_sz.ui-accordion-content");
    if (!content) return;
    if (content.style.display === "none") {
        const trigger = document.querySelector<HTMLAnchorElement>("a.req_sz");
        if (trigger) trigger.click();
        else content.style.display = "";
    }
}

function setSelect(select: HTMLSelectElement, value: string, label: string) {
    if (select.value === value) {
        console.log(`[Helper] ${label} уже ${value}`);
        return;
    }
    select.value = value;
    select.dispatchEvent(new Event("change", {bubbles: true}));
    console.log(`[Helper] ${label} → ${value}`);
}

function waitForSelector<T extends HTMLElement>(
    selector: string,
    timeoutMs = 4000,
): Promise<T | null> {
    return new Promise((resolve) => {
        const existing = document.querySelector<T>(selector);
        if (existing) {
            resolve(existing);
            return;
        }
        let resolved = false;
        const obs = new MutationObserver(() => {
            const el = document.querySelector<T>(selector);
            if (el) {
                resolved = true;
                obs.disconnect();
                resolve(el);
            }
        });
        obs.observe(document.body, {childList: true, subtree: true});
        window.setTimeout(() => {
            if (!resolved) {
                obs.disconnect();
                resolve(null);
            }
        }, timeoutMs);
    });
}

function escapeHtml(s: string): string {
    return s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}
