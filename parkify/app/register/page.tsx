'use client';

import { useState } from 'react';
// import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  // const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [pwd, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('client');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:3001/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, pwd, firstName, lastName, phone, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registration failed. Please try again.');
        setLoading(false);
        return;
      }
      
      setSuccess(true);
      setLoading(false);
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  }

  if (success) {
    return (
        <div style={{
        minHeight: '100vh',
        background: '#0d1225',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Montserrat', sans-serif",
        }}>
        <div style={{
            background: '#0f1628',
            border: '1.5px solid rgba(61,90,241,0.25)',
            borderRadius: '16px',
            padding: '48px 40px',
            textAlign: 'center',
            maxWidth: '420px',
            width: '100%',
        }}>
            <div style={{
            width: '64px', height: '64px',
            background: 'rgba(61,90,241,0.15)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            }}>
            <span className="material-symbols-outlined" style={{ fontSize: '32px', color: '#3d5af1' }}>check_circle</span>
            </div>
            <h2 style={{
            fontFamily: "'Montserrat', sans-serif",
            fontSize: '26px',
            fontWeight: 800,
            color: '#fff',
            margin: '0 0 10px',
            }}>Account Created!</h2>
            <p style={{ color: '#7b9fff', fontSize: '15px', margin: '0 0 32px' }}>
            Your Parkify account is ready. Sign in to get started.
            </p>
            <Link href="/login" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '14px',
            background: '#3d5af1',
            color: '#fff',
            borderRadius: '10px',
            fontSize: '15px',
            fontWeight: 600,
            textDecoration: 'none',
            transition: 'background 0.2s',
            }}>
            Go to Sign In
            </Link>
        </div>
        </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,600;1,600&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .reg-root {
          display: flex;
          min-height: 100vh;
          background: #0d1225;
          font-family: 'Montserrat', sans-serif;
          color: #e8eaf6;
        }
        .reg-left {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 48px 56px;
          background: linear-gradient(145deg, #0d1225 0%, #141c38 60%, #1a2452 100%);
          border-right: 1px solid rgba(61,90,241,0.18);
          position: relative;
          overflow: hidden;
        }
        .reg-left::before {
          content: '';
          position: absolute;
          top: -120px; right: -120px;
          width: 420px; height: 420px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(61,90,241,0.18) 0%, transparent 70%);
          pointer-events: none;
        }
        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .brand-icon {
          width: 42px; height: 42px;
          background: #3d5af1;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-family: 'Montserrat', sans-serif;
          font-weight: 800;
          font-size: 22px;
          color: #fff;
        }
        .brand-name {
          font-family: 'Montserrat', sans-serif;
          font-size: 26px;
          font-weight: 600;
          font-style: italic;
          letter-spacing: -0.5px;
          color: #fff;
        }
        .tagline h1 {
          font-family: 'Montserrat', sans-serif;
          font-size: clamp(28px, 3vw, 44px);
          font-weight: 800;
          line-height: 1.15;
          color: #fff;
          margin: 0 0 16px;
        }
        .tagline p {
          font-size: 16px;
          color: #7b9fff;
          font-weight: 500;
        }
        .illustration {
          width: 100%;
          max-width: 380px;
          opacity: 0.85;
        }
        .reg-right {
          width: 520px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px 40px;
          background: #0f1628;
          overflow-y: auto;
        }
        .form-card {
          width: 100%;
          max-width: 420px;
          padding: 20px 0;
        }
        .form-card h2 {
          font-family: 'Montserrat', sans-serif;
          font-size: 28px;
          font-weight: 800;
          color: #fff;
          margin: 0 0 6px;
        }
        .subtitle {
          color: #7b9fff;
          font-size: 14px;
          margin: 0 0 32px;
        }
        .reg-form {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }
        .field {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }
        .field label {
          font-size: 13px;
          font-weight: 600;
          color: #a0aec8;
          letter-spacing: 0.3px;
          text-transform: uppercase;
        }
        .input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }
        .input-icon {
          position: absolute;
          left: 14px;
          font-size: 18px;
          color: #3d5af1;
          pointer-events: none;
          user-select: none;
        }
        .input-wrap input,
        .input-wrap select {
          width: 100%;
          padding: 12px 14px 12px 44px;
          background: #1a2340;
          border: 1.5px solid rgba(61,90,241,0.25);
          border-radius: 10px;
          font-size: 15px;
          color: #e8eaf6;
          font-family: 'Montserrat', sans-serif;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          appearance: none;
        }
        .input-wrap input::placeholder { color: #3d4f78; }
        .input-wrap input:focus,
        .input-wrap select:focus {
          border-color: #3d5af1;
          box-shadow: 0 0 0 3px rgba(61,90,241,0.15);
        }
        .input-wrap select option { background: #1a2340; }
        .role-group {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .role-btn {
          padding: 11px;
          border-radius: 10px;
          border: 1.5px solid rgba(61,90,241,0.25);
          background: #1a2340;
          color: #7b9fff;
          font-family: 'Montserrat', sans-serif;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
        }
        .role-btn.active {
          border-color: #3d5af1;
          background: rgba(61,90,241,0.15);
          color: #fff;
        }
        .role-btn:hover:not(.active) {
          border-color: rgba(61,90,241,0.5);
        }
        .error-banner {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(239,68,68,0.12);
          border: 1px solid rgba(239,68,68,0.3);
          border-radius: 8px;
          padding: 11px 14px;
          color: #f87171;
          font-size: 13.5px;
          font-weight: 500;
        }
        .error-icon { font-size: 18px; flex-shrink: 0; }
        .btn-primary {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px;
          background: #3d5af1;
          color: #fff;
          border: none;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 600;
          font-family: 'Montserrat', sans-serif;
          cursor: pointer;
          transition: background 0.2s, transform 0.15s;
          margin-top: 4px;
          width: 100%;
        }
        .btn-primary:hover:not(:disabled) {
          background: #5570f5;
          transform: translateY(-1px);
        }
        .btn-primary:disabled { opacity: 0.65; cursor: not-allowed; }
        .spinner {
          width: 18px; height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          display: inline-block;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 20px 0;
          font-size: 13px;
        }
        .divider::before, .divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: rgba(61,90,241,0.2);
        }
        .divider span { color: #4a5a8a; }
        .btn-secondary {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 13px;
          background: transparent;
          color: #7b9fff;
          border: 1.5px solid rgba(61,90,241,0.35);
          border-radius: 10px;
          font-size: 15px;
          font-weight: 600;
          font-family: 'Montserrat', sans-serif;
          text-decoration: none;
          transition: background 0.2s, border-color 0.2s, transform 0.15s;
          width: 100%;
        }
        .btn-secondary:hover {
          background: rgba(61,90,241,0.1);
          border-color: rgba(61,90,241,0.6);
          transform: translateY(-1px);
        }
        @media (max-width: 768px) {
          .reg-root { flex-direction: column; }
          .reg-left {
            padding: 32px 28px;
            border-right: none;
            border-bottom: 1px solid rgba(61,90,241,0.18);
          }
          .illustration { display: none; }
          .reg-right { width: 100%; padding: 40px 24px; }
          .row { grid-template-columns: 1fr; }
        }
      `}</style>
              
      <div className="reg-root">
        <div className="reg-left">
          <div className="brand">
            <div className="brand-icon">P</div>
            <span className="brand-name">Parkify</span>
          </div>
          <div className="tagline">
            <h1>Join the<br />parking<br />revolution.</h1>
            <p>List your space or find parking — all in one place.</p>
          </div>
          <div className="illustration">
            <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="40" y="180" width="320" height="90" rx="8" fill="#1a2340" opacity="0.6"/>
              <rect x="60" y="160" width="80" height="110" rx="6" fill="#243060"/>
              <rect x="160" y="140" width="80" height="130" rx="6" fill="#2a3875"/>
              <rect x="260" y="155" width="80" height="115" rx="6" fill="#243060"/>
              <rect x="70" y="175" width="60" height="35" rx="3" fill="#3d5af1" opacity="0.7"/>
              <rect x="170" y="155" width="60" height="35" rx="3" fill="#3d5af1" opacity="0.9"/>
              <rect x="270" y="168" width="60" height="35" rx="3" fill="#3d5af1" opacity="0.7"/>
              <circle cx="200" cy="80" r="40" fill="#3d5af1" opacity="0.15"/>
              <circle cx="200" cy="80" r="26" fill="#3d5af1" opacity="0.25"/>
              <text x="190" y="87" fill="#7b9fff" fontSize="22" fontWeight="bold">P</text>
              <rect x="80" y="270" width="30" height="10" rx="2" fill="#3d5af1" opacity="0.4"/>
              <rect x="185" y="270" width="30" height="10" rx="2" fill="#3d5af1" opacity="0.4"/>
              <rect x="290" y="270" width="30" height="10" rx="2" fill="#3d5af1" opacity="0.4"/>
            </svg>
          </div>
        </div>

        <div className="reg-right">
          <div className="form-card">
            <h2>Create account</h2>
            <p className="subtitle">Get started with Parkify today</p>

            <form onSubmit={handleRegister} className="reg-form">

              <div className="row">
                <div className="field">
                  <label>First Name</label>
                  <div className="input-wrap">
                    <span className="material-symbols-outlined input-icon">badge</span>
                    <input
                      type="text"
                      placeholder="First name"
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="field">
                  <label>Last Name</label>
                  <div className="input-wrap">
                    <span className="material-symbols-outlined input-icon">badge</span>
                    <input
                      type="text"
                      placeholder="Last name"
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="field">
                <label>Username</label>
                <div className="input-wrap">
                  <span className="material-symbols-outlined input-icon">person</span>
                  <input
                    type="text"
                    placeholder="Choose a username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="field">
                <label>Email</label>
                <div className="input-wrap">
                  <span className="material-symbols-outlined input-icon">mail</span>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="field">
                <label>Phone</label>
                <div className="input-wrap">
                  <span className="material-symbols-outlined input-icon">phone</span>
                  <input
                    type="tel"
                    placeholder="Enter your phone number"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="field">
                <label>Password</label>
                <div className="input-wrap">
                  <span className="material-symbols-outlined input-icon">lock</span>
                  <input
                    type="password"
                    placeholder="Create a password"
                    value={pwd}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="field">
                <label>I am a...</label>
                <div className="role-group">
                  <button
                    type="button"
                    className={`role-btn ${role === 'client' ? 'active' : ''}`}
                    onClick={() => setRole('client')}
                  >
                    <span className="material-symbols-outlined" style={{fontSize:'18px'}}>directions_car</span>
                    Client
                  </button>
                  <button
                    type="button"
                    className={`role-btn ${role === 'provider' ? 'active' : ''}`}
                    onClick={() => setRole('provider')}
                  >
                    <span className="material-symbols-outlined" style={{fontSize:'18px'}}>local_parking</span>
                    Provider
                  </button>
                </div>
              </div>

              {error && (
                <div className="error-banner">
                  <span className="material-symbols-outlined error-icon">error</span>
                  {error}
                </div>
              )}

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? <span className="spinner" /> : 'Create Account'}
              </button>
            </form>

            <div className="divider"><span>or</span></div>

            <Link href="/login" className="btn-secondary">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}