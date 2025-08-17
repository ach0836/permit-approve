import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

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

export async function POST(request: NextRequest) {
    try {
        const { userEmail, title, body, data }: NotificationRequest = await request.json();

        // 입력 검증
        if (!userEmail || !title || !body) {
            console.error('[FCM API] Missing required fields:', { userEmail: !!userEmail, title: !!title, body: !!body });
            return NextResponse.json(
                { error: 'Missing required fields: userEmail, title, body' },
                { status: 400 }
            );
        }

        console.log('[FCM API] Sending notification to:', userEmail);

        // Firestore에서 FCM 토큰 가져오기
        const tokenDoc = await getDoc(doc(db, 'fcmTokens', userEmail));

        if (!tokenDoc.exists()) {
            console.error('[FCM API] No FCM token found for user:', userEmail);
            return NextResponse.json(
                { error: `No FCM token found for user: ${userEmail}` },
                { status: 404 }
            );
        }

        const tokenData = tokenDoc.data();
        const fcmToken = tokenData.token;

        console.log('[FCM API] Found token for user, sending message...');

        // FCM 메시지 구성 (단순화된 구조)
        const message = {
            notification: {
                title,
                body,
            },
            data: {
                title,
                body,
                type: 'permit-notification',
                url: '/dashboard',
                ...(data || {})
            },
            token: fcmToken,
            webpush: {
                fcmOptions: {
                    link: '/dashboard'
                }
            }
        };

        // FCM으로 알림 전송
        const response = await admin.messaging().send(message);
        console.log('[FCM API] Message sent successfully:', response);

        return NextResponse.json({
            success: true,
            messageId: response,
            userEmail
        });

    } catch (error) {
        console.error('[FCM API] Error sending notification:', error);

        // 자세한 에러 정보 반환
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        return NextResponse.json(
            {
                error: 'Failed to send notification',
                details: errorMessage,
                timestamp: new Date().toISOString()
            },
            { status: 500 }
        );
    }
}