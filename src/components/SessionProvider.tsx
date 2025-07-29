'use client';

import { useSession } from 'next-auth/react';
import { useAuthStore } from '@/store';
import { useEffect } from 'react';
import { UserRole } from '@/types';

export default function SessionProvider({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const { setUser, setLoading, user, isSessionValid, clearUser, updateLastLoginTime } = useAuthStore();

    useEffect(() => {
        setLoading(status === 'loading');

        if (status === 'authenticated' && session?.user) {
            console.log('✅ 사용자 로그인 성공:', {
                email: session.user.email,
                name: session.user.name,
                role: (session.user as { role?: UserRole }).role
            });
            setUser({
                id: session.user.email || '', // 이메일을 ID로 사용
                email: session.user.email || '',
                name: session.user.name || '',
                image: session.user.image || '',
                role: ((session.user as { role?: UserRole }).role || 'student') as UserRole,
            });
            updateLastLoginTime();
        } else if (status === 'unauthenticated') {
            console.log('❌ 사용자 인증되지 않음');

            // 캐시된 세션이 유효한지 확인
            if (user && isSessionValid()) {
                console.log('📦 캐시된 세션 사용 중');
                // 캐시된 세션이 유효하면 유지
                return;
            } else {
                console.log('🗑️ 만료된 세션 삭제');
                clearUser();
            }
        }
    }, [session, status, setUser, setLoading, user, isSessionValid, clearUser, updateLastLoginTime]); return <>{children}</>;
}
