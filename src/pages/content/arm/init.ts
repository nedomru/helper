import {initializer} from '../core/initializer';
import {armPageConfigs} from './config';

initializer.initialize(armPageConfigs).catch((error) => {
    console.error('[ARM] - Initialization error:', error);
});
