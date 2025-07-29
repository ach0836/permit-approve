/** @type {import('next').NextConfig} */
const nextConfig = {
    // 캐시 최적화 설정
    experimental: {
        // 정적 이미지 최적화
        optimizePackageImports: ['@/components', '@/lib', '@/utils'],
    },

    // 컴파일러 최적화
    compiler: {
        // 프로덕션에서 console.log 제거
        removeConsole: process.env.NODE_ENV === 'production' ? {
            exclude: ['error']
        } : false,
    },

    // 헤더 설정으로 캐시 제어
    async headers() {
        return [
            {
                // 정적 리소스 캐시 설정
                source: '/(.*)',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            },
            {
                // API 라우트 캐시 설정
                source: '/api/(.*)',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=0, must-revalidate',
                    },
                ],
            },
        ];
    },

    // 이미지 최적화 설정
    images: {
        domains: ['lh3.googleusercontent.com'], // Google 프로필 이미지
        formats: ['image/webp', 'image/avif'],
    },

    // 성능 최적화
    poweredByHeader: false,
    compress: true,
};

module.exports = nextConfig;
