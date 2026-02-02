import type {ReactNode} from 'react';
import type {ToolInputProps} from '../types';

export function ToolInput({label, value, placeholder, onChange, buttonLabel, onAction}: ToolInputProps): ReactNode {
    return (
        <div className="flex gap-2 items-center">
      <span
          className="w-40 px-3 py-2 bg-linear-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 flex items-center">
        {label}
      </span>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
            />
            <button
                onClick={onAction}
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 active:scale-95 transition-all text-sm font-medium text-gray-700 shadow-sm"
            >
                {buttonLabel}
            </button>
        </div>
    );
}
