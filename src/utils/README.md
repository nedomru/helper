# Notification System

## Usage

### Basic usage

```typescript
import {notify} from '@/utils/notify';

// Simple notification
notify('Something happened');

// With type
notify('Success!', 'success');
notify('Error!', 'error');
notify('Warning!', 'warning');
notify('Info!', 'info');

// With custom duration (default: 3000ms)
notify('This will stay for 5 seconds', 'success', 5000);

// With title
notify('Успешно', 'Карточка клиента скопирована', 'success');
notify('Ошибка', 'Не удалось скопировать IP-адрес', 'error');
```

### Advanced options

```typescript
import {notify} from '@/utils/notify';

notify({
    message: 'Custom notification',
    type: 'success',
    duration: 5000,
    position: 'bottom-right', // 'top-right' (default), 'top-left', 'bottom-right', 'bottom-left', 'top-center', 'bottom-center', 'center'
    clickToClose: true, // default: true
    className: 'my-custom-class' // optional CSS class
});
```

### With title

```typescript
import {notify} from '@/utils/notify';

// Using options object
notify({
    title: 'Успешно',
    message: 'IP-адрес скопирован',
    type: 'success',
    position: 'center' // Show in the middle of screen
});

// Using shorthand
notify('Успешно', 'Операция выполнена', 'success');
notify('Ошибка', 'Не удалось выполнить операцию', 'error');
```

### Advanced options

```typescript
import {notify} from '@/utils/notify';

notify({
    message: 'Custom notification',
    type: 'success',
    duration: 5000,
    position: 'bottom-right', // 'top-right' (default), 'top-left', 'bottom-right', 'bottom-left', 'top-center', 'bottom-center'
    clickToClose: true, // default: true
    className: 'my-custom-class' // optional CSS class
});
```

### Convenience methods

```typescript
import {notifySuccess, notifyError, notifyWarning, notifyInfo} from '@/utils/notify';

// Without title
notifySuccess('IP-адрес скопирован');
notifyError('Не удалось скопировать');
notifyWarning('Внимание!');
notifyInfo('Информация');

// With title
import {
    notifySuccessWithTitle,
    notifyErrorWithTitle,
    notifyWarningWithTitle,
    notifyInfoWithTitle
} from '@/utils/notify';

notifySuccessWithTitle('Успешно', 'IP-адрес скопирован');
notifyErrorWithTitle('Ошибка', 'Не удалось скопировать IP-адрес');
notifyWarningWithTitle('Внимание', 'Проверьте введенные данные');
notifyInfoWithTitle('Информация', 'Обработка завершена');
```

### Dismiss all notifications

```typescript
import {dismissAll} from '@/utils/notify';

dismissAll();
```