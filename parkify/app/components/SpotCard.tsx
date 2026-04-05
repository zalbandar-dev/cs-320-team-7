import Link from "next/link";
import { ParkingSpot } from "@/app/lib/types";

function StarRating({ rating }: { rating: number }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="var(--primary)"
        stroke="none"
      >
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
      <span style={{ fontWeight: 600, fontSize: "14px" }}>{rating}</span>
      <span style={{ color: "var(--gray-500)", fontSize: "14px" }}>
        ({rating})
      </span>
    </span>
  );
}

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
  return (
    <Link href={`/spots/${spot.id}`} style={{ textDecoration: "none" }}>
      <div
        style={{
          borderRadius: "16px",
          overflow: "hidden",
          cursor: "pointer",
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.transform =
            "translateY(-4px)";
          (e.currentTarget as HTMLDivElement).style.boxShadow =
            "0 8px 30px rgba(0,0,0,0.12)";
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
            src={spot.image_url}
            alt={spot.title}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
          <SpotTypeBadge type={spot.spot_type} />
        </div>

        {/* Info */}
        <div style={{ padding: "12px 2px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <h3
              style={{
                fontSize: "15px",
                fontWeight: 600,
                color: "var(--gray-900)",
                lineHeight: 1.3,
              }}
            >
              {spot.city}, {spot.state}
            </h3>
            <StarRating rating={spot.rating} />
          </div>

          <p
            style={{
              fontSize: "14px",
              color: "var(--gray-500)",
              marginTop: "2px",
            }}
          >
            {spot.title}
          </p>

          <p
            style={{
              fontSize: "14px",
              color: "var(--gray-500)",
              marginTop: "2px",
            }}
          >
            {spot.address}
          </p>

          <p style={{ marginTop: "6px", fontSize: "15px" }}>
            <span style={{ fontWeight: 600 }}>
              ${spot.price_per_hour.toFixed(2)}
            </span>{" "}
            <span style={{ color: "var(--gray-500)" }}>/ hour</span>
            <span style={{ color: "var(--gray-300)", margin: "0 6px" }}>·</span>
            <span style={{ fontWeight: 600 }}>
              ${spot.price_per_day.toFixed(2)}
            </span>{" "}
            <span style={{ color: "var(--gray-500)" }}>/ day</span>
          </p>
        </div>
      </div>
    </Link>
  );
}