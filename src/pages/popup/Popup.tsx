import {type ReactNode, useCallback, useEffect, useState} from 'react';
import {TelegramUser} from "@src/shared/types/auth";
import {getAuthState, isAuthenticated, logout} from "@src/utils/auth";
import Auth from "@src/components/Auth";

type Tab = 'Главная' | 'Инструменты';

interface ToolState {
    macAddress: string;
}

interface MacLookupResult {
    company: string;
    error?: string;
}

interface ToolInputProps {
    label: string;
    value: string;
    placeholder: string;
    onChange: (value: string) => void;
    buttonLabel: string;
    onAction?: () => void;
}

function ToolInput({label, value, placeholder, onChange, buttonLabel, onAction}: ToolInputProps): ReactNode {
    return (
        <div className="flex gap-2 items-center">
            <span
                className="w-40 px-3 py-2 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 flex items-center">
                {label}
            </span>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
            />
            <button
                onClick={onAction}
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 active:scale-95 transition-all text-sm font-medium text-gray-700 shadow-sm"
            >
                {buttonLabel}
            </button>
        </div>
    );
}

export default function Popup(): ReactNode {
    const [isAuthenticatedState, setIsAuthenticatedState] = useState<boolean | null>(null);
    const [currentUser, setCurrentUser] = useState<TelegramUser | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>('Главная');
    const [tools, setTools] = useState<ToolState>({
        macAddress: '',
    });
    const [macResult, setMacResult] = useState<MacLookupResult | null>(null);

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

    const handleLogout = useCallback(async () => {
        await logout();
        setIsAuthenticatedState(false);
        setCurrentUser(null);
    }, []);

    const handleOpenSettings = useCallback(() => {
        chrome.runtime.openOptionsPage();
    }, []);

    const handleOpenLink = useCallback((url: string) => {
        window.open(url, '_blank', 'noopener,noreferrer');
    }, []);

    const handleMacLookup = useCallback(async () => {
        if (!tools.macAddress.trim()) {
            setMacResult({company: '', error: 'Пожалуйста, введите MAC-адрес'});
            return;
        }

        setMacResult(null); // Clear previous result

        try {
            const response = await chrome.runtime.sendMessage({
                type: 'LOOKUP_MAC',
                mac: tools.macAddress.trim()
            });

            if (response.ok) {
                setMacResult({company: response.data.company});
            } else {
                setMacResult({company: '', error: response.err || 'Ошибка при поиске'});
            }
        } catch (error) {
            setMacResult({company: '', error: String(error)});
        }
    }, [tools.macAddress]);

    const TABS: Tab[] = ['Главная', 'Инструменты'];

    const TOOLBAR_BUTTONS = [
        {title: 'Перейти в настройки', icon: '⚙️', onClick: handleOpenSettings},
        {
            title: 'Перейти в Telegram',
            icon: 'telegram',
            onClick: () => handleOpenLink('https://t.me/+jH1mblw0ytcwOWUy')
        },
        {title: 'Поддержать проект', icon: '💰', onClick: () => handleOpenLink('https://pay.cloudtips.ru/p/787b494c')},
    ] as const;

    if (isAuthenticatedState === null) {
        return (
            <div className="w-160 min-h-145 bg-white flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div
                        className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <div className="text-gray-600 text-sm font-medium">Загрузка...</div>
                </div>
            </div>
        );
    }

    if (!isAuthenticatedState) {
        return <Auth onAuthorized={handleAuthorized}/>;
    }

    return (
        <div className="w-160 min-h-145 bg-white">
            {currentUser && (
                <div
                    className="bg-gradient-to-r from-cyan-50 to-blue-50 px-4 py-2.5 border-b border-cyan-200/50 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-9 h-9 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
                            {currentUser.first_name![0]}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold text-gray-800">
                                {currentUser.first_name} {currentUser.last_name || ''}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="text-xs text-red-600 hover:text-red-700 font-medium px-3 py-1 rounded-full hover:bg-red-50 transition-colors"
                    >
                        Выйти
                    </button>
                </div>
            )}

            <div className="flex items-center gap-2 p-4 border-b border-gray-200/80 bg-white">
                <div className="flex gap-1.5">
                    {TABS.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                                activeTab === tab
                                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md shadow-blue-200'
                                    : 'bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 hover:border-blue-300'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="flex gap-1.5 ml-auto">
                    {TOOLBAR_BUTTONS.map(({title, icon, onClick}) => (
                        <button
                            key={title}
                            onClick={onClick}
                            className="px-3 py-2 text-sm border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 hover:border-blue-300 active:scale-95 transition-all duration-200 shadow-sm"
                            title={title}
                        >
                            {icon === 'telegram' ? (
                                <svg height="16" viewBox="0 0 240.1 240.1" width="16"
                                     xmlns="http://www.w3.org/2000/svg">
                                    <defs>
                                        <linearGradient gradientUnits="userSpaceOnUse" id="telegram-gradient" x1="120.1"
                                                        x2="120.1" y1="0" y2="240.1">
                                            <stop offset="0" style={{stopColor: '#2AABEE'}}/>
                                            <stop offset="1" style={{stopColor: '#229ED9'}}/>
                                        </linearGradient>
                                    </defs>
                                    <circle cx="120.1" cy="120.1" fill="url(#telegram-gradient)" r="120.1"/>
                                    <path
                                        d="M54.3,118.8c35-15.2,58.3-25.3,70-30.2c33.3-13.9,40.3-16.3,44.8-16.4c1,0,3.2,0.2,4.7,1.4 c1.2,1,1.5,2.3,1.7,3.3s0.4,3.1,0.2,4.7c-1.8,19-9.6,65.1-13.6,86.3c-1.7,9-5,12-8.2,12.3c-7,0.6-12.3-4.6-19-9 c-10.6-6.9-16.5-11.2-26.8-18c-11.9-7.8-4.2-12.1,2.6-19.1c1.8-1.8,32.5-29.8,33.1-32.3c0.1-0.3,0.1-1.5-0.6-2.1 c-0.7-0.6-1.7-0.4-2.5-0.2c-1.1,0.2-17.9,11.4-50.6,33.5c-4.8,3.3-9.1,4.9-13,4.8c-4.3-0.1-12.5-2.4-18.7-4.4 c-7.5-2.4-13.5-3.7-13-7.9C45.7,123.3,48.7,121.1,54.3,118.8z"
                                        fill="#FFFFFF"/>
                                </svg>
                            ) : icon}
                        </button>
                    ))}
                </div>
            </div>

            <div className="p-4 animate-in fade-in duration-200">
                {activeTab === 'Главная' && (
                    <div className="grid grid-cols-3 gap-6">
                        <div>
                            <h4 className="font-bold text-gray-800">Главное</h4>
                            <ul>
                                <li><a href="http://genesys-app1.cc4.ertelecom.ru:82/ui/ad/v1/index.html"
                                       className="text-blue-600 hover:underline text-sm">Генезис</a></li>
                                <li><a href="https://perm.db.ertelecom.ru/cgi-bin/ppo/excells/wcc_main.entry_continue"
                                       className="text-blue-600 hover:underline text-sm">Веб-АРМ</a></li>
                                <li><a href="https://okc.ertelecom.ru/yii/breaks/ntp-nck"
                                       className="text-blue-600 hover:underline text-sm">Перерывы</a></li>
                                <li><a href="https://clever.ertelecom.ru"
                                       className="text-blue-600 hover:underline text-sm">Clever</a></li>
                                <li><a href="https://mail.domru.ru/owa/"
                                       className="text-blue-600 hover:underline text-sm">Почта</a></li>
                            </ul>

                            <h4 className="font-bold mt-4 text-gray-800">Линии</h4>
                            <ul>
                                <li><a href="https://okc.ertelecom.ru/yii/genesys-ntp/line"
                                       className="text-blue-600 hover:underline text-sm">НЦК</a></li>
                                <li>
                                    <a href="https://okc.ertelecom.ru/yii/line_ts/ntp1/index"
                                       className="text-blue-600 hover:underline text-sm">НТП1</a>
                                    {' / '}
                                    <a href="https://okc.ertelecom.ru/yii/line_ts/ntp2/index"
                                       className="text-blue-600 hover:underline text-sm">НТП2</a>
                                </li>
                            </ul>

                            <h4 className="font-bold mt-4 text-gray-800">Графики</h4>
                            <ul>
                                <li><a href="https://okc.ertelecom.ru/wfm/vueapp/personal"
                                       className="text-blue-600 hover:underline text-sm">Личный</a></li>
                                <li>
                                    <a href="https://okc.ertelecom.ru/wfm/vueapp/day"
                                       className="text-blue-600 hover:underline text-sm">День</a>
                                    {' / '}
                                    <a href="https://okc.ertelecom.ru/wfm/vueapp/month"
                                       className="text-blue-600 hover:underline text-sm">Месяц</a>
                                </li>
                            </ul>

                            <h4 className="font-bold mt-4 text-gray-800">Регламенты</h4>
                            <ul>
                                <li><a href="https://clever.ertelecom.ru/content/space/4/article/6366/page/2"
                                       className="text-blue-600 hover:underline text-sm">Платный сервис</a></li>
                                <li><a href="https://clever.ertelecom.ru/content/space/4/article/12267"
                                       className="text-blue-600 hover:underline text-sm">Обслуживание СИ</a></li>
                                <li><a
                                    href="https://clever.ertelecom.ru/content/space/4/article/7250/page/0?text=%D0%A1%D0%A0%D0%9E%D0%9A%D0%98+%D0%9E%D0%91%D0%A0%D0%90%D0%A2%D0%9D%D0%9E%D0%93%D0%9E+%D0%9F%D0%9E%D0%94%D0%9A%D0%9B%D0%AE%D0%A7%D0%95%D0%9D%D0%98%D0%AF"
                                    className="text-blue-600 hover:underline text-sm">ТВ после ДЗ</a></li>
                                <li><a href="https://genesys.domru.ru/outbound/outmessages"
                                       className="text-blue-600 hover:underline text-sm">Outmessage</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold text-gray-800">Статистика</h4>
                            <ul>
                                <li><a href="https://okc.ertelecom.ru/yii/ure/report/index"
                                       className="text-blue-600 hover:underline text-sm">URE</a></li>
                                <li><a href="https://okc.ertelecom.ru/yii/premium/ntp-nck/spec_month"
                                       className="text-blue-600 hover:underline text-sm">Премия</a></li>
                                <li><a href="https://okc.ertelecom.ru/yii/gok/detail/ntpNck"
                                       className="text-blue-600 hover:underline text-sm">Гок</a></li>
                                <li><a href="https://okc.ertelecom.ru/yii/csi/report/index"
                                       className="text-blue-600 hover:underline text-sm">Оценки CSI</a></li>
                                <li><a href="https://okc.ertelecom.ru/yii/appl/thanks/index"
                                       className="text-blue-600 hover:underline text-sm">Благодарности</a></li>
                                <li><a href="https://okc.ertelecom.ru/yii/sales/report/index"
                                       className="text-blue-600 hover:underline text-sm">Отчет по продажам</a></li>
                            </ul>

                            <h4 className="font-bold mt-4 text-gray-800">Обучение</h4>
                            <ul>
                                <li><a href="https://okc.ertelecom.ru/yii/testing/lk/profile"
                                       className="text-blue-600 hover:underline text-sm">Тесты</a></li>
                                <li><a href="https://clever.ertelecom.ru/content/space/4/article/8036"
                                       className="text-blue-600 hover:underline text-sm">Электронные курсы</a></li>
                                <li><a href="https://clever.ertelecom.ru/content/space/4/article/2677"
                                       className="text-blue-600 hover:underline text-sm">Гайд по АРМу</a></li>
                                <li><a href="https://clever.ertelecom.ru/content/space/4/article/2504"
                                       className="text-blue-600 hover:underline text-sm">Гайд по EQM Starter</a></li>
                            </ul>

                            <h4 className="font-bold mt-4 mb-3 text-gray-800">Эмуляторы</h4>
                            <ul>
                                <li><a href="https://pixso.net/app/prototype/wmfMLXVpsAjx4Z6JpivhFQ"
                                       className="text-blue-600 hover:underline text-sm">Приставки Movix</a></li>
                                <li><a href="https://pixso.net/app/prototype/0qOfm72G_hZvpMK1wAZJTQ"
                                       className="text-blue-600 hover:underline text-sm">МП Movix</a></li>
                                <li><a href="https://pixso.net/app/prototype/x3PchRZCqy6LPHuRPrV1vQ"
                                       className="text-blue-600 hover:underline text-sm">МП Умный Дом.ру</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold text-gray-800">Интернет</h4>
                            <ul>
                                <li>
                                    <a href="http://octptest.corp.ertelecom.loc/diagnostic-results"
                                       className="text-blue-600 hover:underline text-sm">FTP</a>
                                    {': '}
                                    <a href="http://octptest.corp.ertelecom.loc/diagnostic-results/perm/?C=M;O=D"
                                       className="text-blue-600 hover:underline text-sm">ПК</a>
                                </li>
                                <li><a href="https://provisioning.ertelecom.ru/devices"
                                       className="text-blue-600 hover:underline text-sm">Провижининг</a></li>
                            </ul>

                            <h4 className="font-bold mt-4 mb-3 text-gray-800">Телевидение</h4>
                            <ul>
                                <li>
                                    ЧТП:
                                    <a href="https://clever.ertelecom.ru/content/space/4/article/12409"
                                       className="text-blue-600 hover:underline text-sm ml-1">КТВ</a>
                                    {' / '}
                                    <a href="https://clever.ertelecom.ru/content/space/4/article/8887"
                                       className="text-blue-600 hover:underline text-sm">ЦКТВ</a>
                                </li>
                                <li><a href="http://cpe.domru.ru/tv/swupdate_primary/STB/add_nuid_and_version.php"
                                       className="text-blue-600 hover:underline text-sm">Прошивка приставок</a></li>
                                <li><a href="https://cms.ertelecom.ru"
                                       className="text-blue-600 hover:underline text-sm">Сброс ПИНа</a></li>
                            </ul>

                            <h4 className="font-bold mt-4 text-gray-800">Полезное</h4>
                            <ul>
                                <li><a href="https://flomaster.chrsnv.ru"
                                       className="text-blue-600 hover:underline text-sm">Фломастер (РМы)</a></li>
                                <li><a href="https://okc.ertelecom.ru/yii/appl/chart/index"
                                       className="text-blue-600 hover:underline text-sm">Обращения в КЦ</a></li>
                                <li><a href="https://clever.ertelecom.ru/content/space/4/article/1625"
                                       className="text-blue-600 hover:underline text-sm">Разблокировка логинов</a></li>
                                <li><a href="https://mh-dashboard-erth.proptech.ru/web/"
                                       className="text-blue-600 hover:underline text-sm">Дашборд домофонии</a></li>
                                <li><a href="http://10.121.15.99/lenta"
                                       className="text-blue-600 hover:underline text-sm">Генератор ленты</a></li>
                            </ul>
                        </div>
                    </div>
                )}

                {activeTab === 'Инструменты' && (
                    <div className="space-y-3">
                        <ToolInput
                            label="Проверка MAC"
                            value={tools.macAddress}
                            onChange={(v) => setTools(prev => ({...prev, macAddress: v}))}
                            placeholder="Введи MAC"
                            buttonLabel="Проверить"
                            onAction={handleMacLookup}
                        />

                        {macResult && (
                            <div className={`px-4 py-3 rounded-lg border ${
                                macResult.error
                                    ? 'bg-red-50 border-red-200 text-red-800'
                                    : 'bg-green-50 border-green-200 text-green-800'
                            }`}>
                                {macResult.error ? (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm">❌</span>
                                        <span className="text-sm font-medium">{macResult.error}</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm">✓</span>
                                        <div className="text-sm">
                                            <span className="font-medium">Производитель:</span>{' '}
                                            <span>{macResult.company}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
