import crypto from 'crypto';
import db from './db';

const SESSION_DURATION_DAYS = 7;
const PBKDF2_ITERATIONS = 100_000;
const PBKDF2_KEYLEN = 64;
const PBKDF2_DIGEST = 'sha256';

// ─── Password Hashing ────────────────────────────────────────────────────────

export function hashPassword(plaintext) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto
    .pbkdf2Sync(plaintext, salt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_DIGEST)
    .toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(plaintext, stored) {
  const [salt, storedHash] = stored.split(':');
  const hash = crypto
    .pbkdf2Sync(plaintext, salt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_DIGEST)
    .toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(storedHash));
}

// ─── Session Management ───────────────────────────────────────────────────────

function signToken(token) {
  const secret = process.env.SESSION_SECRET || 'fallback_dev_secret_change_me';
  return crypto.createHmac('sha256', secret).update(token).digest('hex');
}

export function createSession(userId) {
  // Clean expired sessions for this user
  db.prepare(`DELETE FROM sessions WHERE user_id = ? AND expires_at < datetime('now')`).run(userId);

  const raw = crypto.randomBytes(32).toString('hex');
  const sig = signToken(raw);
  const token = `${raw}.${sig}`;

  const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000)
    .toISOString()
    .replace('T', ' ')
    .split('.')[0];

  db.prepare(`INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)`)
    .run(token, userId, expiresAt);

  return token;
}

export function deleteSession(token) {
  if (!token) return;
  db.prepare(`DELETE FROM sessions WHERE token = ?`).run(token);
}

export function getSession(request) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(/euroscore_session=([^;]+)/);
    if (!match) return null;

    const token = decodeURIComponent(match[1]);
    const [raw, sig] = token.split('.');
    if (!raw || !sig) return null;

    // Verify HMAC signature
    const expectedSig = signToken(raw);
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) return null;

    // Lookup in DB (checks expiry too)
    const session = db
      .prepare(`
        SELECT s.token, s.user_id, u.username
        FROM sessions s
        JOIN users u ON u.id = s.user_id
        WHERE s.token = ? AND s.expires_at > datetime('now')
      `)
      .get(token);

    if (!session) return null;
    return { userId: session.user_id, username: session.username };
  } catch {
    return null;
  }
}

// ─── Cookie helpers ───────────────────────────────────────────────────────────

export function sessionCookie(token) {
  const maxAge = SESSION_DURATION_DAYS * 24 * 60 * 60;
  return `euroscore_session=${encodeURIComponent(token)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}`;
}

export function clearSessionCookie() {
  return `euroscore_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`;
}
