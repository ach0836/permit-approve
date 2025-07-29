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

    // 캐시 헤더 설정
    const response = NextResponse.next();

    // 정적 리소스에 대한 캐시 설정
    if (pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/)) {
        response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    }

    // API 라우트 캐시 설정
    if (pathname.startsWith('/api/')) {
        response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        response.headers.set('Pragma', 'no-cache');
        response.headers.set('Expires', '0');
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
