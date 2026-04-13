'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [pwd, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:3001/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, pwd }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed. Please check your credentials.');
        setLoading(false);
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('username', data.user?.username || username);
      localStorage.setItem('role', data.user?.role || '');

      router.push('/homepage');
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,600;1,600&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .login-root {
          display: flex;
          min-height: 100vh;
          background: #0d1225;
          font-family: 'Montserrat', sans-serif;
          color: #e8eaf6;
        }
        .login-left {
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
        .login-left::before {
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
        .login-right {
          width: 480px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px 40px;
          background: #0f1628;
        }
        .form-card {
          width: 100%;
          max-width: 380px;
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
          margin: 0 0 36px;
        }
        .login-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
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
        .input-wrap input {
          width: 100%;
          padding: 13px 14px 13px 44px;
          background: #1a2340;
          border: 1.5px solid rgba(61,90,241,0.25);
          border-radius: 10px;
          font-size: 15px;
          color: #e8eaf6;
          font-family: 'Montserrat', sans-serif;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .input-wrap input::placeholder { color: #3d4f78; }
        .input-wrap input:focus {
          border-color: #3d5af1;
          box-shadow: 0 0 0 3px rgba(61,90,241,0.15);
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
          margin: 24px 0;
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
        .footer-note {
          font-size: 12px;
          color: #3d4f78;
          text-align: center;
          margin-top: 28px;
          line-height: 1.6;
        }
        .footer-note a { color: #7b9fff; text-decoration: none; }
        .footer-note a:hover { text-decoration: underline; }
        @media (max-width: 768px) {
          .login-root { flex-direction: column; }
          .login-left {
            padding: 32px 28px;
            border-right: none;
            border-bottom: 1px solid rgba(61,90,241,0.18);
          }
          .illustration { display: none; }
          .login-right { width: 100%; padding: 40px 24px; }
        }
      `}</style>

      <div className="login-root">
        <div className="login-left">
          <div className="brand">
            <div className="brand-icon">P</div>
            <span className="brand-name">Parkify</span>
          </div>
          <div className="tagline">
            <h1>Your spot.<br />Your schedule.<br />Your way.</h1>
            <p>The smarter way to list, find, and manage parking.</p>
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

        <div className="login-right">
          <div className="form-card">
            <h2>Welcome back</h2>
            <p className="subtitle">Sign in to your Parkify account</p>

            <form onSubmit={handleLogin} className="login-form">
              <div className="field">
                <label htmlFor="username">Username</label>
                <div className="input-wrap">
                  <span className="material-symbols-outlined input-icon">person</span>
                  <input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    required
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="field">
                <label htmlFor="password">Password</label>
                <div className="input-wrap">
                  <span className="material-symbols-outlined input-icon">lock</span>
                  <input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={pwd}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </div>
              </div>

              {error && (
                <div className="error-banner">
                  <span className="material-symbols-outlined error-icon">error</span>
                  {error}
                </div>
              )}

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? <span className="spinner" /> : 'Sign In'}
              </button>
            </form>

            <div className="divider"><span>or</span></div>

            <Link href="/register" className="btn-secondary">
              Create an Account
            </Link>
            
          </div>
        </div>
      </div>
    </>
  );
}