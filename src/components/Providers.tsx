'use client';

import { SessionProvider } from 'next-auth/react';
import SessionProviderComponent from './SessionProvider';

interface ProvidersProps {
    children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
    return (
        <SessionProvider
            refetchInterval={5 * 60} // 5분마다만 갱신
            refetchOnWindowFocus={false} // 윈도우 포커스 시 갱신 비활성화
            refetchWhenOffline={false} // 오프라인에서 갱신 비활성화
        >
            <SessionProviderComponent>
                {children}
            </SessionProviderComponent>
        </SessionProvider>
    );
}
