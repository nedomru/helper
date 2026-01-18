import {isServiceEngineer} from "@pages/content/arm/features/alerts/special_client";

const BUTTON_SELECTOR = ".top_3_butt";
const OBSERVER_TIMEOUT = 3000;

type ProblemType = {
    readonly name: string;
    readonly selector: string;
    readonly textCheck: string | null;
    readonly skipIfServiceEngineer: boolean;
    readonly logMessage: string;
};

const PROBLEM_TYPES: readonly ProblemType[] = [
    {
        name: "СПАС",
        selector: ".spas_body",
        textCheck: null,
        skipIfServiceEngineer: false,
        logMessage: "Найден СПАС",
    },
    {
        name: "Доступ",
        selector: ".bl_antic_head_w",
        textCheck: "Доступ отсутствует",
        skipIfServiceEngineer: false,
        logMessage: "Найден закрытый доступ",
    },
    {
        name: "Авария",
        selector: ".bl_antic_head_w",
        textCheck: "Аварии на адресе",
        skipIfServiceEngineer: false,
        logMessage: "Найдена авария",
    },
    {
        name: "ППР",
        selector: ".bl_antic_head_w",
        textCheck: "ППР на адресе",
        skipIfServiceEngineer: false,
        logMessage: "Найден ППР",
    },
    {
        name: "Особый",
        selector: ".bl_antic_head_w",
        textCheck: "Особый Клиент",
        skipIfServiceEngineer: true,
        logMessage: "Найден особый клиент",
    },
] as const;

const checkProblemType = (element: Element, type: ProblemType): boolean => {
    if (type.textCheck === null) return true;
    return element.textContent.trim() === type.textCheck;
};

const markProblem = (
    button: HTMLElement,
    foundTypes: Set<string>,
    type: ProblemType,
): boolean => {
    if (foundTypes.has(type.name)) return false;

    foundTypes.add(type.name);
    button.innerHTML += ` | ${type.name}`;
    button.style.backgroundColor = "#cc3300";
    console.info(`[Хелпер] - [АРМ] - [Предвосхищение] ${type.logMessage}`);

    return true;
};

const processInitialElements = (
    button: HTMLElement,
    foundTypes: Set<string>,
    problemCount: { value: number },
): void => {
    if (isServiceEngineer()) {
        button.innerHTML += " | Инженер";
        button.style.backgroundColor = "#cc3300";
        problemCount.value++;
        console.info(`[Хелпер] - [АРМ] - [Предвосхищение] Найден сервисный инженер`);
    }

    for (const type of PROBLEM_TYPES) {
        if (type.skipIfServiceEngineer && isServiceEngineer()) continue;

        const elements = document.querySelectorAll(type.selector);
        for (const element of elements) {
            if (checkProblemType(element, type)) {
                if (markProblem(button, foundTypes, type)) {
                    problemCount.value++;
                }
            }
        }
    }
};

const setupMutationObserver = (
    button: HTMLElement,
    foundTypes: Set<string>,
): MutationObserver => {
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type !== "childList") continue;

            for (const node of mutation.addedNodes) {
                if (node.nodeType !== Node.ELEMENT_NODE) continue;

                const element = node as Element;

                for (const type of PROBLEM_TYPES) {
                    if (type.skipIfServiceEngineer && isServiceEngineer()) continue;

                    if (element.classList.contains(type.selector.substring(1))) {
                        if (checkProblemType(element, type)) {
                            markProblem(button, foundTypes, type);
                        }
                    }
                }
            }
        }
    });

    observer.observe(document.body, {childList: true, subtree: true});

    return observer;
};

export async function smartAnticipation(): Promise<void> {
    try {
        const button = document.querySelector<HTMLElement>(BUTTON_SELECTOR);
        if (!button || button.textContent.includes("Хелпер")) return;

        button.textContent = "Хелпер";
        const foundTypes = new Set<string>();
        const problemCount = {value: 0};

        processInitialElements(button, foundTypes, problemCount);

        const observer = setupMutationObserver(button, foundTypes);

        setTimeout(() => {
            observer.disconnect();
        }, OBSERVER_TIMEOUT);

        if (problemCount.value === 0) {
            button.style.backgroundColor = "#008000";
        }

        console.info(`[Хелпер] - [АРМ] - [Предвосхищение] Предвосхищение загружено`);
    } catch (error) {
        console.error(`[Хелпер] - [АРМ] - [Предвосхищение] Ошибка:`, error);
    }
}
