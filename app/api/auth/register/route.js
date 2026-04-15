import { NextResponse } from 'next/server';
import db from '@/lib/db';
import crypto from 'crypto';
import { hashPassword, createSession, sessionCookie } from '@/lib/auth';

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required.' }, { status: 400 });
    }
    if (username.length < 3 || username.length > 30) {
      return NextResponse.json({ error: 'Username must be between 3 and 30 characters.' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
    }

    // Check uniqueness
    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existing) {
      return NextResponse.json({ error: 'Username already taken.' }, { status: 409 });
    }

    const id = crypto.randomUUID();
    const password_hash = hashPassword(password);
    db.prepare('INSERT INTO users (id, username, password_hash) VALUES (?, ?, ?)').run(id, username, password_hash);

    const token = createSession(id);
    const response = NextResponse.json({ id, username }, { status: 201 });
    response.headers.set('Set-Cookie', sessionCookie(token));
    return response;
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
