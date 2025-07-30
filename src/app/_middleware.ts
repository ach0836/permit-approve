import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
    if (request.nextUrl.pathname === '/service-worker.js') {
        return new NextResponse(
            `importScripts('/src/app/service-worker.js');`,
            {
                headers: {
                    'Content-Type': 'application/javascript',
                },
            }
        );
    }
    return NextResponse.next();
}
