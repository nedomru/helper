import {initializer} from '../core/initializer';
import {armPageConfigs} from './config';

// Инициализация ARM модуля
initializer.initialize(armPageConfigs).catch((error) => {
    console.error('[ARM] - Ошибка инициализации:', error);
});
