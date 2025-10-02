# Content Script Initialization System

Модульная система инициализации content scripts с поддержкой условной загрузки функций на основе настроек пользователя.

## Основные возможности

- 🚀 **Высокая производительность**: Параллельное выполнение функций, кеширование настроек
- 🎯 **URL-based роутинг**: Автоматический запуск функций на нужных страницах
- ⚙️ **Условная загрузка**: Функции запускаются только если пользователь включил соответствующую настройку
- 🔧 **Модульность**: Легко добавлять новые модули (ARM, Genesys, Line и т.д.)
- 📦 **Singleton паттерн**: Единая точка инициализации для всех модулей

## Структура

```
src/pages/content/
├── core/
│   ├── types.ts           # TypeScript типы
│   ├── initializer.ts     # Основной класс инициализации
│   └── README.md          # Документация
├── arm/
│   ├── config.ts          # Конфигурация страниц ARM
│   ├── init.ts            # Точка входа для ARM
│   └── utility.ts         # Утилиты ARM
├── genesys/
│   ├── config.ts          # Конфигурация страниц Genesys
│   └── init.ts            # Точка входа для Genesys
└── line/
    ├── config.ts          # Конфигурация страниц Line
    └── init.ts            # Точка входа для Line
```

## Использование

### 1. Создание конфигурации страницы

```typescript
// src/pages/content/mymodule/config.ts
import type {PageConfig} from '../core/types';
import {myFeature, myOtherFeature} from './features';

export const myModuleConfigs: PageConfig[] = [
    {
        // Паттерн URL (строка или массив строк)
        pattern: "example.com/dashboard",

        // Функции, которые запускаются только если пользователь включил настройку
        features: [
            {key: 'MY_enableFeature', handler: myFeature},
            {key: 'MY_enableOtherFeature', handler: myOtherFeature}
        ],

        // Функции, которые всегда запускаются на этой странице
        alwaysRun: [
            async () => {
                console.log('This always runs');
            }
        ]
    },

    // Можно использовать массив паттернов
    {
        pattern: ["example.com/page1", "example.com/page2"],
        features: [
            {key: 'SHARED_feature', handler: sharedFeature}
        ]
    }
];
```

### 2. Инициализация модуля

```typescript
// src/pages/content/mymodule/init.ts
import {initializer} from '../core/initializer';
import {myModuleConfigs} from './config';

initializer.initialize(myModuleConfigs).catch((error) => {
    console.error('[MyModule] - Ошибка инициализации:', error);
});
```

### 3. Добавление в manifest.json

```json
{
  "content_scripts": [
    {
      "matches": [
        "*://example.com/*"
      ],
      "js": [
        "src/pages/content/mymodule/init.js"
      ]
    }
  ]
}
```

## Примеры

### Пример 1: Простая страница с одной функцией

```typescript
export const simpleConfig: PageConfig[] = [
    {
        pattern: "example.com/simple",
        features: [
            {key: 'ENABLE_COPY', handler: allowCopy}
        ]
    }
];
```

### Пример 2: Страница с условными и безусловными функциями

```typescript
export const complexConfig: PageConfig[] = [
    {
        pattern: "example.com/complex",
        features: [
            {key: 'ENABLE_FEATURE_A', handler: featureA},
            {key: 'ENABLE_FEATURE_B', handler: featureB}
        ],
        alwaysRun: [
            initializeUI,
            loadDefaultData
        ]
    }
];
```

### Пример 3: Множественные паттерны

```typescript
export const multiPatternConfig: PageConfig[] = [
    {
        pattern: [
            "example.com/dashboard",
            "example.com/admin",
            "example.com/settings"
        ],
        features: [
            {key: 'ADMIN_TOOLS', handler: enableAdminTools}
        ]
    }
];
```

## API

### ContentInitializer

#### `initialize(configs: PageConfig[]): Promise<void>`

Инициализирует все подходящие страницы из массива конфигураций.

- Автоматически фильтрует конфигурации по URL
- Выполняет функции параллельно для максимальной производительности
- Кеширует настройки для уменьшения запросов к chrome.storage

#### `registerPage(config: PageConfig): Promise<void>`

Регистрирует и инициализирует одну страницу.

#### `clearCache(): void`

Очищает кеш настроек (полезно для тестов).

## Производительность

### Оптимизации:

1. **Параллельное выполнение**: Все функции запускаются одновременно через `Promise.all()`
2. **Единый запрос настроек**: Все настройки загружаются одним вызовом `chrome.storage.sync.get()`
3. **Кеширование**: Настройки кешируются после первой загрузки
4. **Ранний выход**: Если URL не совпадает с паттерном, инициализация не запускается
5. **Lazy loading**: Функции загружаются только когда нужны

### Пример производительности:

```
Старый подход (последовательный):
- 10 функций × 50ms = 500ms

Новый подход (параллельный):
- 10 функций одновременно = ~50ms
- Ускорение в 10 раз! 🚀
```

## TypeScript типы

```typescript
interface FeatureConfig {
    key: string;                              // Ключ настройки в chrome.storage
    handler: () => void | Promise<void>;      // Функция-обработчик
}

interface PageConfig {
    pattern: string | string[];               // URL паттерн(ы)
    features: FeatureConfig[];                // Условные функции
    alwaysRun?: Array<() => void | Promise<void>>; // Безусловные функции
}
```

## Миграция со старого кода

### Было:

```typescript
const initializeExtension = async () => {
    if (matchesUrlPattern(URL_PATTERNS.EXCELLS)) {
        await initializeFeatures({ARM_allowCopy: allowCopy});
    }

    if (matchesUrlPattern(URL_PATTERNS.CLIENT_SESSION)) {
        await initializeFeatures({
            ARM_filterClientSessions: initFilterClientSessions,
            ARM_copySearchMAC: copyMAC,
        });
    }
};
```

### Стало:

```typescript
export const armPageConfigs: PageConfig[] = [
    {
        pattern: URL_PATTERNS.EXCELLS,
        features: [
            {key: 'ARM_allowCopy', handler: allowCopy}
        ]
    },
    {
        pattern: URL_PATTERNS.CLIENT_SESSION,
        features: [
            {key: 'ARM_filterClientSessions', handler: initFilterClientSessions},
            {key: 'ARM_copySearchMAC', handler: copyMAC}
        ]
    }
];

initializer.initialize(armPageConfigs);
```

## Преимущества нового подхода

✅ Декларативная конфигурация вместо императивного кода
✅ Параллельное выполнение = быстрее в 5-10 раз
✅ Типобезопасность TypeScript
✅ Легко добавлять новые модули
✅ Централизованная обработка ошибок
✅ Кеширование настроек
✅ Единый singleton для всех модулей
✅ Простое тестирование
