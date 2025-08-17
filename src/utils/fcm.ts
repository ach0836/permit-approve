import { messaging, getToken, onMessage } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

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
    };
    data?: Record<string, string>;
}

// 전역 상태로 중복 등록 방지
let isServiceWorkerRegistered = false;
let isMessageListenerSetup = false;
let currentToken: string | null = null;

// 서비스 워커 등록
const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
    try {
        if ('serviceWorker' in navigator && !isServiceWorkerRegistered) {
            const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
            console.log('[FCM] Service Worker registered successfully:', registration);

            // 서비스 워커가 준비될 때까지 기다림
            await navigator.serviceWorker.ready;
            console.log('[FCM] Service Worker is ready');

            isServiceWorkerRegistered = true;
            return registration;
        } else if (isServiceWorkerRegistered) {
            console.log('[FCM] Service Worker already registered');
            return await navigator.serviceWorker.ready;
        }
        return null;
    } catch (error) {
        console.error('[FCM] Service Worker registration failed:', error);
        return null;
    }
};

// FCM 토큰 요청 및 등록 (권한이 이미 승인된 상태에서만 호출)
export const requestFCMToken = async (userEmail: string, userRole: string): Promise<string | null> => {
    try {
        // 이미 같은 토큰이 있으면 재사용
        if (currentToken) {
            console.log('[FCM] Using existing token');
            return currentToken;
        }

        // 브라우저 지원 확인
        if (!messaging) {
            console.log('[FCM] Firebase messaging is not supported in this browser');
            return null;
        }

        // 권한이 이미 승인되었는지 확인
        if (Notification.permission !== 'granted') {
            console.log('[FCM] Notification permission not granted');
            return null;
        }

        // 서비스 워커 등록
        const registration = await registerServiceWorker();
        if (!registration) {
            console.error('[FCM] Failed to register service worker');
            return null;
        }

        // FCM 토큰 가져오기
        const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
        if (!vapidKey) {
            console.error('[FCM] VAPID key is not configured');
            return null;
        }

        const token = await getToken(messaging, { vapidKey });

        if (token) {
            console.log('[FCM] Token obtained:', token.substring(0, 20) + '...');
            currentToken = token;

            // Firestore에 토큰 저장
            await saveFCMToken(token, userEmail, userRole);
            console.log('[FCM] Token saved successfully');

            return token;
        } else {
            console.log('[FCM] No registration token available');
            return null;
        }
    } catch (error) {
        console.error('[FCM] Error getting FCM token:', error);
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
        console.error('[FCM] Error saving FCM token:', error);
        throw error;
    }
};

// 포그라운드 메시지 리스너 설정
export const setupForegroundMessageListener = (onMessageReceived: (payload: MessagePayload) => void): void => {
    if (!messaging) {
        console.log('[FCM] Messaging not available for foreground listener');
        return;
    }

    if (isMessageListenerSetup) {
        console.log('[FCM] Message listener already setup');
        return;
    }

    onMessage(messaging, (payload: MessagePayload) => {
        console.log('[FCM] Foreground message received:', payload);

        // 페이지가 백그라운드 상태인지 확인
        if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
            console.log('[FCM] Page is hidden, letting service worker handle notification');
            return;
        }

        onMessageReceived(payload);
    });

    isMessageListenerSetup = true;
    console.log('[FCM] Message listener setup complete');
};

// FCM 토큰 가져오기 (Firestore에서)
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
        console.error('[FCM] Error getting FCM token from Firestore:', error);
        return null;
    }
};
