'use client';

import { useEffect, useState, useCallback, memo } from 'react';
import { useAuthStore } from '@/store';
import { requestFCMToken } from '@/utils/fcm';
import { FaBell, FaBellSlash, FaSpinner } from 'react-icons/fa';
import { logger } from '@/utils/logger';
import { ErrorCodes, getUserFriendlyMessage, reportError, createError } from '@/utils/errorHandler';

interface NotificationToggleProps {
    onPermissionChange?: (granted: boolean) => void;
    className?: string;
    isMobile?: boolean;
}

const NotificationToggle = memo(function NotificationToggle({
    onPermissionChange,
    className = '',
    isMobile = false
}: NotificationToggleProps) {
    const { user } = useAuthStore();
    const [permissionStatus, setPermissionStatus] = useState<'default' | 'granted' | 'denied'>('default');
    const [isLoading, setIsLoading] = useState(false);

    // 권한 상태 확인
    useEffect(() => {
        if ('Notification' in window) {
            setPermissionStatus(Notification.permission);
        }
    }, []);

    // FCM 초기화 함수 (useCallback으로 최적화)
    const initializeFCM = useCallback(async () => {
        if (!user?.email || !user?.role) {
            const error = createError(
                ErrorCodes.FCM_INIT_FAILED,
                'User email or role missing for FCM initialization',
                '사용자 정보가 없어 알림을 설정할 수 없습니다.'
            );
            reportError(error);
            return;
        }

        try {
            logger.fcm.log('Initializing FCM after permission granted');
            const token = await requestFCMToken(user.email, user.role);
            if (token) {
                logger.fcm.log('FCM token obtained successfully');
            }
        } catch (error) {
            const appError = createError(
                ErrorCodes.FCM_INIT_FAILED,
                'FCM initialization failed',
                '알림 설정 중 문제가 발생했습니다.',
                error
            );
            reportError(appError);
        }
    }, [user?.email, user?.role]);

    // 알림 권한 토글 (useCallback으로 최적화)
    const handleToggle = useCallback(async () => {
        if (!('Notification' in window)) {
            const message = getUserFriendlyMessage(ErrorCodes.FCM_NOT_SUPPORTED);
            alert(message);
            return;
        }

        if (permissionStatus === 'denied') {
            const message = getUserFriendlyMessage(ErrorCodes.FCM_PERMISSION_DENIED);
            alert(message);
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
                await initializeFCM();
            }

            onPermissionChange?.(permission === 'granted');
        } catch (error) {
            const appError = createError(
                ErrorCodes.FCM_PERMISSION_DENIED,
                'Notification permission request failed',
                '알림 권한 요청 중 오류가 발생했습니다.',
                error
            );
            reportError(appError);
            alert(appError.userMessage);
        } finally {
            setIsLoading(false);
        }
    }, [permissionStatus, initializeFCM, onPermissionChange]);

    const getButtonConfig = useCallback(() => {
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
    }, [permissionStatus]);

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
            aria-label={isMobile ? config.text : undefined}
        >
            {isLoading ? (
                <FaSpinner className={`${iconSize} animate-spin`} />
            ) : (
                <IconComponent className={`${iconSize} ${config.iconColor}`} />
            )}
            {!isMobile && <span>{config.text}</span>}
        </button>
    );
});

export default NotificationToggle;
