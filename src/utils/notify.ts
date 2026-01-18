/**
 * Lightweight notification system for browser extensions
 * No external dependencies required
 */

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface NotifyOptions {
    message: string;
    title?: string;
    type?: NotificationType;
    duration?: number;
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center' | 'center';
    clickToClose?: boolean;
    className?: string;
}

interface NotificationConfig {
    title?: string;
    message: string;
    type: NotificationType;
    duration: number;
    position: string;
    clickToClose: boolean;
    className?: string;
}

class NotificationManager {
    private container: HTMLElement | null = null;
    private notifications: HTMLElement[] = [];

    /**
     * Create and show notification
     */
    show(options: NotifyOptions): void {
        const config: NotificationConfig = {
            title: options.title,
            message: options.message,
            type: options.type || 'info',
            duration: options.duration ?? 3000,
            position: options.position || 'top-right',
            clickToClose: options.clickToClose ?? true,
            className: options.className,
        };

        const container = this.ensureContainer(config.position);

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `extension-notification ${config.className || ''}`;
        notification.style.cssText = this.getStyles(config.type);
        notification.innerHTML = this.createContent(config.title, config.message, config.type);

        // Add click to close
        if (config.clickToClose) {
            notification.addEventListener('click', () => this.dismiss(notification));
        }

        // Add to container
        container.appendChild(notification);
        this.notifications.push(notification);

        // Add styles for animations if not already present
        this.ensureAnimationStyles();

        // Auto-dismiss after duration
        if (config.duration > 0) {
            setTimeout(() => this.dismiss(notification), config.duration);
        }
    }

    /**
     * Dismiss all notifications
     */
    dismissAll(): void {
        this.notifications.forEach(n => this.dismiss(n));
    }

    /**
     * Initialize notification container
     */
    private ensureContainer(position: string): HTMLElement {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'extension-notification-container';
            this.container.style.cssText = `
                position: fixed;
                z-index: 999999;
                pointer-events: none;
                display: flex;
                flex-direction: column;
                gap: 10px;
                max-width: 400px;
                width: 100%;
            `;
            document.body.appendChild(this.container);
        }

        // Update container position
        const positions: Record<string, string> = {
            'top-right': 'top: 20px; right: 20px; align-items: flex-end;',
            'top-left': 'top: 20px; left: 20px; align-items: flex-start;',
            'bottom-right': 'bottom: 20px; right: 20px; align-items: flex-end;',
            'bottom-left': 'bottom: 20px; left: 20px; align-items: flex-start;',
            'top-center': 'top: 20px; left: 50%; transform: translateX(-50%); align-items: center;',
            'bottom-center': 'bottom: 20px; left: 50%; transform: translateX(-50%); align-items: center;',
            'center': 'top: 50%; left: 50%; transform: translate(-50%, -50%); align-items: center;',
        };

        this.container.style.cssText = `
            position: fixed;
            z-index: 999999;
            pointer-events: none;
            display: flex;
            flex-direction: column;
            gap: 10px;
            max-width: 450px;
            width: 100%;
            ${positions[position] || positions['top-right']}
        `;

        return this.container;
    }

    /**
     * Create notification HTML content
     */
    private createContent(title: string | undefined, message: string, type: NotificationType): string {
        const icons: Record<NotificationType, string> = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ',
        };

        const icon = icons[type];

        if (title) {
            return `
                <div style="display: flex; align-items: flex-start; gap: 10px; width: 100%;">
                    <span style="font-weight: bold; font-size: 18px; flex-shrink: 0;">${icon}</span>
                    <div style="flex: 1; min-width: 0;">
                        <div style="font-weight: 600; margin-bottom: 4px; font-size: 14px;">${this.escapeHtml(title)}</div>
                        <div style="font-size: 13px; opacity: 0.9;">${this.escapeHtml(message)}</div>
                    </div>
                </div>
            `;
        }

        return `
            <div style="display: flex; align-items: center; gap: 8px; width: 100%;">
                <span style="font-weight: bold; font-size: 16px; flex-shrink: 0;">${icon}</span>
                <span style="flex: 1;">${this.escapeHtml(message)}</span>
            </div>
        `;
    }

    /**
     * Escape HTML to prevent XSS
     */
    private escapeHtml(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    private getStyles(type: NotificationType): string {
        const baseStyles = `
            pointer-events: auto;
            padding: 12px 16px;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            font-size: 14px;
            line-height: 1.4;
            cursor: pointer;
            transition: all 0.3s ease;
            opacity: 0;
            transform: translateX(100%);
            animation: slideIn 0.3s ease forwards;
            display: flex;
            align-items: center;
            gap: 8px;
            word-wrap: break-word;
        `;

        const typeStyles: Record<NotificationType, string> = {
            success: `
                background: #dcfce7;
                color: #166534;
                border-left: 4px solid #16a34a;
            `,
            error: `
                background: #fee2e2;
                color: #991b1b;
                border-left: 4px solid #dc2626;
            `,
            warning: `
                background: #fef3c7;
                color: #92400e;
                border-left: 4px solid #f59e0b;
            `,
            info: `
                background: #dbeafe;
                color: #1e40af;
                border-left: 4px solid #2563eb;
            `,
        };

        const icons: Record<NotificationType, string> = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ',
        };

        return `
            ${baseStyles}
            ${typeStyles[type]}
        ` + `::before { content: "${icons[type]}"; font-weight: bold; font-size: 16px; }`;
    }

    /**
     * Dismiss notification with animation
     */
    private dismiss(notification: HTMLElement): void {
        notification.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => {
            notification.remove();
            this.notifications = this.notifications.filter(n => n !== notification);
        }, 300);
    }

    /**
     * Ensure animation styles are present
     */
    private ensureAnimationStyles(): void {
        if (!document.getElementById('extension-notification-styles')) {
            const style = document.createElement('style');
            style.id = 'extension-notification-styles';
            style.textContent = `
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateX(100%);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                @keyframes slideOut {
                    from {
                        opacity: 1;
                        transform: translateX(0);
                    }
                    to {
                        opacity: 0;
                        transform: translateX(100%);
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }
}

// Singleton instance
const manager = new NotificationManager();

/**
 * Show a notification
 *
 * @example
 * ```ts
 * notify({ message: 'Success!', type: 'success' });
 * notify({ message: 'Error occurred', type: 'error', duration: 5000 });
 * ```
 */
export function notify(options: NotifyOptions): void;

/**
 * Show notification with message and type
 *
 * @example
 * ```ts
 * notify('Copied to clipboard', 'success');
 * notify('Something went wrong', 'error');
 * notify('Message', 'info', 5000);
 * ```
 */
export function notify(message: string, type?: NotificationType, duration?: number): void;

/**
 * Show notification with title, message and type
 *
 * @example
 * ```ts
 * notify('Success!', 'Operation completed', 'success');
 * notify('Error', 'Something went wrong', 'error');
 * ```
 */
export function notify(title: string, message: string, type?: NotificationType, duration?: number): void;

export function notify(
    titleOrMessageOrOptions: NotifyOptions | string,
    messageOrType?: string | NotificationType,
    typeOrDuration?: NotificationType | number,
    duration?: number
): void {
    // Handle options object
    if (typeof titleOrMessageOrOptions === 'object') {
        manager.show(titleOrMessageOrOptions);
        return;
    }

    // Handle (message, type, duration) - 3 args, message is first
    if (messageOrType && typeof messageOrType !== 'string' && typeOrDuration === undefined) {
        manager.show({
            message: titleOrMessageOrOptions,
            type: messageOrType,
        });
        return;
    }

    // Handle (message, type, duration) - 3 args with duration
    if (messageOrType && typeof messageOrType !== 'string' && typeof typeOrDuration === 'number') {
        manager.show({
            message: titleOrMessageOrOptions,
            type: messageOrType,
            duration: typeOrDuration,
        });
        return;
    }

    // Handle (title, message, type, duration) - 4 args
    if (messageOrType && typeof messageOrType === 'string') {
        manager.show({
            title: titleOrMessageOrOptions,
            message: messageOrType,
            type: (typeOrDuration as NotificationType) || 'info',
            duration: duration ?? 3000,
        });
        return;
    }

    // Default: message only
    manager.show({
        message: titleOrMessageOrOptions,
    });
}

/**
 * Dismiss all active notifications
 */
export const dismissAll = () => manager.dismissAll();
