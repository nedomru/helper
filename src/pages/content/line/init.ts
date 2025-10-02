import {initializer} from '../core/initializer';
import {linePageConfigs} from './config';

// Инициализация Line модуля
initializer.initialize(linePageConfigs).catch((error) => {
    console.error('[Линия] - Ошибка инициализации:', error);
});
