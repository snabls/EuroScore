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

  useEffect(() => {
    const load = async () => {
      const res = await fetch(`/api/vote?token=${token}`);
      if (res.ok) setData(await res.json());
      else setError('Invalid voting link or error loading.');
    };
    load();
  }, [token]);

  if (error) return <main className="container"><h1 style={{color: '#f87171'}}>{error}</h1></main>;
  if (!data) return <main className="container"><p>Loading...</p></main>;

  if (data.jury.has_voted) {
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
    setLoading(true);
    const votesArray = Object.entries(selections).map(([pts, pId]) => ({
      points: parseInt(pts),
      participantId: pId
    }));
    
    const res = await fetch('/api/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, votes: votesArray })
    });
    
    if (res.ok) {
      window.location.reload(); 
    } else {
      setLoading(false);
      alert('Error submitting votes');
    }
  };

  const isAssigned = (pId) => Object.values(selections).includes(pId);

  return (
    <main className="container" style={{ maxWidth: '800px' }}>
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ color: 'var(--accent-color)' }}>{data.scoreboard.name}</h1>
          <h2>Jury: {data.jury.name}</h2>
          <p style={{ color: '#94a3b8' }}>Assign your points strictly to unique participants.</p>
        </div>

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
