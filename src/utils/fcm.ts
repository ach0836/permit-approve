import { messaging, getToken, onMessage } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { logger } from './logger';

export interface FCMTokenData {
    token: string;
    userEmail: string;
    userRole: string;
    createdAt: Date;
    updatedAt: Date;
}

interface MessagePayload {
    notification?: {
        title?: string;
        body?: string;
        icon?: string;
    };
    data?: Record<string, string>;
}

// FCM 초기화 상태 타입
interface FCMStatus {
    isServiceWorkerRegistered: boolean;
    isMessageListenerSetup: boolean;
    currentToken: string | null;
}

// FCM 에러 타입
interface FCMError {
    code: string;
    message: string;
    details?: unknown;
}

// 전역 상태로 중복 등록 방지
const fcmStatus: FCMStatus = {
    isServiceWorkerRegistered: false,
    isMessageListenerSetup: false,
    currentToken: null
};

// 서비스 워커 등록
const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
    try {
        if ('serviceWorker' in navigator && !fcmStatus.isServiceWorkerRegistered) {
            const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
            logger.fcm.log('Service Worker registered successfully:', registration);

            // 서비스 워커가 준비될 때까지 기다림
            await navigator.serviceWorker.ready;
            logger.fcm.log('Service Worker is ready');

            fcmStatus.isServiceWorkerRegistered = true;
            return registration;
        } else if (fcmStatus.isServiceWorkerRegistered) {
            logger.fcm.log('Service Worker already registered');
            return await navigator.serviceWorker.ready;
        }
        return null;
    } catch (error) {
        logger.fcm.error('Service Worker registration failed:', error);
        return null;
    }
};

// FCM 토큰 요청 및 등록 (권한이 이미 승인된 상태에서만 호출)
export const requestFCMToken = async (userEmail: string, userRole: string): Promise<string | null> => {
    try {
        // 이미 같은 토큰이 있으면 재사용
        if (fcmStatus.currentToken) {
            logger.fcm.log('Using existing token');
            return fcmStatus.currentToken;
        }

        // 브라우저 지원 확인
        if (!messaging) {
            logger.fcm.log('Firebase messaging is not supported in this browser');
            return null;
        }

        // 권한이 이미 승인되었는지 확인
        if (Notification.permission !== 'granted') {
            logger.fcm.log('Notification permission not granted');
            return null;
        }

        // 서비스 워커 등록
        const registration = await registerServiceWorker();
        if (!registration) {
            logger.fcm.error('Failed to register service worker');
            return null;
        }

        // FCM 토큰 가져오기
        const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
        if (!vapidKey) {
            logger.fcm.error('VAPID key is not configured');
            return null;
        }

        const token = await getToken(messaging, { vapidKey });

        if (token) {
            logger.fcm.log('Token obtained:', token.substring(0, 20) + '...');
            fcmStatus.currentToken = token;

            // Firestore에 토큰 저장
            await saveFCMToken(token, userEmail, userRole);
            logger.fcm.log('Token saved successfully');

            return token;
        } else {
            logger.fcm.log('No registration token available');
            return null;
        }
    } catch (error) {
        logger.fcm.error('Error getting FCM token:', error);
        return null;
    }
};

// FCM 토큰을 Firestore에 저장
export const saveFCMToken = async (token: string, userEmail: string, userRole: string): Promise<void> => {
    try {
        const tokenData: FCMTokenData = {
            token,
            userEmail,
            userRole,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        await setDoc(doc(db, 'fcmTokens', userEmail), tokenData, { merge: true });
        console.log('[FCM] Token saved to Firestore for user:', userEmail);
    } catch (error) {
        logger.fcm.error('Error saving FCM token:', error);
        throw error;
    }
};

// 포그라운드 메시지 리스너 설정
export const setupForegroundMessageListener = (onMessageReceived: (payload: MessagePayload) => void): void => {
    if (!messaging) {
        logger.fcm.log('Messaging not available for foreground listener');
        return;
    }

    if (fcmStatus.isMessageListenerSetup) {
        logger.fcm.log('Message listener already setup');
        return;
    }

    onMessage(messaging, (payload: MessagePayload) => {
        logger.fcm.log('Foreground message received:', payload);

        // 페이지가 백그라운드 상태인지 확인
        if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
            logger.fcm.log('Page is hidden, letting service worker handle notification');
            return;
        }

        onMessageReceived(payload);
    });

    fcmStatus.isMessageListenerSetup = true;
    logger.fcm.log('Message listener setup complete');
};// FCM 토큰 가져오기 (Firestore에서)
export const getFCMToken = async (userEmail: string): Promise<string | null> => {
    try {
        const tokenDoc = await getDoc(doc(db, 'fcmTokens', userEmail));
        if (tokenDoc.exists()) {
            const data = tokenDoc.data() as FCMTokenData;
            return data.token;
        }
        console.log('[FCM] No token found for user:', userEmail);
        return null;
    } catch (error) {
        logger.fcm.error('Error getting FCM token from Firestore:', error);
        return null;
    }
};
