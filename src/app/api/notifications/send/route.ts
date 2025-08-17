import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Firebase Admin 초기화 (환경변수 체크 강화)
if (!admin.apps.length) {
    try {
        const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
        const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

        if (!serviceAccountKey || !projectId) {
            throw new Error('Firebase service account key or project ID not configured');
        }

        const serviceAccount = JSON.parse(serviceAccountKey);

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: projectId,
        });

        console.log('[FCM Admin] Firebase Admin initialized successfully');
    } catch (error) {
        console.error('[FCM Admin] Failed to initialize Firebase Admin:', error);
    }
}

interface NotificationRequest {
    userEmail: string;
    title: string;
    body: string;
    data?: { [key: string]: string };
}

// 입력 검증 함수
function validateInput(data: NotificationRequest): string | null {
    const { userEmail, title, body } = data;

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!userEmail || !emailRegex.test(userEmail)) {
        return 'Invalid email format';
    }

    // 길이 제한 (XSS 방지)
    if (!title || title.length > 100) {
        return 'Title must be between 1-100 characters';
    }

    if (!body || body.length > 500) {
        return 'Body must be between 1-500 characters';
    }

    // XSS 방지를 위한 특수 문자 검증
    const dangerousChars = /<script|javascript:|data:|vbscript:/i;
    if (dangerousChars.test(title) || dangerousChars.test(body)) {
        return 'Invalid characters detected';
    }

    return null;
}

export async function POST(request: NextRequest) {
    try {
        // 세션 인증 확인
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json(
                { error: 'Unauthorized - Authentication required' },
                { status: 401 }
            );
        }

        const requestData: NotificationRequest = await request.json();

        // 입력 검증
        const validationError = validateInput(requestData);
        if (validationError) {
            return NextResponse.json(
                { error: validationError },
                { status: 400 }
            );
        }

        const { userEmail, title, body, data } = requestData;

        // Rate limiting (간단한 구현)
        const rateLimitKey = `notification_${session.user.email}`;
        // 실제로는 Redis나 다른 저장소를 사용해야 합니다

        console.log('[FCM API] Authorized request from:', session.user.email);

        // Firestore에서 FCM 토큰 가져오기
        const tokenDoc = await getDoc(doc(db, 'fcmTokens', userEmail));

        if (!tokenDoc.exists()) {
            // 민감한 정보 노출 방지
            return NextResponse.json(
                { error: 'Notification delivery failed' },
                { status: 404 }
            );
        }

        const tokenData = tokenDoc.data();
        const fcmToken = tokenData.token;

        // 추가 보안: 토큰 유효성 검증
        if (!fcmToken || typeof fcmToken !== 'string') {
            return NextResponse.json(
                { error: 'Invalid token configuration' },
                { status: 400 }
            );
        }

        // XSS 방지를 위한 텍스트 정제
        const sanitizedTitle = title.replace(/<[^>]*>/g, '').substring(0, 100);
        const sanitizedBody = body.replace(/<[^>]*>/g, '').substring(0, 500);

        // FCM 메시지 구성 - data 메시지만 사용 (중복 알림 방지)
        const message = {
            data: {
                title: sanitizedTitle,
                body: sanitizedBody,
                type: 'permit-notification',
                url: '/dashboard',
                icon: '/icons/icon-192x192.png',
                timestamp: new Date().toISOString(),
                ...(data || {})
            },
            token: fcmToken,
            android: {
                priority: 'high' as const
            },
            apns: {
                headers: {
                    'apns-priority': '10'
                }
            }
        };

        // FCM으로 알림 전송
        const response = await admin.messaging().send(message);

        return NextResponse.json({
            success: true,
            messageId: response,
            // 민감한 정보 제외
        });

    } catch (error) {
        console.error('[FCM API] Error sending notification:', error);

        // 프로덕션에서는 상세한 에러 정보 숨김
        const isDevelopment = process.env.NODE_ENV === 'development';
        const errorMessage = isDevelopment && error instanceof Error ?
            error.message : 'Internal server error';

        return NextResponse.json(
            {
                error: 'Failed to send notification',
                ...(isDevelopment && { details: errorMessage }),
                timestamp: new Date().toISOString()
            },
            { status: 500 }
        );
    }
}