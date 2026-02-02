export interface Feature {
    key: string;
    label: string;
    description: string;
}

export interface FeatureGroup {
    title: string;
    icon: string;
    description: string;
    features: Feature[];
    isCustom?: boolean;
}

export const armFeatureGroups: FeatureGroup[] = [
    {
        title: 'Сворачивание',
        icon: '📁',
        description: 'Управление отображением вкладок и панелей',
        features: [],
        isCustom: true,
    },
    {
        title: 'Скрытие вкладок',
        icon: '👁️',
        description: 'Выберите вкладки, которые нужно скрыть в АРМ',
        features: [],
        isCustom: true,
    },
    {
        title: 'Удаление',
        icon: '📁',
        description: 'Управление удалений информации',
        features: [
            {
                key: 'removeDiagnosticTabs',
                label: 'Вкладки диагностики',
                description:
                    'Удаляет ненужные вкладки диагностики EQM:\nВосстановление сброшенных данных, Диагностика абонентского устройств, Диагностика сети НТК',
            },
            {
                key: 'removeAppealsColumns',
                label: 'Колонки обращений',
                description: 'Удаляет ненужные колонки обращений:\nОборудование, Продукт, Платформа, Исполнитель',
            },
        ],
    },
    {
        title: 'Быстрые обращения',
        icon: '⚡',
        description: 'Создание быстрых шаблонов для обращений',
        features: [],
        isCustom: true,
    },
];

export const genesysFeatureGroups: FeatureGroup[] = [
    {
        title: 'Интерфейс',
        icon: '🖥️',
        description: 'Настройки интерфейса Genesys',
        features: [
            {key: 'showLineStatus', label: 'Статус линии', description: 'Показывать статус линии (слоты, аварии)'},
            {key: 'showDutyMessages', label: 'Сообщения дежурных', description: 'Отображать сообщения дежурных'},
            {key: 'hideButtons', label: 'Скрыть бесполезные кнопки', description: 'Скрыть ненужные кнопки'},
            {key: 'showClock', label: 'Отображать таймер', description: 'Включает таймер в верхнюю панель Генезиса'},
        ],
    },
    {
        title: 'Чат',
        icon: '💬',
        description: 'Настройки чата',
        features: [
            {
                key: 'allowChatSizeEdit',
                label: 'Изменение размера',
                description: 'Разрешить изменение размера окна чата',
            },
            {
                key: 'autoCollapseChatHeader',
                label: 'Автосворачивание заголовка',
                description: 'Автоматически сворачивать заголовок нового чата',
            },
            {
                key: 'allowPaste',
                label: 'Вставка изображений',
                description: 'Разрешить вставку изображений из буфера',
            },
            {
                key: 'autoClose',
                label: 'Виджет автозакрытия чата',
                description: 'Добавляет виджет автозакрытия чата по таймеру'
            },
            {
                key: 'ctrlClose',
                label: 'Закрытие чата при отправке',
                description: 'Позволяет закрыть чат сразу при отправке сообщения ПРИ НАЖАТИИ CTRL+Отправить'
            },
            {
                key: 'showPresets',
                label: 'Отображение пресетов РМов',
                description: 'Добавляет виджет РМов в быстрый доступ к чату'
            },
        ],
    },
    {
        title: 'Кастомные цвета',
        icon: '🎨',
        description: 'Настройка цветов чата',
        features: [],
        isCustom: true,
    },
    {
        title: 'Кастомные звуки',
        icon: '🔔',
        description: 'Настройка звуков уведомлений чата',
        features: [],
        isCustom: true,
    },
];

export const extensionFeatureGroups: FeatureGroup[] = [
    {
        title: 'Обновления',
        icon: '🔄',
        description: 'Управление каналами обновлений',
        features: [],
        isCustom: true,
    },
];
