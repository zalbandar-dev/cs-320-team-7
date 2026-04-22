'use client';

import { useState } from 'react';
import { getAuthHeaders } from '@/app/lib/auth';

const VEHICLE_SERVICES = ['Oil Change', 'Tyre Change', 'Car Wash', 'Detailing', 'Battery Jump', 'Other'];
const SPOT_SERVICES    = ['Snow Shoveling', 'Leaf Raking', 'Pressure Washing', 'Painting', 'Other'];

interface Props {
  onClose: () => void;
  onSubmitted?: () => void;
}

export default function ServiceRequestModal({ onClose, onSubmitted }: Props) {
  const [category, setCategory]       = useState<'vehicle' | 'spot'>('vehicle');
  const [serviceType, setServiceType] = useState('');
  const [customType, setCustomType]   = useState('');
  const [entityId, setEntityId]       = useState('');
  const [notes, setNotes]             = useState('');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');

  const options       = category === 'vehicle' ? VEHICLE_SERVICES : SPOT_SERVICES;
  const finalType     = serviceType === 'Other' ? customType : serviceType;
  const idLabel       = category === 'vehicle' ? 'Booking ID' : 'Spot ID';
  const idIcon        = category === 'vehicle' ? 'receipt' : 'location_on';
  const idPlaceholder = category === 'vehicle' ? 'Enter booking ID' : 'Enter spot ID';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!finalType.trim()) {
      setError('Please select or enter a service type.');
      return;
    }
    const id = Number(entityId);
    if (!entityId || isNaN(id) || id <= 0) {
      setError(`Please enter a valid ${idLabel.toLowerCase()}.`);
      return;
    }

    setLoading(true);
    const body: Record<string, unknown> = {
      service_type: finalType.trim(),
      notes: notes.trim() || undefined,
      ...(category === 'vehicle' ? { booking_id: id } : { spot_id: id }),
    };

    try {
      const res  = await fetch('http://localhost:3001/api/service-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? (data.errors as string[])?.join(', ') ?? 'Submission failed.');
        setLoading(false);
        return;
      }
      onSubmitted?.();
      onClose();
    } catch {
      setError('Network error. Please try again.');
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
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-extrabold text-on-surface" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Request a Service
            </h2>
            <p className="text-sm text-on-surface-variant mt-0.5">Submit a new service request</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-surface-container rounded-full transition-colors flex-shrink-0"
          >
            <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 20 }}>close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          {/* Category toggle */}
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-2">
              Service Category
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['vehicle', 'spot'] as const).map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => { setCategory(cat); setServiceType(''); setCustomType(''); }}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm border transition-all ${
                    category === cat
                      ? 'bg-primary text-on-primary border-primary shadow-sm'
                      : 'bg-surface-container text-on-surface-variant border-surface-container-high hover:border-primary/40'
                  }`}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                    {cat === 'vehicle' ? 'directions_car' : 'local_parking'}
                  </span>
                  {cat === 'vehicle' ? 'Vehicle' : 'Spot'}
                </button>
              ))}
            </div>
          </div>

          {/* Service type */}
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-2">
              Service Type
            </label>
            <select
              value={serviceType}
              onChange={e => setServiceType(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low text-on-surface text-sm font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all appearance-none cursor-pointer"
            >
              <option value="" disabled>Select a service...</option>
              {options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            {serviceType === 'Other' && (
              <input
                type="text"
                placeholder="Describe the service..."
                value={customType}
                onChange={e => setCustomType(e.target.value)}
                required
                className="mt-2 w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low text-on-surface text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
              />
            )}
          </div>

          {/* ID field */}
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-2">
              {idLabel}
            </label>
            <div className="relative">
              <span
                className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary"
                style={{ fontSize: 18, pointerEvents: 'none' }}
              >
                {idIcon}
              </span>
              <input
                type="number"
                min="1"
                placeholder={idPlaceholder}
                value={entityId}
                onChange={e => setEntityId(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low text-on-surface text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-2">
              Notes{' '}
              <span className="normal-case font-normal text-on-surface-variant opacity-60">(optional)</span>
            </label>
            <textarea
              rows={3}
              placeholder="Any details or instructions for the provider..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low text-on-surface text-sm resize-none focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
            />
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
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
