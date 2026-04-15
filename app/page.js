"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';

export default function Home() {
  const router = useRouter();
  const [scoreboards, setScoreboards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  const load = async () => {
    const res = await fetch('/api/scoreboard');
    if (res.ok) setScoreboards(await res.json());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const createScoreboard = () => router.push('/setup/new');

  const deleteScoreboard = async (id) => {
    if (!confirm('Delete this scoreboard? This cannot be undone.')) return;
    setDeleting(id);
    await fetch(`/api/scoreboard?id=${id}`, { method: 'DELETE' });
    setDeleting(null);
    load();
  };

  const pointLabels = {
    standard: 'Standard ESC',
    extended: 'ESC Extended',
  };

  return (
    <main className="container" style={{ paddingTop: '3rem' }}>
      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <Logo size="xl" showText={false} />
        </div>
        <h1 style={{
          fontSize: 'clamp(2rem, 5vw, 3.5rem)',
          marginBottom: '1rem',
          background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #f59e0b 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          Your Scoreboards
        </h1>
        <p style={{ color: '#64748b', fontSize: '1.1rem', marginBottom: '2rem' }}>
          Create and manage your Eurovision-style voting scoreboards
        </p>
        <button id="create-scoreboard-btn" className="btn" onClick={createScoreboard} style={{ padding: '0.9rem 2.5rem' }}>
          + New Scoreboard
        </button>
      </div>

      {/* Scoreboard List */}
      {loading ? (
        <div style={{ textAlign: 'center', color: '#64748b', padding: '3rem' }}>
          Loading your scoreboards...
        </div>
      ) : scoreboards.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem', maxWidth: '500px', margin: '0 auto' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎵</div>
          <h2 style={{ color: '#94a3b8', marginBottom: '1rem' }}>No scoreboards yet</h2>
          <p style={{ color: '#64748b', marginBottom: '2rem' }}>
            Create your first scoreboard to start the show!
          </p>
          <button className="btn" onClick={createScoreboard}>Create First Scoreboard</button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '1.5rem',
        }}>
          {scoreboards.map(sb => (
            <div
              key={sb.id}
              className="card"
              style={{
                padding: '1.75rem',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
                borderColor: 'rgba(255,255,255,0.08)',
              }}
              onMouseOver={e => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = 'rgba(96,165,250,0.4)';
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(96,165,250,0.2)';
              }}
              onMouseOut={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#60a5fa',
                  background: 'rgba(59,130,246,0.12)',
                  border: '1px solid rgba(59,130,246,0.25)',
                  padding: '0.25rem 0.6rem',
                  borderRadius: '6px',
                }}>
                  {pointLabels[sb.point_system] || sb.point_system}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteScoreboard(sb.id); }}
                  disabled={deleting === sb.id}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#475569',
                    cursor: 'pointer',
                    fontSize: '1.1rem',
                    padding: '0.2rem 0.4rem',
                    borderRadius: '4px',
                    transition: 'color 0.2s',
                  }}
                  title="Delete scoreboard"
                  onMouseOver={e => e.currentTarget.style.color = '#f87171'}
                  onMouseOut={e => e.currentTarget.style.color = '#475569'}
                >
                  {deleting === sb.id ? '...' : '✕'}
                </button>
              </div>

              <h2 style={{ fontSize: '1.35rem', marginBottom: '0.5rem', color: '#e2e8f0' }}>{sb.name}</h2>
              <p style={{ color: '#475569', fontSize: '0.8rem', marginBottom: '1.5rem' }}>
                Created {new Date(sb.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  className="btn"
                  onClick={() => router.push(`/setup/${sb.id}`)}
                  style={{ flex: 1, padding: '0.6rem', fontSize: '0.9rem' }}
                >
                  Manage
                </button>
                <button
                  onClick={() => router.push(`/presentation/${sb.id}`)}
                  style={{
                    flex: 1,
                    padding: '0.6rem',
                    fontSize: '0.9rem',
                    background: 'rgba(245,158,11,0.15)',
                    border: '1px solid rgba(245,158,11,0.35)',
                    color: '#f59e0b',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    transition: 'all 0.2s',
                  }}
                  onMouseOver={e => { e.currentTarget.style.background = 'rgba(245,158,11,0.25)'; }}
                  onMouseOut={e => { e.currentTarget.style.background = 'rgba(245,158,11,0.15)'; }}
                >
                  ▶ Present
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
