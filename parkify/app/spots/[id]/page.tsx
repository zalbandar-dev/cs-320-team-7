"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ParkingSpot } from "@/app/lib/types";

const STATUS_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  available:  { label: "Available",  color: "#15803d", bg: "#dcfce7" },
  occupied:   { label: "Occupied",   color: "#b91c1c", bg: "#fee2e2" },
  reserved:   { label: "Reserved",   color: "#b45309", bg: "#fef3c7" },
};

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

  const status = STATUS_STYLES[spot.status] ?? STATUS_STYLES.available;

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
            src={spot.image_url}
            alt={spot.title}
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
                color: status.color, background: status.bg,
              }}>
                {status.label}
              </span>
              <span style={{ fontSize: "13px", color: "#6b7280", background: "#f3f4f6", padding: "4px 12px", borderRadius: "20px", fontWeight: 500 }}>
                {spot.spot_type.charAt(0).toUpperCase() + spot.spot_type.slice(1)}
              </span>
            </div>

            <h1 style={{ fontSize: "26px", fontWeight: 700, margin: "0 0 4px" }}>{spot.title}</h1>
            <p style={{ fontSize: "14px", color: "#6b7280", margin: "0 0 4px" }}>
              {spot.address}, {spot.city}, {spot.state} {spot.zip_code}
            </p>
            <p style={{ fontSize: "14px", color: "#6b7280", margin: "0 0 20px" }}>
              Hosted by <strong style={{ color: "#111827" }}>{spot.host_name}</strong>
              &nbsp;·&nbsp;
              <span style={{ color: "#f59e0b" }}>★</span> {spot.rating} ({spot.review_count} reviews)
            </p>

            <p style={{ fontSize: "15px", lineHeight: 1.7, color: "#374151", margin: "0 0 24px" }}>
              {spot.description}
            </p>

            {spot.amenities.length > 0 && (
              <>
                <h3 style={{ fontSize: "16px", fontWeight: 600, margin: "0 0 12px" }}>Amenities</h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {spot.amenities.map((a) => (
                    <span key={a} style={{ padding: "5px 12px", background: "white", border: "1px solid #e5e7eb", borderRadius: "20px", fontSize: "13px", color: "#374151" }}>
                      {a}
                    </span>
                  ))}
                </div>
              </>
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
                    ${spot.price_per_hour.toFixed(2)}
                  </span>
                  <span style={{ color: "#6b7280", fontSize: "14px" }}>/ hour</span>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginTop: "4px" }}>
                  <span style={{ fontSize: "18px", fontWeight: 600, color: "#111827" }}>
                    ${spot.price_per_day.toFixed(2)}
                  </span>
                  <span style={{ color: "#6b7280", fontSize: "14px" }}>/ day</span>
                </div>
              </div>

              {/* Availability */}
              <div style={{
                display: "flex", alignItems: "center", gap: "8px",
                padding: "10px 14px", borderRadius: "10px",
                background: status.bg, marginBottom: "20px",
              }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: status.color, flexShrink: 0 }} />
                <span style={{ fontSize: "14px", fontWeight: 600, color: status.color }}>
                  {status.label}
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
                disabled={spot.status !== "available"}
                style={{
                  width: "100%",
                  padding: "14px",
                  background: spot.status === "available" ? "#2563eb" : "#d1d5db",
                  color: spot.status === "available" ? "white" : "#9ca3af",
                  border: "none",
                  borderRadius: "10px",
                  fontSize: "16px",
                  fontWeight: 700,
                  cursor: spot.status === "available" ? "pointer" : "not-allowed",
                  transition: "opacity 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (spot.status === "available")
                    (e.currentTarget as HTMLButtonElement).style.opacity = "0.88";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.opacity = "1";
                }}
              >
                {spot.status === "available" ? "Book" : "Not Available"}
              </button>

              {spot.status === "available" && (
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
