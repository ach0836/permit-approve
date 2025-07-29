/** @type {import('next').NextConfig} */
const nextConfig = {
    // 실험적 기능
    experimental: {
        optimizePackageImports: ['@/components', '@/lib', '@/utils'],
    },

    // 이미지 최적화 설정
    images: {
        domains: ['lh3.googleusercontent.com'], // Google 프로필 이미지
        formats: ['image/webp', 'image/avif'],
    },

    // 기본 최적화 설정
    poweredByHeader: false,
    compress: true,
};

module.exports = nextConfig;
