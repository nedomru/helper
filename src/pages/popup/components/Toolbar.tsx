import type {ReactNode} from 'react';
import {TelegramIcon} from './TelegramIcon';

interface ToolbarButton {
    title: string;
    icon: string;
    onClick: () => void;
}

interface ToolbarProps {
    buttons: readonly ToolbarButton[];
}

export function Toolbar({buttons}: ToolbarProps): ReactNode {
    return (
        <div className="flex gap-1.5 ml-auto">
            {buttons.map(({title, icon, onClick}) => (
                <button
                    key={title}
                    onClick={onClick}
                    className="px-3 py-2 text-sm border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 hover:border-blue-300 active:scale-95 transition-all duration-200 shadow-sm"
                    title={title}
                >
                    {icon === 'telegram' ? <TelegramIcon/> : icon}
                </button>
            ))}
        </div>
    );
}
