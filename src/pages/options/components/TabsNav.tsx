interface TabsNavProps {
    activeSection: 'arm' | 'genesys' | 'line' | 'speech';
    onSectionChange: (section: 'arm' | 'genesys' | 'line' | 'speech') => void;
}

export default function TabsNav({activeSection, onSectionChange}: TabsNavProps) {
    return (
        <nav className="tabs-nav">
            <button
                className={`tab-button ${activeSection === 'arm' ? 'active' : ''}`}
                onClick={() => onSectionChange('arm')}
            >
                <span className="tab-icon">🖥️</span>
                <span>Настройки АРМа</span>
            </button>
            <button
                className={`tab-button ${activeSection === 'genesys' ? 'active' : ''}`}
                onClick={() => onSectionChange('genesys')}
            >
                <span className="tab-icon">💬</span>
                <span>Настройки Генезиса</span>
            </button>
            <button
                className={`tab-button ${activeSection === 'line' ? 'active' : ''}`}
                onClick={() => onSectionChange('line')}
            >
                <span className="tab-icon">💚</span>
                <span>Настройки Линии</span>
            </button>
            <button
                className={`tab-button ${activeSection === 'speech' ? 'active' : ''}`}
                onClick={() => onSectionChange('speech')}
            >
                <span className="tab-icon">🗣️</span>
                <span>Речевые модули</span>
            </button>
        </nav>
    );
}
