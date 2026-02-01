import type {UpdateChannel} from '@pages/options/types';

interface UpdateChannelSectionProps {
    currentChannel: UpdateChannel;
    onChannelChange: (channel: UpdateChannel) => void;
}

export default function UpdateChannelSection({
                                                 currentChannel,
                                                 onChannelChange,
                                             }: UpdateChannelSectionProps) {
    return (
        <div key="Обновления" className="card">
            <div className="card-header">
                <div className="card-header-content">
                    <span className="card-icon">🔄</span>
                    <div className="card-header-text">
                        <h3 className="card-title">Канал обновлений</h3>
                        <p className="card-description">Выберите канал получения обновлений расширения</p>
                    </div>
                </div>
            </div>

            <div className="feature-list">
                <div className="feature-item">
                    <div className="feature-info" style={{width: '100%'}}>
                        <label className="feature-label">Выберите канал обновлений</label>
                        <span className="feature-description">
                            Stable - стабильные версии, Beta - тестовые нововведения
                        </span>
                        <div style={{marginTop: '0.5rem'}}>
                            <button
                                className={`btn ${currentChannel === 'stable' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                                onClick={() => onChannelChange('stable')}
                                style={{marginRight: '0.5rem'}}
                            >
                                🛡️ Stable
                            </button>
                            <button
                                className={`btn ${currentChannel === 'beta' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                                onClick={() => onChannelChange('beta')}
                            >
                                🧪 Beta
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
