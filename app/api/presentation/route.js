import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  const scoreboard = db.prepare('SELECT * FROM scoreboards WHERE id = ?').get(id);
  if (!scoreboard) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const participants = db.prepare('SELECT * FROM participants WHERE scoreboard_id = ?').all(id);
  const juries = db.prepare('SELECT * FROM juries WHERE scoreboard_id = ? AND has_voted = 1').all(id);
  const votes = db.prepare(`
    SELECT v.* FROM votes v
    JOIN juries j ON j.id = v.jury_id
    WHERE j.scoreboard_id = ?
  `).all(id);

  return NextResponse.json({ scoreboard, participants, juries, votes });
}
