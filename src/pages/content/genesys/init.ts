import {initializer} from '../core/initializer';
import {genesysPageConfigs} from './config';

// Инициализация Genesys модуля
initializer.initialize(genesysPageConfigs).catch((error) => {
    console.error('[Генезис] - Ошибка инициализации:', error);
});
