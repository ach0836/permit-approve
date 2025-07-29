'use client';

import { useSession } from 'next-auth/react';
import { useEffect, ReactNode } from 'react';
import { useAuthStore } from '@/store';

interface SessionProviderProps {
    children: ReactNode;
}

export default function SessionProvider({ children }: SessionProviderProps) {
    const { data: session, status } = useSession();
    const { setUser, setLoading, loadUserFromStorage } = useAuthStore();

    // 컴포넌트 마운트 시 로컬 스토리지에서 사용자 정보 로드
    useEffect(() => {
        if (typeof window !== 'undefined') {
            loadUserFromStorage();
        }
    }, [loadUserFromStorage]);

    // 세션 상태 변경 시 사용자 정보 업데이트
    useEffect(() => {
        setLoading(status === 'loading');

        if (status === 'authenticated' && session?.user) {
            const { email, name, image } = session.user;
            if (email) {
                setUser({
                    id: email, // 이메일을 ID로 사용
                    email,
                    name: name || '',
                    image: image || '',
                    role: 'student' // 기본값, 실제로는 Firebase에서 가져와야 함
                });
            }
        } else if (status === 'unauthenticated') {
            // NextAuth 세션이 없을 때는 로컬 스토리지의 데이터만 유지
            // 사용자가 명시적으로 로그아웃하지 않은 경우 세션 유지
        }
    }, [session, status, setUser, setLoading]);

    return <>{children}</>;
}
