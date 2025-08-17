import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Firebase 초기화 (중복 초기화 방지)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

// FCM 초기화 (브라우저에서만)
let messaging: any = null;

// 브라우저 환경에서만 FCM 초기화
if (typeof window !== 'undefined') {
    console.log('[Firebase] Initializing FCM...');

    isSupported().then((supported) => {
        if (supported) {
            try {
                messaging = getMessaging(app);
                console.log('[Firebase] FCM initialized successfully');
            } catch (error) {
                console.error('[Firebase] FCM initialization failed:', error);
            }
        } else {
            console.log('[Firebase] FCM is not supported in this browser');
        }
    }).catch((error) => {
        console.error('[Firebase] FCM support check failed:', error);
    });
}

console.log('[Firebase] Firebase app initialized:', app.name);

export { db, app, messaging, getToken, onMessage };
