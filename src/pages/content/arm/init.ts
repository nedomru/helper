import {initializer} from '../core/initializer';
import {armPageConfigs} from './config';
import {applyDarkTheme} from './features/dark-theme';

applyDarkTheme().catch((error) => {
    console.error('[ARM] - Dark theme init error:', error);
});

initializer.initialize(armPageConfigs).catch((error) => {
    console.error('[ARM] - Initialization error:', error);
});
