"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import Sidebar from "@/app/components/Sidebar";
import { getAuthHeaders } from "@/app/lib/auth";

interface Booking {
  booking_id: number;
  spot_id: number;
  start_time: string;
  end_time: string;
  total_price: number;
  status: "active" | "completed" | "cancelled";
  vehicle_make: string;
  vehicle_model: string;
  license_plate: string;
  created_at: string;
  parking_spots: {
    address: string;
    spot_type: string;
    hourly_rate: number;
    zip_code: string;
  } | null;
}

const STATUS_STYLES: Record<string, string> = {
  active:    "bg-green-100 text-green-800",
  completed: "bg-slate-100 text-slate-600",
  cancelled: "bg-red-100 text-red-700",
};

function formatDt(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

function hours(start: string, end: string) {
  return ((new Date(end).getTime() - new Date(start).getTime()) / 3_600_000).toFixed(1);
}

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/myBookings", { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setBookings(data.data);
        else setError(data.error ?? "Failed to load bookings.");
      })
      .catch(() => setError("Network error."))
      .finally(() => setLoading(false));
  }, []);

  async function handleCancel(bookingId: number) {
    if (!confirm("Cancel this booking?")) return;
    setCancelling(bookingId);
    const res = await fetch(`/api/cancelBooking/${bookingId}`, {
      method: "PATCH",
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    setCancelling(null);
    if (data.success) {
      setBookings((prev) =>
        prev.map((b) => (b.booking_id === bookingId ? { ...b, status: "cancelled" } : b))
      );
    } else {
      alert(data.error ?? "Failed to cancel booking.");
    }
  }

  return (
    <div className="bg-background text-on-background min-h-screen">
      <Navbar />
      <Sidebar />

      <main className="lg:pl-64 pt-24 min-h-screen">
        <div className="max-w-4xl mx-auto px-8 py-10">

          <header className="mb-10">
            <h1 className="text-4xl font-extrabold text-on-surface tracking-tight font-headline">My Bookings</h1>
            <p className="text-on-surface-variant mt-1">Your parking reservation history</p>
          </header>

          {loading && (
            <div className="flex flex-col gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-surface-container-lowest rounded-2xl p-6 animate-pulse h-36" />
              ))}
            </div>
          )}

          {!loading && error && (
            <div className="bg-red-50 text-red-700 rounded-xl px-6 py-4 font-medium">{error}</div>
          )}

          {!loading && !error && bookings.length === 0 && (
            <div className="text-center py-20 text-on-surface-variant">
              <p className="text-lg font-semibold mb-2">No bookings yet</p>
              <Link href="/homepage" className="text-primary font-semibold hover:underline">
                Browse available spots →
              </Link>
            </div>
          )}

          {!loading && !error && bookings.length > 0 && (
            <div className="flex flex-col gap-4">
              {bookings.map((b) => (
                <div
                  key={b.booking_id}
                  className="bg-surface-container-lowest rounded-2xl border border-slate-100 shadow-sm p-6"
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    {/* Left: spot + vehicle info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="bg-primary/10 text-primary px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                          {b.parking_spots?.spot_type ?? "—"}
                        </span>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${STATUS_STYLES[b.status]}`}>
                          {b.status}
                        </span>
                      </div>

                      <h3 className="font-bold text-base text-on-surface truncate">
                        {b.parking_spots?.address ?? `Spot #${b.spot_id}`}
                      </h3>
                      <p className="text-sm text-on-surface-variant mb-3">
                        {b.parking_spots?.zip_code}
                      </p>

                      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-on-surface-variant">
                        <span>
                          <span className="font-semibold text-on-surface">Start</span>{" "}
                          {formatDt(b.start_time)}
                        </span>
                        <span>
                          <span className="font-semibold text-on-surface">End</span>{" "}
                          {formatDt(b.end_time)}
                        </span>
                        <span>
                          <span className="font-semibold text-on-surface">Duration</span>{" "}
                          {hours(b.start_time, b.end_time)} hrs
                        </span>
                        <span>
                          <span className="font-semibold text-on-surface">Vehicle</span>{" "}
                          {b.vehicle_make} {b.vehicle_model} · {b.license_plate}
                        </span>
                      </div>
                    </div>

                    {/* Right: price + actions */}
                    <div className="flex flex-col items-end gap-3 shrink-0">
                      <p className="text-2xl font-extrabold text-on-surface">
                        ${Number(b.total_price).toFixed(2)}
                      </p>

                      <div className="flex gap-2">
                        <Link href={`/spots/${b.spot_id}`}>
                          <button type="button" className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-on-surface hover:bg-slate-50 transition-colors">
                            View spot
                          </button>
                        </Link>
                        {b.status === "active" && (
                          <button
                            type="button"
                            disabled={cancelling === b.booking_id}
                            onClick={() => handleCancel(b.booking_id)}
                            className="px-4 py-2 rounded-lg bg-red-50 text-error text-sm font-semibold hover:bg-red-100 transition-colors disabled:opacity-50"
                          >
                            {cancelling === b.booking_id ? "Cancelling..." : "Cancel"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
