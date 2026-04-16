"use client";
import { useEffect, useState } from 'react';
import { findCountryByName } from '@/lib/countries';
import FlagImage from '@/components/FlagImage';

const POINT_SYSTEMS = {
  standard: [12, 10, 8, 7, 6, 5, 4, 3, 2, 1],
  extended: [20, 17, 14, 12, 10, 8, 6, 5, 4, 3, 2, 1]
};

export default function VotePage({ params }) {
  const token = params.token;
  const [data, setData] = useState(null);
  const [selections, setSelections] = useState({}); // point -> participantId
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [juryMode, setJuryMode] = useState('existing');
  const [selectedJuryId, setSelectedJuryId] = useState('');
  const [manualJuryName, setManualJuryName] = useState('');

  useEffect(() => {
    const load = async () => {
      const tokenRes = await fetch(`/api/vote?token=${token}`);
      if (tokenRes.ok) {
        setData(await tokenRes.json());
        return;
      }

      const globalRes = await fetch(`/api/vote?scoreboardId=${token}`);
      if (globalRes.ok) {
        const globalData = await globalRes.json();
        setData(globalData);
        if (globalData.juries?.length) {
          const firstAvailable = globalData.juries.find(j => !j.has_voted);
          if (firstAvailable) setSelectedJuryId(firstAvailable.id);
        }
      } else {
        setError('Invalid voting link or error loading.');
      }
    };
    load();
  }, [token]);

  if (error) return <main className="container"><h1 style={{color: '#f87171'}}>{error}</h1></main>;
  if (!data) return <main className="container"><p>Loading...</p></main>;

  if (data.mode === 'token' && data.jury.has_voted) {
    return (
      <main className="container text-center" style={{ marginTop: '15vh' }}>
        <h1 style={{ color: '#4ade80', fontSize: '3rem' }}>Thank You!</h1>
        <p>Your votes for {data.jury.name} have been securely cast.</p>
        <p>You can now close this page and wait for the presentation.</p>
      </main>
    );
  }

  const points = POINT_SYSTEMS[data.scoreboard.point_system] || POINT_SYSTEMS.standard;
  const availableParticipants = data.participants;

  const handleSelect = (point, participantId) => {
    setSelections(prev => {
      const newSel = { ...prev };
      Object.keys(newSel).forEach(p => {
        if (newSel[p] === participantId) delete newSel[p];
      });
      if (participantId) newSel[point] = participantId;
      else delete newSel[point];
      return newSel;
    });
  };

  const submitVotes = async () => {
    if (Object.keys(selections).length !== points.length) {
      alert("Please assign all available points before submitting.");
      return;
    }

    const payload = {
      votes: Object.entries(selections).map(([pts, pId]) => ({
        points: parseInt(pts),
        participantId: pId
      }))
    };

    let juryLabel = '';

    if (data.mode === 'token') {
      payload.token = token;
      juryLabel = data.jury.name;
    } else {
      payload.scoreboardId = token;
      if (juryMode === 'existing') {
        if (!selectedJuryId) {
          alert('Select a jury before submitting.');
          return;
        }
        payload.juryId = selectedJuryId;
        const selected = data.juries.find(j => j.id === selectedJuryId);
        juryLabel = selected?.name || 'jury';
      } else {
        if (!manualJuryName.trim()) {
          alert('Insert jury name before submitting.');
          return;
        }
        payload.juryName = manualJuryName.trim();
        juryLabel = manualJuryName.trim();
      }
    }

    setLoading(true);
    
    const res = await fetch('/api/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (res.ok) {
      setData(prev => ({
        ...prev,
        mode: 'token',
        jury: { ...(prev.jury || {}), name: juryLabel, has_voted: 1 }
      }));
      setLoading(false);
    } else {
      setLoading(false);
      const errData = await res.json().catch(() => null);
      alert(errData?.error || 'Error submitting votes');
    }
  };

  const isAssigned = (pId) => Object.values(selections).includes(pId);

  return (
    <main className="container" style={{ maxWidth: '800px' }}>
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ color: 'var(--accent-color)' }}>{data.scoreboard.name}</h1>
          {data.mode === 'token' ? (
            <h2>Jury: {data.jury.name}</h2>
          ) : (
            <h2>Global Voting Link</h2>
          )}
          <p style={{ color: '#94a3b8' }}>Assign your points strictly to unique participants.</p>
        </div>

        {data.mode === 'global' && (
          <div style={{ marginBottom: '1.5rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--panel-border)', borderRadius: '8px', padding: '1rem' }}>
            <p style={{ marginTop: 0, marginBottom: '0.75rem', color: '#cbd5e1', fontWeight: 'bold' }}>Identify the jury before sending votes</p>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setJuryMode('existing')}
                style={{
                  background: juryMode === 'existing' ? '#2563eb' : 'transparent',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.25)',
                  borderRadius: '6px',
                  padding: '0.35rem 0.6rem',
                  cursor: 'pointer'
                }}
              >
                Select existing jury
              </button>
              <button
                type="button"
                onClick={() => setJuryMode('manual')}
                style={{
                  background: juryMode === 'manual' ? '#2563eb' : 'transparent',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.25)',
                  borderRadius: '6px',
                  padding: '0.35rem 0.6rem',
                  cursor: 'pointer'
                }}
              >
                Insert manually
              </button>
            </div>

            {juryMode === 'existing' ? (
              <select value={selectedJuryId} onChange={e => setSelectedJuryId(e.target.value)} required style={{ marginBottom: 0 }}>
                <option value="" style={{ color: 'black' }}>-- Select Jury --</option>
                {data.juries.map(j => (
                  <option key={j.id} value={j.id} disabled={j.has_voted} style={{ color: 'black' }}>
                    {j.name}{j.has_voted ? ' (already voted)' : ''}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={manualJuryName}
                onChange={e => setManualJuryName(e.target.value)}
                placeholder="Type jury name"
                required
                style={{ marginBottom: 0 }}
              />
            )}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {points.map(pt => (
            <div key={pt} style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--panel-border)' }}>
              <div style={{ width: '80px', fontSize: '1.5rem', fontWeight: 'bold', color: pt >= 10 ? '#fbbf24' : 'white', textAlign: 'right', paddingRight: '1rem' }}>
                {pt}
              </div>
              <div style={{ flex: 1 }}>
                <select 
                  value={selections[pt] || ''} 
                  onChange={e => handleSelect(pt, e.target.value)}
                  style={{ marginBottom: 0, padding: '0.5rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', fontSize: '1.1rem' }}
                >
                  <option value="" style={{ color: 'black' }}>-- Select Participant --</option>
                  {availableParticipants.map(participant => {
                    const countryInfo = findCountryByName(participant.country);
                    return (
                    <option key={participant.id} value={participant.id} disabled={isAssigned(participant.id) && selections[pt] !== participant.id} style={{ color: 'black' }}>
                      {countryInfo?.code ?? '🏳'} {participant.country} ({participant.artist})
                    </option>
                    )
                  })}
                </select>
              </div>
            </div>
          ))}
        </div>

        <button className="btn" onClick={submitVotes} disabled={loading} style={{ width: '100%', marginTop: '2rem', padding: '1rem', fontSize: '1.2rem', background: Object.keys(selections).length === points.length ? '#4ade80' : 'var(--accent-color)', color: Object.keys(selections).length === points.length ? 'black' : 'white' }}>
          {loading ? 'Submitting...' : 'Submit Final Votes'}
        </button>
      </div>
    </main>
  );
}
