"use client";

import { useState, useRef, useEffect } from "react";

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const menuItems = [
    { label: "Create Spot", onClick: () => {} },
    { label: "Option 2", onClick: () => {} },
    { label: "Option 3", onClick: () => {} },
  ];

  return (
    <aside style={{
      width: "220px",
      flexShrink: 0,
      borderRight: "1px solid #e5e7eb",
      background: "white",
      minHeight: "calc(100vh - 65px)",
      padding: "16px 12px",
      display: "flex",
      flexDirection: "column",
      gap: "8px",
    }}>
      {/* Dropdown menu button */}
      <div ref={dropdownRef} style={{ position: "relative" }}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "8px",
            width: "100%",
            padding: "10px 14px",
            background: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <span>Menu</span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            style={{
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease",
            }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {open && (
          <div style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            width: "100%",
            background: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
            zIndex: 100,
            overflow: "hidden",
          }}>
            {menuItems.map((item) => (
              <button
                type="button"
                key={item.label}
                onClick={() => { item.onClick(); setOpen(false); }}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "10px 14px",
                  background: "none",
                  border: "none",
                  textAlign: "left",
                  fontSize: "14px",
                  color: "#2563eb",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.background = "#f3f4f6")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.background = "none")
                }
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* My Listings button */}
      <button
        type="button"
        style={{
          width: "100%",
          padding: "10px 14px",
          background: "none",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          fontSize: "14px",
          fontWeight: 600,
          color: "#2563eb",
          cursor: "pointer",
          textAlign: "left",
        }}
        onMouseEnter={(e) =>
          ((e.currentTarget as HTMLButtonElement).style.background = "#f3f4f6")
        }
        onMouseLeave={(e) =>
          ((e.currentTarget as HTMLButtonElement).style.background = "none")
        }
      >
        My Listings
      </button>
    </aside>
  );
}
