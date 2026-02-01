import React, {useCallback, useEffect, useState} from 'react';
import logo from '@assets/img/logo.svg';
import '@pages/newtab/Newtab.css';
import {TelegramUser} from "@src/shared/types/auth";
import {getAuthState, isAuthenticated, logout} from "@src/utils/auth";
import Auth from "@src/components/Auth";

export default function Newtab() {
    const [isAuthenticatedState, setIsAuthenticatedState] = useState<boolean | null>(null);
    const [currentUser, setCurrentUser] = useState<TelegramUser | null>(null);

    // Check authentication on mount
    useEffect(() => {
        const checkAuth = async () => {
            const authenticated = await isAuthenticated();
            setIsAuthenticatedState(authenticated);
            if (authenticated) {
                const state = await getAuthState();
                if (state?.user) {
                    setCurrentUser(state.user);
                }
            }
        };
        checkAuth();
    }, []);

    const handleAuthorized = useCallback((user: TelegramUser) => {
        setCurrentUser(user);
        setIsAuthenticatedState(true);
    }, []);

    // Show loading while checking auth
    if (isAuthenticatedState === null) {
        return (
            <div className="App">
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-gray-600">Загрузка...</div>
                </div>
            </div>
        );
    }

    // Show auth screen if not authenticated
    if (!isAuthenticatedState) {
        return <Auth onAuthorized={handleAuthorized}/>;
    }

    return (
        <div className="App">
            <header className="App-header">
                <div className="flex items-center justify-between w-full px-8">
                    <img src={logo} className="App-logo" alt="logo"/>
                    {currentUser && (
                        <div className="flex items-center gap-4 bg-white bg-opacity-20 rounded-lg px-4 py-2">
                            <div
                                className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-cyan-600 font-bold text-sm">
                                {currentUser.first_name[0]}
                            </div>
                            <span className="text-white font-medium">
                                {currentUser.first_name} {currentUser.last_name || ''}
                            </span>
                            <button
                                onClick={async () => {
                                    await logout();
                                    setIsAuthenticatedState(false);
                                    setCurrentUser(null);
                                }}
                                className="text-white text-sm underline hover:no-underline"
                            >
                                Выйти
                            </button>
                        </div>
                    )}
                </div>
                <p>
                    Edit <code>src/pages/newtab/Newtab.tsx</code> and save to reload.
                </p>
                <a
                    className="App-link"
                    href="https://reactjs.org"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Learn React!
                </a>
            </header>
        </div>
    );
}
