'use client';

import { useEffect, useState } from 'react';

interface HydrationGuardProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

/**
 * HydrationGuard - 클라이언트 사이드에서만 렌더링하는 컴포넌트
 * Hydration mismatch 오류를 방지합니다.
 */
export default function HydrationGuard({ children, fallback = null }: HydrationGuardProps) {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}