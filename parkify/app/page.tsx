"use client";

import { useState, useEffect } from "react";
import Navbar from "@/app/components/Navbar";
import SpotGrid from "@/app/components/SpotGrid";
import { ParkingSpot } from "@/app/lib/types";

export default function Home() {
  const [spots, setSpots] = useState<ParkingSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeZip, setActiveZip] = useState<string>("");

  const fetchSpots = async (zip?: string) => {
    setLoading(true);
    try {
      const url =
        zip && zip.length > 0
          ? `/api/listSpotsByZip?zip=${zip}`
          : `/api/listAvailableSpots`;
      const res = await fetch(url);
      const data = await res.json();
      setSpots(Array.isArray(data) ? data : []);
    } catch {
      setSpots([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpots();
  }, []);

  const handleSearch = (zip: string) => {
    setActiveZip(zip);
    fetchSpots(zip);
  };

  return (
    <div style={{ minHeight: "100vh" }}>
      <Navbar onSearch={handleSearch} />

      {/* Active filter chip */}
      {activeZip && (
        <div
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            padding: "16px 24px 0",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span
            style={{
              background: "var(--gray-100)",
              padding: "6px 14px",
              borderRadius: "20px",
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            Zip: {activeZip}
            <button
              onClick={() => handleSearch("")}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "16px",
                lineHeight: 1,
                color: "var(--gray-500)",
              }}
            >
              ✕
            </button>
          </span>
        </div>
      )}

      <SpotGrid spots={spots} loading={loading} />
    </div>
  );
}