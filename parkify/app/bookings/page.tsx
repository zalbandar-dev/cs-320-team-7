"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Booking } from "@/app/lib/types";
import { getAuthHeaders } from "@/app/lib/auth";
import Sidebar from "@/app/components/Sidebar";
import Navbar from "@/app/components/Navbar";
import Toast from "@/app/components/Toast";

type Tab = "current" | "past";

const STATUS_STYLES: Record<string, { color: string; bg: string; label: string }> = {
  pending_provider: { color: "#92400e", bg: "#fef3c7", label: "Pending Approval" },
  active:           { color: "#15803d", bg: "#dcfce7", label: "Confirmed" },
  completed:        { color: "#1d4ed8", bg: "#dbeafe", label: "Completed" },
  cancelled:        { color: "#b91c1c", bg: "#fee2e2", label: "Cancelled" },
  expired:          { color: "#6b7280", bg: "#f3f4f6", label: "Expired" },
};

function formatDateRange(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  const dateOpts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" };
  const timeOpts: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit" };
  if (s.toDateString() === e.toDateString()) {
    return `${s.toLocaleDateString(undefined, dateOpts)}, ${s.toLocaleTimeString(undefined, timeOpts)} – ${e.toLocaleTimeString(undefined, timeOpts)}`;
  }
  return `${s.toLocaleDateString(undefined, dateOpts)} ${s.toLocaleTimeString(undefined, timeOpts)} – ${e.toLocaleDateString(undefined, dateOpts)} ${e.toLocaleTimeString(undefined, timeOpts)}`;
}

function isPast(booking: Booking): boolean {
  const now = new Date();
  const end = new Date(booking.end_time);
  return end < now || booking.status === "completed" || booking.status === "cancelled";
}

/* ───────── Star Rating Component ───────── */
function StarRating({
  value,
  onChange,
  readonly = false,
  size = 32,
}: {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
  size?: number;
}) {
  const [hover, setHover] = useState(0);

  return (
    <div style={{ display: "flex", gap: "4px" }}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= (hover || value);
        return (
          <button
            key={star}
            type="button"
            onClick={() => !readonly && onChange?.(star)}
            onMouseEnter={() => !readonly && setHover(star)}
            onMouseLeave={() => !readonly && setHover(0)}
            style={{
              background: "none",
              border: "none",
              cursor: readonly ? "default" : "pointer",
              padding: 0,
              fontSize: `${size}px`,
              lineHeight: 1,
              color: filled ? "#f59e0b" : "#d1d5db",
              transition: "color 0.15s, transform 0.15s",
              transform: !readonly && hover === star ? "scale(1.2)" : "scale(1)",
            }}
            aria-label={`${star} star${star > 1 ? "s" : ""}`}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}

/* ───────── Review Modal ───────── */
function ReviewModal({
  booking,
  onClose,
  onSubmitted,
}: {
  booking: Booking;
  onClose: () => void;
  onSubmitted: (spotId: number) => void;
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (rating === 0) {
      setError("Please select a rating.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/submitReview", {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          spot_id: booking.spot_id,
          booking_id: booking.booking_id,
          rating,
          comment: comment.trim() || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        onSubmitted(booking.spot_id);
        onClose();
      } else {
        setError(data.error ?? "Failed to submit review.");
      }
    } catch {
      setError("Network error. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "16px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "white",
          borderRadius: "20px",
          padding: "32px",
          width: "100%",
          maxWidth: "440px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
          animation: "modalIn 0.25s ease-out",
        }}
      >
        <style>{`
          @keyframes modalIn {
            from { opacity: 0; transform: scale(0.95) translateY(10px); }
            to   { opacity: 1; transform: scale(1) translateY(0); }
          }
        `}</style>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>
              Leave a Review
            </h2>
            <p style={{ fontSize: "13px", color: "#6b7280", margin: 0 }}>
              {booking.parking_spots?.address ?? `Spot #${booking.spot_id}`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "#f3f4f6",
              border: "none",
              borderRadius: "50%",
              width: "32px",
              height: "32px",
              fontSize: "18px",
              cursor: "pointer",
              color: "#6b7280",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>

        {/* Stars */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <p style={{ fontSize: "13px", fontWeight: 600, color: "#374151", margin: "0 0 12px" }}>
            How was your experience?
          </p>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <StarRating value={rating} onChange={setRating} size={40} />
          </div>
          {rating > 0 && (
            <p style={{ fontSize: "12px", color: "#6b7280", margin: "8px 0 0" }}>
              {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][rating]}
            </p>
          )}
        </div>

        {/* Comment */}
        <textarea
          placeholder="Share more details about your experience (optional)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          style={{
            width: "100%",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            padding: "12px 14px",
            fontSize: "14px",
            resize: "vertical",
            outline: "none",
            fontFamily: "inherit",
            marginBottom: "16px",
            boxSizing: "border-box",
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "#2563eb")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")}
        />

        {/* Error */}
        {error && (
          <div style={{ background: "#fee2e2", color: "#b91c1c", borderRadius: "10px", padding: "10px 14px", marginBottom: "14px", fontSize: "13px" }}>
            {error}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1,
              padding: "11px",
              background: "white",
              color: "#374151",
              border: "1px solid #e5e7eb",
              borderRadius: "10px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || rating === 0}
            style={{
              flex: 1,
              padding: "11px",
              background: submitting || rating === 0 ? "#93c5fd" : "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "10px",
              fontSize: "14px",
              fontWeight: 700,
              cursor: submitting || rating === 0 ? "not-allowed" : "pointer",
              transition: "background 0.2s",
            }}
          >
            {submitting ? "Submitting…" : "Submit Review"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ───────── Main Page ───────── */
export default function BookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("current");
  const [reviewedSpots, setReviewedSpots] = useState<Set<number>>(new Set());
  const [reviewModal, setReviewModal] = useState<Booking | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  async function fetchBookings() {
    try {
      const res = await fetch("/api/myBookings", { headers: getAuthHeaders() });
      if (res.status === 401) { router.push("/login"); return; }
      const data = await res.json();
      if (data.success) {
        setBookings(data.data);
        // Check review status for past bookings
        const pastBookings = (data.data as Booking[]).filter(isPast);
        const uniqueSpotIds = [...new Set(pastBookings.map((b) => b.spot_id))];
        await checkReviewedSpots(uniqueSpotIds);
      }
    } catch {
      setError("Failed to load bookings.");
    } finally {
      setLoading(false);
    }
  }

  async function checkReviewedSpots(spotIds: number[]) {
    const reviewed = new Set<number>();
    await Promise.all(
      spotIds.map(async (spotId) => {
        try {
          const res = await fetch(`/api/checkReview?spot_id=${spotId}`, {
            headers: getAuthHeaders(),
          });
          const data = await res.json();
          if (data.success && data.hasReviewed) {
            reviewed.add(spotId);
          }
        } catch {
          // silently ignore
        }
      })
    );
    setReviewedSpots(reviewed);
  }

  async function handleCancel(bookingId: number) {
    setCancelling(bookingId);
    try {
      const res = await fetch(`/api/cancelBooking/${bookingId}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setBookings((prev) =>
          prev.map((b) =>
            b.booking_id === bookingId ? { ...b, status: "cancelled" } : b
          )
        );
        setToast("Booking cancelled successfully.");
      } else {
        setError(data.error ?? "Failed to cancel.");
      }
    } catch {
      setError("Network error. Try again.");
    } finally {
      setCancelling(null);
    }
  }

  function handleReviewSubmitted(spotId: number) {
    setReviewedSpots((prev) => new Set(prev).add(spotId));
  }

  const currentBookings = bookings.filter((b) => !isPast(b));
  const pastBookings = bookings.filter(isPast);
  const displayedBookings = tab === "current" ? currentBookings : pastBookings;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f3f4f6" }}>
      <Navbar />
      <Sidebar />
      <main style={{ marginLeft: "256px", paddingTop: "72px" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto", padding: "32px 24px 80px" }}>

          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>
            My Bookings
          </h1>
          <p style={{ fontSize: "14px", color: "#6b7280", margin: "0 0 24px" }}>
            Manage your parking reservations
          </p>

          {/* ── Tabs ── */}
          <div
            style={{
              display: "flex",
              gap: "0",
              marginBottom: "24px",
              background: "#e5e7eb",
              borderRadius: "12px",
              padding: "4px",
              width: "fit-content",
            }}
          >
            {(["current", "past"] as Tab[]).map((t) => {
              const active = tab === t;
              const count = t === "current" ? currentBookings.length : pastBookings.length;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  style={{
                    padding: "9px 24px",
                    borderRadius: "9px",
                    border: "none",
                    fontSize: "14px",
                    fontWeight: active ? 700 : 500,
                    color: active ? "#111827" : "#6b7280",
                    background: active ? "white" : "transparent",
                    cursor: "pointer",
                    boxShadow: active ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                    transition: "all 0.2s",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  {t === "current" ? "Current" : "Past"}
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      background: active ? "#2563eb" : "#d1d5db",
                      color: active ? "white" : "#6b7280",
                      padding: "1px 8px",
                      borderRadius: "20px",
                      minWidth: "20px",
                      textAlign: "center",
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ── Error ── */}
          {error && (
            <div
              style={{
                background: "#fee2e2",
                color: "#b91c1c",
                borderRadius: "10px",
                padding: "12px 16px",
                marginBottom: "16px",
                fontSize: "14px",
              }}
            >
              {error}
            </div>
          )}

          {/* ── Loading Skeletons ── */}
          {loading && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    background: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "14px",
                    padding: "20px 24px",
                    animation: "pulse 1.5s ease-in-out infinite",
                  }}
                >
                  <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }`}</style>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
                    <div>
                      <div style={{ height: "18px", width: "200px", background: "#e5e7eb", borderRadius: "6px", marginBottom: "8px" }} />
                      <div style={{ height: "13px", width: "120px", background: "#e5e7eb", borderRadius: "6px" }} />
                    </div>
                    <div style={{ height: "26px", width: "90px", background: "#e5e7eb", borderRadius: "20px" }} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", padding: "14px 0", borderTop: "1px solid #f3f4f6" }}>
                    {[1, 2, 3].map((j) => (
                      <div key={j}>
                        <div style={{ height: "10px", width: "40px", background: "#e5e7eb", borderRadius: "4px", marginBottom: "6px" }} />
                        <div style={{ height: "13px", width: "80px", background: "#e5e7eb", borderRadius: "4px" }} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Empty State ── */}
          {!loading && displayedBookings.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "60px 24px",
                background: "white",
                borderRadius: "16px",
                border: "1px solid #e5e7eb",
              }}
            >
              <p style={{ fontSize: "18px", fontWeight: 600, color: "#111827", margin: "0 0 8px" }}>
                {tab === "current" ? "No upcoming bookings" : "No past bookings"}
              </p>
              <p style={{ fontSize: "14px", color: "#6b7280", margin: "0 0 24px" }}>
                {tab === "current"
                  ? "Find a spot and make your first booking."
                  : "Your completed and expired bookings will appear here."}
              </p>
              {tab === "current" && (
                <button
                  type="button"
                  onClick={() => router.push("/homepage")}
                  style={{
                    padding: "10px 24px",
                    background: "#2563eb",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  Browse Spots
                </button>
              )}
            </div>
          )}

          {/* ── Booking Cards ── */}
          {!loading && displayedBookings.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {displayedBookings.map((b) => {
                const spot = b.parking_spots;
                const bookingIsPast = isPast(b);

                // Determine display status — if active but end_time has passed, show "Expired"
                let displayStatus = b.status;
                if (
                  b.status === "active" &&
                  new Date(b.end_time) < new Date()
                ) {
                  displayStatus = "expired";
                }
                const style = STATUS_STYLES[displayStatus] ?? STATUS_STYLES.active;

                const hours =
                  (new Date(b.end_time).getTime() -
                    new Date(b.start_time).getTime()) /
                  (1000 * 60 * 60);

                const alreadyReviewed = reviewedSpots.has(b.spot_id);

                return (
                  <div
                    key={b.booking_id}
                    style={{
                      background: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "14px",
                      padding: "20px 24px",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                    }}
                  >
                    {/* Top Row */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: "12px",
                      }}
                    >
                      <div>
                        <p
                          style={{
                            fontSize: "16px",
                            fontWeight: 700,
                            color: "#111827",
                            margin: "0 0 2px",
                          }}
                        >
                          {spot?.address ?? `Spot #${b.spot_id}`}
                        </p>
                        {spot?.zip_code && (
                          <p
                            style={{
                              fontSize: "13px",
                              color: "#6b7280",
                              margin: "0 0 4px",
                            }}
                          >
                            {spot.zip_code} · {spot.spot_type}
                          </p>
                        )}
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                          <span
                            style={{
                              fontSize: "11px",
                              fontFamily: "monospace",
                              background: "#f3f4f6",
                              color: "#374151",
                              padding: "2px 8px",
                              borderRadius: "6px",
                              border: "1px solid #e5e7eb",
                            }}
                          >
                            Booking ID: {b.booking_id}
                          </span>
                          <span
                            style={{
                              fontSize: "11px",
                              fontFamily: "monospace",
                              background: "#f3f4f6",
                              color: "#374151",
                              padding: "2px 8px",
                              borderRadius: "6px",
                              border: "1px solid #e5e7eb",
                            }}
                          >
                            Spot ID: {b.spot_id}
                          </span>
                        </div>
                      </div>
                      <span
                        style={{
                          padding: "4px 12px",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: 700,
                          color: style.color,
                          background: style.bg,
                          flexShrink: 0,
                        }}
                      >
                        {style.label}
                      </span>
                    </div>

                    {/* Details Grid */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr 1fr",
                        gap: "16px",
                        padding: "14px 0",
                        borderTop: "1px solid #f3f4f6",
                        borderBottom: "1px solid #f3f4f6",
                        marginBottom: "14px",
                      }}
                    >
                      <div>
                        <p
                          style={{
                            fontSize: "10px",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                            color: "#9ca3af",
                            margin: "0 0 3px",
                          }}
                        >
                          Time
                        </p>
                        <p style={{ fontSize: "13px", color: "#374151", margin: 0 }}>
                          {formatDateRange(b.start_time, b.end_time)}
                        </p>
                      </div>
                      <div>
                        <p
                          style={{
                            fontSize: "10px",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                            color: "#9ca3af",
                            margin: "0 0 3px",
                          }}
                        >
                          Duration
                        </p>
                        <p style={{ fontSize: "13px", color: "#374151", margin: 0 }}>
                          {hours.toFixed(1)} hrs
                        </p>
                      </div>
                      <div>
                        <p
                          style={{
                            fontSize: "10px",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                            color: "#9ca3af",
                            margin: "0 0 3px",
                          }}
                        >
                          Total
                        </p>
                        <p
                          style={{
                            fontSize: "13px",
                            fontWeight: 700,
                            color: "#111827",
                            margin: 0,
                          }}
                        >
                          ${b.total_price.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* Bottom Row */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <p style={{ fontSize: "13px", color: "#6b7280", margin: 0 }}>
                        {b.vehicle_make} {b.vehicle_model} ·{" "}
                        <span style={{ fontFamily: "monospace" }}>{b.license_plate}</span>
                      </p>

                      {/* Current tab: Cancel button */}
                      {!bookingIsPast &&
                        ["active", "pending_provider"].includes(b.status) && (
                          <button
                            type="button"
                            onClick={() => handleCancel(b.booking_id)}
                            disabled={cancelling === b.booking_id}
                            style={{
                              padding: "7px 16px",
                              background: "white",
                              color:
                                cancelling === b.booking_id ? "#9ca3af" : "#b91c1c",
                              border: `1px solid ${
                                cancelling === b.booking_id ? "#e5e7eb" : "#fca5a5"
                              }`,
                              borderRadius: "8px",
                              fontSize: "13px",
                              fontWeight: 600,
                              cursor:
                                cancelling === b.booking_id
                                  ? "not-allowed"
                                  : "pointer",
                            }}
                          >
                            {cancelling === b.booking_id ? "Cancelling…" : "Cancel"}
                          </button>
                        )}

                      {/* Past tab: Review button (only for non-cancelled) */}
                      {bookingIsPast && b.status !== "cancelled" && (
                        <button
                          type="button"
                          onClick={() => !alreadyReviewed && setReviewModal(b)}
                          disabled={alreadyReviewed}
                          style={{
                            padding: "7px 16px",
                            background: alreadyReviewed ? "#f3f4f6" : "white",
                            color: alreadyReviewed ? "#9ca3af" : "#2563eb",
                            border: `1px solid ${
                              alreadyReviewed ? "#e5e7eb" : "#93c5fd"
                            }`,
                            borderRadius: "8px",
                            fontSize: "13px",
                            fontWeight: 600,
                            cursor: alreadyReviewed ? "default" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          {alreadyReviewed ? (
                            <>
                              <span style={{ fontSize: "14px" }}>✓</span> Reviewed
                            </>
                          ) : (
                            <>
                              <span style={{ fontSize: "14px" }}>★</span> Review
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Review Modal */}
      {reviewModal && (
        <ReviewModal
          booking={reviewModal}
          onClose={() => setReviewModal(null)}
          onSubmitted={(spotId) => { handleReviewSubmitted(spotId); setToast("Review submitted!"); }}
        />
      )}

      {toast && <Toast message={toast} onHide={() => setToast(null)} />}
    </div>
  );
}