import { NextResponse } from 'next/server';

// Routes that DON'T require authentication
const PUBLIC_PATHS = [
  '/login',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/logout',
];

// Verify the session cookie signature using only Web Crypto API (Edge-compatible)
async function verifySessionCookie(cookieHeader) {
  if (!cookieHeader) return false;
  const match = cookieHeader.match(/euroscore_session=([^;]+)/);
  if (!match) return false;

  const token = decodeURIComponent(match[1]);
  const dotIdx = token.lastIndexOf('.');
  if (dotIdx === -1) return false;

  const raw = token.substring(0, dotIdx);
  const sig = token.substring(dotIdx + 1);

  try {
    const secret = process.env.SESSION_SECRET || 'fallback_dev_secret_change_me';
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const key = await crypto.subtle.importKey(
      'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
    );
    const sigBuffer = Uint8Array.from(
      sig.match(/.{1,2}/g).map(b => parseInt(b, 16))
    );
    const rawBuffer = encoder.encode(raw);
    return await crypto.subtle.verify('HMAC', key, sigBuffer, rawBuffer);
  } catch {
    return false;
  }
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next();
  }

  // Allow vote pages (public via token)
  if (pathname.startsWith('/vote/') || pathname.startsWith('/api/vote')) {
    return NextResponse.next();
  }

  // Allow Next.js internals and static files
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    /\.(png|jpg|jpeg|svg|ico|webp|css|js)$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  // Verify session cookie signature (pure Edge-compatible HMAC)
  const cookieHeader = request.headers.get('cookie') || '';
  const valid = await verifySessionCookie(cookieHeader);

  if (!valid) {
    const loginUrl = new URL('/login', request.url);
    if (!pathname.startsWith('/api/')) {
      loginUrl.searchParams.set('redirect', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
