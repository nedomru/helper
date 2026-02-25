import {useCallback, useEffect, useState} from 'react';
import type {SessionStatus, TelegramUser} from '@src/shared/types/auth';
import {
    completeAuthentication,
    createSession,
    getSessionStatus,
    initializeAuth,
    isAuthenticated,
    pollSessionStatus,
} from '@src/utils/auth';

interface AuthProps {
    onAuthorized?: (user: TelegramUser) => void;
}

type AuthStep = 'loading' | 'qr' | 'waiting' | 'success' | 'error' | 'access_denied';

export default function Auth({onAuthorized}: AuthProps) {
    const [step, setStep] = useState<AuthStep>('loading');
    const [sessionId, setSessionId] = useState('');
    const [botLink, setBotLink] = useState('');
    const [status, setStatus] = useState<SessionStatus>('pending');
    const [error, setError] = useState('');

    useEffect(() => {
        const init = async () => {
            try {
                if (await isAuthenticated()) {
                    setStep('success');
                    return;
                }

                let session = await initializeAuth();
                if (!session) {
                    session = await createSession();
                }

                const correctedLink = session.botLink?.replace('YourBot', 'nedomru_bot') || '';
                setSessionId(session.sessionId);
                setBotLink(correctedLink);

                // Check status immediately in case user already authorized
                const currentStatus = await getSessionStatus(session.sessionId);
                setStatus(currentStatus.status);

                if (currentStatus.status === 'authorized' && currentStatus.user) {
                    await completeAuthentication(session.sessionId);
                    setStep('success');
                    onAuthorized?.(currentStatus.user);
                    return;
                }

                if (currentStatus.status === 'expired' || currentStatus.status === 'consumed') {
                    setError(currentStatus.status === 'expired' ? 'Сессия истекла' : 'Сессия уже использована');
                    setStep('error');
                    return;
                }

                setStep('qr');
            } catch (err) {
                console.error('[Auth] Init error:', err);
                if (err instanceof Error && err.message === 'ACCESS_DENIED') {
                    console.log('[Auth] Showing access denied screen');
                    setStep('access_denied');
                } else {
                    console.error('[Auth] Generic auth error:', err);
                    setError('Failed to initialize authorization');
                    setStep('error');
                }
            }
        };

        init();
    }, [onAuthorized]);

    useEffect(() => {
        if (!sessionId || (step !== 'qr' && step !== 'waiting')) return;

        if (step === 'qr') {
            setStep('waiting');
        }

        return pollSessionStatus(
            sessionId,
            (newStatus, user) => {
                setStatus(newStatus);
                if (newStatus === 'authorized' && user) {
                    handleAuthorized(user);
                } else if (newStatus === 'expired' || newStatus === 'consumed') {
                    setError(newStatus === 'expired' ? 'Сессия истекла' : 'Сессия уже использована');
                    setStep('error');
                }
            },
            () => {
            }
        );
    }, [sessionId, step]);

    const handleAuthorized = useCallback(async (user: TelegramUser) => {
        try {
            await completeAuthentication(sessionId);
            setStep('success');
            onAuthorized?.(user);
        } catch (err) {
            if (err instanceof Error && err.message === 'ACCESS_DENIED') {
                setStep('access_denied');
            } else {
                setError('Failed to complete authentication');
                setStep('error');
            }
        }
    }, [sessionId, onAuthorized]);

    const handleCreateSession = useCallback(async () => {
        try {
            setStep('loading');
            const session = await createSession();
            const correctedLink = session.botLink?.replace('YourBot', 'nedomru_bot') || '';
            setSessionId(session.sessionId);
            setBotLink(correctedLink);
            setStatus(session.status);
            setStep('qr');
        } catch {
            setError('Failed to create session');
            setStep('error');
        }
    }, []);

    if (step === 'loading') {
        return (
            <div className="flex items-center justify-center min-h-screen bg-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin"/>
                    <p className="text-gray-700 text-lg font-medium">Загрузка...</p>
                </div>
            </div>
        );
    }

    if (step === 'success') {
        return (
            <div className="flex items-center justify-center min-h-screen bg-white">
                <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
                        <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/>
                        </svg>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-3">Авторизация успешна!</h2>
                    <p className="text-gray-600 text-lg">Вы можете использовать расширение</p>
                </div>
            </div>
        );
    }

    if (step === 'error') {
        return (
            <div className="flex items-center justify-center min-h-screen bg-white p-4">
                <div
                    className="bg-white rounded-2xl shadow-lg border border-gray-200 max-w-md w-full mx-4 overflow-hidden">
                    <div className="p-8 text-center">
                        <div
                            className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Ошибка</h2>
                        <p className="text-gray-600 mb-8">{error}</p>
                        <button
                            onClick={handleCreateSession}
                            className="w-full px-6 py-3 bg-linear-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:from-cyan-600 hover:to-blue-700 transition-all font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                            Создать новую сессию
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (step === 'access_denied') {
        return (
            <div className="flex items-center justify-center min-h-screen bg-white p-4">
                <div
                    className="bg-white rounded-2xl shadow-lg border border-gray-200 max-w-md w-full mx-4 overflow-hidden">
                    <div className="p-8 text-center">
                        <div
                            className="w-16 h-16 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor"
                                 viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Доступ запрещен</h2>
                        <p className="text-gray-600 mb-8">
                            У вас нет доступа к использованию расширения. Обратитесь к администратору для получения
                            доступа.
                        </p>
                        <button
                            onClick={handleCreateSession}
                            className="w-full px-6 py-3 bg-linear-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:from-cyan-600 hover:to-blue-700 transition-all font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                            Попробовать снова
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(botLink)}`;

    return (
        <div className="flex items-center justify-center min-h-screen bg-white p-4">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 max-w-md w-full mx-4 overflow-hidden">
                <div className="p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Авторизация</h1>
                    </div>

                    <div className="flex justify-center mb-6">
                        <div className="relative">
                            <div
                                className="absolute inset-0 bg-linear-to-r from-cyan-500 to-blue-600 rounded-2xl blur opacity-30"/>
                            <div className="relative bg-white p-4 rounded-2xl shadow-lg border-2 border-gray-100">
                                <img src={qrCodeUrl} alt="QR Code" className="w-56 h-56"/>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3 mb-6 text-center">
                        <p className="text-sm text-gray-700">Отсканируйте QR для доступа</p>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4 mb-6">
                        <p className="text-xs text-gray-500 mb-2 text-center">Или перейдите по ссылке:</p>
                        <a
                            href={botLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-center text-sm text-cyan-600 hover:text-cyan-700 font-medium break-all"
                        >
                            {botLink}
                        </a>
                    </div>

                    <div className="bg-linear-to-r from-cyan-50 to-blue-50 rounded-xl p-4">
                        <div className="flex items-center justify-center gap-3">
                            {step === 'waiting' && (
                                <>
                                    <div
                                        className="w-4 h-4 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin"/>
                                    <span className="text-cyan-700 font-medium text-sm">
                                        {status === 'pending' ? 'Ожидание авторизации...' : `Статус: ${status}`}
                                    </span>
                                </>
                            )}
                            {step === 'qr' &&
                                <span className="text-cyan-700 font-medium text-sm">Готово к авторизации</span>}
                        </div>
                    </div>

                    <button
                        onClick={handleCreateSession}
                        className="w-full mt-4 text-sm text-gray-500 hover:text-cyan-600 transition-colors"
                    >
                        Создать новую сессию
                    </button>
                </div>
            </div>
        </div>
    );
}
