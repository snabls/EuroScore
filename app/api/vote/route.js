import { NextResponse } from 'next/server';
import db from '@/lib/db';
import crypto from 'crypto';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const scoreboardId = searchParams.get('scoreboardId');

  if (token) {
    const jury = db.prepare('SELECT * FROM juries WHERE token = ?').get(token);
    if (!jury) return NextResponse.json({ error: 'Invalid token' }, { status: 404 });

    const scoreboard = db.prepare('SELECT * FROM scoreboards WHERE id = ?').get(jury.scoreboard_id);
    const participants = db.prepare('SELECT * FROM participants WHERE scoreboard_id = ?').all(jury.scoreboard_id);

    return NextResponse.json({ mode: 'token', jury, scoreboard, participants });
  }

  if (!scoreboardId) {
    return NextResponse.json({ error: 'Missing token or scoreboardId' }, { status: 400 });
  }

  const scoreboard = db.prepare('SELECT * FROM scoreboards WHERE id = ?').get(scoreboardId);
  if (!scoreboard) return NextResponse.json({ error: 'Scoreboard not found' }, { status: 404 });
  if ((scoreboard.vote_mode || 'manual') !== 'global') {
    return NextResponse.json({ error: 'Global voting is disabled for this scoreboard' }, { status: 400 });
  }

  const participants = db.prepare('SELECT * FROM participants WHERE scoreboard_id = ?').all(scoreboardId);
  const juries = db.prepare('SELECT id, name, has_voted FROM juries WHERE scoreboard_id = ? ORDER BY name ASC').all(scoreboardId);

  return NextResponse.json({ mode: 'global', scoreboard, participants, juries });
}

export async function POST(request) {
  try {
    const { token, scoreboardId, juryId, juryName, votes } = await request.json(); // votes: [{ participantId, points }]

    let jury = null;

    if (token) {
      jury = db.prepare('SELECT * FROM juries WHERE token = ?').get(token);
    } else if (scoreboardId && juryId) {
      const scoreboard = db.prepare('SELECT * FROM scoreboards WHERE id = ?').get(scoreboardId);
      if (!scoreboard) {
        return NextResponse.json({ error: 'Scoreboard not found' }, { status: 404 });
      }
      if ((scoreboard.vote_mode || 'manual') !== 'global') {
        return NextResponse.json({ error: 'Global voting is disabled for this scoreboard' }, { status: 400 });
      }
      jury = db.prepare('SELECT * FROM juries WHERE id = ? AND scoreboard_id = ?').get(juryId, scoreboardId);
    } else if (scoreboardId && juryName) {
      const scoreboard = db.prepare('SELECT * FROM scoreboards WHERE id = ?').get(scoreboardId);
      if (!scoreboard) {
        return NextResponse.json({ error: 'Scoreboard not found' }, { status: 404 });
      }
      if ((scoreboard.vote_mode || 'manual') !== 'global') {
        return NextResponse.json({ error: 'Global voting is disabled for this scoreboard' }, { status: 400 });
      }

      const normalizedName = juryName.trim();
      if (!normalizedName) {
        return NextResponse.json({ error: 'Jury name is required' }, { status: 400 });
      }

      jury = db.prepare('SELECT * FROM juries WHERE scoreboard_id = ? AND LOWER(name) = LOWER(?)')
        .get(scoreboardId, normalizedName);

      if (!jury) {
        const newJuryId = crypto.randomUUID();
        const newToken = crypto.randomBytes(16).toString('hex');
        db.prepare('INSERT INTO juries (id, scoreboard_id, name, token) VALUES (?, ?, ?, ?)')
          .run(newJuryId, scoreboardId, normalizedName, newToken);
        jury = db.prepare('SELECT * FROM juries WHERE id = ?').get(newJuryId);
      }
    }

    if (!jury || jury.has_voted) {
      return NextResponse.json({ error: 'Invalid jury or already voted' }, { status: 400 });
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
