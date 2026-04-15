"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewScoreboard() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [pointSystem, setPointSystem] = useState('standard');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/scoreboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, pointSystem })
    });
    if (res.ok) {
      const data = await res.json();
      router.push(`/setup/${data.id}`);
    } else {
      setLoading(false);
      alert('Error creating scoreboard');
    }
  };

  return (
    <main className="container">
      <div className="card" style={{ maxWidth: '600px', margin: '10vh auto' }}>
        <h2>Create New Scoreboard</h2>
        <form onSubmit={handleSubmit} style={{ marginTop: '2rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Scoreboard Name / Event</label>
            <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Eurovision 2024" />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Point System</label>
            <select value={pointSystem} onChange={e => setPointSystem(e.target.value)}>
              <option value="standard">Standard ESC (1,2,3,4,5,6,7,8,10,12)</option>
              <option value="extended">ESC Extended (1,2,3,4,5,6,8,10,12,14,17,20)</option>
            </select>
          </div>
          <button className="btn" type="submit" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Creating...' : 'Create Scoreboard'}
          </button>
        </form>
      </div>
    </main>
  );
}
