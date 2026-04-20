"use client";

import { useEffect, useState } from "react";
import Navbar from "@/app/components/Navbar";
import Sidebar from "@/app/components/Sidebar";
import AcceptServiceModal from "@/app/components/AcceptServiceModal";
import { getAuthHeaders } from "@/app/lib/auth";

interface ServiceRequest {
  request_id: number;
  user_id: number;
  service_type: string;
  notes: string | null;
  spot_id: number | null;
  booking_id: number | null;
  status: string;
  created_at: string;
  updated_at: string;
  users: { first_name: string; last_name: string; username: string; role: string } | null;
  parking_spots: { address: string } | null;
}

type Filter = "All" | "Vehicle Services" | "Spot Services";

// Maps snake_case service_type values to human-readable labels.
// Falls back to title-casing the raw value for any unknown type.
const SERVICE_LABELS: Record<string, string> = {
  oil_change:       "Oil Change",
  tyre_change:      "Tyre Change",
  tire_change:      "Tire Change",
  tire_inflation:   "Tire Inflation",
  snow_shoveling:   "Snow Shoveling",
  leaf_raking:      "Leaf Raking",
  detailing:        "Detailing",
  car_wash:         "Car Wash",
  pressure_washing: "Pressure Washing",
  painting:         "Painting",
  battery_jump:     "Battery Jump Start",
  lockout:          "Lockout Assistance",
};

const SERVICE_ICONS: Record<string, string> = {
  oil_change:       "oil_barrel",
  tyre_change:      "tire_repair",
  tire_change:      "tire_repair",
  tire_inflation:   "tire_repair",
  snow_shoveling:   "weather_snowy",
  leaf_raking:      "yard",
  detailing:        "local_car_wash",
  car_wash:         "local_car_wash",
  pressure_washing: "water",
  painting:         "format_paint",
  battery_jump:     "bolt",
  lockout:          "key",
};

const ROLE_LABELS: Record<string, string> = {
  customer: "Parker",
  provider: "Spot Owner",
};

const ROLE_STYLES: Record<string, string> = {
  customer: "bg-purple-100 text-purple-700",
  provider: "bg-teal-100 text-teal-700",
};

function formatServiceType(raw: string): string {
  const key = raw.toLowerCase().replace(/ /g, "_");
  return SERVICE_LABELS[key] ?? raw.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function serviceIcon(raw: string): string {
  return SERVICE_ICONS[raw.toLowerCase().replace(/ /g, "_")] ?? "build";
}

function userDisplayName(u: ServiceRequest["users"]): string {
  if (!u) return "Unknown";
  const full = `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim();
  return full || u.username || "Unknown";
}

function userInitials(u: ServiceRequest["users"]): string {
  if (!u) return "?";
  if (u.first_name && u.last_name) return `${u.first_name[0]}${u.last_name[0]}`.toUpperCase();
  return (u.username ?? "?").slice(0, 2).toUpperCase();
}

function timeAgo(iso: string): string {
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 60)   return "just now";
  if (sec < 3600) return `${Math.floor(sec / 60)} min ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)} hr ago`;
  return `${Math.floor(sec / 86400)} days ago`;
}

export default function ServiceRequestsPage() {
  const [requests, setRequests]   = useState<ServiceRequest[]>([]);
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());
  const [filter, setFilter]       = useState<Filter>("All");
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [acceptTarget, setAcceptTarget] = useState<ServiceRequest | null>(null);

  async function fetchRequests() {
    setLoading(true);
    setError("");
    try {
      const res  = await fetch("http://localhost:3001/api/service-requests", {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to load requests."); return; }
      setRequests(data.data ?? []);
    } catch {
      setError("Network error. Is the server running?");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchRequests(); }, []);

  function handleDismiss(id: number) {
    setDismissed(prev => new Set(prev).add(id));
  }

  const visible = requests.filter(r => {
    if (dismissed.has(r.request_id)) return false;
    if (filter === "Vehicle Services") return r.booking_id !== null;
    if (filter === "Spot Services")    return r.booking_id === null;
    return true;
  });

  const filters: Filter[] = ["All", "Vehicle Services", "Spot Services"];

  return (
    <div className="bg-background text-on-background min-h-screen">
      <Navbar />
      <Sidebar />

      <main className="lg:pl-64 pt-24 min-h-screen">
        <div className="max-w-5xl mx-auto px-8 py-10">

          {/* Header */}
          <header className="flex items-center justify-between mb-10 flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-extrabold text-on-surface tracking-tight font-headline">
                Service Requests
              </h1>
              <p className="text-on-surface-variant mt-1">
                Open requests available to accept across all listings
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {filters.map(f => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                    filter === f
                      ? "bg-primary text-on-primary shadow-sm"
                      : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </header>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-24 text-on-surface-variant gap-3">
              <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
              Loading requests...
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-2xl px-6 py-4 text-error text-sm font-medium">
              <span className="material-symbols-outlined">error</span>
              {error}
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && visible.length === 0 && (
            <div className="text-center py-24 text-on-surface-variant">
              <span className="material-symbols-outlined text-[64px] mb-4 block opacity-30">
                build_circle
              </span>
              <p className="text-lg font-semibold">No open requests</p>
              <p className="text-sm mt-1">Check back later or adjust the filter.</p>
            </div>
          )}

          {/* Request cards */}
          {!loading && !error && visible.length > 0 && (
            <div className="space-y-4">
              {visible.map(req => {
                const role       = req.users?.role ?? "customer";
                const roleLabel  = ROLE_LABELS[role] ?? role;
                const isAccepted = req.status !== "pending" && req.status !== "awaiting_approval";

                return (
                  <div
                    key={req.request_id}
                    className="bg-surface-container-lowest rounded-2xl border border-slate-100 p-6 flex items-start gap-5 hover:shadow-md transition-shadow"
                  >
                    {/* Avatar */}
                    <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-on-primary font-bold text-sm flex-shrink-0 uppercase">
                      {userInitials(req.users)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-bold text-on-surface">
                          {userDisplayName(req.users)}
                        </span>
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-tight ${ROLE_STYLES[role] ?? "bg-slate-100 text-slate-600"}`}>
                          {roleLabel}
                        </span>
                        {isAccepted && (
                          <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-tight bg-blue-100 text-blue-700">
                            Accepted
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="material-symbols-outlined text-base text-primary">
                          {serviceIcon(req.service_type)}
                        </span>
                        <p className="text-sm font-semibold text-primary">{formatServiceType(req.service_type)}</p>
                      </div>

                      {req.notes && (
                        <p className="text-sm text-on-surface-variant mb-2">{req.notes}</p>
                      )}

                      {req.booking_id !== null && (
                        <div className="flex items-center gap-1 text-xs text-slate-500 bg-surface-container-low rounded-lg px-3 py-1.5 w-fit mb-2">
                          <span className="material-symbols-outlined text-sm">directions_car</span>
                          Booking #{req.booking_id}
                        </div>
                      )}

                      <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                        <span className="material-symbols-outlined text-sm">location_on</span>
                        {req.parking_spots?.address ?? `Spot #${req.spot_id}`}
                        <span className="mx-1">·</span>
                        <span className="material-symbols-outlined text-sm">schedule</span>
                        {timeAgo(req.created_at)}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleDismiss(req.request_id)}
                        className="h-9 px-4 rounded-full border border-slate-200 text-sm font-semibold hover:bg-slate-50 transition-colors"
                      >
                        Dismiss
                      </button>
                      <button
                        type="button"
                        onClick={() => !isAccepted && setAcceptTarget(req)}
                        disabled={isAccepted}
                        className="h-9 px-4 rounded-full bg-primary text-on-primary text-sm font-semibold shadow-sm hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        {isAccepted ? "Accepted" : "Accept"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {acceptTarget && (
        <AcceptServiceModal
          requestId={acceptTarget.request_id}
          serviceType={acceptTarget.service_type}
          spotAddress={acceptTarget.parking_spots?.address ?? null}
          onClose={() => setAcceptTarget(null)}
          onAccepted={() => {
            setRequests(prev =>
              prev.map(r => r.request_id === acceptTarget.request_id ? { ...r, status: "approved" } : r)
            );
            setAcceptTarget(null);
          }}
        />
      )}
    </div>
  );
}
