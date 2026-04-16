import { NextResponse } from 'next/server';
import db from '@/lib/db';
import crypto from 'crypto';
import { getSession } from '@/lib/auth';

export async function POST(request) {
  const session = getSession(request);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { name, pointSystem, voteMode } = await request.json();
    const normalizedVoteMode = voteMode === 'global' ? 'global' : 'manual';
    const id = crypto.randomUUID();
    
    db.prepare('INSERT INTO scoreboards (id, user_id, name, point_system, vote_mode) VALUES (?, ?, ?, ?, ?)')
      .run(id, session.userId, name, pointSystem, normalizedVoteMode);
      
    return NextResponse.json({ id, name, point_system: pointSystem, vote_mode: normalizedVoteMode, user_id: session.userId });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request) {
  const session = getSession(request);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (id) {
    const scoreboard = db.prepare('SELECT * FROM scoreboards WHERE id = ? AND user_id = ?').get(id, session.userId);
    if (!scoreboard) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const participants = db.prepare('SELECT * FROM participants WHERE scoreboard_id = ?').all(id);
    const juries = db.prepare('SELECT * FROM juries WHERE scoreboard_id = ?').all(id);
    return NextResponse.json({ ...scoreboard, participants, juries });
  }

  // List all scoreboards for this user
  const scoreboards = db.prepare(
    'SELECT * FROM scoreboards WHERE user_id = ? ORDER BY created_at DESC'
  ).all(session.userId);
  return NextResponse.json(scoreboards);
}

export async function DELETE(request) {
  const session = getSession(request);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  // Only delete own scoreboards
  db.prepare('DELETE FROM scoreboards WHERE id = ? AND user_id = ?').run(id, session.userId);
  return NextResponse.json({ success: true });
}
