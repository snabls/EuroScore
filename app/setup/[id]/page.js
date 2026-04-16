"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { COUNTRIES, findCountryByName } from '@/lib/countries';
import FlagImage from '@/components/FlagImage';

export default function ScoreboardAdmin({ params }) {
  const router = useRouter();
  const id = params.id;
  const [data, setData] = useState(null);
  const POINT_SYSTEM_MIN = { standard: 10, extended: 12 };
  
  const [newCountry, setNewCountry] = useState(COUNTRIES[0].name);
  const [newArtist, setNewArtist] = useState('');
  const [newSong, setNewSong] = useState('');
  const [newJuryName, setNewJuryName] = useState('');
  const [editingParticipantId, setEditingParticipantId] = useState(null);
  const [editCountry, setEditCountry] = useState(COUNTRIES[0].name);
  const [editArtist, setEditArtist] = useState('');
  const [editSong, setEditSong] = useState('');

  const loadData = async () => {
    const res = await fetch(`/api/scoreboard?id=${id}`);
    if (res.ok) {
      setData(await res.json());
    }
  };

  useEffect(() => { loadData(); }, [id]);

  const addParticipant = async (e) => {
    e.preventDefault();
    await fetch('/api/participants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scoreboardId: id, country: newCountry, artist: newArtist, song: newSong })
    });
    setNewArtist('');
    setNewSong('');
    loadData();
  };

  const removeParticipant = async (pId) => {
    await fetch(`/api/participants?id=${pId}`, { method: 'DELETE' });
    loadData();
  };

  const startEditParticipant = (participant) => {
    setEditingParticipantId(participant.id);
    setEditCountry(participant.country);
    setEditArtist(participant.artist);
    setEditSong(participant.song);
  };

  const cancelEditParticipant = () => {
    setEditingParticipantId(null);
    setEditCountry(COUNTRIES[0].name);
    setEditArtist('');
    setEditSong('');
  };

  const saveParticipant = async (e) => {
    e.preventDefault();
    if (!editingParticipantId) return;

    await fetch('/api/participants', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editingParticipantId,
        country: editCountry,
        artist: editArtist,
        song: editSong
      })
    });

    cancelEditParticipant();
    loadData();
  };

  const addJury = async (e) => {
    e.preventDefault();
    await fetch('/api/juries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scoreboardId: id, name: newJuryName })
    });
    setNewJuryName('');
    loadData();
  };

  const removeJury = async (jId) => {
    await fetch(`/api/juries?id=${jId}`, { method: 'DELETE' });
    loadData();
  };

  const getVoteLink = (token) => {
    return `${window.location.origin}/vote/${token}`;
  };

  const setVoteForJury = (token) => {
    window.open(getVoteLink(token), '_blank');
  };

  const copyGlobalLink = () => {
    navigator.clipboard.writeText(getVoteLink(id));
    alert('Global voting link copied to clipboard!');
  };

  if (!data) return <main className="container"><p>Loading...</p></main>;
  const requiredParticipants = POINT_SYSTEM_MIN[data.point_system] || 10;
  const voteMode = data.vote_mode || 'manual';
  const isGlobalVote = voteMode === 'global';

  return (
    <main className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ marginBottom: '0.5rem' }}>{data.name}</h1>
          <span style={{ fontSize: '0.9rem', color: '#94a3b8', background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
            System: {data.point_system}
          </span>
          <span style={{ fontSize: '0.85rem', marginLeft: '0.5rem', color: '#cbd5e1', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.35)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
            Vote mode: {isGlobalVote ? 'global link' : 'manual juries'}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
          {isGlobalVote && (
            <button
              onClick={copyGlobalLink}
              style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '0.45rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}
              title="Link unico per voto"
            >
              Copy Global Vote Link
            </button>
          )}
          {data.participants.length < requiredParticipants && (
            <span style={{ fontSize: '0.8rem', color: '#fbbf24', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', padding: '0.25rem 0.6rem', borderRadius: '6px' }}>
              ⚠️ Minimo {requiredParticipants} partecipanti richiesti ({data.participants.length}/{requiredParticipants})
            </span>
          )}
          <button
            className="btn"
            onClick={() => router.push(`/presentation/${id}`)}
            disabled={data.participants.length < requiredParticipants}
            style={data.participants.length < requiredParticipants ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
          >
            Launch Presentation
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2.5rem' }}>
        <div className="card">
          <h2>Participants ({data.participants.length}/{requiredParticipants} min)</h2>
          <form onSubmit={addParticipant} style={{ marginBottom: '1.5rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
            <select value={newCountry} onChange={e => setNewCountry(e.target.value)} required>
              {COUNTRIES.map(c => <option key={c.code} value={c.name} style={{color:'black'}}>{c.name}</option>)}
            </select>
            <input type="text" placeholder="Artist" value={newArtist} onChange={e => setNewArtist(e.target.value)} required />
            <input type="text" placeholder="Song Title" value={newSong} onChange={e => setNewSong(e.target.value)} required />
            <button className="btn" type="submit" style={{width: '100%'}}>Add Participant</button>
          </form>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {data.participants.map(p => {
              const countryInfo = findCountryByName(p.country);
              return (
              <li key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', borderBottom: '1px solid var(--panel-border)', alignItems: 'center' }}>
                {editingParticipantId === p.id ? (
                  <form onSubmit={saveParticipant} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <select value={editCountry} onChange={e => setEditCountry(e.target.value)} required>
                      {COUNTRIES.map(c => <option key={c.code} value={c.name} style={{color:'black'}}>{c.name}</option>)}
                    </select>
                    <input type="text" value={editArtist} onChange={e => setEditArtist(e.target.value)} placeholder="Artist" required style={{ marginBottom: 0 }} />
                    <input type="text" value={editSong} onChange={e => setEditSong(e.target.value)} placeholder="Song Title" required style={{ marginBottom: 0 }} />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <button type="button" onClick={cancelEditParticipant} style={{ background: 'transparent', color: '#94a3b8', border: '1px solid #334155', borderRadius: '6px', padding: '0.35rem 0.6rem', cursor: 'pointer' }}>
                        Cancel
                      </button>
                      <button type="submit" style={{ background: '#22c55e', color: 'white', border: 'none', borderRadius: '6px', padding: '0.35rem 0.6rem', cursor: 'pointer', fontWeight: 'bold' }}>
                        Save
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <FlagImage code={countryInfo?.code} name={p.country} size={32} />
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <strong style={{ fontSize: '1.1rem' }}>{p.country}</strong>
                        <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{p.artist} - "{p.song}"</span>
                      </div>
                    </span>
                    <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
                      <button
                        onClick={() => startEditParticipant(p)}
                        style={{
                          background: 'transparent',
                          color: '#60a5fa',
                          border: 'none',
                          cursor: 'pointer',
                          fontWeight: 'bold'
                        }}
                        title="Modifica"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => removeParticipant(p.id)}
                        disabled={data.participants.length <= requiredParticipants}
                        style={{
                          background: 'transparent',
                          color: data.participants.length <= requiredParticipants ? '#475569' : '#f87171',
                          border: 'none',
                          cursor: data.participants.length <= requiredParticipants ? 'not-allowed' : 'pointer',
                          fontWeight: 'bold'
                        }}
                        title={data.participants.length <= requiredParticipants ? `Non puoi scendere sotto i ${requiredParticipants} partecipanti` : 'Rimuovi'}
                      >
                        Remove
                      </button>
                    </div>
                  </>
                )}
              </li>
              )
            })}
            {data.participants.length === 0 && <p style={{ color: '#94a3b8' }}>No participants yet.</p>}
          </ul>
        </div>

        <div className="card">
          <h2>Juries ({data.juries.length})</h2>
          {isGlobalVote ? (
            <p style={{ color: '#94a3b8', marginBottom: '1.25rem' }}>
              In global mode, juries can identify themselves directly on the vote page.
            </p>
          ) : (
            <form onSubmit={addJury} className="flex gap-4 items-center" style={{ marginBottom: '1.5rem' }}>
              <input type="text" placeholder="Jury Name" value={newJuryName} onChange={e => setNewJuryName(e.target.value)} required style={{ marginBottom: 0 }} />
              <button className="btn" type="submit">Add</button>
            </form>
          )}
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {data.juries.map(j => (
              <li key={j.id} style={{ display: 'flex', flexDirection: 'column', padding: '0.75rem', borderBottom: '1px solid var(--panel-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'center' }}>
                  <strong>{j.name}</strong>
                  <span style={{ color: j.has_voted ? '#4ade80' : '#f87171', fontSize: '0.85rem', fontWeight: 'bold', background: 'rgba(0,0,0,0.3)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                    {j.has_voted ? 'VOTED' : 'WAITING'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => setVoteForJury(j.token)} style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '0.4rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem', flex: 1 }}>
                    Set Vote
                  </button>
                  {!isGlobalVote && (
                    <button onClick={() => removeJury(j.id)} style={{ background: 'transparent', color: '#f87171', border: 'none', cursor: 'pointer', padding: '0.25rem' }}>Remove</button>
                  )}
                </div>
              </li>
            ))}
            {data.juries.length === 0 && <p style={{ color: '#94a3b8' }}>No juries yet.</p>}
          </ul>
        </div>
      </div>
    </main>
  );
}
