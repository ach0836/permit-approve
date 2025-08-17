import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
    const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET
    });

    const { pathname } = request.nextUrl;

    // 보호된 경로 목록
    const protectedPaths = ['/dashboard'];
    const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));

    // 인증이 필요한 페이지에 토큰 없이 접근하는 경우
    if (isProtectedPath && !token) {
        const url = request.nextUrl.clone();
        url.pathname = '/auth/signin';
        url.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(url);
    }

    // 로그인 페이지에 이미 인증된 사용자가 접근하는 경우
    if (pathname.startsWith('/auth/signin') && token) {
        const url = request.nextUrl.clone();
        url.pathname = '/dashboard';
        return NextResponse.redirect(url);
    }

    // 보안 헤더 및 캐시 설정
    const response = NextResponse.next();

    // 보안 헤더 추가
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    // HTTPS 강제 (프로덕션)
    if (process.env.NODE_ENV === 'production') {
        response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    // CSP 설정 (보안 강화)
    const csp = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.gstatic.com https://www.google.com https://accounts.google.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: https: blob:",
        "connect-src 'self' https://fcm.googleapis.com https://firebaseinstallations.googleapis.com https://firebase.googleapis.com",
        "worker-src 'self'",
        "manifest-src 'self'",
        "frame-src https://accounts.google.com"
    ].join('; ');

    // 개발 환경에서는 느슨한 CSP 적용
    if (process.env.NODE_ENV === 'development') {
        response.headers.set('Content-Security-Policy-Report-Only', csp);
    } else {
        response.headers.set('Content-Security-Policy', csp);
    }

    // 캐시 헤더 설정
    if (pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/)) {
        response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    }

    // API 라우트 보안 및 캐시 설정
    if (pathname.startsWith('/api/')) {
        response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        response.headers.set('Pragma', 'no-cache');
        response.headers.set('Expires', '0');

        // API 요청에 대한 추가 보안 헤더
        response.headers.set('X-API-Version', '1.0');

        // 민감한 API 경로 보호
        if (pathname.startsWith('/api/notifications/send') && !token) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }
    }

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
