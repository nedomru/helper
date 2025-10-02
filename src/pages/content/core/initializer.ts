import type {PageConfig, SettingsStorage} from './types';

class ContentInitializer {
    private static instance: ContentInitializer;
    private settingsCache: SettingsStorage | null = null;
    private initPromise: Promise<void> | null = null;

    private constructor() {
    }

    static getInstance(): ContentInitializer {
        if (!ContentInitializer.instance) {
            ContentInitializer.instance = new ContentInitializer();
        }
        return ContentInitializer.instance;
    }

    /**
     * Регистрирует и инициализирует страницу
     */
    async registerPage(config: PageConfig): Promise<void> {
        if (!this.matchesPattern(config.pattern)) {
            console.debug('[Initializer] Page pattern not matched, skipping');
            return;
        }

        try {
            await this.initializeFeatures(config);
            console.debug('[Initializer] Page initialized successfully');
        } catch (error) {
            console.error('[Initializer] Error during page initialization:', error);
        }
    }

    /**
     * Регистрирует несколько страниц и выполняет инициализацию
     */
    async initialize(configs: PageConfig[]): Promise<void> {
        if (this.initPromise) return this.initPromise;

        this.initPromise = (async () => {
            const matchedConfigs = configs.filter(config =>
                this.matchesPattern(config.pattern)
            );

            if (!matchedConfigs.length) {
                console.debug('[Initializer] No matching page configs found');
                return;
            }

            await Promise.all(
                matchedConfigs.map(config => this.initializeFeatures(config))
            );
        })();

        return this.initPromise;
    }

    /**
     * Очищает кеш настроек (полезно для тестов или когда настройки изменились)
     */
    clearCache(): void {
        this.settingsCache = null;
    }

    /**
     * Проверяет соответствие текущего URL паттерну
     */
    private matchesPattern(pattern: string | string[]): boolean {
        const patterns = Array.isArray(pattern) ? pattern : [pattern];
        return patterns.some(p => document.URL.includes(p));
    }

    /**
     * Загружает настройки из chrome.storage с кешированием
     */
    private async getSettings(keys: string[]): Promise<SettingsStorage> {
        if (!this.settingsCache) {
            this.settingsCache = await chrome.storage.sync.get(keys) as SettingsStorage;
        }
        return this.settingsCache;
    }

    /**
     * Инициализирует функции на основе настроек
     */
    private async initializeFeatures(config: PageConfig): Promise<void> {
        const {features, alwaysRun} = config;

        // Выполняем функции которые всегда должны запускаться
        if (alwaysRun?.length) {
            await Promise.all(alwaysRun.map(fn => fn()));
        }

        // Если нет функций зависящих от настроек, выходим
        if (!features.length) return;

        // Получаем настройки для всех функций одним запросом
        const featureKeys = features.map(f => f.key);
        const settings = await this.getSettings(featureKeys);

        // Запускаем только включенные функции параллельно
        const enabledFeatures = features
            .filter(({key}) => settings[key])
            .map(({handler}) => handler());

        await Promise.all(enabledFeatures);
    }
}

export const initializer = ContentInitializer.getInstance();
