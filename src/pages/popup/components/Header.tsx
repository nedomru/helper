import type {ReactNode} from 'react';
import type {TelegramUser} from '@src/shared/types/auth';

interface HeaderProps {
    user: TelegramUser;
    onLogout: () => void;
}

export function Header({user, onLogout}: HeaderProps): ReactNode {
    return (
        <div
            className="bg-linear-to-r from-cyan-50 to-blue-50 px-4 py-2.5 border-b border-cyan-200/50 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
                <div
                    className="w-9 h-9 bg-linear-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
                    {user.first_name![0]}
                </div>
                <div className="flex flex-col">
          <span className="text-sm font-semibold text-gray-800">
            {user.first_name} {user.last_name || ''}
          </span>
                </div>
            </div>
            <button
                onClick={onLogout}
                className="text-xs text-red-600 hover:text-red-700 font-medium px-3 py-1 rounded-full hover:bg-red-50 transition-colors"
            >
                Выйти
            </button>
        </div>
    );
}
