import { NextResponse } from 'next/server';
import db from '@/lib/db';
import crypto from 'crypto';

export async function POST(request) {
  try {
    const { scoreboardId, name } = await request.json();
    const id = crypto.randomUUID();
    const token = crypto.randomBytes(16).toString('hex');
    
    db.prepare('INSERT INTO juries (id, scoreboard_id, name, token) VALUES (?, ?, ?, ?)')
      .run(id, scoreboardId, name, token);
      
    const jury = db.prepare('SELECT * FROM juries WHERE id = ?').get(id);
    return NextResponse.json(jury);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  try {
    db.prepare('DELETE FROM juries WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
