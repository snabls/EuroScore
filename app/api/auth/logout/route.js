import { NextResponse } from 'next/server';
import { getSession, deleteSession, clearSessionCookie } from '@/lib/auth';

export async function POST(request) {
  const session = getSession(request);
  if (session) {
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(/euroscore_session=([^;]+)/);
    if (match) {
      deleteSession(decodeURIComponent(match[1]));
    }
  }
  const response = NextResponse.json({ success: true });
  response.headers.set('Set-Cookie', clearSessionCookie());
  return response;
}
