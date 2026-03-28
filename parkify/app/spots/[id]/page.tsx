"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ParkingSpot } from "@/app/lib/types";
import Link from "next/link";

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
      <div style={{ padding: "80px 24px", textAlign: "center" }}>
        <div
          style={{
            width: "40px",
            height: "40px",
            border: "3px solid var(--gray-200)",
            borderTopColor: "var(--primary)",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
            margin: "0 auto",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!spot) {
    return (
      <div style={{ padding: "80px 24px", textAlign: "center" }}>
        <h1
          style={{ fontSize: "24px", fontWeight: 700, marginBottom: "12px" }}
        >
          Spot not found
        </h1>
        <Link href="/" style={{ color: "var(--primary)", fontWeight: 600 }}>
          ← Back to listings
        </Link>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "white" }}>
      {/* Header */}
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "20px 24px 0",
        }}
      >
        <button
          onClick={() => router.back()}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: 600,
            color: "var(--gray-700)",
            padding: "8px 0",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          ← Back
        </button>
        <h1
          style={{
            fontSize: "28px",
            fontWeight: 700,
            marginTop: "8px",
            color: "var(--gray-900)",
          }}
        >
          {spot.title}
        </h1>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginTop: "6px",
            fontSize: "14px",
            color: "var(--gray-500)",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="var(--primary)"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            <strong style={{ color: "var(--gray-900)" }}>{spot.rating}</strong>
          </span>
          <span>·</span>
          <span>{spot.review_count} reviews</span>
          <span>·</span>
          <span>
            {spot.city}, {spot.state}
          </span>
        </div>
      </div>

      {/* Image */}
      <div
        style={{
          maxWidth: "1100px",
          margin: "20px auto 0",
          padding: "0 24px",
        }}
      >
        <div
          style={{
            borderRadius: "16px",
            overflow: "hidden",
            height: "400px",
            background: "var(--gray-100)",
          }}
        >
          <img
            src={spot.image_url}
            alt={spot.title}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "32px 24px 80px",
          display: "grid",
          gridTemplateColumns: "1fr 380px",
          gap: "48px",
        }}
      >
        {/* Left column */}
        <div>
          {/* Host & Type */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingBottom: "24px",
              borderBottom: "1px solid var(--gray-200)",
            }}
          >
            <div>
              <h2 style={{ fontSize: "22px", fontWeight: 600 }}>
                {spot.spot_type.charAt(0).toUpperCase() +
                  spot.spot_type.slice(1)}{" "}
                parking hosted by {spot.host_name}
              </h2>
              <p
                style={{
                  color: "var(--gray-500)",
                  marginTop: "4px",
                  fontSize: "14px",
                }}
              >
                {spot.address}, {spot.city}, {spot.state} {spot.zip_code}
              </p>
            </div>
          </div>

          {/* Description */}
          <div
            style={{
              padding: "24px 0",
              borderBottom: "1px solid var(--gray-200)",
            }}
          >
            <h3
              style={{
                fontSize: "18px",
                fontWeight: 600,
                marginBottom: "12px",
              }}
            >
              About this spot
            </h3>
            <p
              style={{
                lineHeight: 1.7,
                color: "var(--gray-700)",
                fontSize: "15px",
              }}
            >
              {spot.description}
            </p>
          </div>

          {/* Amenities */}
          <div style={{ padding: "24px 0" }}>
            <h3
              style={{
                fontSize: "18px",
                fontWeight: 600,
                marginBottom: "16px",
              }}
            >
              Amenities
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
              }}
            >
              {spot.amenities.map((amenity) => (
                <div
                  key={amenity}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    fontSize: "15px",
                    color: "var(--gray-700)",
                  }}
                >
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: "var(--primary)",
                      flexShrink: 0,
                    }}
                  />
                  {amenity}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column - Booking card */}
        <div>
          <div
            style={{
              position: "sticky",
              top: "24px",
              border: "1px solid var(--gray-200)",
              borderRadius: "16px",
              padding: "28px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: "6px",
                marginBottom: "20px",
              }}
            >
              <span style={{ fontSize: "24px", fontWeight: 700 }}>
                ${spot.price_per_hour.toFixed(2)}
              </span>
              <span style={{ color: "var(--gray-500)" }}>/ hour</span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: "6px",
                marginBottom: "24px",
              }}
            >
              <span style={{ fontSize: "18px", fontWeight: 600 }}>
                ${spot.price_per_day.toFixed(2)}
              </span>
              <span style={{ color: "var(--gray-500)", fontSize: "14px" }}>
                / day
              </span>
            </div>

            {/* Date inputs */}
            <div
              style={{
                border: "1px solid var(--gray-300)",
                borderRadius: "12px",
                overflow: "hidden",
                marginBottom: "16px",
              }}
            >
              <div style={{ display: "flex" }}>
                <div
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRight: "1px solid var(--gray-300)",
                  }}
                >
                  <label
                    style={{
                      display: "block",
                      fontSize: "10px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      marginBottom: "4px",
                    }}
                  >
                    Start
                  </label>
                  <input
                    type="date"
                    style={{
                      border: "none",
                      outline: "none",
                      fontSize: "14px",
                      width: "100%",
                    }}
                  />
                </div>
                <div style={{ flex: 1, padding: "12px" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "10px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      marginBottom: "4px",
                    }}
                  >
                    End
                  </label>
                  <input
                    type="date"
                    style={{
                      border: "none",
                      outline: "none",
                      fontSize: "14px",
                      width: "100%",
                    }}
                  />
                </div>
              </div>
            </div>

            <button
              style={{
                width: "100%",
                padding: "14px",
                background:
                  "linear-gradient(to right, var(--primary), var(--primary-dark))",
                color: "white",
                border: "none",
                borderRadius: "12px",
                fontSize: "16px",
                fontWeight: 700,
                cursor: "pointer",
                transition: "opacity 0.2s",
              }}
              onMouseEnter={(e) =>
                ((e.target as HTMLButtonElement).style.opacity = "0.9")
              }
              onMouseLeave={(e) =>
                ((e.target as HTMLButtonElement).style.opacity = "1")
              }
            >
              Reserve this spot
            </button>

            <p
              style={{
                textAlign: "center",
                fontSize: "13px",
                color: "var(--gray-500)",
                marginTop: "12px",
              }}
            >
              You won&apos;t be charged yet
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}