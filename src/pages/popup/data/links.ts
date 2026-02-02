import type {LinkCategory} from '../types';

export const LINKS_DATA: LinkCategory[] = [
    {
        title: 'Главное',
        links: [
            {href: 'http://genesys-app1.cc4.ertelecom.ru:82/ui/ad/v1/index.html', label: 'Генезис'},
            {href: 'https://perm.db.ertelecom.ru/cgi-bin/ppo/excells/wcc_main.entry_continue', label: 'Веб-АРМ'},
            {href: 'https://okc.ertelecom.ru/yii/breaks/ntp-nck', label: 'Перерывы'},
            {href: 'https://clever.ertelecom.ru', label: 'Clever'},
            {href: 'https://mail.domru.ru/owa/', label: 'Почта'},
        ],
    },
    {
        title: 'Линии',
        links: [
            {href: 'https://okc.ertelecom.ru/yii/genesys-ntp/line', label: 'НЦК'},
            {href: 'https://okc.ertelecom.ru/yii/line_ts/ntp1/index', label: 'НТП1'},
            {href: 'https://okc.ertelecom.ru/yii/line_ts/ntp2/index', label: 'НТП2'},
        ],
    },
    {
        title: 'Графики',
        links: [
            {href: 'https://okc.ertelecom.ru/wfm/vueapp/personal', label: 'Личный'},
            {href: 'https://okc.ertelecom.ru/wfm/vueapp/day', label: 'День'},
            {href: 'https://okc.ertelecom.ru/wfm/vueapp/month', label: 'Месяц'},
        ],
    },
    {
        title: 'Регламенты',
        links: [
            {href: 'https://clever.ertelecom.ru/content/space/4/article/6366/page/2', label: 'Платный сервис'},
            {href: 'https://clever.ertelecom.ru/content/space/4/article/12267', label: 'Обслуживание СИ'},
            {
                href: 'https://clever.ertelecom.ru/content/space/4/article/7250/page/0?text=%D0%A1%D0%A0%D0%9E%D0%9A%D0%98+%D0%9E%D0%91%D0%A0%D0%90%D0%A2%D0%9D%D0%9E%D0%93%D0%9E+%D0%9F%D0%9E%D0%94%D0%9A%D0%9B%D0%AE%D0%A7%D0%95%D0%9D%D0%98%D0%AF',
                label: 'ТВ после ДЗ',
            },
            {href: 'https://genesys.domru.ru/outbound/outmessages', label: 'Outmessage'},
        ],
    },
    {
        title: 'Статистика',
        links: [
            {href: 'https://okc.ertelecom.ru/yii/ure/report/index', label: 'URE'},
            {href: 'https://okc.ertelecom.ru/yii/premium/ntp-nck/spec_month', label: 'Премия'},
            {href: 'https://okc.ertelecom.ru/yii/gok/detail/ntpNck', label: 'Гок'},
            {href: 'https://okc.ertelecom.ru/yii/csi/report/index', label: 'Оценки CSI'},
            {href: 'https://okc.ertelecom.ru/yii/appl/thanks/index', label: 'Благодарности'},
            {href: 'https://okc.ertelecom.ru/yii/sales/report/index', label: 'Отчет по продажам'},
        ],
    },
    {
        title: 'Обучение',
        links: [
            {href: 'https://okc.ertelecom.ru/yii/testing/lk/profile', label: 'Тесты'},
            {href: 'https://clever.ertelecom.ru/content/space/4/article/8036', label: 'Электронные курсы'},
            {href: 'https://clever.ertelecom.ru/content/space/4/article/2677', label: 'Гайд по АРМу'},
            {href: 'https://clever.ertelecom.ru/content/space/4/article/2504', label: 'Гайд по EQM Starter'},
        ],
    },
    {
        title: 'Интернет',
        links: [
            {href: 'http://octptest.corp.ertelecom.loc/diagnostic-results/perm/?C=M;O=D', label: 'FTP'},
            {href: 'https://provisioning.ertelecom.ru/devices', label: 'Провижининг'},
        ],
    },
    {
        title: 'Телевидение',
        links: [
            {href: 'https://clever.ertelecom.ru/content/space/4/article/12409', label: 'ЧТП КТВ'},
            {href: 'https://clever.ertelecom.ru/content/space/4/article/8887', label: 'ЧТП ЦКТВ'},
            {href: 'http://cpe.domru.ru/tv/swupdate_primary/STB/add_nuid_and_version.php', label: 'Прошивка приставок'},
            {href: 'https://cms.ertelecom.ru', label: 'Сброс ПИНа'},
        ],
        noMargin: true,
    },
    {
        title: 'Эмуляторы',
        links: [
            {href: 'https://pixso.net/app/prototype/wmfMLXVpsAjx4Z6JpivhFQ', label: 'Приставки Movix'},
            {href: 'https://pixso.net/app/prototype/0qOfm72G_hZvpMK1wAZJTQ', label: 'МП Movix'},
            {href: 'https://pixso.net/app/prototype/x3PchRZCqy6LPHuRPrV1vQ', label: 'МП Умный Дом.ру'},
        ],
        noMargin: true,
    },
    {
        title: 'Полезное',
        links: [
            {href: 'https://flomaster.chrsnv.ru', label: 'Фломастер (РМы)'},
            {href: 'https://okc.ertelecom.ru/yii/appl/chart/index', label: 'Обращения в КЦ'},
            {href: 'https://clever.ertelecom.ru/content/space/4/article/1625', label: 'Разблокировка логинов'},
            {href: 'https://mh-dashboard-erth.proptech.ru/web/', label: 'Дашборд домофонии'},
            {href: 'http://10.121.15.99/lenta', label: 'Генератор ленты'},
        ],
    },
];

export const COLUMNS_COUNT = 3;
