'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store';
import { requestFCMToken } from '@/utils/fcm';
import { FaBell, FaBellSlash, FaSpinner } from 'react-icons/fa';

interface NotificationToggleProps {
    onPermissionChange?: (granted: boolean) => void;
    className?: string;
    isMobile?: boolean;
}

export default function NotificationToggle({ onPermissionChange, className = '', isMobile = false }: NotificationToggleProps) {
    const { user } = useAuthStore();
    const [permissionStatus, setPermissionStatus] = useState<'default' | 'granted' | 'denied'>('default');
    const [isLoading, setIsLoading] = useState(false);

    // 권한 상태 확인
    useEffect(() => {
        if ('Notification' in window) {
            setPermissionStatus(Notification.permission);
        }
    }, []);

    // FCM 초기화 함수
    const initializeFCM = async () => {
        if (!user?.email || !user?.role) {
            console.log('❌ [NotificationToggle] User email or role missing for FCM initialization');
            return;
        }

        try {
            console.log('🚀 [NotificationToggle] Initializing FCM after permission granted');
            const token = await requestFCMToken(user.email, user.role);
            if (token) {
                console.log('✅ [NotificationToggle] FCM token obtained successfully');
            }
        } catch (error) {
            console.error('❌ [NotificationToggle] FCM initialization failed:', error);
        }
    };

    // 알림 권한 토글
    const handleToggle = async () => {
        if (!('Notification' in window)) {
            alert('이 브라우저는 알림을 지원하지 않습니다.');
            return;
        }

        if (permissionStatus === 'denied') {
            alert('알림 권한이 차단되었습니다. 브라우저 설정에서 수동으로 허용해주세요.');
            return;
        }

        if (permissionStatus === 'granted') {
            alert('알림을 비활성화하려면 브라우저 설정에서 변경해주세요.');
            return;
        }

        setIsLoading(true);
        try {
            const permission = await Notification.requestPermission();
            setPermissionStatus(permission);

            if (permission === 'granted') {
                // FCM 초기화
                await initializeFCM();
            }

            onPermissionChange?.(permission === 'granted');
        } catch (error) {
            console.error('알림 권한 요청 중 오류:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getButtonConfig = () => {
        const baseConfig = {
            granted: {
                icon: FaBell,
                bgColor: 'bg-green-100 hover:bg-green-200',
                textColor: 'text-green-700',
                iconColor: 'text-green-600',
                text: '알림 활성화됨'
            },
            denied: {
                icon: FaBellSlash,
                bgColor: 'bg-red-100 hover:bg-red-200',
                textColor: 'text-red-700',
                iconColor: 'text-red-600',
                text: '알림 차단됨'
            },
            default: {
                icon: FaBell,
                bgColor: 'bg-gray-100 hover:bg-gray-200',
                textColor: 'text-gray-700',
                iconColor: 'text-gray-600',
                text: '알림 허용'
            }
        };

        return baseConfig[permissionStatus];
    };

    const config = getButtonConfig();
    const IconComponent = config.icon;

    // 모바일용 스타일과 데스크톱용 스타일 구분
    const buttonStyle = isMobile
        ? `flex items-center justify-center p-2 rounded-lg font-medium transition-colors ${config.bgColor} ${config.textColor}`
        : `flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${config.bgColor} ${config.textColor}`;

    const iconSize = isMobile ? "w-4 h-4" : "w-4 h-4";

    return (
        <button
            onClick={handleToggle}
            disabled={isLoading}
            className={`${buttonStyle} ${className}`}
        >
            {isLoading ? (
                <FaSpinner className={`${iconSize} animate-spin`} />
            ) : (
                <IconComponent className={`${iconSize} ${config.iconColor}`} />
            )}
            {!isMobile && <span>{config.text}</span>}
        </button>
    );
}
