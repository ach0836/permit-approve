// Firebase Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Firebase 설정 - 환경변수 대신 직접 설정
const firebaseConfig = {
    apiKey: "AIzaSyC0p7v_XhBQgYKZHKJP1n1VwWj7hBdKFfg",
    authDomain: "permit-approve.firebaseapp.com",
    projectId: "permit-approve",
    storageBucket: "permit-approve.firebasestorage.app",
    messagingSenderId: "474639906354",
    appId: "1:474639906354:web:c2e2ac7d7e9c8b8b8f8a1c"
};

// Firebase 초기화
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// 백그라운드 메시지 처리
messaging.onBackgroundMessage(function (payload) {
    console.log('[firebase-messaging-sw.js] Received background message:', payload);

    const notificationTitle = payload.notification?.title || payload.data?.title || '허가원 알림';
    const notificationBody = payload.notification?.body || payload.data?.body || '새로운 알림이 있습니다.';

    // 고유한 태그로 중복 알림 방지
    const notificationTag = payload.data?.id || `permit-${Date.now()}`;

    const notificationOptions = {
        body: notificationBody,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
        tag: notificationTag, // 중복 방지를 위한 고유 태그
        data: payload.data,
        requireInteraction: true,
        renotify: false, // 같은 태그의 알림이 있어도 다시 알리지 않음
        actions: [
            {
                action: 'view',
                title: '확인하기'
            },
            {
                action: 'dismiss',
                title: '닫기'
            }
        ]
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

// 알림 클릭 이벤트 처리
self.addEventListener('notificationclick', function (event) {
    console.log('[SW] Notification click event:', event);

    event.notification.close();

    if (event.action === 'view' || !event.action) {
        // 허가원 대시보드로 이동
        event.waitUntil(
            clients.matchAll({
                type: 'window',
                includeUncontrolled: true
            }).then(function (clientList) {
                // 기존 탭이 있으면 포커스
                for (const client of clientList) {
                    if (client.url.includes('/dashboard') && 'focus' in client) {
                        return client.focus();
                    }
                }
                // 없으면 새 탭 열기
                if (clients.openWindow) {
                    return clients.openWindow('/dashboard');
                }
            })
        );
    }
});

// 서비스 워커 설치 이벤트
self.addEventListener('install', function (event) {
    console.log('[SW] Installing...');
    self.skipWaiting();
});

// 서비스 워커 활성화 이벤트  
self.addEventListener('activate', function (event) {
    console.log('[SW] Activating...');
    event.waitUntil(self.clients.claim());
});