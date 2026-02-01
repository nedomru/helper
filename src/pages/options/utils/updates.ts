import type {UpdateChannel, UpdateStatus} from '../types';
import {notify} from '@src/utils/notify';

function compareVersions(v1: string, v2: string): number {
    const normalize = (v: string) => {
        return v.replace('v', '').split('.').map((part) => {
            const num = parseInt(part.replace(/[^\d]/g, ''), 10);
            return isNaN(num) ? 0 : num;
        });
    };

    const parts1 = normalize(v1);
    const parts2 = normalize(v2);

    const maxLength = Math.max(parts1.length, parts2.length);

    for (let i = 0; i < maxLength; i++) {
        const p1 = parts1[i] || 0;
        const p2 = parts2[i] || 0;

        if (p1 > p2) return 1;
        if (p1 < p2) return -1;
    }

    return 0;
}

function getUpdateUrl(channel: UpdateChannel): string {
    if (channel === 'beta') {
        return 'https://helper.chrsnv.ru/api/versions-beta.json';
    }
    return 'https://helper.chrsnv.ru/api/versions.json';
}

export async function checkForUpdates(
    currentVersion: string,
    autoCheck = false,
    channel: UpdateChannel = 'stable'
): Promise<UpdateStatus> {
    try {
        const updateUrl = getUpdateUrl(channel);
        const response = await fetch(updateUrl);
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();

        const addonId = Object.keys(data?.addons ?? {})[0];
        const updates = data?.addons?.[addonId]?.updates;

        if (updates && updates.length > 0) {
            const latestUpdate = updates[0];
            const latestVersion = latestUpdate.version;
            const updateLink = latestUpdate.update_link;

            const hasUpdate = compareVersions(latestVersion, currentVersion) > 0;

            if (hasUpdate && !autoCheck) {
                const link = document.createElement('a');
                link.href = updateLink;
                link.download = `helper-${latestVersion}.xpi`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                const channelLabel = channel === 'beta' ? ' (beta)' : '';
                notify('Обновление', `Начата загрузка версии ${latestVersion}${channelLabel}`, 'success');
            } else if (!hasUpdate && !autoCheck) {
                notify('Обновление', 'Установлена последняя версия!', 'success');
            }

            return {
                checking: false,
                hasUpdate,
                latestVersion,
            };
        } else {
            throw new Error('Invalid version data');
        }
    } catch {
        if (!autoCheck) {
            notify('Обновление', 'Не удалось проверить обновления', 'error');
        }
        return {
            checking: false,
            hasUpdate: null,
            latestVersion: null,
        };
    }
}
