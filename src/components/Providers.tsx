'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';
import SessionProvider from './SessionProvider';

interface ProvidersProps {
    children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
    return (
        <NextAuthSessionProvider>
            <SessionProvider>
                {children}
            </SessionProvider>
        </NextAuthSessionProvider>
    );
}
