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
            {key: 'customChatColors', label: 'Кастомные цвета', description: 'Использовать кастомные цвета чата'},
            {
                key: 'customChatSounds',
                label: 'Кастомные звуки',
                description: 'Использовать кастомные звуки уведомлений',
            },
        ],
    },
];
