import type {UpdateStatus} from '../types';
import {exportSettings} from '../utils/export-import';
import {checkForUpdates} from '../utils/updates';

interface ActionsToolbarProps {
    updateStatus: UpdateStatus;
    version: string;
    setUpdateStatus: (status: UpdateStatus) => void;
    onImportSettings: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
}

export default function ActionsToolbar({
                                           updateStatus,
                                           version,
                                           setUpdateStatus,
                                           onImportSettings
                                       }: ActionsToolbarProps) {
    const handleCheckUpdates = async () => {
        setUpdateStatus({checking: true, hasUpdate: null, latestVersion: null});
        const status = await checkForUpdates(version, false);
        setUpdateStatus(status);
    };

    return (
        <div className="actions-toolbar">
            <div className="actions-left">
                <button
                    onClick={handleCheckUpdates}
                    className={`action-button ${updateStatus.hasUpdate === true ? 'update-available' : ''}`}
                    disabled={updateStatus.checking}
                >
                    {updateStatus.checking ? (
                        <svg className="spinning" width="16" height="16" viewBox="0 0 24 24" fill="none"
                             stroke="currentColor" strokeWidth="2">
                            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                        </svg>
                    ) : updateStatus.hasUpdate === true ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                             strokeWidth="2">
                            <path d="M21 12a9 9 0 1 1-9-9"/>
                            <polyline points="21 3 21 9 15 9"/>
                        </svg>
                    ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                             strokeWidth="2">
                            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                            <path d="M3 3v5h5"/>
                            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
                            <path d="M16 21h5v-5"/>
                        </svg>
                    )}
                    <span>
                        {updateStatus.checking
                            ? 'Проверка...'
                            : updateStatus.hasUpdate === true
                                ? `Доступна v${updateStatus.latestVersion}`
                                : updateStatus.hasUpdate === false
                                    ? 'Проверить обновления'
                                    : 'Проверить обновления'}
                    </span>
                </button>
                <button onClick={exportSettings} className="action-button">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    <span>Экспорт настроек</span>
                </button>
                <label className="action-button">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    <span>Импорт настроек</span>
                    <input type="file" accept=".json" onChange={onImportSettings} hidden/>
                </label>
            </div>
        </div>
    );
}
