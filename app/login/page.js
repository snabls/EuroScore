"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';

export default function LoginPage({ searchParams }) {
  const router = useRouter();
  const redirect = searchParams?.redirect || '/';
  const [tab, setTab] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = tab === 'login' ? '/api/auth/login' : '/api/auth/register';
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Something went wrong.');
      setLoading(false);
      return;
    }

    router.push(redirect);
    router.refresh();
  };

  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      background: 'radial-gradient(ellipse at top, rgba(59,130,246,0.15) 0%, transparent 50%), radial-gradient(ellipse at bottom, rgba(139,92,246,0.12) 0%, transparent 50%)',
    }}>
      {/* Floating stars background */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
        {[...Array(12)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: `${4 + (i % 4) * 3}px`,
            height: `${4 + (i % 4) * 3}px`,
            borderRadius: '50%',
            background: ['#3b82f6', '#a78bfa', '#f59e0b', '#60a5fa'][i % 4],
            opacity: 0.15 + (i % 3) * 0.08,
            left: `${(i * 83) % 95}%`,
            top: `${(i * 137 + 10) % 90}%`,
            animation: `float ${4 + (i % 3) * 2}s ease-in-out ${i * 0.4}s infinite alternate`,
          }} />
        ))}
      </div>

      <div style={{
        width: '100%',
        maxWidth: '440px',
        position: 'relative',
        zIndex: 1,
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(24px)',
        transition: 'opacity 0.5s ease, transform 0.5s ease',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <Logo size="xl" showText={false} />
          <div style={{ marginTop: '1rem' }}>
            <Logo size="lg" showText={true} />
          </div>
          <p style={{ color: '#64748b', marginTop: '0.75rem', fontSize: '0.95rem' }}>
            The ultimate Eurovision-style scoreboard
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: '2.5rem' }}>
          {/* Tabs */}
          <div style={{
            display: 'flex',
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '10px',
            padding: '4px',
            marginBottom: '2rem',
          }}>
            {['login', 'register'].map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(''); }}
                style={{
                  flex: 1,
                  padding: '0.6rem',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  transition: 'all 0.2s ease',
                  background: tab === t ? 'var(--accent-color)' : 'transparent',
                  color: tab === t ? 'white' : '#64748b',
                  boxShadow: tab === t ? '0 2px 8px rgba(59,130,246,0.4)' : 'none',
                }}
              >
                {t === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8', fontSize: '0.875rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="your_username"
                required
                autoFocus
                autoComplete="username"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8', fontSize: '0.875rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={tab === 'register' ? 'At least 6 characters' : '••••••••'}
                required
                autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
              />
            </div>

            {error && (
              <div style={{
                background: 'rgba(248,113,113,0.1)',
                border: '1px solid rgba(248,113,113,0.3)',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                color: '#f87171',
                fontSize: '0.9rem',
                marginBottom: '1.5rem',
              }}>
                {error}
              </div>
            )}

            <button
              id={tab === 'login' ? 'login-btn' : 'register-btn'}
              className="btn"
              type="submit"
              disabled={loading}
              style={{ width: '100%', marginBottom: 0, fontSize: '1.05rem' }}
            >
              {loading
                ? (tab === 'login' ? 'Signing in...' : 'Creating account...')
                : (tab === 'login' ? 'Sign In' : 'Create Account')}
            </button>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes float {
          from { transform: translateY(0px) scale(1); }
          to { transform: translateY(-20px) scale(1.1); }
        }
      `}</style>
    </main>
  );
}
