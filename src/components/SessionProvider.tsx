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
    const lastStatusRef = useRef<string>('');

    // 컴포넌트 마운트 시 로컬 스토리지에서 사용자 정보 로드 (한 번만)
    useEffect(() => {
        if (typeof window !== 'undefined' && !hasLoadedFromStorage.current) {
            authStore.loadUserFromStorage();
            hasLoadedFromStorage.current = true;
        }
    }, []);

    // 세션 상태 변경 시 사용자 정보 업데이트 (상태가 실제로 변경된 경우만)
    useEffect(() => {
        // 상태가 변경되지 않았다면 무시
        if (lastStatusRef.current === status) {
            return;
        }
        lastStatusRef.current = status;

        authStore.setLoading(status === 'loading');

        if (status === 'authenticated' && session?.user) {
            const { email, name, image } = session.user;
            if (email) {
                authStore.setUser({
                    id: email,
                    email,
                    name: name || '',
                    image: image || '',
                    role: 'student'
                });
            }
        } else if (status === 'unauthenticated') {
            // NextAuth 세션이 없을 때는 로컬 스토리지의 데이터만 유지
        }
    }, [session, status]); // Zustand 스토어 함수들은 의존성에서 제외

    return <>{children}</>;
}
