'use client';

import { SessionProvider } from 'next-auth/react';
import SessionProviderComponent from './SessionProvider';

interface ProvidersProps {
    children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
    return (
        <SessionProvider>
            <SessionProviderComponent>
                {children}
            </SessionProviderComponent>
        </SessionProvider>
    );
}
