'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/store';
import { requestFCMToken, setupForegroundMessageListener } from '@/utils/fcm';
import { FaBell, FaTimes, FaExclamationTriangle } from 'react-icons/fa';
import HydrationGuard from './HydrationGuard';

interface NotificationState {
    show: boolean;
    title: string;
    body: string;
    data?: Record<string, unknown>;
}

interface MessagePayload {
    notification?: {
        title?: string;
        body?: string;
    };
    data?: Record<string, string>;
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
    const [bannerDismissed, setBannerDismissed] = useState(false);

    // FCM 초기화 함수
    const initializeFCM = useCallback(async () => {
        try {
            setFcmError(null);
            console.log('🚀 [NotificationManager] Starting FCM initialization...');

            if (!user?.email || !user?.role) {
                console.log('❌ [NotificationManager] User email or role missing');
                return;
            }

            // FCM 토큰 요청
            const token = await requestFCMToken(user.email, user.role);

            if (token) {
                console.log('✅ [NotificationManager] FCM token obtained successfully');
                setFcmInitialized(true);

                // 포그라운드 메시지 리스너 설정
                setupForegroundMessageListener((payload: MessagePayload) => {
                    console.log('📨 [NotificationManager] Foreground message received:', payload);
                    setNotification({
                        show: true,
                        title: payload.notification?.title || payload.data?.title || '새 알림',
                        body: payload.notification?.body || payload.data?.body || '새로운 메시지가 있습니다',
                        data: payload.data
                    });
                });
            } else {
                console.log('❌ [NotificationManager] Failed to get FCM token');
                setFcmError('FCM 토큰을 가져올 수 없습니다.');
            }
        } catch (error) {
            console.error('❌ [NotificationManager] FCM initialization error:', error);
            setFcmError('FCM 초기화 중 오류가 발생했습니다.');
        }
    }, [user]);

    // 메인 useEffect - 알림 권한 상태 확인 및 배너 표시 결정
    useEffect(() => {
        console.log('🔍 [NotificationManager] useEffect triggered');
        console.log('📧 [NotificationManager] User email:', user?.email);

        // 사용자가 로그인하지 않았으면 배너 숨김
        if (!user?.email) {
            console.log('❌ [NotificationManager] No user email, hiding banner');
            setShowPermissionBanner(false);
            setBannerDismissed(false);
            return;
        }

        // 세션 스토리지에서 배너 dismiss 상태 확인
        const sessionKey = `notification_banner_dismissed_${user.email}`;
        const dismissed = sessionStorage.getItem(sessionKey) === 'true';
        console.log('💾 [NotificationManager] Session dismissed status:', dismissed);
        setBannerDismissed(dismissed);

        // 브라우저가 알림을 지원하는지 확인
        if (!('Notification' in window)) {
            console.log('❌ [NotificationManager] Browser does not support notifications');
            setShowPermissionBanner(false);
            setFcmError('이 브라우저는 알림을 지원하지 않습니다.');
            return;
        }

        // 현재 알림 권한 상태 확인
        const currentPermission = Notification.permission;
        console.log('🔔 [NotificationManager] Current permission:', currentPermission);

        const isGranted = currentPermission === 'granted';
        setPermissionGranted(isGranted);

        // 배너 표시 조건: 권한이 default이고 세션에서 dismiss되지 않았을 때
        const shouldShowBanner = currentPermission === 'default' && !dismissed;
        console.log('🎯 [NotificationManager] Should show banner:', shouldShowBanner);
        console.log('   - Permission is default:', currentPermission === 'default');
        console.log('   - Not dismissed:', !dismissed);
        console.log('   - User email exists:', !!user.email);

        setShowPermissionBanner(shouldShowBanner);

        // 권한이 이미 승인되어 있으면 FCM 초기화
        if (isGranted && !fcmInitialized) {
            console.log('✅ [NotificationManager] Permission already granted, initializing FCM');
            initializeFCM();
        }
    }, [user?.email, fcmInitialized, initializeFCM]);

    // 알림 권한 요청 처리
    const handleNotificationPermission = async () => {
        try {
            console.log('📱 [NotificationManager] Requesting notification permission...');

            if ('Notification' in window) {
                const permission = await Notification.requestPermission();
                console.log('🔔 [NotificationManager] Permission result:', permission);

                setPermissionGranted(permission === 'granted');
                setShowPermissionBanner(false);
                setBannerDismissed(true);

                if (permission === 'granted') {
                    // 권한 승인 시 세션 스토리지에서 dismissed 상태 제거
                    if (user?.email) {
                        sessionStorage.removeItem(`notification_banner_dismissed_${user.email}`);
                    }

                    if (user?.email && user?.role) {
                        await initializeFCM();
                    }
                } else if (permission === 'denied') {
                    setFcmError('알림 권한이 거부되었습니다. 브라우저 설정에서 수동으로 허용해주세요.');
                }
            }
        } catch (error) {
            console.error('❌ [NotificationManager] Permission request error:', error);
            setFcmError('권한 요청 중 오류가 발생했습니다.');
        }
    };

    // 배너 dismiss 처리
    const handleDismissBanner = () => {
        console.log('⏰ [NotificationManager] Permission banner dismissed');
        setShowPermissionBanner(false);
        setBannerDismissed(true);

        // 세션 스토리지에 dismissed 상태 저장
        if (user?.email) {
            sessionStorage.setItem(`notification_banner_dismissed_${user.email}`, 'true');
        }
    };

    // 알림 닫기
    const closeNotification = () => {
        setNotification(prev => ({ ...prev, show: false }));
    };

    // 알림 클릭 처리
    const handleNotificationClick = () => {
        // 알림 클릭 시 적절한 페이지로 이동
        if (notification.data?.type === 'permission-slip') {
            window.location.href = '/dashboard';
        }
        closeNotification();
    };

    return (
        <>
            {/* Debug information */}
            {process.env.NODE_ENV === 'development' && (
                <div className="fixed bottom-0 right-0 bg-black text-white p-2 text-xs z-50 opacity-75">
                    Banner: {showPermissionBanner ? 'TRUE' : 'FALSE'} |
                    User: {user?.email ? 'YES' : 'NO'} |
                    Dismissed: {bannerDismissed ? 'YES' : 'NO'} |
                    Permission: {typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'N/A'}
                </div>
            )}

            {/* 알림 권한 요청 배너 */}
            {showPermissionBanner && user && !bannerDismissed && (
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
                            className="bg-white text-blue-600 px-3 py-1 rounded text-xs font-medium hover:bg-blue-50 transition-colors"
                        >
                            알림 허용
                        </button>
                        <button
                            onClick={handleDismissBanner}
                            className="text-white hover:text-blue-100 transition-colors"
                            title="나중에"
                        >
                            <FaTimes className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            )}

            {/* FCM 에러 메시지 */}
            {fcmError && (
                <div className="fixed top-16 left-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-40 flex items-center gap-2">
                    <FaExclamationTriangle className="w-4 h-4" />
                    <span className="text-sm">{fcmError}</span>
                    <button
                        onClick={() => setFcmError(null)}
                        className="ml-auto text-red-500 hover:text-red-700"
                    >
                        <FaTimes className="w-3 h-3" />
                    </button>
                </div>
            )}

            {/* 알림 메시지 */}
            {notification.show && (
                <div
                    className="fixed top-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-40 max-w-sm cursor-pointer"
                    onClick={handleNotificationClick}
                >
                    <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{notification.title}</h4>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                closeNotification();
                            }}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <FaTimes className="w-3 h-3" />
                        </button>
                    </div>
                    <p className="text-sm text-gray-600">{notification.body}</p>
                </div>
            )}

            {/* 디버그 정보 (개발 모드에서만) */}
            {process.env.NODE_ENV === 'development' && (
                <div className="fixed bottom-4 left-4 bg-gray-800 text-white p-2 rounded text-xs max-w-xs">
                    <div>FCM 상태:</div>
                    <div>- 브라우저 지원: {'Notification' in window && 'serviceWorker' in navigator ? '✅' : '❌'}</div>
                    <div>- 권한: {'Notification' in window ? Notification.permission : 'unknown'}</div>
                    <div>- 초기화: {fcmInitialized ? '✅' : '❌'}</div>
                    <div>- 사용자: {user?.email || '없음'}</div>
                    <div>- 배너 표시: {showPermissionBanner ? '✅' : '❌'}</div>
                </div>
            )}
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
