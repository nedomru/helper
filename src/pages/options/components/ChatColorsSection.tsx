import {useEffect, useState} from 'react';
import ColorPicker from './ColorPicker';

export interface ChatColors {
    agentPrompt: string;
    agentText: string;
    clientPrompt: string;
    clientText: string;
}

interface ChatColorsSectionProps {
    colors: ChatColors;
    onColorsChange: (colors: ChatColors) => void;
    enabled: boolean;
    onEnabledChange: (enabled: boolean) => void;
}

const DEFAULT_COLORS: ChatColors = {
    agentPrompt: '#FF6B35',
    agentText: '#2C3E50',
    clientPrompt: '#27AE60',
    clientText: '#34495E',
};

export default function ChatColorsSection({
                                              colors,
                                              onColorsChange,
                                              enabled,
                                              onEnabledChange,
                                          }: ChatColorsSectionProps) {
    const [localColors, setLocalColors] = useState<ChatColors>(colors);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        setLocalColors(colors);
        setHasChanges(false);
    }, [colors]);

    const handleColorChange = (key: keyof ChatColors, value: string) => {
        const newColors = {...localColors, [key]: value};
        setLocalColors(newColors);
        setHasChanges(JSON.stringify(newColors) !== JSON.stringify(colors));
    };

    const handleSave = () => {
        onColorsChange(localColors);
        setHasChanges(false);
    };

    const handleReset = () => {
        setLocalColors(DEFAULT_COLORS);
        setHasChanges(true);
    };

    return (
        <div key="Кастомные цвета" className="card">
            <div className="card-header">
                <div className="card-header-content">
                    <span className="card-icon">🎨</span>
                    <div className="card-header-text">
                        <h3 className="card-title">Кастомные цвета чата</h3>
                        <p className="card-description">Настройте цвета для сообщений агента и клиента</p>
                    </div>
                </div>
            </div>

            <div className="feature-list">
                {/* Enable/Disable Toggle */}
                <div className="feature-item">
                    <div className="feature-info">
                        <label className="feature-label" htmlFor="custom-chat-colors-enabled">
                            Использовать кастомные цвета
                        </label>
                        <span
                            className="feature-description">Включить пользовательские цвета для сообщений в чате</span>
                    </div>
                    <label className="switch">
                        <input
                            id="custom-chat-colors-enabled"
                            type="checkbox"
                            checked={enabled}
                            onChange={(e) => onEnabledChange(e.target.checked)}
                        />
                        <span className="slider"/>
                    </label>
                </div>

                {enabled && (
                    <>
                        {/* Agent Colors */}
                        <div className="feature-item">
                            <div className="feature-info" style={{width: '100%'}}>
                                <label className="feature-label">👤 Агент</label>
                                <span className="feature-description">Цвета для сообщений агента</span>
                            </div>
                        </div>
                        <div className="feature-item">
                            <div className="feature-info"
                                 style={{width: '100%', flexDirection: 'column', alignItems: 'flex-start'}}>
                                <ColorPicker
                                    label="Цвет имени оператора"
                                    description="Цвет текста для ФИО оператора"
                                    value={localColors.agentPrompt}
                                    onChange={(color) => handleColorChange('agentPrompt', color)}
                                />
                                <ColorPicker
                                    label="Цвет текста сообщения"
                                    description="Цвет текста для сообщений оператора"
                                    value={localColors.agentText}
                                    onChange={(color) => handleColorChange('agentText', color)}
                                />
                            </div>
                        </div>

                        {/* Client Colors */}
                        <div className="feature-item">
                            <div className="feature-info" style={{width: '100%'}}>
                                <label className="feature-label">👤 Клиент</label>
                                <span className="feature-description">Цвета для сообщений клиента</span>
                            </div>
                        </div>
                        <div className="feature-item">
                            <div className="feature-info"
                                 style={{width: '100%', flexDirection: 'column', alignItems: 'flex-start'}}>
                                <ColorPicker
                                    label="Цвет имени клиента"
                                    description="Цвет текста для имени клиента"
                                    value={localColors.clientPrompt}
                                    onChange={(color) => handleColorChange('clientPrompt', color)}
                                />
                                <ColorPicker
                                    label="Цвет текста сообщения"
                                    description="Цвет текста для сообщений клиента"
                                    value={localColors.clientText}
                                    onChange={(color) => handleColorChange('clientText', color)}
                                />
                            </div>
                        </div>

                        {/* Actions */}
                        {hasChanges && (
                            <div className="feature-item">
                                <div className="feature-info" style={{width: '100%'}}>
                                    <div
                                        style={{
                                            display: 'flex',
                                            gap: '0.5rem',
                                            flexWrap: 'wrap',
                                        }}
                                    >
                                        <button className="btn btn-primary btn-sm" onClick={handleSave}>
                                            💾 Сохранить изменения
                                        </button>
                                        <button className="btn btn-secondary btn-sm" onClick={handleReset}>
                                            🔄 Сбросить по умолчанию
                                        </button>
                                        <button
                                            className="btn btn-secondary btn-sm"
                                            onClick={() => {
                                                setLocalColors(colors);
                                                setHasChanges(false);
                                            }}
                                        >
                                            ✕ Отмена
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Preview */}
                        <div className="feature-item">
                            <div className="feature-info" style={{width: '100%'}}>
                                <label className="feature-label">Предпросмотр</label>
                                <div
                                    style={{
                                        marginTop: '0.5rem',
                                        padding: '1rem',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '0.375rem',
                                        backgroundColor: 'var(--card-bg)',
                                    }}
                                >
                                    <div style={{marginBottom: '0.75rem'}}>
                                        <span style={{color: localColors.agentPrompt, fontWeight: 600}}>
                                            Агент Иванов И.И.:
                                        </span>{' '}
                                        <span style={{color: localColors.agentText}}>
                                            Здравствуйте! Чем могу помочь?
                                        </span>
                                    </div>
                                    <div>
                                        <span style={{color: localColors.clientPrompt, fontWeight: 600}}>
                                            Клиент Петров П.П.:
                                        </span>{' '}
                                        <span style={{color: localColors.clientText}}>
                                            Добрый день! У меня вопрос по услуге.
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export {DEFAULT_COLORS};
