import type {PageConfig} from './types';
import {clearSettingsCache, getUserSettings, isFeatureEnabled} from '@src/shared/user-settings';
import {getAccessToken} from '@src/utils/auth';

class ContentInitializer {
    private static instance: ContentInitializer;
    private settingsCache: Record<string, unknown> | null = null;
    private allConfigs: PageConfig[] = [];
    private isInitialized: boolean = false;
    private isInitializing: boolean = false;
    private pendingModules: string[] = [];

    private constructor() {
    }

    static getInstance(): ContentInitializer {
        if (!ContentInitializer.instance) {
            ContentInitializer.instance = new ContentInitializer();
        }
        return ContentInitializer.instance;
    }

    /**
     * Регистрирует несколько страниц и выполняет инициализацию
     */
    async initialize(configs: PageConfig[]): Promise<void> {
        // Если уже инициализировано, игнорируем
        if (this.isInitialized) {
            console.debug('[Initializer] Already initialized, ignoring new configs');
            return;
        }

        // Определяем модуль по количеству конфигов (простая эвристика)
        const moduleName = this.getModuleName(configs.length);

        // Проверяем, не добавляли ли уже этот модуль
        if (this.pendingModules.includes(moduleName)) {
            // Используем debug для повторных регистраций, чтобы уменьшить шум в логах
            console.debug(`[Initializer] Module ${moduleName} already registered in this context, ignoring`);
            return;
        }

        // Добавляем модуль в список ожидающих
        this.pendingModules.push(moduleName);
        this.allConfigs.push(...configs);

        console.log(`[Initializer] Registered ${moduleName} module (${configs.length} configs), total: ${this.allConfigs.length}`);

        // Если уже инициализируем, ждем завершения
        if (this.isInitializing) {
            console.debug('[Initializer] Initialization in progress, waiting...');
            return;
        }

        // Ждем немного, чтобы дать возможность другим модулям зарегистрироваться
        await new Promise(resolve => setTimeout(resolve, 50));

        await this.performInitialization();
    }

    /**
     * Очищает кеш настроек и сбрасывает состояние инициализации (полезно для тестов или когда настройки изменились)
     */
    clearCache(): void {
        this.settingsCache = null;
        this.allConfigs = [];
        this.isInitialized = false;
        this.isInitializing = false;
        this.pendingModules = [];
        clearSettingsCache();
    }

    /**
     * Определяет имя модуля по количеству конфигураций и уже зарегистрированным модулям
     */
    private getModuleName(configCount: number): string {
        switch (configCount) {
            case 1:
                // Если уже есть Line модуль с 1 конфигом, то это Genesys
                return this.pendingModules.includes('Line') ? 'Genesys' : 'Line';
            case 7:
                return 'ARM';
            default:
                return `Unknown(${configCount})`;
        }
    }

    /**
     * Выполняет фактическую инициализацию со всеми накопленными конфигурациями
     */
    private async performInitialization(): Promise<void> {
        if (this.isInitialized || this.isInitializing) return;

        this.isInitializing = true;

        try {
            // Проверяем авторизацию перед инициализацией
            const token = await getAccessToken();
            if (!token) {
                console.log('[Initializer] User not authorized, skipping feature initialization');
                this.isInitialized = true;
                return;
            }

            // Определяем тип фрейма для лучшего логирования
            const frameInfo = this.getFrameInfo();

            const matchedConfigs = this.allConfigs.filter(config =>
                this.matchesPattern(config.pattern)
            );

            // Подсчитываем общее количество функций для инициализации
            const totalFeatures = matchedConfigs.reduce((count, config) => {
                return count + (config.features?.length || 0) + (config.alwaysRun?.length || 0);
            }, 0);

            // Если нет функций для выполнения, не логируем лишнего
            if (totalFeatures === 0) {
                console.debug(`[Initializer] ${frameInfo} - No features to initialize, skipping`);
                this.isInitialized = true;
                return;
            }

            console.log(`[Initializer] ${frameInfo} - Starting initialization with ${totalFeatures} features from ${matchedConfigs.length} matched configs`);

            await Promise.all(
                matchedConfigs.map(config => this.initializeFeatures(config))
            );

            console.log(`[Initializer] ${frameInfo} - Successfully initialized ${totalFeatures} features`);

            this.isInitialized = true;
        } catch (error) {
            console.error('[Initializer] Initialization failed:', error);
            throw error;
        } finally {
            this.isInitializing = false;
        }
    }

    /**
     * Определяет информацию о текущем фрейме
     */
    private getFrameInfo(): string {
        const url = window.location.href;

        if (url.includes('frame_top')) return 'TopFrame';
        if (url.includes('frame_left_reasons')) return 'LeftReasonsFrame';
        if (url.includes('frame_left')) return 'LeftFrame';
        if (url.includes('frame_navigate')) return 'NavigateFrame';
        if (url.includes('search_result')) return 'SearchFrame';
        if (url.includes('excells')) return 'MainFrame';
        if (url.includes('static_pages')) return 'StaticFrame';
        if (window.parent !== window) return 'IFrame';

        return 'MainWindow';
    }

    /**
     * Проверяет соответствие текущего URL паттерну
     */
    private matchesPattern(pattern: string | string[]): boolean {
        const patterns = Array.isArray(pattern) ? pattern : [pattern];
        return patterns.some(p => document.URL.includes(p));
    }

    /**
     * Загружает настройки пользователя из /me endpoint
     */
    private async getSettings(): Promise<Record<string, unknown> | null> {
        if (!this.settingsCache) {
            this.settingsCache = await getUserSettings();
        }
        return this.settingsCache;
    }

    /**
     * Инициализирует функции на основе настроек
     */
    private async initializeFeatures(config: PageConfig): Promise<void> {
        const {features, alwaysRun} = config;

        // Если нет функций, выходим
        if (!features.length && !alwaysRun?.length) return;

        // Получаем настройки пользователя с /me endpoint
        const settings = await this.getSettings();

        if (!settings) {
            console.log('[Initializer] No user settings found, skipping optional features');
            // Все равно запускаем alwaysRun даже без настроек
            if (alwaysRun?.length) {
                await Promise.all(alwaysRun.map(fn => fn()));
            }
            return;
        }

        // Запускаем alwaysRun и включенные функции параллельно
        const allPromises: Promise<void>[] = [];

        // Выполняем функции которые всегда должны запускаться
        if (alwaysRun?.length) {
            allPromises.push(...alwaysRun.map(fn => Promise.resolve(fn())));
        }

        // Запускаем только включенные функции параллельно
        const enabledFeatures = features
            .filter(({key}) => isFeatureEnabled(key, settings))
            .map(({handler}) => Promise.resolve(handler()));

        allPromises.push(...enabledFeatures);

        const skippedFeatures = features.length - enabledFeatures.length;
        if (skippedFeatures > 0) {
            console.log(`[Initializer] Skipped ${skippedFeatures} disabled features`);
        }

        await Promise.all(allPromises);
    }
}

export const initializer = ContentInitializer.getInstance();
