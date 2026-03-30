"use client";

import { useState } from "react";
import Link from "next/link";

interface NavbarProps {
  onSearch?: (zip: string) => void;
}

export default function Navbar({ onSearch }: NavbarProps) {
  const [zipInput, setZipInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(zipInput.trim());
  };

  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "white",
        borderBottom: "1px solid var(--gray-200)",
        padding: "16px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "16px",
      }}
    >
      <Link
        href="/"
        style={{
          fontSize: "24px",
          fontWeight: 800,
          color: "var(--primary)",
          letterSpacing: "-0.5px",
          flexShrink: 0,
        }}
      >
        🅿️ ParkSpot
      </Link>

      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          alignItems: "center",
          border: "1px solid var(--gray-300)",
          borderRadius: "40px",
          overflow: "hidden",
          maxWidth: "420px",
          width: "100%",
          boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
        }}
      >
        <input
          type="text"
          placeholder="Search by zip code..."
          value={zipInput}
          onChange={(e) => setZipInput(e.target.value)}
          style={{
            flex: 1,
            padding: "10px 20px",
            border: "none",
            outline: "none",
            fontSize: "14px",
            color: "#2563eb",
            background: "white",
          }}
        />
        <button
          type="submit"
          style={{
            background: "var(--primary)",
            color: "white",
            border: "none",
            padding: "10px 18px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: 600,
          }}
        >
          Search
        </button>
      </form>

      <div style={{ width: "120px", flexShrink: 0 }} />
    </nav>
  );
}