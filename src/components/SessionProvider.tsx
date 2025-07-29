'use client';

import { useSession } from 'next-auth/react';
import { useEffect, ReactNode, useRef, useCallback, useMemo } from 'react';
import { useAuthStore } from '@/store';

interface SessionProviderProps {
    children: ReactNode;
}

export default function SessionProvider({ children }: SessionProviderProps) {
    const { data: session, status } = useSession();
    const authStore = useAuthStore();
    const hasLoadedFromStorage = useRef(false);
    const lastSessionRef = useRef<string | null>(null);
    const lastStatusRef = useRef<string>('');

    // 세션 정보를 메모화하여 불필요한 리렌더링 방지
    const sessionEmail = useMemo(() => session?.user?.email || null, [session?.user?.email]);
    const sessionName = useMemo(() => session?.user?.name || '', [session?.user?.name]);
    const sessionImage = useMemo(() => session?.user?.image || '', [session?.user?.image]);

    // 로컬 스토리지 로드 함수를 메모화
    const loadFromStorage = useCallback(() => {
        if (typeof window !== 'undefined' && !hasLoadedFromStorage.current) {
            authStore.loadUserFromStorage();
            hasLoadedFromStorage.current = true;
        }
    }, []);

    // 컴포넌트 마운트 시 로컬 스토리지에서 사용자 정보 로드 (한 번만)
    useEffect(() => {
        loadFromStorage();
    }, [loadFromStorage]);

    // 세션 상태 변경 시 사용자 정보 업데이트 (실제 변경된 경우만)
    useEffect(() => {
        // 상태와 세션 모두 변경되지 않았다면 무시  
        if (lastSessionRef.current === sessionEmail && lastStatusRef.current === status) {
            return;
        }

        // 이전 상태와 현재 상태 저장
        const prevStatus = lastStatusRef.current;
        lastStatusRef.current = status;

        console.log('Session status changed:', prevStatus, '->', status, 'Session ID:', sessionEmail);

        // 로딩 상태는 실제 상태 변경시에만 업데이트
        if (prevStatus !== status) {
            authStore.setLoading(status === 'loading');
        }

        if (status === 'authenticated' && sessionEmail) {
            // 같은 사용자면 업데이트하지 않음
            if (lastSessionRef.current !== sessionEmail) {
                lastSessionRef.current = sessionEmail;

                authStore.setUser({
                    id: sessionEmail,
                    email: sessionEmail,
                    name: sessionName,
                    image: sessionImage,
                    role: 'student'
                });
            }
        } else if (status === 'unauthenticated') {
            lastSessionRef.current = null;
            // 로그아웃이 아닌 경우 로컬 스토리지 데이터 유지
        }
    }, [sessionEmail, sessionName, sessionImage, status, authStore]);

    return <>{children}</>;
}
