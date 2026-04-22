import Link from "next/link";
import { ParkingSpot } from "@/app/lib/types";

const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800&q=80";

const DAILY_DISCOUNT = 0.75;

function SpotTypeBadge({ type }: { type: string }) {
  const label = type.charAt(0).toUpperCase() + type.slice(1);
  return (
    <span
      style={{
        position: "absolute",
        top: "12px",
        left: "12px",
        background: "rgba(0,0,0,0.65)",
        color: "white",
        padding: "4px 10px",
        borderRadius: "6px",
        fontSize: "12px",
        fontWeight: 600,
        backdropFilter: "blur(4px)",
      }}
    >
      {label}
    </span>
  );
}

export default function SpotCard({ spot }: { spot: ParkingSpot }) {
  const imgSrc = spot.image?.trim() || PLACEHOLDER_IMAGE;
  const pricePerDay = parseFloat((spot.hourly_rate * 24 * DAILY_DISCOUNT).toFixed(2));

  return (
    <Link href={`/spots/${spot.spot_id}`} style={{ textDecoration: "none" }}>
      <div
        style={{
          borderRadius: "16px",
          overflow: "hidden",
          cursor: "pointer",
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)";
          (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 30px rgba(0,0,0,0.12)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
          (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
        }}
      >
        {/* Image */}
        <div
          style={{
            position: "relative",
            width: "100%",
            paddingBottom: "66%",
            background: "var(--gray-100)",
            overflow: "hidden",
            borderRadius: "16px",
          }}
        >
          <img
            src={imgSrc}
            alt={spot.spot_type}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
            onError={(e) => {
              (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE;
            }}
          />
          <SpotTypeBadge type={spot.spot_type} />
        </div>

        {/* Info */}
        <div style={{ padding: "12px 2px" }}>
          <h3
            style={{
              fontSize: "15px",
              fontWeight: 600,
              color: "var(--gray-900)",
              lineHeight: 1.3,
              margin: "0 0 2px",
            }}
          >
            {spot.address}
          </h3>

          <p style={{ fontSize: "13px", color: "var(--gray-500)", marginTop: "2px" }}>
            {spot.zip_code} · {spot.spot_type}
          </p>

          <p style={{ marginTop: "6px", fontSize: "15px" }}>
            <span style={{ fontWeight: 600 }}>${spot.hourly_rate.toFixed(2)}</span>{" "}
            <span style={{ color: "var(--gray-500)" }}>/ hour</span>
            <span style={{ color: "var(--gray-300)", margin: "0 6px" }}>·</span>
            <span style={{ fontWeight: 600 }}>${pricePerDay.toFixed(2)}</span>{" "}
            <span style={{ color: "var(--gray-500)" }}>/ day</span>
          </p>
        </div>
      </div>
    </Link>
  );
}
