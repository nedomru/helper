interface SearchBarProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    isMac: boolean;
}

export default function SearchBar({searchQuery, onSearchChange, isMac}: SearchBarProps) {
    return (
        <div className="search-wrapper">
            <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
                type="text"
                placeholder="Поиск настроек..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="search-input"
            />
            {searchQuery && (
                <button
                    className="search-clear"
                    onClick={() => onSearchChange('')}
                    title="Очистить"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                </button>
            )}
            <kbd className="search-shortcut">{isMac ? '⌘K' : '⌃K'}</kbd>
        </div>
    );
}
