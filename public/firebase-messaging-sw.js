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

// 백그라운드 메시지 처리 - data 메시지만 처리
messaging.onBackgroundMessage(function (payload) {
    console.log('[firebase-messaging-sw.js] Received background message:', payload);

    // notification 객체가 있으면 FCM이 자동으로 처리하므로 여기서는 data만 처리
    if (payload.data) {
        const { title, body, icon, url } = payload.data;

        // 고유한 태그로 중복 알림 방지
        const notificationTag = payload.data?.id || `permit-${Date.now()}`;

        const notificationOptions = {
            body: body || '새로운 알림이 있습니다.',
            icon: icon || '/icons/icon-192x192.png',
            badge: '/icons/icon-192x192.png',
            tag: notificationTag,
            data: { url: url || '/dashboard' },
            requireInteraction: true,
            renotify: false,
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

        self.registration.showNotification(title || '허가원 알림', notificationOptions);
    }
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