"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ParkingSpot } from "@/app/lib/types";

const PLACEHOLDER_IMAGE = "https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800&q=80";

export default function SpotDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [spot, setSpot] = useState<ParkingSpot | null>(null);
  const [loading, setLoading] = useState(true);

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
  const dailyRate = spot.hourly_rate * 24 * 0.75;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f3f4f6", color: "#111827" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "32px 24px 80px" }}>

        {/* Back button */}
        <button
          type="button"
          onClick={() => router.back()}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: "14px", fontWeight: 600, color: "#2563eb", padding: "0 0 20px", display: "flex", alignItems: "center", gap: "6px" }}
        >
          ← Back to listings
        </button>

        {/* Image */}
        <div style={{ borderRadius: "16px", overflow: "hidden", height: "420px", background: "#e5e7eb" }}>
          <img
            src={PLACEHOLDER_IMAGE}
            alt={spot.spot_type}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>

        {/* Main content */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "32px", marginTop: "28px" }}>

          {/* Left — details */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <span style={{
                padding: "4px 12px", borderRadius: "20px", fontSize: "13px", fontWeight: 600,
                color: statusColor, background: statusBg,
              }}>
                {statusLabel}
              </span>
              <span style={{ fontSize: "13px", color: "#6b7280", background: "#f3f4f6", padding: "4px 12px", borderRadius: "20px", fontWeight: 500 }}>
                {spot.spot_type.charAt(0).toUpperCase() + spot.spot_type.slice(1)}
              </span>
            </div>

            <h1 style={{ fontSize: "26px", fontWeight: 700, margin: "0 0 4px" }}>{spot.address}</h1>
            <p style={{ fontSize: "14px", color: "#6b7280", margin: "0 0 20px" }}>
              {spot.address}, {spot.zip_code}
            </p>

            {spot.description && (
              <p style={{ fontSize: "15px", lineHeight: 1.7, color: "#374151", margin: "0 0 24px" }}>
                {spot.description}
              </p>
            )}
          </div>

          {/* Right — booking card */}
          <div>
            <div style={{
              background: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "16px",
              padding: "24px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.07)",
              position: "sticky",
              top: "24px",
            }}>
              {/* Price */}
              <div style={{ marginBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                  <span style={{ fontSize: "28px", fontWeight: 700, color: "#111827" }}>
                    ${spot.hourly_rate.toFixed(2)}
                  </span>
                  <span style={{ color: "#6b7280", fontSize: "14px" }}>/ hour</span>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginTop: "4px" }}>
                  <span style={{ fontSize: "18px", fontWeight: 600, color: "#111827" }}>
                    ${dailyRate.toFixed(2)}
                  </span>
                  <span style={{ color: "#6b7280", fontSize: "14px" }}>/ day</span>
                </div>
              </div>

              {/* Availability */}
              <div style={{
                display: "flex", alignItems: "center", gap: "8px",
                padding: "10px 14px", borderRadius: "10px",
                background: statusBg, marginBottom: "20px",
              }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: statusColor, flexShrink: 0 }} />
                <span style={{ fontSize: "14px", fontWeight: 600, color: statusColor }}>
                  {statusLabel}
                </span>
              </div>

              {/* Date pickers */}
              <div style={{ border: "1px solid #e5e7eb", borderRadius: "10px", overflow: "hidden", marginBottom: "16px" }}>
                <div style={{ display: "flex" }}>
                  <div style={{ flex: 1, padding: "10px 12px", borderRight: "1px solid #e5e7eb" }}>
                    <label style={{ display: "block", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "#6b7280", marginBottom: "4px" }}>
                      Start
                    </label>
                    <input type="date" title="Start date" style={{ border: "none", outline: "none", fontSize: "13px", width: "100%", color: "#111827", background: "transparent" }} />
                  </div>
                  <div style={{ flex: 1, padding: "10px 12px" }}>
                    <label style={{ display: "block", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "#6b7280", marginBottom: "4px" }}>
                      End
                    </label>
                    <input type="date" title="End date" style={{ border: "none", outline: "none", fontSize: "13px", width: "100%", color: "#111827", background: "transparent" }} />
                  </div>
                </div>
              </div>

              {/* Book button */}
              <button
                type="button"
                disabled={!isAvailable}
                style={{
                  width: "100%",
                  padding: "14px",
                  background: isAvailable ? "#2563eb" : "#d1d5db",
                  color: isAvailable ? "white" : "#9ca3af",
                  border: "none",
                  borderRadius: "10px",
                  fontSize: "16px",
                  fontWeight: 700,
                  cursor: isAvailable ? "pointer" : "not-allowed",
                  transition: "opacity 0.2s",
                }}
              >
                {isAvailable ? "Book" : "Not Available"}
              </button>

              {isAvailable && (
                <p style={{ textAlign: "center", fontSize: "12px", color: "#6b7280", marginTop: "10px" }}>
                  You won&apos;t be charged yet
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
