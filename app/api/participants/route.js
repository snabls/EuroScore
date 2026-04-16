import { NextResponse } from 'next/server';
import db from '@/lib/db';
import crypto from 'crypto';

export async function POST(request) {
  try {
    const { scoreboardId, country, artist, song } = await request.json();
    const id = crypto.randomUUID();
    
    db.prepare('INSERT INTO participants (id, scoreboard_id, country, artist, song) VALUES (?, ?, ?, ?, ?)')
      .run(id, scoreboardId, country, artist, song);
      
    const participant = db.prepare('SELECT * FROM participants WHERE id = ?').get(id);
    return NextResponse.json(participant);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  try {
    const participant = db.prepare('SELECT * FROM participants WHERE id = ?').get(id);
    if (!participant) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const count = db.prepare('SELECT COUNT(*) as c FROM participants WHERE scoreboard_id = ?')
      .get(participant.scoreboard_id).c;

    // Determine required minimum participants from the scoreboard's point system
    const scoreboard = db.prepare('SELECT * FROM scoreboards WHERE id = ?').get(participant.scoreboard_id);
    const POINT_SYSTEM_MIN = { standard: 10, extended: 12 };
    const required = POINT_SYSTEM_MIN[scoreboard?.point_system] || 10;

    if (count <= required) {
      return NextResponse.json({ error: `Minimo ${required} partecipanti richiesti per il sistema di voto` }, { status: 400 });
    }

    db.prepare('DELETE FROM participants WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { id, country, artist, song } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'Missing participant id' }, { status: 400 });
    }

    const participant = db.prepare('SELECT * FROM participants WHERE id = ?').get(id);
    if (!participant) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    db.prepare('UPDATE participants SET country = ?, artist = ?, song = ? WHERE id = ?')
      .run(country, artist, song, id);

    const updated = db.prepare('SELECT * FROM participants WHERE id = ?').get(id);
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
