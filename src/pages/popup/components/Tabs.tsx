import type {ReactNode} from 'react';
import type {Tab} from '../types';

interface TabsProps {
    active: Tab;
    onChange: (tab: Tab) => void;
}

const TABS: Tab[] = ['Главная', 'Инструменты'];

export function Tabs({active, onChange}: TabsProps): ReactNode {
    return (
        <div className="flex items-center gap-2 p-4 border-gray-200/80 bg-white">
            <div className="flex gap-1.5">
                {TABS.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => onChange(tab)}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                            active === tab
                                ? 'bg-linear-to-r from-blue-600 to-blue-700 text-white shadow-md shadow-blue-200'
                                : 'bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 hover:border-blue-300'
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>
        </div>
    );
}
