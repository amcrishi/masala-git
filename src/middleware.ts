import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-change-me');

const protectedRoutes = ['/dashboard', '/admin', '/checkout'];
const adminRoutes = ['/admin'];
const authRoutes = ['/login', '/register'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value;

  // Redirect authenticated users away from auth pages
  if (authRoutes.some((route) => pathname.startsWith(route))) {
    if (token) {
      try {
        await jwtVerify(token, JWT_SECRET);
        return NextResponse.redirect(new URL('/dashboard', request.url));
      } catch {
        // Token invalid, let them proceed to auth page
      }
    }
    return NextResponse.next();
  }

  // Protect routes that require authentication
  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));
  if (!isProtected) {
    return NextResponse.next();
  }

  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const role = payload.role as string;

    // Check admin routes
    if (adminRoutes.some((route) => pathname.startsWith(route))) {
      if (role !== 'admin' && role !== 'technician') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }

    return NextResponse.next();
  } catch {
    // Token invalid
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete('token');
    return response;
  }
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/checkout/:path*',
    '/login',
    '/register',
  ],
};
