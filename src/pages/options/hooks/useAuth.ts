import {useCallback, useEffect, useState} from 'react';
import {getAuthState, isAuthenticated, logout} from '@src/utils/auth';
import type {TelegramUser} from '@src/shared/types/auth';
import {getModuleSettings, getUserSettings} from '@src/shared/user-settings';
import type {Settings} from '../types';

export function useAuth() {
    const [isAuthenticatedState, setIsAuthenticatedState] = useState<boolean | null>(null);
    const [currentUser, setCurrentUser] = useState<TelegramUser | null>(null);
    const [settings, setSettings] = useState<Settings>({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        const init = async () => {
            const authenticated = await isAuthenticated();
            if (!mounted) return;

            setIsAuthenticatedState(authenticated);

            if (authenticated) {
                const state = await getAuthState();
                if (!mounted) return;

                if (state?.user) {
                    setCurrentUser(state.user);
                }

                setIsLoading(true);
                try {
                    const userSettings = await getUserSettings();
                    if (!mounted) return;

                    if (userSettings) {
                        setSettings({
                            arm: getModuleSettings('arm', userSettings) ?? undefined,
                            genesys: getModuleSettings('genesys', userSettings) ?? undefined,
                            line: getModuleSettings('line', userSettings) ?? undefined,
                        });
                    }
                } finally {
                    if (mounted) {
                        setIsLoading(false);
                    }
                }
            } else {
                setIsLoading(false);
            }
        };

        init();

        return () => {
            mounted = false;
        };
    }, []);

    const handleAuthorized = useCallback((user: TelegramUser) => {
        setCurrentUser(user);
        setIsAuthenticatedState(true);

        const loadNewUserSettings = async () => {
            setIsLoading(true);
            try {
                const userSettings = await getUserSettings();
                if (userSettings) {
                    setSettings({
                        arm: getModuleSettings('arm', userSettings) ?? undefined,
                        genesys: getModuleSettings('genesys', userSettings) ?? undefined,
                        line: getModuleSettings('line', userSettings) ?? undefined,
                    });
                }
            } finally {
                setIsLoading(false);
            }
        };

        loadNewUserSettings();
    }, []);

    const handleLogout = async () => {
        await logout();
        setIsAuthenticatedState(false);
        setCurrentUser(null);
        setSettings({});
    };

    return {
        isAuthenticatedState,
        currentUser,
        settings,
        isLoading,
        handleAuthorized,
        handleLogout,
        setSettings,
    };
}
