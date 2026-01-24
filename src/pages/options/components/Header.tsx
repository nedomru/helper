import type {TelegramUser} from '@src/shared/types/auth';

interface HeaderProps {
    currentUser: TelegramUser | null;
    version: string;
    theme: 'light' | 'dark';
    onToggleTheme: () => void;
    onLogout: () => void;
}

export default function Header({currentUser, version, theme, onToggleTheme, onLogout}: HeaderProps) {
    return (
        <header className="options-header">
            <div className="header-content">
                <div className="header-left">
                    <h1 className="header-title">Хелпер</h1>
                    <p className="header-subtitle">Настройки расширения. Версия - {version || 'загрузка...'}</p>
                </div>
                <div className="header-right">
                    <div className="user-info">
                        <div className="user-avatar">{currentUser?.first_name?.[0] || 'U'}</div>
                        <span className="user-name">
                            {currentUser?.first_name} {currentUser?.last_name || ''}
                        </span>
                    </div>
                    <a
                        href="https://t.me/nedomru_bot"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary btn-sm"
                        title="Настройки в боте"
                    >
                        🤖
                    </a>
                    <button onClick={onToggleTheme} className="btn btn-secondary btn-sm" title="Переключить тему">
                        {theme === 'light' ? '🌙' : '☀️'}
                    </button>
                    <button onClick={onLogout} className="btn btn-secondary btn-sm">
                        Выйти
                    </button>
                </div>
            </div>
        </header>
    );
}
