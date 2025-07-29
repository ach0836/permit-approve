'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store';

interface HydrationGuardProps {
    children: React.ReactNode;
}

export default function HydrationGuard({ children }: HydrationGuardProps) {
    const [isHydrated, setIsHydrated] = useState(false);
    const { hydrated, setHydrated } = useAuthStore();

    useEffect(() => {
        // 클라이언트에서만 실행
        if (typeof window !== 'undefined') {
            setIsHydrated(true);
            if (!hydrated) {
                setHydrated();
            }
        }
    }, [hydrated, setHydrated]);

    // 서버 사이드에서는 로딩 상태 표시
    if (!isHydrated) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-600 font-medium">시스템 초기화 중...</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
