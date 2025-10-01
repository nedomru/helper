import React, { useState, useEffect, useMemo } from 'react';
import { fetchMNAData, fetchRoutersData, type MNAProvider, type Router } from '../../utils/api';

type Tab = 'Главная' | 'MnA' | 'Роутеры' | 'РМы' | 'Инструменты';

export default function Popup() {
  const [activeTab, setActiveTab] = useState<Tab>('Главная');
  const [searchProvider, setSearchProvider] = useState('');
  const [searchRouter, setSearchRouter] = useState('');
  const [macAddress, setMacAddress] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [link, setLink] = useState('');
  const [specialist, setSpecialist] = useState('');

  const [mnaData, setMnaData] = useState<MNAProvider[]>([]);
  const [routersData, setRoutersData] = useState<Router[]>([]);
  const [loadingMna, setLoadingMna] = useState(false);
  const [loadingRouters, setLoadingRouters] = useState(false);

  const handleOpenSettings = () => {
    chrome.runtime.openOptionsPage();
  };

  const handleOpenTelegram = () => {
    window.open('https://t.me/+jH1mblw0ytcwOWUy', '_blank');
  };

  const handleOpenDonate = () => {
    window.open('https://donate.url', '_blank');
  };

  useEffect(() => {
    if (activeTab === 'MnA' && mnaData.length === 0) {
      setLoadingMna(true);
      fetchMNAData()
        .then((data) => {
          setMnaData(data.mna);
        })
        .catch((error) => {
          console.error('Error loading MNA data:', error);
        })
        .finally(() => {
          setLoadingMna(false);
        });
    }
  }, [activeTab, mnaData.length]);

  useEffect(() => {
    if (activeTab === 'Роутеры' && routersData.length === 0) {
      setLoadingRouters(true);
      fetchRoutersData()
        .then((data) => {
          setRoutersData(data.routers);
        })
        .catch((error) => {
          console.error('Error loading routers data:', error);
        })
        .finally(() => {
          setLoadingRouters(false);
        });
    }
  }, [activeTab, routersData.length]);

  const filteredMnaData = useMemo(() => {
    if (!searchProvider) return mnaData;
    const search = searchProvider.toUpperCase();
    return mnaData.filter(
      (provider) =>
        provider.name.toUpperCase().includes(search) ||
        provider.authorization.toUpperCase().includes(search) ||
        provider.connection.toUpperCase().includes(search)
    );
  }, [mnaData, searchProvider]);

  const filteredRoutersData = useMemo(() => {
    if (!searchRouter) return routersData;
    const search = searchRouter.toUpperCase();
    return routersData.filter((router) =>
      router.Name.toUpperCase().includes(search) ||
      router.Settings.toUpperCase().includes(search)
    );
  }, [routersData, searchRouter]);

  const createLinkOrText = (value: string | string[], text: string, isEmulator = false) => {
    if (value === 'Нет') {
      return 'Нет';
    }
    if (isEmulator && Array.isArray(value)) {
      return value.map((link, index) => (
        <React.Fragment key={link}>
          {index > 0 && ', '}
          <a href={link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            {text}
          </a>
        </React.Fragment>
      ));
    }
    if (Array.isArray(value)) {
      return (
        <a href={value[0]} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
          {text}
        </a>
      );
    }
    return (
      <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
        {text}
      </a>
    );
  };

  return (
    <div className="w-[640px] min-h-[580px] bg-white">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-4 border-b border-gray-200">
        <div className="flex gap-1">
          {(['Главная', 'MnA', 'Роутеры', 'РМы', 'Инструменты'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-blue-600 border border-blue-600 hover:bg-blue-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex gap-1 ml-auto">
          <button
            onClick={handleOpenSettings}
            className="px-3 py-1.5 text-sm border border-blue-600 text-blue-600 rounded hover:bg-blue-50 transition-colors"
            title="Перейти в настройки"
          >
            ⚙️
          </button>
          <button
            onClick={handleOpenTelegram}
            className="px-3 py-1.5 text-sm border border-blue-600 text-blue-600 rounded hover:bg-blue-50 transition-colors flex items-center"
            title="Перейти в Telegram"
          >
            <svg height="16" viewBox="0 0 240.1 240.1" width="16" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient gradientUnits="userSpaceOnUse" id="telegram-gradient" x1="120.1" x2="120.1" y1="0" y2="240.1">
                  <stop offset="0" style={{stopColor:'#2AABEE'}}/>
                  <stop offset="1" style={{stopColor:'#229ED9'}}/>
                </linearGradient>
              </defs>
              <circle cx="120.1" cy="120.1" fill="url(#telegram-gradient)" r="120.1"/>
              <path d="M54.3,118.8c35-15.2,58.3-25.3,70-30.2c33.3-13.9,40.3-16.3,44.8-16.4c1,0,3.2,0.2,4.7,1.4 c1.2,1,1.5,2.3,1.7,3.3s0.4,3.1,0.2,4.7c-1.8,19-9.6,65.1-13.6,86.3c-1.7,9-5,12-8.2,12.3c-7,0.6-12.3-4.6-19-9 c-10.6-6.9-16.5-11.2-26.8-18c-11.9-7.8-4.2-12.1,2.6-19.1c1.8-1.8,32.5-29.8,33.1-32.3c0.1-0.3,0.1-1.5-0.6-2.1 c-0.7-0.6-1.7-0.4-2.5-0.2c-1.1,0.2-17.9,11.4-50.6,33.5c-4.8,3.3-9.1,4.9-13,4.8c-4.3-0.1-12.5-2.4-18.7-4.4 c-7.5-2.4-13.5-3.7-13-7.9C45.7,123.3,48.7,121.1,54.3,118.8z"
                fill="#FFFFFF"/>
            </svg>
          </button>
          <button
            onClick={handleOpenDonate}
            className="px-3 py-1.5 text-sm border border-blue-600 text-blue-600 rounded hover:bg-blue-50 transition-colors"
            title="Поддержать проект"
          >
            💰
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {activeTab === 'Главная' && (
          <div className="grid grid-cols-3 gap-6">
            <div>
              <h4 className="font-bold text-gray-800">Главное</h4>
              <ul>
                <li><a href="http://genesys-app1.cc4.ertelecom.ru:82/ui/ad/v1/index.html" className="text-blue-600 hover:underline text-sm">Генезис</a></li>
                <li><a href="https://perm.db.ertelecom.ru/cgi-bin/ppo/excells/wcc_main.entry_continue" className="text-blue-600 hover:underline text-sm">Веб-АРМ</a></li>
                <li><a href="https://okc2.ertelecom.ru/yii/breaks/ntp-nck" className="text-blue-600 hover:underline text-sm">Перерывы</a></li>
                <li><a href="https://clever.ertelecom.ru" className="text-blue-600 hover:underline text-sm">Clever</a></li>
                <li><a href="https://mail.domru.ru/owa/" className="text-blue-600 hover:underline text-sm">Почта</a></li>
              </ul>

              <h4 className="font-bold mt-4 text-gray-800">Линии</h4>
              <ul>
                <li><a href="https://okc2.ertelecom.ru/yii/genesys-ntp/line" className="text-blue-600 hover:underline text-sm">НЦК</a></li>
                <li>
                  <a href="https://okc2.ertelecom.ru/yii/line_ts/ntp1/index" className="text-blue-600 hover:underline text-sm">НТП1</a>
                  {' / '}
                  <a href="https://okc2.ertelecom.ru/yii/line_ts/ntp2/index" className="text-blue-600 hover:underline text-sm">НТП2</a>
                </li>
              </ul>

              <h4 className="font-bold mt-4 text-gray-800">Графики</h4>
              <ul>
                <li><a href="https://okc2.ertelecom.ru/wfm/vueapp/personal" className="text-blue-600 hover:underline text-sm">Личный</a></li>
                <li>
                  <a href="https://okc2.ertelecom.ru/wfm/vueapp/day" className="text-blue-600 hover:underline text-sm">День</a>
                  {' / '}
                  <a href="https://okc2.ertelecom.ru/wfm/vueapp/month" className="text-blue-600 hover:underline text-sm">Месяц</a>
                </li>
              </ul>

              <h4 className="font-bold mt-4 text-gray-800">Регламенты</h4>
              <ul>
                <li><a href="https://clever.ertelecom.ru/content/space/4/article/6366/page/2" className="text-blue-600 hover:underline text-sm">Платный сервис</a></li>
                <li><a href="https://clever.ertelecom.ru/content/space/4/article/12267" className="text-blue-600 hover:underline text-sm">Обслуживание СИ</a></li>
                <li><a href="https://clever.ertelecom.ru/content/space/4/article/7250/page/0?text=%D0%A1%D0%A0%D0%9E%D0%9A%D0%98+%D0%9E%D0%91%D0%A0%D0%90%D0%A2%D0%9D%D0%9E%D0%93%D0%9E+%D0%9F%D0%9E%D0%94%D0%9A%D0%9B%D0%AE%D0%A7%D0%95%D0%9D%D0%98%D0%AF" className="text-blue-600 hover:underline text-sm">ТВ после ДЗ</a></li>
                <li><a href="https://genesys.domru.ru/outbound/outmessages" className="text-blue-600 hover:underline text-sm">Outmessage</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-gray-800">Статистика</h4>
              <ul>
                <li><a href="https://okc2.ertelecom.ru/yii/ure/report/index" className="text-blue-600 hover:underline text-sm">URE</a></li>
                <li><a href="https://okc2.ertelecom.ru/yii/premium/ntp-nck/spec_month" className="text-blue-600 hover:underline text-sm">Премия</a></li>
                <li><a href="https://okc2.ertelecom.ru/yii/gok/detail/ntpNck" className="text-blue-600 hover:underline text-sm">Гок</a></li>
                <li><a href="https://okc2.ertelecom.ru/yii/csi/report/index" className="text-blue-600 hover:underline text-sm">Оценки CSI</a></li>
                <li><a href="https://okc2.ertelecom.ru/yii/appl/thanks/index" className="text-blue-600 hover:underline text-sm">Благодарности</a></li>
                <li><a href="https://okc2.ertelecom.ru/yii/sales/report/index" className="text-blue-600 hover:underline text-sm">Отчет по продажам</a></li>
              </ul>

              <h4 className="font-bold mt-4 text-gray-800">Обучение</h4>
              <ul>
                <li><a href="https://okc2.ertelecom.ru/yii/testing/lk/profile" className="text-blue-600 hover:underline text-sm">Тесты</a></li>
                <li><a href="https://clever.ertelecom.ru/content/space/4/article/8036" className="text-blue-600 hover:underline text-sm">Электронные курсы</a></li>
                <li><a href="https://clever.ertelecom.ru/content/space/4/article/2677" className="text-blue-600 hover:underline text-sm">Гайд по АРМу</a></li>
                <li><a href="https://clever.ertelecom.ru/content/space/4/article/2504" className="text-blue-600 hover:underline text-sm">Гайд по EQM Starter</a></li>
              </ul>

              <h4 className="font-bold mt-4 mb-3 text-gray-800">Эмуляторы</h4>
              <ul>
                <li><a href="https://pixso.net/app/prototype/wmfMLXVpsAjx4Z6JpivhFQ" className="text-blue-600 hover:underline text-sm">Приставки Movix</a></li>
                <li><a href="https://pixso.net/app/prototype/0qOfm72G_hZvpMK1wAZJTQ" className="text-blue-600 hover:underline text-sm">МП Movix</a></li>
                <li><a href="https://pixso.net/app/prototype/x3PchRZCqy6LPHuRPrV1vQ" className="text-blue-600 hover:underline text-sm">МП Умный Дом.ру</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-gray-800">Интернет</h4>
              <ul>
                <li>
                  <a href="http://octptest.corp.ertelecom.loc/diagnostic-results" className="text-blue-600 hover:underline text-sm">FTP</a>
                  {': '}
                  <a href="http://octptest.corp.ertelecom.loc/diagnostic-results/perm/?C=M;O=D" className="text-blue-600 hover:underline text-sm">ПК</a>
                </li>
                <li><a href="https://provisioning.ertelecom.ru/devices" className="text-blue-600 hover:underline text-sm">Провижининг</a></li>
              </ul>

              <h4 className="font-bold mt-4 mb-3 text-gray-800">Телевидение</h4>
              <ul>
                <li>
                  ЧТП:
                  <a href="https://clever.ertelecom.ru/content/space/4/article/12409" className="text-blue-600 hover:underline text-sm ml-1">КТВ</a>
                  {' / '}
                  <a href="https://clever.ertelecom.ru/content/space/4/article/8887" className="text-blue-600 hover:underline text-sm">ЦКТВ</a>
                </li>
                <li><a href="http://cpe.domru.ru/tv/swupdate_primary/STB/add_nuid_and_version.php" className="text-blue-600 hover:underline text-sm">Прошивка приставок</a></li>
                <li><a href="https://cms.ertelecom.ru" className="text-blue-600 hover:underline text-sm">Сброс ПИНа</a></li>
              </ul>

              <h4 className="font-bold mt-4 text-gray-800">Полезное</h4>
              <ul>
                <li><a href="https://flomaster.chrsnv.ru" className="text-blue-600 hover:underline text-sm">Фломастер (РМы)</a></li>
                <li><a href="https://okc2.ertelecom.ru/yii/appl/chart/index" className="text-blue-600 hover:underline text-sm">Обращения в КЦ</a></li>
                <li><a href="https://clever.ertelecom.ru/content/space/4/article/1625" className="text-blue-600 hover:underline text-sm">Разблокировка логинов</a></li>
                <li><a href="https://mh-dashboard-erth.proptech.ru/web/" className="text-blue-600 hover:underline text-sm">Дашборд домофонии</a></li>
                <li><a href="http://10.121.15.99/lenta" className="text-blue-600 hover:underline text-sm">Генератор ленты</a></li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'MnA' && (
          <div>
            <input
              type="text"
              value={searchProvider}
              onChange={(e) => setSearchProvider(e.target.value)}
              placeholder="Поиск провайдера"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              autoFocus
            />
            {loadingMna ? (
              <div className="text-center py-8 text-gray-600">Загрузка данных...</div>
            ) : (
              <div className="overflow-auto" style={{ maxHeight: '480px' }}>
                <table className="w-full border-collapse border border-gray-300 text-sm">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="border border-gray-300 px-3 py-2 text-left">Провайдер</th>
                      <th className="border border-gray-300 px-3 py-2 text-left">Авторизация</th>
                      <th className="border border-gray-300 px-3 py-2 text-left">Подключение</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMnaData.map((provider, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-3 py-2">
                          <a href={provider.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {provider.name}
                          </a>
                        </td>
                        <td className="border border-gray-300 px-3 py-2">{provider.authorization}</td>
                        <td className="border border-gray-300 px-3 py-2">{provider.connection}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'Роутеры' && (
          <div>
            <input
              type="text"
              value={searchRouter}
              onChange={(e) => setSearchRouter(e.target.value)}
              placeholder="Поиск роутера"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              autoFocus
            />
            {loadingRouters ? (
              <div className="text-center py-8 text-gray-600">Загрузка данных...</div>
            ) : (
              <div className="overflow-y-auto" style={{ maxHeight: '480px' }}>
                <table className="w-full border-collapse border border-gray-300 text-xs table-fixed">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="border border-gray-300 px-1 py-1 text-left" style={{ width: '20%' }}>Название</th>
                      <th className="border border-gray-300 px-1 py-1 text-left" style={{ width: '10%' }}>PPPoE</th>
                      <th className="border border-gray-300 px-1 py-1 text-left" style={{ width: '10%' }}>DHCP</th>
                      <th className="border border-gray-300 px-1 py-1 text-left" style={{ width: '10%' }}>IPoE</th>
                      <th className="border border-gray-300 px-1 py-1 text-left" style={{ width: '10%' }}>Каналы</th>
                      <th className="border border-gray-300 px-1 py-1 text-left" style={{ width: '15%' }}>Интерфейс</th>
                      <th className="border border-gray-300 px-1 py-1 text-left" style={{ width: '10%' }}>БЗ</th>
                      <th className="border border-gray-300 px-1 py-1 text-left" style={{ width: '15%' }}>Эмулятор</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRoutersData.map((router, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-1 py-1 break-words">{router.Name}</td>
                        <td className="border border-gray-300 px-1 py-1 break-words">{createLinkOrText(router.PPPoE, 'PPPoE')}</td>
                        <td className="border border-gray-300 px-1 py-1 break-words">{createLinkOrText(router.DHCP, 'DHCP')}</td>
                        <td className="border border-gray-300 px-1 py-1 break-words">{createLinkOrText(router.IPoE, 'IPoE')}</td>
                        <td className="border border-gray-300 px-1 py-1 break-words">{createLinkOrText(router.Channels, 'Каналы')}</td>
                        <td className="border border-gray-300 px-1 py-1 break-words">{router.Settings}</td>
                        <td className="border border-gray-300 px-1 py-1 break-words">{createLinkOrText(router.BZ, 'БЗ')}</td>
                        <td className="border border-gray-300 px-1 py-1 break-words">{createLinkOrText(router.Emulator, 'Эмулятор', true)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'РМы' && (
          <div className="border border-gray-300 overflow-hidden w-full" style={{ height: '527px' }}>
            <iframe
              src="https://flomaster.chrsnv.ru/phrases"
              className="w-full h-full border-0"
              loading="lazy"
              sandbox="allow-downloads allow-scripts allow-same-origin allow-popups allow-forms"
              referrerPolicy="no-referrer"
            />
          </div>
        )}

        {activeTab === 'Инструменты' && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <span className="w-40 px-3 py-2 bg-gray-100 border border-gray-300 rounded text-sm flex items-center">Проверка MAC</span>
              <input
                type="text"
                value={macAddress}
                onChange={(e) => setMacAddress(e.target.value)}
                placeholder="Введи MAC"
                className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors text-sm">
                Проверить
              </button>
            </div>

            <div className="flex gap-2">
              <span className="w-40 px-3 py-2 bg-gray-100 border border-gray-300 rounded text-sm flex items-center">Проверка IP</span>
              <input
                type="text"
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
                placeholder="Введи IP"
                className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors text-sm">
                Проверить
              </button>
            </div>

            <div className="flex gap-2">
              <span className="w-40 px-3 py-2 bg-gray-100 border border-gray-300 rounded text-sm flex items-center">Сокращ. ссылок</span>
              <input
                type="text"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="Введи ссылку"
                className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors text-sm">
                Сократить
              </button>
            </div>

            <div className="flex gap-2">
              <span className="w-40 px-3 py-2 bg-gray-100 border border-gray-300 rounded text-sm flex items-center">Проверка спеца</span>
              <input
                type="text"
                value={specialist}
                onChange={(e) => setSpecialist(e.target.value)}
                placeholder="Введи фамилию и имя"
                className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors text-sm">
                Проверить
              </button>
            </div>

            <div className="flex gap-2">
              <span className="w-32 px-3 py-2 bg-gray-100 border border-gray-300 rounded text-sm flex items-center">Премия</span>
              <select className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                <option value="specialist">Спец</option>
                <option value="head">РГ</option>
              </select>
              <select className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                <option value="1">Январь</option>
                <option value="2">Февраль</option>
                <option value="3">Март</option>
                <option value="4">Апрель</option>
                <option value="5">Май</option>
                <option value="6">Июнь</option>
                <option value="7">Июль</option>
                <option value="8">Август</option>
                <option value="9">Сентябрь</option>
                <option value="10">Октябрь</option>
                <option value="11">Ноябрь</option>
                <option value="12">Декабрь</option>
              </select>
              <select className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                <option value="2025">2025</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
              </select>
              <input
                type="text"
                placeholder="Часы"
                className="w-20 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <button className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors text-sm">
                Проверить
              </button>
            </div>

            <div id="specialist-results" className="mt-4"></div>
            <div id="result-container" className="mt-4"></div>
          </div>
        )}
      </div>
    </div>
  );
}
