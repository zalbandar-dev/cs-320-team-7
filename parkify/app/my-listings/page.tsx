"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import Sidebar from "@/app/components/Sidebar";
import { ParkingSpot } from "@/app/lib/types";
import { getAuthHeaders } from "@/app/lib/auth";

const STATUS_COLORS: Record<string, string> = {
  available: "bg-green-100 text-green-800",
  occupied:  "bg-red-100 text-red-800",
  reserved:  "bg-yellow-100 text-yellow-800",
};

const SPOT_TYPES = ["compact", "standard", "large", "motorcycle", "rv"];

const emptyForm = {
  address: "",
  zip_code: "",
  hourly_rate: "",
  spot_type: "standard",
  description: "",
  latitude: "",
  longitude: "",
};

interface GeoapifyResult {
  formatted: string;
  address_line1: string;
  postcode: string;
  lat: number;
  lon: number;
}

export default function MyListingsPage() {
  const searchParams = useSearchParams();
  const [spots, setSpots] = useState<ParkingSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(searchParams.get("new") === "true");
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Autocomplete state
  const [suggestions, setSuggestions] = useState<GeoapifyResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const addressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/mySpots", { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((data) => setSpots(Array.isArray(data) ? data : data?.data ?? []))
      .finally(() => setLoading(false));
  }, []);

  // Close suggestions on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (addressRef.current && !addressRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleAddressChange(value: string) {
    setForm((f) => ({ ...f, address: value }));
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.length < 3) { setSuggestions([]); setShowSuggestions(false); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/autocomplete?text=${encodeURIComponent(value)}`);
        const data = await res.json();
        setSuggestions(data.results ?? []);
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
      }
    }, 300);
  }

  function handleSelectSuggestion(result: GeoapifyResult) {
    setForm((f) => ({
      ...f,
      address: result.formatted,
      zip_code: result.postcode ?? f.zip_code,
      latitude: String(result.lat ?? ""),
      longitude: String(result.lon ?? ""),
    }));
    setSuggestions([]);
    setShowSuggestions(false);
  }

  async function handleDelete(spotId: number) {
    if (!confirm("Delete this spot? This cannot be undone.")) return;
    const res = await fetch(`/api/deleteSpot/${spotId}`, { method: "DELETE", headers: getAuthHeaders() });
    const data = await res.json();
    if (data.success) {
      setSpots((prev) => prev.filter((s) => s.spot_id !== spotId));
    } else {
      alert(data.error ?? "Failed to delete spot.");
    }
  }

  async function handleToggleAvailability(spot: ParkingSpot) {
    const newAvailable = !spot.available;
    const res = await fetch(`/api/toggleSpotAvailability/${spot.spot_id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ available: newAvailable, provider_id: spot.provider_id }),
    });
    const data = await res.json();
    if (data.success) {
      setSpots((prev) =>
        prev.map((s) => (s.spot_id === spot.spot_id ? { ...s, available: newAvailable } : s))
      );
    } else {
      alert(data.error ?? "Failed to update availability.");
    }
  }

  async function handleAddSpot(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    const res = await fetch("/api/addSpot", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify({
        ...form,
        hourly_rate: parseFloat(form.hourly_rate),
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
      }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (data.success) {
      setSpots((prev) => [...prev, data.data]);
      setForm(emptyForm);
      setShowModal(false);
    } else {
      setFormError(data.error ?? "Failed to add spot.");
    }
  }

  return (
    <div className="bg-background text-on-background min-h-screen">
      <Navbar />
      <Sidebar />

      <main className="lg:pl-64 pt-24 min-h-screen">
        <div className="max-w-7xl mx-auto px-8 py-10">

          {/* Header */}
          <header className="flex items-center justify-between mb-10">
            <div>
              <h1 className="text-4xl font-extrabold text-on-surface tracking-tight font-headline">My Listings</h1>
              <p className="text-on-surface-variant mt-1">{spots.length} spots in your portfolio</p>
            </div>
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-xl font-bold shadow-md hover:scale-[1.02] active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined">add</span>
              New Listing
            </button>
          </header>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-surface-container-lowest rounded-2xl overflow-hidden animate-pulse">
                  <div className="h-48 bg-slate-200" />
                  <div className="p-6 space-y-3">
                    <div className="h-4 bg-slate-200 rounded w-3/4" />
                    <div className="h-3 bg-slate-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {spots.map((spot) => (
                <div key={spot.spot_id} className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm border border-slate-100 flex flex-col group">
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-primary/10 text-primary px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                        {spot.spot_type}
                      </span>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${STATUS_COLORS[spot.available ? "available" : "occupied"]}`}>
                        {spot.available ? "available" : "occupied"}
                      </span>
                    </div>
                    <h3 className="font-bold text-base text-on-surface mb-1">{spot.address}</h3>
                    <p className="text-sm text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">location_on</span>
                      {spot.zip_code}
                    </p>
                    <p className="text-sm text-on-surface-variant mt-1">{spot.description}</p>
                    <p className="text-primary font-bold mt-2">${Number(spot.hourly_rate).toFixed(2)}<span className="text-xs font-normal text-on-surface-variant">/hr</span></p>

                    <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                      <Link href={`/spots/${spot.spot_id}`} className="flex-1 no-underline">
                        <button type="button" className="w-full py-2 rounded-lg border border-slate-200 text-sm font-semibold text-on-surface hover:bg-slate-50 transition-colors">
                          View
                        </button>
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleToggleAvailability(spot)}
                        title={spot.available ? "Mark as unavailable" : "Mark as available"}
                        className={`py-2 px-3 rounded-lg text-sm font-semibold transition-colors ${
                          spot.available
                            ? "bg-green-50 text-green-700 hover:bg-green-100"
                            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                        }`}
                      >
                        <span className="material-symbols-outlined text-sm">
                          {spot.available ? "toggle_on" : "toggle_off"}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(spot.spot_id)}
                        className="py-2 px-3 rounded-lg bg-red-50 text-error text-sm font-semibold hover:bg-red-100 transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Add Spot Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-extrabold text-on-surface">New Listing</h2>
              <button type="button" onClick={() => { setShowModal(false); setFormError(""); setForm(emptyForm); }} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleAddSpot} className="space-y-4">
              {/* Address with autocomplete */}
              <div ref={addressRef} className="relative">
                <label className="block text-sm font-semibold mb-1">Address</label>
                <input
                  required
                  autoComplete="off"
                  value={form.address}
                  onChange={(e) => handleAddressChange(e.target.value)}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Start typing an address..."
                />
                {showSuggestions && suggestions.length > 0 && (
                  <ul className="absolute z-10 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {suggestions.map((s, i) => (
                      <li key={i}>
                        <button
                          type="button"
                          onMouseDown={() => handleSelectSuggestion(s)}
                          className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 flex items-center gap-2"
                        >
                          <span className="material-symbols-outlined text-sm text-slate-400">location_on</span>
                          {s.formatted}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Zip Code</label>
                  <input
                    required
                    value={form.zip_code}
                    onChange={(e) => setForm({ ...form, zip_code: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Auto-filled from address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Hourly Rate ($)</label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.hourly_rate}
                    onChange={(e) => setForm({ ...form, hourly_rate: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="5.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Spot Type</label>
                  <select
                    title="Spot Type"
                    value={form.spot_type}
                    onChange={(e) => setForm({ ...form, spot_type: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {SPOT_TYPES.map((t) => (
                      <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  placeholder="Describe your parking spot..."
                />
              </div>

              {formError && <p className="text-sm text-red-600">{formError}</p>}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setFormError(""); setForm(emptyForm); }}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-on-surface hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {submitting ? "Adding..." : "Add Spot"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
