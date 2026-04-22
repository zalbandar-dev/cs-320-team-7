import { ParkingSpot } from "@/app/lib/types";
import SpotCard from "./SpotCard";

interface SpotGridProps {
  spots: ParkingSpot[];
  loading?: boolean;
}

export default function SpotGrid({ spots, loading }: SpotGridProps) {
  if (loading) {
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "24px",
          padding: "24px",
          maxWidth: "1400px",
          margin: "0 auto",
        }}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i}>
            <div
              style={{
                width: "100%",
                paddingBottom: "66%",
                background: "var(--gray-100)",
                borderRadius: "16px",
                animation: "pulse 1.5s infinite",
              }}
            />
            <div
              style={{
                height: "14px",
                width: "60%",
                background: "var(--gray-100)",
                borderRadius: "8px",
                marginTop: "12px",
              }}
            />
            <div
              style={{
                height: "12px",
                width: "80%",
                background: "var(--gray-100)",
                borderRadius: "8px",
                marginTop: "8px",
              }}
            />
          </div>
        ))}
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </div>
    );
  }

  if (spots.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "80px 24px",
          color: "var(--gray-500)",
        }}
      >
        <p style={{ fontSize: "48px", marginBottom: "16px" }}>🅿️</p>
        <h2
          style={{
            fontSize: "20px",
            fontWeight: 600,
            color: "var(--gray-700)",
          }}
        >
          No spots found
        </h2>
        <p style={{ marginTop: "8px" }}>
          Try a different zip code or clear your search.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: "24px",
        padding: "24px",
        maxWidth: "1400px",
        margin: "0 auto",
      }}
    >
      {spots.map((spot) => (
        <SpotCard key={spot.spot_id} spot={spot} />
      ))}
    </div>
  );
}