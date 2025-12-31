import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const session = request.cookies.get('titanus_session')?.value;

    let isAuthenticated = false;
    if (session) {
        try {
            const decoded = Buffer.from(session, 'base64').toString();
            const [user, salt, secret] = decoded.split(':');
            const serverSecret = process.env.DASHBOARD_SECRET || "spartan_fortress_2025_titanus_gym";

            if (user === 'Titanus Gym' && secret === serverSecret) {
                isAuthenticated = true;
            }
        } catch (e) {
            isAuthenticated = false;
        }
    }

    const { pathname } = request.nextUrl;

    // Rutas públicas que no requieren login
    const isPublicPath = pathname === '/login' || pathname.startsWith('/api/');

    if (!isAuthenticated && !isPublicPath) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    if (session && pathname === '/login') {
        return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
