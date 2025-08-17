import { NextResponse } from 'next/server';

export async function GET() {
    try {
        // 공개해도 안전한 Firebase 설정만 반환
        const config = {
            apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
            authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
            messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
            appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
        };

        // 환경변수가 제대로 설정되어 있는지 확인
        const hasAllConfig = Object.values(config).every(value => value);

        if (!hasAllConfig) {
            console.error('[Firebase Config API] Missing environment variables');
            return NextResponse.json(
                { error: 'Firebase configuration not available' },
                { status: 500 }
            );
        }

        return NextResponse.json(config, {
            headers: {
                'Cache-Control': 'public, max-age=3600', // 1시간 캐시
                'Content-Type': 'application/json',
            },
        });

    } catch (error) {
        console.error('[Firebase Config API] Error:', error);
        return NextResponse.json(
            { error: 'Configuration error' },
            { status: 500 }
        );
    }
}
