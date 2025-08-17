'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/store';
import { requestFCMToken, setupForegroundMessageListener } from '@/utils/fcm';
import { FaTimes } from 'react-icons/fa';
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
    const [fcmInitialized, setFcmInitialized] = useState(false);
    const [isInitializing, setIsInitializing] = useState(false);

    // FCM 초기화 함수
    const initializeFCM = useCallback(async () => {
        // 이미 초기화 중이거나 완료되었으면 건너뜀
        if (isInitializing || fcmInitialized) {
            console.log('🔄 [NotificationManager] FCM initialization already in progress or completed');
            return;
        }

        try {
            setIsInitializing(true);
            console.log('🚀 [NotificationManager] Starting FCM initialization...');

            if (!user?.email || !user?.role) {
                console.log('❌ [NotificationManager] User email or role missing');
                return;
            }

            // 알림 권한이 승인되지 않았으면 초기화하지 않음
            if (Notification.permission !== 'granted') {
                console.log('❌ [NotificationManager] Notification permission not granted');
                return;
            }

            // FCM 토큰 요청
            const token = await requestFCMToken(user.email, user.role);

            if (token) {
                console.log('✅ [NotificationManager] FCM token obtained successfully');

                // 포그라운드 메시지 리스너 설정 (한 번만)
                setupForegroundMessageListener((payload: MessagePayload) => {
                    console.log('📨 [NotificationManager] Foreground message received:', payload);
                    setNotification({
                        show: true,
                        title: payload.notification?.title || payload.data?.title || '새 알림',
                        body: payload.notification?.body || payload.data?.body || '새로운 메시지가 있습니다',
                        data: payload.data
                    });
                });

                setFcmInitialized(true);
            } else {
                console.log('❌ [NotificationManager] Failed to get FCM token');
            }
        } catch (error) {
            console.error('❌ [NotificationManager] FCM initialization error:', error);
        } finally {
            setIsInitializing(false);
        }
    }, [user, isInitializing, fcmInitialized]);

    // 권한 상태 모니터링 및 FCM 초기화
    useEffect(() => {
        console.log('🔍 [NotificationManager] Checking notification permission...');

        if (!user?.email) {
            return;
        }

        // 브라우저가 알림을 지원하는지 확인
        if (!('Notification' in window)) {
            console.log('❌ [NotificationManager] Browser does not support notifications');
            return;
        }

        // 권한이 승인되어 있고 FCM이 아직 초기화되지 않았으면 초기화
        if (Notification.permission === 'granted' && !fcmInitialized && !isInitializing) {
            console.log('✅ [NotificationManager] Permission granted, initializing FCM');
            initializeFCM();
        }
    }, [user?.email, fcmInitialized, isInitializing, initializeFCM]);

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
                    <div>- FCM 초기화: {fcmInitialized ? '✅' : '❌'}</div>
                    <div>- 초기화 중: {isInitializing ? '🔄' : '⏹️'}</div>
                    <div>- 사용자: {user?.email || '없음'}</div>
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