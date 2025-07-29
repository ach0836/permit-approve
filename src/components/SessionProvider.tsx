'use client';

import { useSession } from 'next-auth/react';
import { useEffect, ReactNode, useRef } from 'react';
import { useAuthStore } from '@/store';

interface SessionProviderProps {
    children: ReactNode;
}

export default function SessionProvider({ children }: SessionProviderProps) {
    const { data: session, status } = useSession();
    const authStore = useAuthStore();
    const hasLoadedFromStorage = useRef(false);
    const lastSessionRef = useRef<string | null>(null);

    // 컴포넌트 마운트 시 로컬 스토리지에서 사용자 정보 로드 (한 번만)
    useEffect(() => {
        if (typeof window !== 'undefined' && !hasLoadedFromStorage.current) {
            authStore.loadUserFromStorage();
            hasLoadedFromStorage.current = true;
        }
    }, []);

    // 세션 상태 변경 시 사용자 정보 업데이트 (실제 변경된 경우만)
    useEffect(() => {
        const sessionId = session?.user?.email || null;

        // 세션이 실제로 변경되지 않았다면 무시
        if (lastSessionRef.current === sessionId && status !== 'loading') {
            return;
        }

        console.log('Session status:', status, 'Session ID:', sessionId);

        authStore.setLoading(status === 'loading');

        if (status === 'authenticated' && session?.user?.email) {
            const { email, name, image } = session.user;
            lastSessionRef.current = email;

            authStore.setUser({
                id: email,
                email,
                name: name || '',
                image: image || '',
                role: 'student'
            });
        } else if (status === 'unauthenticated') {
            lastSessionRef.current = null;
            // 로그아웃이 아닌 경우 로컬 스토리지 데이터 유지
        }
    }, [session?.user?.email, status]);

    return <>{children}</>;
}
