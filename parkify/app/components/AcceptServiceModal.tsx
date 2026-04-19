'use client';

import { useState, useEffect } from 'react';
import { getAuthHeaders } from '@/app/lib/auth';

interface Props {
  requestId: number;
  serviceType: string;
  spotAddress: string | null;
  onClose: () => void;
  onAccepted: () => void;
}

export default function AcceptServiceModal({ requestId, serviceType, spotAddress, onClose, onAccepted }: Props) {
  const [providerName, setProviderName]       = useState('');
  const [providerContact, setProviderContact] = useState('');
  const [loading, setLoading]                 = useState(false);
  const [error, setError]                     = useState('');

  // Pre-fill name from localStorage username as a starting point
  useEffect(() => {
    const username = localStorage.getItem('username') ?? '';
    if (username) setProviderName(username);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!providerName.trim()) { setError('Please enter your name or company name.'); return; }
    if (!providerContact.trim()) { setError('Please enter a contact phone or email.'); return; }

    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3001/api/service-requests/${requestId}/accept`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ provider_name: providerName.trim(), provider_contact: providerContact.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Failed to accept request.'); return; }
      onAccepted();
      onClose();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-8" style={{ fontFamily: 'Inter, sans-serif' }}>

        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div>
            <h2 className="text-xl font-extrabold text-on-surface" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Accept Job
            </h2>
            <p className="text-sm text-on-surface-variant mt-0.5">Confirm your contact info for the requester</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-surface-container rounded-full transition-colors flex-shrink-0">
            <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 20 }}>close</span>
          </button>
        </div>

        {/* Job summary chip */}
        <div className="flex items-center gap-2 px-3 py-2 bg-surface-container-low rounded-xl mb-6 mt-4">
          <span className="material-symbols-outlined text-primary" style={{ fontSize: 18 }}>build_circle</span>
          <span className="text-sm font-semibold text-on-surface">{serviceType}</span>
          {spotAddress && (
            <>
              <span className="text-on-surface-variant opacity-40">·</span>
              <span className="text-sm text-on-surface-variant truncate">{spotAddress}</span>
            </>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          {/* Name / Company */}
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-1.5">
              Your Name or Company
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary" style={{ fontSize: 18, pointerEvents: 'none' }}>
                badge
              </span>
              <input
                type="text"
                placeholder="e.g. John's Auto Services"
                value={providerName}
                onChange={e => setProviderName(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low text-on-surface text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
              />
            </div>
            <p className="text-xs text-on-surface-variant mt-1 opacity-60">Pre-filled from your username — edit freely</p>
          </div>

          {/* Contact */}
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-1.5">
              Contact Phone or Email
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary" style={{ fontSize: 18, pointerEvents: 'none' }}>
                phone
              </span>
              <input
                type="text"
                placeholder="e.g. 617-555-0123 or you@example.com"
                value={providerContact}
                onChange={e => setProviderContact(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low text-on-surface text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
              />
            </div>
            <p className="text-xs text-on-surface-variant mt-1 opacity-60">Shared with the requester so they can reach you</p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-error">
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>error</span>
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-outline-variant text-sm font-semibold text-on-surface-variant hover:bg-surface-container transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 rounded-xl bg-primary text-on-primary text-sm font-bold shadow-sm hover:scale-[1.02] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
            >
              {loading ? 'Accepting…' : 'Confirm Acceptance'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
