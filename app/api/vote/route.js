import { NextResponse } from 'next/server';
import db from '@/lib/db';
import crypto from 'crypto';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 });

  const jury = db.prepare('SELECT * FROM juries WHERE token = ?').get(token);
  if (!jury) return NextResponse.json({ error: 'Invalid token' }, { status: 404 });

  const scoreboard = db.prepare('SELECT * FROM scoreboards WHERE id = ?').get(jury.scoreboard_id);
  const participants = db.prepare('SELECT * FROM participants WHERE scoreboard_id = ?').all(jury.scoreboard_id);
  
  return NextResponse.json({ jury, scoreboard, participants });
}

export async function POST(request) {
  try {
    const { token, votes } = await request.json(); // votes: [{ participantId, points }]
    
    const jury = db.prepare('SELECT * FROM juries WHERE token = ?').get(token);
    if (!jury || jury.has_voted) {
      return NextResponse.json({ error: 'Invalid token or already voted' }, { status: 400 });
    }

    const insertVote = db.prepare('INSERT INTO votes (id, jury_id, participant_id, points) VALUES (?, ?, ?, ?)');
    const updateJury = db.prepare('UPDATE juries SET has_voted = 1 WHERE id = ?');

    const transaction = db.transaction((votesData, juryId) => {
      for (const v of votesData) {
        insertVote.run(crypto.randomUUID(), juryId, v.participantId, v.points);
      }
      updateJury.run(juryId);
    });

    transaction(votes, jury.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
