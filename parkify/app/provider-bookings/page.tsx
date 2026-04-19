"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import Sidebar from "@/app/components/Sidebar";
import { getAuthHeaders } from "@/app/lib/auth";

interface BookingUser {
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  phone: string | null;
}

interface BookingSpot {
  address: string;
  zip_code: string;
  spot_type: string;
  hourly_rate: number;
}

interface ProviderBooking {
  booking_id: number;
  user_id: number;
  spot_id: number;
  start_time: string;
  end_time: string;
  total_price: number;
  status: string;
  vehicle_make: string;
  vehicle_model: string;
  license_plate: string;
  created_at: string;
  users: BookingUser | null;
  parking_spots: BookingSpot | null;
}

const STATUS_STYLES: Record<string, { color: string; bg: string; label: string }> = {
  pending_provider: { color: "#92400e", bg: "#fef3c7", label: "Awaiting Your Approval" },
  active:           { color: "#15803d", bg: "#dcfce7", label: "Confirmed"              },
  cancelled:        { color: "#b91c1c", bg: "#fee2e2", label: "Cancelled"              },
  completed:        { color: "#1d4ed8", bg: "#dbeafe", label: "Completed"              },
};

type TabFilter = "pending" | "all";

function formatDateRange(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  const dateOpts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" };
  const timeOpts: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit" };
  if (s.toDateString() === e.toDateString()) {
    return `${s.toLocaleDateString(undefined, dateOpts)}, ${s.toLocaleTimeString(undefined, timeOpts)} – ${e.toLocaleTimeString(undefined, timeOpts)}`;
  }
  return `${s.toLocaleDateString(undefined, dateOpts)} ${s.toLocaleTimeString(undefined, timeOpts)} – ${e.toLocaleDateString(undefined, dateOpts)} ${e.toLocaleTimeString(undefined, timeOpts)}`;
}

export default function ProviderBookingsPage() {
  const router = useRouter();
  const [bookings, setBookings]   = useState<ProviderBooking[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [tab, setTab]             = useState<TabFilter>("pending");
  const [acting, setActing]       = useState<number | null>(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/providerBookings", { headers: getAuthHeaders() });
      if (res.status === 401) { router.push("/login"); return; }
      const data = await res.json();
      if (data.success) setBookings(data.data ?? []);
      else setError(data.error ?? "Failed to load bookings.");
    } catch {
      setError("Network error. Is the server running?");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  async function handleAction(bookingId: number, action: "confirm" | "reject") {
    setActing(bookingId);
    try {
      const endpoint = action === "confirm"
        ? `/api/confirmBooking/${bookingId}`
        : `/api/rejectBooking/${bookingId}`;
      const res = await fetch(endpoint, { method: "PATCH", headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) {
        setBookings(prev =>
          prev.map(b =>
            b.booking_id === bookingId
              ? { ...b, status: action === "confirm" ? "active" : "cancelled" }
              : b
          )
        );
      } else {
        setError(data.error ?? `Failed to ${action} booking.`);
      }
    } catch {
      setError("Network error. Try again.");
    } finally {
      setActing(null);
    }
  }

  const visible = tab === "pending"
    ? bookings.filter(b => b.status === "pending_provider")
    : bookings;

  const pendingCount = bookings.filter(b => b.status === "pending_provider").length;

  return (
    <div className="bg-background text-on-background min-h-screen">
      <Navbar />
      <Sidebar />

      <main className="lg:pl-64 pt-24 min-h-screen">
        <div className="max-w-4xl mx-auto px-8 py-10">

          {/* Header */}
          <header className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-extrabold text-on-surface tracking-tight font-headline">
                Booking Requests
              </h1>
              <p className="text-on-surface-variant mt-1">
                Review and confirm incoming bookings for your spots
              </p>
            </div>
            {pendingCount > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm font-semibold">
                <span className="material-symbols-outlined text-amber-500" style={{ fontSize: 18 }}>notifications_active</span>
                {pendingCount} pending {pendingCount === 1 ? "request" : "requests"}
              </div>
            )}
          </header>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            {(["pending", "all"] as TabFilter[]).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${
                  tab === t
                    ? "bg-primary text-on-primary shadow-sm"
                    : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                }`}
              >
                {t === "pending" ? `Pending (${pendingCount})` : "All Bookings"}
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-2xl px-6 py-4 text-error text-sm font-medium mb-6">
              <span className="material-symbols-outlined">error</span>
              {error}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-24 text-on-surface-variant gap-3">
              <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
              Loading bookings...
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && visible.length === 0 && (
            <div className="text-center py-24 text-on-surface-variant bg-surface-container-lowest rounded-2xl border border-slate-100">
              <span className="material-symbols-outlined text-[56px] mb-3 block opacity-30">event_available</span>
              <p className="text-lg font-semibold">
                {tab === "pending" ? "No pending requests" : "No bookings yet"}
              </p>
              <p className="text-sm mt-1 opacity-70">
                {tab === "pending" ? "All caught up — check All Bookings for history." : "Bookings for your spots will appear here."}
              </p>
            </div>
          )}

          {/* Booking cards */}
          {!loading && !error && visible.length > 0 && (
            <div className="space-y-5">
              {visible.map(b => {
                const style  = STATUS_STYLES[b.status] ?? STATUS_STYLES.active;
                const spot   = b.parking_spots;
                const user   = b.users;
                const hours  = (new Date(b.end_time).getTime() - new Date(b.start_time).getTime()) / (1000 * 60 * 60);
                const isPending = b.status === "pending_provider";
                const isActing  = acting === b.booking_id;

                return (
                  <div
                    key={b.booking_id}
                    className={`bg-surface-container-lowest rounded-2xl border p-6 hover:shadow-md transition-shadow ${
                      isPending ? "border-amber-200 bg-amber-50/30" : "border-slate-100"
                    }`}
                  >
                    {/* Top row: spot address + status badge */}
                    <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
                      <div>
                        <h3 className="font-bold text-on-surface text-base">
                          {spot?.address ?? `Spot #${b.spot_id}`}
                        </h3>
                        {spot && (
                          <p className="text-sm text-on-surface-variant mt-0.5">
                            {spot.zip_code} · {spot.spot_type.charAt(0).toUpperCase() + spot.spot_type.slice(1)} · ${spot.hourly_rate.toFixed(2)}/hr
                          </p>
                        )}
                      </div>
                      <span
                        className="text-xs px-3 py-1 rounded-full font-bold uppercase tracking-tight flex-shrink-0"
                        style={{ color: style.color, background: style.bg }}
                      >
                        {style.label}
                      </span>
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-3 gap-4 py-4 border-t border-b border-slate-100 mb-4">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wide text-on-surface-variant mb-1">Time</p>
                        <p className="text-sm text-on-surface">{formatDateRange(b.start_time, b.end_time)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wide text-on-surface-variant mb-1">Duration</p>
                        <p className="text-sm text-on-surface">{hours.toFixed(1)} hrs</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wide text-on-surface-variant mb-1">Total</p>
                        <p className="text-sm font-bold text-on-surface">${b.total_price.toFixed(2)}</p>
                      </div>
                    </div>

                    {/* Customer + vehicle row */}
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold text-xs flex-shrink-0">
                          {user ? `${user.first_name[0]}${user.last_name[0]}` : "?"}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-on-surface">
                            {user ? `${user.first_name} ${user.last_name}` : `User #${b.user_id}`}
                          </p>
                          <p className="text-xs text-on-surface-variant">
                            {user?.email ?? ""}{user?.phone ? ` · ${user.phone}` : ""}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-on-surface-variant font-mono">
                        {b.vehicle_make} {b.vehicle_model} · {b.license_plate}
                      </p>
                    </div>

                    {/* Actions (pending only) */}
                    {isPending && (
                      <div className="flex gap-3 mt-5 pt-4 border-t border-amber-100">
                        <button
                          type="button"
                          onClick={() => handleAction(b.booking_id, "reject")}
                          disabled={isActing}
                          className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-error hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {isActing ? "Working…" : "Decline"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAction(b.booking_id, "confirm")}
                          disabled={isActing}
                          className="flex-1 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-bold shadow-sm hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          {isActing ? "Working…" : "Confirm Booking"}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
