"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ParkingSpot } from "@/app/lib/types";
import { getAuthHeaders } from "@/app/lib/auth";

const PLACEHOLDER_IMAGE = "https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800&q=80";

interface BookingForm {
  start_time: string;
  end_time: string;
  vehicle_make: string;
  vehicle_model: string;
  license_plate: string;
}

const emptyForm: BookingForm = {
  start_time: "",
  end_time: "",
  vehicle_make: "",
  vehicle_model: "",
  license_plate: "",
};

export default function SpotDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [spot, setSpot] = useState<ParkingSpot | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<BookingForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    const fetchSpot = async () => {
      try {
        const res = await fetch(`/api/getSpotDetails/${params.id}`);
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();
        setSpot(data);
      } catch {
        setSpot(null);
      } finally {
        setLoading(false);
      }
    };
    fetchSpot();
  }, [params.id]);

  // Derived: hours and total cost from the selected times
  const selectedHours = (() => {
    if (!form.start_time || !form.end_time) return 0;
    const diff = (new Date(form.end_time).getTime() - new Date(form.start_time).getTime()) / (1000 * 60 * 60);
    return diff > 0 ? diff : 0;
  })();
  const totalCost = spot ? parseFloat((spot.hourly_rate * selectedHours).toFixed(2)) : 0;

  async function handleBook(e: React.FormEvent) {
    e.preventDefault();
    setBookingError("");
    setSubmitting(true);

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      setBookingError("You must be logged in to book a spot.");
      setSubmitting(false);
      return;
    }

    const res = await fetch("/api/createBooking", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify({ spot_id: spot?.spot_id, ...form }),
    });
    const data = await res.json();
    setSubmitting(false);

    if (data.success) {
      setBookingSuccess(true);
      setForm(emptyForm);
    } else {
      setBookingError(data.error ?? "Booking failed. Please try again.");
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{
          width: "40px", height: "40px",
          border: "3px solid #e5e7eb",
          borderTopColor: "#2563eb",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!spot) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#f3f4f6", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px" }}>
        <p style={{ fontSize: "20px", fontWeight: 700, color: "#111827" }}>Spot not found</p>
        <button type="button" onClick={() => router.back()} style={{ color: "#2563eb", background: "none", border: "none", cursor: "pointer", fontWeight: 600, fontSize: "15px" }}>
          ← Back to listings
        </button>
      </div>
    );
  }

  const isAvailable = spot.available;
  const statusLabel = isAvailable ? "Available" : "Unavailable";
  const statusColor = isAvailable ? "#15803d" : "#b91c1c";
  const statusBg = isAvailable ? "#dcfce7" : "#fee2e2";

  // Min datetime = now (rounded up to next hour)
  const nowIso = new Date(Math.ceil(Date.now() / 3600000) * 3600000).toISOString().slice(0, 16);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f3f4f6", color: "#111827" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "32px 24px 80px" }}>

        {/* Back */}
        <button
          type="button"
          onClick={() => router.back()}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: "14px", fontWeight: 600, color: "#2563eb", padding: "0 0 20px", display: "flex", alignItems: "center", gap: "6px" }}
        >
          ← Back to listings
        </button>

        {/* Image */}
        <div style={{ borderRadius: "16px", overflow: "hidden", height: "420px", background: "#e5e7eb" }}>
          <img src={PLACEHOLDER_IMAGE} alt={spot.spot_type} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>

        {/* Main content */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "32px", marginTop: "28px" }}>

          {/* Left — details */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <span style={{ padding: "4px 12px", borderRadius: "20px", fontSize: "13px", fontWeight: 600, color: statusColor, background: statusBg }}>
                {statusLabel}
              </span>
              <span style={{ fontSize: "13px", color: "#6b7280", background: "#f3f4f6", padding: "4px 12px", borderRadius: "20px", fontWeight: 500 }}>
                {spot.spot_type.charAt(0).toUpperCase() + spot.spot_type.slice(1)}
              </span>
            </div>
            <h1 style={{ fontSize: "26px", fontWeight: 700, margin: "0 0 4px" }}>{spot.address}</h1>
            <p style={{ fontSize: "14px", color: "#6b7280", margin: "0 0 20px" }}>{spot.address}, {spot.zip_code}</p>
            {spot.description && (
              <p style={{ fontSize: "15px", lineHeight: 1.7, color: "#374151", margin: "0 0 24px" }}>
                {spot.description}
              </p>
            )}
          </div>

          {/* Right — booking card */}
          <div>
            <div style={{
              background: "white", border: "1px solid #e5e7eb", borderRadius: "16px",
              padding: "24px", boxShadow: "0 4px 16px rgba(0,0,0,0.07)",
              position: "sticky", top: "24px",
            }}>
              {/* Price */}
              <div style={{ marginBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                  <span style={{ fontSize: "28px", fontWeight: 700 }}>${spot.hourly_rate.toFixed(2)}</span>
                  <span style={{ color: "#6b7280", fontSize: "14px" }}>/ hour</span>
                </div>
              </div>

              {/* Availability indicator */}
              <div style={{
                display: "flex", alignItems: "center", gap: "8px",
                padding: "10px 14px", borderRadius: "10px", background: statusBg, marginBottom: "20px",
              }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: statusColor, flexShrink: 0 }} />
                <span style={{ fontSize: "14px", fontWeight: 600, color: statusColor }}>{statusLabel}</span>
              </div>

              {bookingSuccess ? (
                <div style={{ textAlign: "center", padding: "16px 0" }}>
                  <div style={{ fontSize: "36px", marginBottom: "8px" }}>✅</div>
                  <p style={{ fontWeight: 700, fontSize: "16px", color: "#15803d", marginBottom: "4px" }}>Booking confirmed!</p>
                  <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "16px" }}>Check your bookings for details.</p>
                  <button
                    type="button"
                    onClick={() => router.push("/my-bookings")}
                    style={{ fontSize: "14px", fontWeight: 600, color: "#2563eb", background: "none", border: "none", cursor: "pointer" }}
                  >
                    View my bookings →
                  </button>
                </div>
              ) : (
                <form onSubmit={handleBook}>
                  {/* Date/time pickers */}
                  <div style={{ border: "1px solid #e5e7eb", borderRadius: "10px", overflow: "hidden", marginBottom: "12px" }}>
                    <div style={{ padding: "10px 12px", borderBottom: "1px solid #e5e7eb" }}>
                      <label style={{ display: "block", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "#6b7280", marginBottom: "4px" }}>
                        Start
                      </label>
                      <input
                        required
                        type="datetime-local"
                        min={nowIso}
                        value={form.start_time}
                        onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value, end_time: f.end_time < e.target.value ? "" : f.end_time }))}
                        style={{ border: "none", outline: "none", fontSize: "13px", width: "100%", color: "#111827", background: "transparent" }}
                      />
                    </div>
                    <div style={{ padding: "10px 12px" }}>
                      <label style={{ display: "block", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "#6b7280", marginBottom: "4px" }}>
                        End
                      </label>
                      <input
                        required
                        type="datetime-local"
                        min={form.start_time || nowIso}
                        value={form.end_time}
                        onChange={(e) => setForm((f) => ({ ...f, end_time: e.target.value }))}
                        style={{ border: "none", outline: "none", fontSize: "13px", width: "100%", color: "#111827", background: "transparent" }}
                      />
                    </div>
                  </div>

                  {/* Live cost preview */}
                  {selectedHours > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#374151", marginBottom: "12px", padding: "8px 12px", background: "#f9fafb", borderRadius: "8px" }}>
                      <span>{selectedHours.toFixed(1)} hrs × ${spot.hourly_rate.toFixed(2)}</span>
                      <span style={{ fontWeight: 700 }}>${totalCost.toFixed(2)}</span>
                    </div>
                  )}

                  {/* Vehicle info */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "8px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#6b7280", marginBottom: "4px" }}>Make</label>
                      <input
                        required
                        placeholder="Toyota"
                        value={form.vehicle_make}
                        onChange={(e) => setForm((f) => ({ ...f, vehicle_make: e.target.value }))}
                        style={{ width: "100%", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "8px 10px", fontSize: "13px", outline: "none", boxSizing: "border-box" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#6b7280", marginBottom: "4px" }}>Model</label>
                      <input
                        required
                        placeholder="Camry"
                        value={form.vehicle_model}
                        onChange={(e) => setForm((f) => ({ ...f, vehicle_model: e.target.value }))}
                        style={{ width: "100%", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "8px 10px", fontSize: "13px", outline: "none", boxSizing: "border-box" }}
                      />
                    </div>
                  </div>
                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#6b7280", marginBottom: "4px" }}>License Plate</label>
                    <input
                      required
                      placeholder="ABC-1234"
                      value={form.license_plate}
                      onChange={(e) => setForm((f) => ({ ...f, license_plate: e.target.value }))}
                      style={{ width: "100%", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "8px 10px", fontSize: "13px", outline: "none", boxSizing: "border-box" }}
                    />
                  </div>

                  {bookingError && (
                    <p style={{ fontSize: "13px", color: "#b91c1c", marginBottom: "12px", background: "#fee2e2", padding: "8px 12px", borderRadius: "8px" }}>
                      {bookingError}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={!isAvailable || submitting}
                    style={{
                      width: "100%", padding: "14px",
                      background: isAvailable ? "#2563eb" : "#d1d5db",
                      color: isAvailable ? "white" : "#9ca3af",
                      border: "none", borderRadius: "10px",
                      fontSize: "16px", fontWeight: 700,
                      cursor: isAvailable && !submitting ? "pointer" : "not-allowed",
                      opacity: submitting ? 0.7 : 1,
                      transition: "opacity 0.2s",
                    }}
                  >
                    {!isAvailable ? "Not Available" : submitting ? "Booking..." : "Book"}
                  </button>

                  {isAvailable && (
                    <p style={{ textAlign: "center", fontSize: "12px", color: "#6b7280", marginTop: "10px" }}>
                      You won&apos;t be charged yet
                    </p>
                  )}
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
