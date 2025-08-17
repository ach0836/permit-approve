// Firebase Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Firebase 설정 - 동적으로 가져오기 (보안 강화)
let firebaseConfig = null;

// 설정을 동적으로 가져오는 함수
async function getFirebaseConfig() {
    if (firebaseConfig) return firebaseConfig;

    try {
        // 공개 API에서 설정 가져오기
        const response = await fetch('/api/firebase-config');
        const config = await response.json();
        firebaseConfig = config;
        return config;
    } catch (error) {
        console.error('[SW] Failed to fetch Firebase config:', error);
        // 폴백 설정 (최소한의 정보만)
        return {
            apiKey: "AIzaSyC0p7v_XhBQgYKZHKJP1n1VwWj7hBdKFfg",
            projectId: "permit-approve",
            messagingSenderId: "474639906354",
            appId: "1:474639906354:web:c2e2ac7d7e9c8b8b8f8a1c"
        };
    }
}

// Firebase 초기화 및 메시징 설정
let messaging = null;

async function initializeFirebase() {
    if (messaging) return messaging;

    try {
        const config = await getFirebaseConfig();
        firebase.initializeApp(config);
        messaging = firebase.messaging();
        console.log('[SW] Firebase initialized successfully');
        return messaging;
    } catch (error) {
        console.error('[SW] Firebase initialization failed:', error);
        return null;
    }
}

// 백그라운드 메시지 처리 - data 메시지만 처리
self.addEventListener('message', async function (event) {
    if (event.data && event.data.type === 'INIT_MESSAGING') {
        await initializeFirebase();
    }
});

// 메시징 초기화
initializeFirebase().then((msg) => {
    if (msg) {
        msg.onBackgroundMessage(function (payload) {
            console.log('[firebase-messaging-sw.js] Received background message:', payload);

            // 입력 검증 강화
            if (!payload || !payload.data) {
                console.warn('[SW] Invalid payload received');
                return;
            }

            const { title, body, icon, url } = payload.data;

            // XSS 방지를 위한 텍스트 정제
            const sanitizedTitle = title ? String(title).substring(0, 100) : '허가원 알림';
            const sanitizedBody = body ? String(body).substring(0, 200) : '새로운 알림이 있습니다.';

            // 고유한 태그로 중복 알림 방지
            const notificationTag = payload.data?.id ?
                `permit-${String(payload.data.id).replace(/[^a-zA-Z0-9-]/g, '')}` :
                `permit-${Date.now()}`;

            const notificationOptions = {
                body: sanitizedBody,
                icon: icon || '/icons/icon-192x192.png',
                badge: '/icons/icon-192x192.png',
                tag: notificationTag,
                data: {
                    url: url && url.startsWith('/') ? url : '/dashboard' // URL 검증
                },
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

            self.registration.showNotification(sanitizedTitle, notificationOptions);
        });
    }
});

// 알림 클릭 이벤트 처리 (보안 강화)
self.addEventListener('notificationclick', function (event) {
    console.log('[SW] Notification click event:', event);

    event.notification.close();

    if (event.action === 'view' || !event.action) {
        const targetUrl = event.notification.data?.url;

        // URL 검증 강화
        let safeUrl = '/dashboard';
        if (targetUrl && typeof targetUrl === 'string') {
            // 상대 경로만 허용 (절대 URL 차단으로 피싱 방지)
            if (targetUrl.startsWith('/') && !targetUrl.startsWith('//')) {
                // 추가 경로 검증
                const allowedPaths = ['/dashboard', '/auth/signin', '/'];
                if (allowedPaths.some(path => targetUrl.startsWith(path))) {
                    safeUrl = targetUrl;
                }
            }
        }

        event.waitUntil(
            clients.matchAll({
                type: 'window',
                includeUncontrolled: true
            }).then(function (clientList) {
                // 기존 탭이 있으면 포커스
                for (const client of clientList) {
                    if (client.url.includes('/dashboard') && 'focus' in client) {
                        return client.focus().then(() => {
                            // 안전한 방식으로 페이지 네비게이션
                            client.postMessage({ type: 'NAVIGATE', url: safeUrl });
                        });
                    }
                }
                // 없으면 새 탭 열기
                if (clients.openWindow) {
                    return clients.openWindow(safeUrl);
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