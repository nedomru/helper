import {useEffect, useState} from 'react';
import type {ChatSounds} from '@pages/options/types';

const AVAILABLE_SOUNDS = [
    {value: 'Sound_1.mp3', label: 'Звук 1'},
    {value: 'Sound_2.mp3', label: 'Звук 2'},
    {value: 'Sound_3.mp3', label: 'Звук 3'},
    {value: 'Sound_4.mp3', label: 'Звук 4'},
    {value: 'Sound_5.mp3', label: 'Звук 5'},
    {value: 'Sound_6.mp3', label: 'Звук 6'},
    {value: 'Sound_7.mp3', label: 'Звук 7'},
    {value: 'Sound_8.mp3', label: 'Звук 8'},
    {value: 'Sound_9.mp3', label: 'Звук 9'},
    {value: 'zvuk-chpok-4.mp3', label: 'Чпок'},
] as const;

const DEFAULT_SOUNDS: ChatSounds = {
    incomingChat: 'zvuk-chpok-4.mp3',
    incomingMessage: 'zvuk-chpok-4.mp3',
};

interface ChatSoundsSectionProps {
    sounds: ChatSounds;
    onSoundsChange: (sounds: ChatSounds) => void;
    enabled: boolean;
    onEnabledChange: (enabled: boolean) => void;
}

export default function ChatSoundsSection({
                                              sounds,
                                              onSoundsChange,
                                              enabled,
                                              onEnabledChange,
                                          }: ChatSoundsSectionProps) {
    const [localSounds, setLocalSounds] = useState<ChatSounds>(sounds);
    const [hasChanges, setHasChanges] = useState(false);
    const [previewSound, setPreviewSound] = useState<string | null>(null);

    useEffect(() => {
        setLocalSounds(sounds);
        setHasChanges(false);
    }, [sounds]);

    const handleSoundChange = (key: keyof ChatSounds, value: string) => {
        const newSounds = {...localSounds, [key]: value};
        setLocalSounds(newSounds);
        setHasChanges(JSON.stringify(newSounds) !== JSON.stringify(sounds));
    };

    const handleSave = () => {
        onSoundsChange(localSounds);
        setHasChanges(false);
    };

    const handleReset = () => {
        setLocalSounds(DEFAULT_SOUNDS);
        setHasChanges(true);
    };

    const playPreview = (soundFile: string) => {
        setPreviewSound(soundFile);
        const audio = new Audio(chrome.runtime.getURL(`sounds/${soundFile}`));
        audio.play().catch(() => {
            // Ignore errors if audio can't play
        });
        audio.onended = () => setPreviewSound(null);
        audio.onerror = () => setPreviewSound(null);
    };

    return (
        <div key="Кастомные звуки" className="card">
            <div className="card-header">
                <div className="card-header-content">
                    <span className="card-icon">🔔</span>
                    <div className="card-header-text">
                        <h3 className="card-title">Кастомные звуки уведомлений</h3>
                        <p className="card-description">Настройте звуки для новых чатов и сообщений</p>
                    </div>
                </div>
            </div>

            <div className="feature-list">
                {/* Enable/Disable Toggle */}
                <div className="feature-item">
                    <div className="feature-info">
                        <label className="feature-label" htmlFor="custom-chat-sounds-enabled">
                            Использовать кастомные звуки
                        </label>
                        <span
                            className="feature-description">Включить пользовательские звуки для уведомлений в чате</span>
                    </div>
                    <label className="switch">
                        <input
                            id="custom-chat-sounds-enabled"
                            type="checkbox"
                            checked={enabled}
                            onChange={(e) => onEnabledChange(e.target.checked)}
                        />
                        <span className="slider"/>
                    </label>
                </div>

                {enabled && (
                    <>
                        {/* New Chat Sound */}
                        <div className="feature-item">
                            <div className="feature-info" style={{width: '100%'}}>
                                <label className="feature-label">💬 Новый чат</label>
                                <span className="feature-description">Звук для уведомления о новом чате</span>
                                <div style={{marginTop: '0.5rem'}}>
                                    <select
                                        value={localSounds.incomingChat}
                                        onChange={(e) => handleSoundChange('incomingChat', e.target.value)}
                                        style={{
                                            padding: '0.5rem',
                                            borderRadius: '0.375rem',
                                            border: '1px solid var(--border-color)',
                                            backgroundColor: 'var(--card-bg)',
                                            color: 'var(--text-color)',
                                            minWidth: '200px',
                                            marginRight: '0.5rem',
                                        }}
                                    >
                                        {AVAILABLE_SOUNDS.map((sound) => (
                                            <option key={sound.value} value={sound.value}>
                                                {sound.label}
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        className="btn btn-secondary btn-sm"
                                        onClick={() => playPreview(localSounds.incomingChat)}
                                        disabled={previewSound === localSounds.incomingChat}
                                        style={{marginLeft: '0.5rem'}}
                                    >
                                        {previewSound === localSounds.incomingChat ? '▶️ Играет...' : '🔊 Прослушать'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* New Message Sound */}
                        <div className="feature-item">
                            <div className="feature-info" style={{width: '100%'}}>
                                <label className="feature-label">💭 Новое сообщение</label>
                                <span className="feature-description">Звук для уведомления о новом сообщении</span>
                                <div style={{marginTop: '0.5rem'}}>
                                    <select
                                        value={localSounds.incomingMessage}
                                        onChange={(e) => handleSoundChange('incomingMessage', e.target.value)}
                                        style={{
                                            padding: '0.5rem',
                                            borderRadius: '0.375rem',
                                            border: '1px solid var(--border-color)',
                                            backgroundColor: 'var(--card-bg)',
                                            color: 'var(--text-color)',
                                            minWidth: '200px',
                                            marginRight: '0.5rem',
                                        }}
                                    >
                                        {AVAILABLE_SOUNDS.map((sound) => (
                                            <option key={sound.value} value={sound.value}>
                                                {sound.label}
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        className="btn btn-secondary btn-sm"
                                        onClick={() => playPreview(localSounds.incomingMessage)}
                                        disabled={previewSound === localSounds.incomingMessage}
                                        style={{marginLeft: '0.5rem'}}
                                    >
                                        {previewSound === localSounds.incomingMessage ? '▶️ Играет...' : '🔊 Прослушать'}
                                    </button>
                                </div>
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
                                                setLocalSounds(sounds);
                                                setHasChanges(false);
                                            }}
                                        >
                                            ✕ Отмена
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export {DEFAULT_SOUNDS};
