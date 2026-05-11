import {initializer} from '../core/initializer';
import {armPageConfigs} from './config';
import {applyDarkTheme} from './features/dark-theme';
import {setupHotkeys} from './features/hotkeys';

applyDarkTheme().catch((error) => {
    console.error('[ARM] - Dark theme init error:', error);
});

setupHotkeys().catch((error) => {
    console.error('[ARM] - Hotkeys init error:', error);
});

initializer.initialize(armPageConfigs).catch((error) => {
    console.error('[ARM] - Initialization error:', error);
});
