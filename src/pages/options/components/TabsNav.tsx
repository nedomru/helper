interface TabsNavProps {
    activeSection: 'arm' | 'genesys' | 'line' | 'speech' | 'extension';
    onSectionChange: (section: 'arm' | 'genesys' | 'line' | 'speech' | 'extension') => void;
}

export default function TabsNav({activeSection, onSectionChange}: TabsNavProps) {
    return (
        <nav className="tabs-nav">
            <button
                className={`tab-button ${activeSection === 'arm' ? 'active' : ''}`}
                onClick={() => onSectionChange('arm')}
            >
                <span className="tab-icon">🖥️</span>
                <span>АРМ</span>
            </button>
            <button
                className={`tab-button ${activeSection === 'genesys' ? 'active' : ''}`}
                onClick={() => onSectionChange('genesys')}
            >
                <span className="tab-icon">💬</span>
                <span>Генезис</span>
            </button>
            <button
                className={`tab-button ${activeSection === 'line' ? 'active' : ''}`}
                onClick={() => onSectionChange('line')}
            >
                <span className="tab-icon">💚</span>
                <span>Линия</span>
            </button>
            <button
                className={`tab-button ${activeSection === 'speech' ? 'active' : ''}`}
                onClick={() => onSectionChange('speech')}
            >
                <span className="tab-icon">🗣️</span>
                <span>РМы</span>
            </button>
            <button
                className={`tab-button ${activeSection === 'extension' ? 'active' : ''}`}
                onClick={() => onSectionChange('extension')}
            >
                <span className="tab-icon">🔧</span>
                <span>Расширение</span>
            </button>
        </nav>
    );
}
