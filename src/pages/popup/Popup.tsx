import {useCallback, useEffect, useState} from 'react';
import type {TelegramUser} from '@src/shared/types/auth';
import {getAuthState, isAuthenticated, logout} from '@src/utils/auth';
import Auth from '@src/components/Auth';
import browser from 'webextension-polyfill';
import type {MacLookupResult, Tab} from './types';
import {Header, HomeTab, Loading, Tabs, Toolbar, ToolsTab, WhatsNewTab} from './components';
import {countUnseenEntries, getLatestVersion} from './data/changelog';

const LAST_SEEN_CHANGELOG_KEY = 'lastSeenChangelogVersion';

const TOOLBAR_BUTTONS = [
    {
        title: 'ТГ Канал',
        icon: 'telegram',
        onClick: () => window.open('https://t.me/+jH1mblw0ytcwOWUy', '_blank', 'noopener,noreferrer'),
    },
    {
        title: '✨ Квазар',
        icon: '✨',
        onClick: () => window.open('https://t.me/quazar_vpnbot', '_blank', 'noopener,noreferrer'),
    },
    {
        title: 'Поддержать проект',
        icon: '💰',
        onClick: () => window.open('https://pay.cloudtips.ru/p/787b494c', '_blank', 'noopener,noreferrer'),
    },
    {title: 'Перейти в настройки', icon: '⚙️', onClick: () => browser.runtime.openOptionsPage()},
] as const;

export default function Popup() {
    const [isAuthenticatedState, setIsAuthenticatedState] = useState<boolean | null>(null);
    const [currentUser, setCurrentUser] = useState<TelegramUser | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>('Главная');
    const [macAddress, setMacAddress] = useState('');
    const [macResult, setMacResult] = useState<MacLookupResult | null>(null);
    const [lastSeenVersion, setLastSeenVersion] = useState<string | null>(null);
    const [unseenCount, setUnseenCount] = useState(0);

    useEffect(() => {
        (async () => {
            const authenticated = await isAuthenticated();
            setIsAuthenticatedState(authenticated);
            if (authenticated) {
                const state = await getAuthState();
                if (state?.user) setCurrentUser(state.user);
            }
            const stored = await browser.storage.local.get(LAST_SEEN_CHANGELOG_KEY);
            const seen = (stored[LAST_SEEN_CHANGELOG_KEY] as string | undefined) ?? null;
            setLastSeenVersion(seen);
            setUnseenCount(countUnseenEntries(seen));
        })();
    }, []);

    useEffect(() => {
        if (activeTab !== 'Что нового' || unseenCount === 0) return;
        const latest = getLatestVersion();
        browser.storage.local.set({[LAST_SEEN_CHANGELOG_KEY]: latest});
        setUnseenCount(0);
    }, [activeTab, unseenCount]);

    const handleAuthorized = useCallback((user: TelegramUser) => {
        setCurrentUser(user);
        setIsAuthenticatedState(true);
    }, []);

    const handleLogout = useCallback(async () => {
        await logout();
        setIsAuthenticatedState(false);
        setCurrentUser(null);
    }, []);

    const handleMacLookup = useCallback(async () => {
        if (!macAddress.trim()) {
            setMacResult({company: '', error: 'Пожалуйста, введите MAC-адрес'});
            return;
        }

        setMacResult(null);

        try {
            const response = await chrome.runtime.sendMessage({type: 'LOOKUP_MAC', mac: macAddress.trim()});
            setMacResult(response.ok ? {company: response.data.company} : {
                company: '',
                error: response.err || 'Ошибка при поиске'
            });
        } catch (error) {
            setMacResult({company: '', error: String(error)});
        }
    }, [macAddress]);

    if (isAuthenticatedState === null) return <Loading/>;
    if (!isAuthenticatedState) return <Auth onAuthorized={handleAuthorized}/>;

    return (
        <div className="w-160 h-145 bg-white overflow-hidden flex flex-col">
            {currentUser && <Header user={currentUser} onLogout={handleLogout}/>}

            <div className="flex items-center border-b border-gray-200/80 bg-white">
                <Tabs active={activeTab} onChange={setActiveTab} badges={{'Что нового': unseenCount}}/>
                <Toolbar buttons={TOOLBAR_BUTTONS}/>
            </div>

            <div className="p-4 animate-in fade-in duration-200 flex-1 overflow-auto">
                {activeTab === 'Главная' && <HomeTab/>}
                {activeTab === 'Инструменты' &&
                    <ToolsTab macAddress={macAddress} onMacChange={setMacAddress} onMacLookup={handleMacLookup}
                              macResult={macResult}/>}
                {activeTab === 'Что нового' && <WhatsNewTab lastSeenVersion={lastSeenVersion}/>}
            </div>
        </div>
    );
}

