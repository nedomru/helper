import type {ReactNode} from 'react';
import type {Tab} from '../types';

interface TabsProps {
    active: Tab;
    onChange: (tab: Tab) => void;
    badges?: Partial<Record<Tab, number>>;
}

const TABS: Tab[] = ['Главная', 'Инструменты', 'Буфер', 'Что нового'];

export function Tabs({active, onChange, badges}: TabsProps): ReactNode {
    return (
        <div className="flex items-center gap-2 p-4 border-gray-200/80 bg-white">
            <div className="flex gap-1.5">
                {TABS.map((tab) => {
                    const count = badges?.[tab] ?? 0;
                    const isActive = active === tab;
                    return (
                        <button
                            key={tab}
                            onClick={() => onChange(tab)}
                            className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                                isActive
                                    ? 'bg-linear-to-r from-blue-600 to-blue-700 text-white shadow-md shadow-blue-200'
                                    : 'bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 hover:border-blue-300'
                            }`}
                        >
                            {tab}
                            {count > 0 && (
                                <span
                                    className={`ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full ${
                                        isActive
                                            ? 'bg-white text-blue-700'
                                            : 'bg-red-500 text-white'
                                    }`}
                                >
                                    {count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
