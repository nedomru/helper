export type ChangelogType = "feat" | "fix" | "improve" | "breaking";

export interface ChangelogChange {
    type: ChangelogType;
    text: string;
}

export interface ChangelogEntry {
    version: string;
    date: string;
    changes: ChangelogChange[];
}

export const CHANGELOG: ChangelogEntry[] = [
    {
        version: "3.1.0.0",
        date: "2026-05-11",
        changes: [
            {
                type: "feat",
                text: "Онлайн-заметки по клиенту: видны всем операторам, привязаны к номеру договора, автоудаление через 7 дней. Запросы E2E-шифруются (RSA+AES-GCM).",
            },
            {
                type: "feat",
                text: "История буфера обмена с автотегами (IP/MAC/договор/телефон) и поиском — вкладка «Буфер» в popup",
            },
            {
                type: "feat",
                text: "Bulk-actions на странице сессий: чекбоксы, копирование строк в TSV/CSV, копирование уникальных IP/MAC",
            },
            {
                type: "feat",
                text: "Быстрые фильтры причин завершения сессий — чипы топ-5 причин рядом с дропдауном",
            },
            {
                type: "feat",
                text: "Глобальные хоткеи: Alt+Shift+1 (договор), 2 (телефон), 3 (IP), 4 (MAC). Настраиваются в chrome://extensions/shortcuts",
            },
            {
                type: "feat",
                text: "Плейсхолдеры в речевых модулях: {дата}, {время}, {оператор}, {договор}, {телефон}, {ip}, {mac}, {фио}",
            },
            {type: "feat", text: "Тёмная тема для АРМ — включается в настройках, «Внешний вид»"},
            {type: "feat", text: "Вкладка «Что нового» в popup с уведомлением об обновлениях"},
            {
                type: "improve",
                text: "Настройки сохраняются оффлайн: при отсутствии сети изменения копятся в очередь и синхронизируются автоматически",
            },
            {
                type: "improve",
                text: "Content-script ARM похудел на ~20%: тяжёлые фичи (заметки, bulk-actions, шаблоны) грузятся только когда нужны",
            },
        ],
    },
];

const TYPE_ORDER: Record<ChangelogType, number> = {
    breaking: 0,
    feat: 1,
    improve: 2,
    fix: 3,
};

export const TYPE_LABELS: Record<ChangelogType, string> = {
    feat: "Новое",
    fix: "Исправлено",
    improve: "Улучшено",
    breaking: "Важно",
};

export const TYPE_COLORS: Record<ChangelogType, string> = {
    feat: "bg-emerald-100 text-emerald-700 border-emerald-200",
    fix: "bg-amber-100 text-amber-700 border-amber-200",
    improve: "bg-sky-100 text-sky-700 border-sky-200",
    breaking: "bg-rose-100 text-rose-700 border-rose-200",
};

export function sortChanges(changes: ChangelogChange[]): ChangelogChange[] {
    return [...changes].sort((a, b) => TYPE_ORDER[a.type] - TYPE_ORDER[b.type]);
}

export function compareVersions(a: string, b: string): number {
    const pa = a.split(".").map((p) => parseInt(p, 10) || 0);
    const pb = b.split(".").map((p) => parseInt(p, 10) || 0);
    const len = Math.max(pa.length, pb.length);
    for (let i = 0; i < len; i++) {
        const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
        if (diff !== 0) return diff;
    }
    return 0;
}

export function getLatestVersion(): string {
    return CHANGELOG[0]?.version ?? "0.0.0.0";
}

export function countUnseenEntries(lastSeenVersion: string | null): number {
    if (!lastSeenVersion) return CHANGELOG.length;
    return CHANGELOG.filter((entry) => compareVersions(entry.version, lastSeenVersion) > 0).length;
}
