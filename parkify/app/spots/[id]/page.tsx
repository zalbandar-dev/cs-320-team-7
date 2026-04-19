"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ParkingSpot } from "@/app/lib/types";
import { getAuthHeaders } from "@/app/lib/auth";

const PLACEHOLDER_IMAGE = "https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800&q=80";

function toLocalDatetimeValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function SpotDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [spot, setSpot] = useState<ParkingSpot | null>(null);
  const [loading, setLoading] = useState(true);

  // Booking form state
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [vehicleMake, setVehicleMake] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Minimum selectable datetime = right now (updated each render is fine, pickers read it on open)
  const nowMin = toLocalDatetimeValue(new Date());

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

    // Default start = now rounded up to next hour, end = +2h
    const now = new Date();
    now.setMinutes(0, 0, 0);
    now.setHours(now.getHours() + 1);
    const end = new Date(now);
    end.setHours(end.getHours() + 2);
    setStartTime(toLocalDatetimeValue(now));
    setEndTime(toLocalDatetimeValue(end));
  }, [params.id]);

  function handleStartChange(value: string) {
    setStartTime(value);
    // If end is now before or equal to new start, push end to start + 2h
    if (value && endTime && new Date(endTime) <= new Date(value)) {
      const newEnd = new Date(value);
      newEnd.setHours(newEnd.getHours() + 2);
      setEndTime(toLocalDatetimeValue(newEnd));
    }
  }

  const hours =
    startTime && endTime
      ? Math.max(0, (new Date(endTime).getTime() - new Date(startTime).getTime()) / (1000 * 60 * 60))
      : 0;
  const estimatedPrice = spot ? parseFloat((hours * spot.hourly_rate).toFixed(2)) : 0;

  async function handleBook() {
    setBookingError("");
    if (!startTime || !endTime) return setBookingError("Please select start and end times.");
    if (!vehicleMake.trim() || !vehicleModel.trim() || !licensePlate.trim())
      return setBookingError("Please fill in all vehicle details.");
    if (new Date(startTime) < new Date())
      return setBookingError("Start time must be in the future.");
    if (new Date(endTime) <= new Date(startTime))
      return setBookingError("End time must be after start time.");
    const durationHours = (new Date(endTime).getTime() - new Date(startTime).getTime()) / (1000 * 60 * 60);
    if (durationHours < 0.5)
      return setBookingError("Minimum booking duration is 30 minutes.");
    if (durationHours > 30 * 24)
      return setBookingError("Maximum booking duration is 30 days.");

    setBooking(true);
    try {
      const res = await fetch("/api/createBooking", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          spot_id: spot!.spot_id,
          start_time: new Date(startTime).toISOString(),
          end_time: new Date(endTime).toISOString(),
          vehicle_make: vehicleMake.trim(),
          vehicle_model: vehicleModel.trim(),
          license_plate: licensePlate.trim().toUpperCase(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setBookingError(data.error ?? "Failed to create booking.");
      } else {
        setBookingSuccess(true);
      }
    } catch {
      setBookingError("Network error. Please try again.");
    } finally {
      setBooking(false);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "40px", height: "40px", border: "3px solid #e5e7eb", borderTopColor: "#2563eb", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
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

  if (bookingSuccess) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#f3f4f6", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px", padding: "24px" }}>
        <div style={{ background: "white", borderRadius: "20px", padding: "48px 40px", maxWidth: "460px", width: "100%", textAlign: "center", boxShadow: "0 8px 32px rgba(0,0,0,0.08)" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <span style={{ fontSize: "32px" }}>✓</span>
          </div>
          <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#111827", margin: "0 0 8px" }}>Booking Confirmed!</h2>
          <p style={{ fontSize: "14px", color: "#6b7280", margin: "0 0 8px" }}>{spot.address}</p>
          <p style={{ fontSize: "14px", color: "#6b7280", margin: "0 0 24px" }}>
            {new Date(startTime).toLocaleString()} → {new Date(endTime).toLocaleString()}
          </p>
          <p style={{ fontSize: "24px", fontWeight: 700, color: "#15803d", margin: "0 0 32px" }}>${estimatedPrice.toFixed(2)} total</p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
            <button
              type="button"
              onClick={() => router.push("/bookings")}
              style={{ padding: "12px 24px", background: "#2563eb", color: "white", border: "none", borderRadius: "10px", fontWeight: 700, cursor: "pointer", fontSize: "14px" }}
            >
              View My Bookings
            </button>
            <button
              type="button"
              onClick={() => router.push("/homepage")}
              style={{ padding: "12px 24px", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: "10px", fontWeight: 700, cursor: "pointer", fontSize: "14px" }}
            >
              Browse More
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isAvailable = spot.available;
  const statusColor = isAvailable ? "#15803d" : "#b91c1c";
  const statusBg = isAvailable ? "#dcfce7" : "#fee2e2";

  const inputStyle: React.CSSProperties = {
    width: "100%",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    padding: "9px 12px",
    fontSize: "13px",
    outline: "none",
    color: "#111827",
    background: "white",
    boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "10px",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    color: "#6b7280",
    marginBottom: "4px",
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f3f4f6", color: "#111827" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "32px 24px 80px" }}>

        <button
          type="button"
          onClick={() => router.back()}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: "14px", fontWeight: 600, color: "#2563eb", padding: "0 0 20px", display: "flex", alignItems: "center", gap: "6px" }}
        >
          ← Back to listings
        </button>

        <div style={{ borderRadius: "16px", overflow: "hidden", height: "420px", background: "#e5e7eb" }}>
          <img src={PLACEHOLDER_IMAGE} alt={spot.spot_type} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "32px", marginTop: "28px" }}>

          {/* Left — details */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <span style={{ padding: "4px 12px", borderRadius: "20px", fontSize: "13px", fontWeight: 600, color: statusColor, background: statusBg }}>
                {isAvailable ? "Available" : "Unavailable"}
              </span>
              <span style={{ fontSize: "13px", color: "#6b7280", background: "#f3f4f6", padding: "4px 12px", borderRadius: "20px", fontWeight: 500 }}>
                {spot.spot_type.charAt(0).toUpperCase() + spot.spot_type.slice(1)}
              </span>
            </div>
            <h1 style={{ fontSize: "26px", fontWeight: 700, margin: "0 0 4px" }}>{spot.address}</h1>
            <p style={{ fontSize: "14px", color: "#6b7280", margin: "0 0 20px" }}>{spot.address}, {spot.zip_code}</p>
            {spot.description && (
              <p style={{ fontSize: "15px", lineHeight: 1.7, color: "#374151", margin: "0 0 24px" }}>{spot.description}</p>
            )}
          </div>

          {/* Right — booking card */}
          <div>
            <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "16px", padding: "24px", boxShadow: "0 4px 16px rgba(0,0,0,0.07)", position: "sticky", top: "24px" }}>

              {/* Price */}
              <div style={{ marginBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                  <span style={{ fontSize: "28px", fontWeight: 700, color: "#111827" }}>${spot.hourly_rate.toFixed(2)}</span>
                  <span style={{ color: "#6b7280", fontSize: "14px" }}>/ hour</span>
                </div>
              </div>

              {/* Availability badge */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px", borderRadius: "10px", background: statusBg, marginBottom: "20px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: statusColor, flexShrink: 0 }} />
                <span style={{ fontSize: "14px", fontWeight: 600, color: statusColor }}>{isAvailable ? "Available" : "Not Available"}</span>
              </div>

              {isAvailable && (
                <>
                  {/* Date/time pickers */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "14px" }}>
                    <div>
                      <label style={labelStyle}>Start</label>
                      <input
                        type="datetime-local"
                        value={startTime}
                        min={nowMin}
                        onChange={e => handleStartChange(e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>End</label>
                      <input
                        type="datetime-local"
                        value={endTime}
                        min={startTime || nowMin}
                        onChange={e => setEndTime(e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  {/* Price estimate */}
                  {hours > 0 && (
                    <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: "8px", padding: "10px 14px", marginBottom: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "13px", color: "#0369a1" }}>{hours.toFixed(1)} hrs × ${spot.hourly_rate.toFixed(2)}</span>
                      <span style={{ fontSize: "15px", fontWeight: 700, color: "#0369a1" }}>${estimatedPrice.toFixed(2)}</span>
                    </div>
                  )}

                  {/* Vehicle details */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "14px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                      <div>
                        <label style={labelStyle}>Make</label>
                        <input
                          type="text"
                          placeholder="Toyota"
                          value={vehicleMake}
                          onChange={e => setVehicleMake(e.target.value)}
                          style={inputStyle}
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>Model</label>
                        <input
                          type="text"
                          placeholder="Camry"
                          value={vehicleModel}
                          onChange={e => setVehicleModel(e.target.value)}
                          style={inputStyle}
                        />
                      </div>
                    </div>
                    <div>
                      <label style={labelStyle}>License Plate</label>
                      <input
                        type="text"
                        placeholder="ABC-1234"
                        value={licensePlate}
                        onChange={e => setLicensePlate(e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  {/* Error */}
                  {bookingError && (
                    <div style={{ background: "#fee2e2", color: "#b91c1c", fontSize: "13px", borderRadius: "8px", padding: "10px 12px", marginBottom: "12px" }}>
                      {bookingError}
                    </div>
                  )}

                  {/* Book button */}
                  <button
                    type="button"
                    onClick={handleBook}
                    disabled={booking}
                    style={{
                      width: "100%",
                      padding: "14px",
                      background: booking ? "#93c5fd" : "#2563eb",
                      color: "white",
                      border: "none",
                      borderRadius: "10px",
                      fontSize: "16px",
                      fontWeight: 700,
                      cursor: booking ? "not-allowed" : "pointer",
                      transition: "opacity 0.2s",
                    }}
                  >
                    {booking ? "Booking…" : "Book Now"}
                  </button>
                  <p style={{ textAlign: "center", fontSize: "12px", color: "#6b7280", marginTop: "10px" }}>
                    You won&apos;t be charged yet
                  </p>
                </>
              )}

              {!isAvailable && (
                <button
                  type="button"
                  disabled
                  style={{ width: "100%", padding: "14px", background: "#d1d5db", color: "#9ca3af", border: "none", borderRadius: "10px", fontSize: "16px", fontWeight: 700, cursor: "not-allowed" }}
                >
                  Not Available
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
