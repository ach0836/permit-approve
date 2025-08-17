'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store';
import { requestFCMToken, setupForegroundMessageListener, checkFCMSupport } from '@/utils/fcm';
import { FaBell, FaTimes, FaExclamationTriangle } from 'react-icons/fa';
import HydrationGuard from './HydrationGuard';

interface NotificationState {
    show: boolean;
    title: string;
    body: string;
    data?: any;
}

function NotificationManagerContent() {
    const { user } = useAuthStore();
    const [notification, setNotification] = useState<NotificationState>({
        show: false,
        title: '',
        body: ''
    });
    const [permissionGranted, setPermissionGranted] = useState(false);
    const [showPermissionBanner, setShowPermissionBanner] = useState(false);
    const [fcmInitialized, setFcmInitialized] = useState(false);
    const [fcmError, setFcmError] = useState<string | null>(null);

    useEffect(() => {
        console.log('[NotificationManager] Checking FCM support...');

        // FCM 지원 확인
        if (!checkFCMSupport()) {
            setFcmError('이 브라우저는 알림 기능을 지원하지 않습니다.');
            return;
        }

        // 알림 권한 상태 확인
        if ('Notification' in window) {
            const isGranted = Notification.permission === 'granted';
            setPermissionGranted(isGranted);
            console.log('[NotificationManager] Permission status:', Notification.permission);

            // 사용자가 로그인했고 권한이 없으면 배너 표시
            if (user && !isGranted && Notification.permission === 'default') {
                setShowPermissionBanner(true);
            }
        }
    }, [user]);

    useEffect(() => {
        if (!user?.email || !user?.role || fcmInitialized) return;

        console.log('[NotificationManager] Initializing FCM for user:', user.email);
        initializeFCM();
    }, [user, fcmInitialized]);

    const initializeFCM = async () => {
        try {
            setFcmError(null);
            console.log('[NotificationManager] Starting FCM initialization...');

            // FCM 토큰 요청
            const token = await requestFCMToken(user!.email, user!.role);

            if (token) {
                console.log('[NotificationManager] FCM token obtained successfully');
                setPermissionGranted(true);
                setFcmInitialized(true);
                setShowPermissionBanner(false);

                // 포그라운드 메시지 리스너 설정
                setupForegroundMessageListener((payload) => {
                    console.log('[NotificationManager] Foreground message received:', payload);
                    setNotification({
                        show: true,
                        title: payload.notification?.title || payload.data?.title || '새 알림',
                        body: payload.notification?.body || payload.data?.body || '새로운 메시지가 있습니다',
                        data: payload.data
                    });
                });
            } else {
                setFcmError('FCM 토큰을 가져올 수 없습니다.');
            }
        } catch (error) {
            console.error('[NotificationManager] FCM initialization error:', error);
            setFcmError('알림 초기화 중 오류가 발생했습니다.');
        }
    };

    const handleNotificationPermission = async () => {
        try {
            console.log('[NotificationManager] Requesting notification permission...');

            if ('Notification' in window) {
                const permission = await Notification.requestPermission();
                console.log('[NotificationManager] Permission result:', permission);

                setPermissionGranted(permission === 'granted');
                setShowPermissionBanner(false);

                if (permission === 'granted' && user?.email && user?.role) {
                    await initializeFCM();
                } else if (permission === 'denied') {
                    setFcmError('알림 권한이 거부되었습니다. 브라우저 설정에서 수동으로 허용해주세요.');
                }
            }
        } catch (error) {
            console.error('[NotificationManager] Permission request error:', error);
            setFcmError('권한 요청 중 오류가 발생했습니다.');
        }
    };

    const handleDismissBanner = () => {
        console.log('[NotificationManager] Permission banner dismissed');
        setShowPermissionBanner(false);
    };

    const closeNotification = () => {
        setNotification(prev => ({ ...prev, show: false }));
    };

    const handleNotificationClick = () => {
        // 알림 클릭 시 적절한 페이지로 이동
        if (notification.data?.type === 'permission-slip') {
            window.location.href = '/dashboard';
        }
        closeNotification();
    };

    return (
        <>
            {/* 알림 권한 요청 배너 */}
            {showPermissionBanner && user && (
                <div className="fixed top-0 left-0 right-0 bg-blue-400 text-white p-3 z-50 flex items-center justify-between shadow-lg">
                    <div className="flex items-center gap-2">
                        <FaBell className="w-4 h-4 animate-pulse" />
                        <span className="text-sm font-medium">
                            허가원 상태 변경 알림을 받으시겠습니까?
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleNotificationPermission}
                            className="bg-white text-blue-400 px-4 py-1 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
                        >
                            허용
                        </button>
                        <button
                            onClick={handleDismissBanner}
                            className="bg-gray-500 text-white px-3 py-1 rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors"
                        >
                            나중에
                        </button>
                    </div>
                </div>
            )}

            {/* FCM 오류 메시지 */}
            {fcmError && (
                <div className="fixed top-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg max-w-sm z-50">
                    <div className="flex items-start gap-2">
                        <FaExclamationTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-medium">알림 설정 오류</p>
                            <p className="text-xs mt-1">{fcmError}</p>
                            <button
                                onClick={() => setFcmError(null)}
                                className="text-xs underline mt-2 hover:no-underline"
                            >
                                닫기
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 포그라운드 알림 */}
            {notification.show && (
                <div className={`fixed right-4 bg-white border border-gray-200 rounded-xl shadow-lg p-4 max-w-sm z-50 animate-slide-in ${showPermissionBanner ? 'top-20' : 'top-4'}`}>
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center">
                                    <FaBell className="w-4 h-4 text-white" />
                                </div>
                                <h4 className="font-bold text-black text-sm">{notification.title}</h4>
                            </div>
                            <p className="text-gray-600 text-sm whitespace-pre-line">{notification.body}</p>
                            <button
                                onClick={handleNotificationClick}
                                className="mt-2 text-blue-400 text-sm font-medium hover:text-blue-600 transition-colors"
                            >
                                확인하기
                            </button>
                        </div>
                        <button
                            onClick={closeNotification}
                            className="text-gray-400 hover:text-gray-600 transition-colors ml-2"
                        >
                            <FaTimes className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* 디버그 정보 (개발 모드에서만) */}
            {process.env.NODE_ENV === 'development' && (
                <div className="fixed bottom-4 left-4 bg-gray-800 text-white p-2 rounded text-xs max-w-xs">
                    <div>FCM 상태:</div>
                    <div>- 지원: {checkFCMSupport() ? '✅' : '❌'}</div>
                    <div>- 권한: {'Notification' in window ? Notification.permission : 'unknown'}</div>
                    <div>- 초기화: {fcmInitialized ? '✅' : '❌'}</div>
                    <div>- 사용자: {user?.email || '없음'}</div>
                </div>
            )}

            <style jsx>{`
                @keyframes slide-in {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                .animate-slide-in {
                    animation: slide-in 0.3s ease-out;
                }
            `}</style>
        </>
    );
}

export default function NotificationManager() {
    return (
        <HydrationGuard>
            <NotificationManagerContent />
        </HydrationGuard>
    );
}
