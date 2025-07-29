'use client';

import { useSession } from 'next-auth/react';
import { useAuthStore } from '@/store';
import { useEffect } from 'react';

export default function SessionProvider({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const { setUser, setLoading } = useAuthStore();

    useEffect(() => {
        setLoading(status === 'loading');

        if (status === 'authenticated' && session?.user) {
            console.log('✅ 사용자 로그인 성공:', {
                email: session.user.email,
                name: session.user.name,
                role: (session.user as any).role
            });
            setUser({
                id: session.user.email || '', // 이메일을 ID로 사용
                email: session.user.email || '',
                name: session.user.name || '',
                image: session.user.image || '',
                role: (session.user as any).role || 'student',
            });
        } else if (status === 'unauthenticated') {
            console.log('❌ 사용자 인증되지 않음');
            setUser(null);
        }
    }, [session, status, setUser, setLoading]);

    return <>{children}</>;
}
