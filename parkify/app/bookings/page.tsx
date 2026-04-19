"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Booking } from "@/app/lib/types";
import { getAuthHeaders } from "@/app/lib/auth";
import Sidebar from "@/app/components/Sidebar";
import Navbar from "@/app/components/Navbar";

const STATUS_STYLES: Record<string, { color: string; bg: string; label: string }> = {
  active:    { color: "#15803d", bg: "#dcfce7", label: "Active" },
  completed: { color: "#1d4ed8", bg: "#dbeafe", label: "Completed" },
  cancelled: { color: "#b91c1c", bg: "#fee2e2", label: "Cancelled" },
};

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

export default function BookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchBookings();
  }, []);

  async function fetchBookings() {
    try {
      const res = await fetch("/api/myBookings", { headers: getAuthHeaders() });
      if (res.status === 401) { router.push("/login"); return; }
      const data = await res.json();
      if (data.success) setBookings(data.data);
    } catch {
      setError("Failed to load bookings.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel(bookingId: number) {
    setCancelling(bookingId);
    try {
      const res = await fetch(`/api/cancelBooking/${bookingId}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setBookings(prev => prev.map(b => b.booking_id === bookingId ? { ...b, status: "cancelled" } : b));
      } else {
        setError(data.error ?? "Failed to cancel.");
      }
    } catch {
      setError("Network error. Try again.");
    } finally {
      setCancelling(null);
    }
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f3f4f6" }}>
      <Navbar />
      <Sidebar />
      <main style={{ marginLeft: "256px", paddingTop: "72px" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto", padding: "32px 24px 80px" }}>

          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>My Bookings</h1>
          <p style={{ fontSize: "14px", color: "#6b7280", margin: "0 0 28px" }}>Manage your parking reservations</p>

          {error && (
            <div style={{ background: "#fee2e2", color: "#b91c1c", borderRadius: "10px", padding: "12px 16px", marginBottom: "16px", fontSize: "14px" }}>
              {error}
            </div>
          )}

          {loading && (
            <div style={{ display: "flex", justifyContent: "center", padding: "60px" }}>
              <div style={{ width: "36px", height: "36px", border: "3px solid #e5e7eb", borderTopColor: "#2563eb", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {!loading && bookings.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px 24px", background: "white", borderRadius: "16px", border: "1px solid #e5e7eb" }}>
              <p style={{ fontSize: "18px", fontWeight: 600, color: "#111827", margin: "0 0 8px" }}>No bookings yet</p>
              <p style={{ fontSize: "14px", color: "#6b7280", margin: "0 0 24px" }}>Find a spot and make your first booking.</p>
              <button
                type="button"
                onClick={() => router.push("/homepage")}
                style={{ padding: "10px 24px", background: "#2563eb", color: "white", border: "none", borderRadius: "8px", fontWeight: 700, cursor: "pointer", fontSize: "14px" }}
              >
                Browse Spots
              </button>
            </div>
          )}

          {!loading && bookings.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {bookings.map(b => {
                const spot = b.parking_spots;
                const style = STATUS_STYLES[b.status] ?? STATUS_STYLES.active;
                const hours = (new Date(b.end_time).getTime() - new Date(b.start_time).getTime()) / (1000 * 60 * 60);

                return (
                  <div key={b.booking_id} style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "14px", padding: "20px 24px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                      <div>
                        <p style={{ fontSize: "16px", fontWeight: 700, color: "#111827", margin: "0 0 2px" }}>
                          {spot?.address ?? `Spot #${b.spot_id}`}
                        </p>
                        {spot?.zip_code && (
                          <p style={{ fontSize: "13px", color: "#6b7280", margin: 0 }}>{spot.zip_code} · {spot.spot_type}</p>
                        )}
                      </div>
                      <span style={{ padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: 700, color: style.color, background: style.bg, flexShrink: 0 }}>
                        {style.label}
                      </span>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", padding: "14px 0", borderTop: "1px solid #f3f4f6", borderBottom: "1px solid #f3f4f6", marginBottom: "14px" }}>
                      <div>
                        <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "#9ca3af", margin: "0 0 3px" }}>Time</p>
                        <p style={{ fontSize: "13px", color: "#374151", margin: 0 }}>{formatDateRange(b.start_time, b.end_time)}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "#9ca3af", margin: "0 0 3px" }}>Duration</p>
                        <p style={{ fontSize: "13px", color: "#374151", margin: 0 }}>{hours.toFixed(1)} hrs</p>
                      </div>
                      <div>
                        <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "#9ca3af", margin: "0 0 3px" }}>Total</p>
                        <p style={{ fontSize: "13px", fontWeight: 700, color: "#111827", margin: 0 }}>${b.total_price.toFixed(2)}</p>
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <p style={{ fontSize: "13px", color: "#6b7280", margin: 0 }}>
                        {b.vehicle_make} {b.vehicle_model} · <span style={{ fontFamily: "monospace" }}>{b.license_plate}</span>
                      </p>
                      {b.status === "active" && (
                        <button
                          type="button"
                          onClick={() => handleCancel(b.booking_id)}
                          disabled={cancelling === b.booking_id}
                          style={{
                            padding: "7px 16px",
                            background: "white",
                            color: cancelling === b.booking_id ? "#9ca3af" : "#b91c1c",
                            border: `1px solid ${cancelling === b.booking_id ? "#e5e7eb" : "#fca5a5"}`,
                            borderRadius: "8px",
                            fontSize: "13px",
                            fontWeight: 600,
                            cursor: cancelling === b.booking_id ? "not-allowed" : "pointer",
                          }}
                        >
                          {cancelling === b.booking_id ? "Cancelling…" : "Cancel"}
                        </button>
                      )}
                    </div>
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
