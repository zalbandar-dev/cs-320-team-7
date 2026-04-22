"use client";

import { useEffect, useState, useCallback } from "react";
import Navbar from "@/app/components/Navbar";
import Sidebar from "@/app/components/Sidebar";
import ServiceRequestModal from "@/app/components/ServiceRequestModal";
import { getAuthHeaders } from "@/app/lib/auth";
import Toast from "@/app/components/Toast";

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
  provider_name: string | null;
  provider_contact: string | null;
  provider_assigned_at: string | null;
  users: { first_name: string; last_name: string; username: string; role: string; email?: string; phone?: string } | null;
  parking_spots: { address: string } | null;
}

const STATUS_MAP: Record<string, { label: string; badge: string; icon: string; iconColor: string }> = {
  pending:           { label: "Pending",           badge: "bg-yellow-100 text-yellow-800", icon: "hourglass_empty", iconColor: "text-yellow-500" },
  awaiting_approval: { label: "Awaiting Approval", badge: "bg-yellow-100 text-yellow-800", icon: "hourglass_empty", iconColor: "text-yellow-500" },
  approved:          { label: "Approved",          badge: "bg-blue-100 text-blue-800",    icon: "check_circle",    iconColor: "text-blue-500"   },
  provider_assigned: { label: "Provider Assigned", badge: "bg-blue-100 text-blue-800",    icon: "handyman",        iconColor: "text-blue-500"   },
  in_progress:       { label: "In Progress",       badge: "bg-indigo-100 text-indigo-800",icon: "autorenew",       iconColor: "text-indigo-500" },
  completed:         { label: "Completed",         badge: "bg-green-100 text-green-800",  icon: "check_circle",    iconColor: "text-green-500"  },
  rejected:          { label: "Rejected",          badge: "bg-red-100 text-red-800",      icon: "cancel",          iconColor: "text-red-500"    },
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

function serviceIcon(type: string): string {
  const key = type.toLowerCase().replace(/ /g, "_");
  return SERVICE_ICONS[key] ?? "build";
}

function formatServiceType(raw: string): string {
  return raw.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function timeAgo(iso: string): string {
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 60)    return "just now";
  if (sec < 3600)  return `${Math.floor(sec / 60)} min ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)} hr ago`;
  return `${Math.floor(sec / 86400)} days ago`;
}

const CLOSED = new Set(["completed", "rejected"]);
type Tab = "my-requests" | "accepted-jobs";

export default function MyServiceRequestsPage() {
  const [tab, setTab]             = useState<Tab>("my-requests");
  const [myRequests, setMyRequests]       = useState<ServiceRequest[]>([]);
  const [acceptedJobs, setAcceptedJobs]   = useState<ServiceRequest[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast]         = useState<string | null>(null);

  const fetchMyRequests = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res  = await fetch("http://localhost:3001/api/service-requests/mine", {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to load requests."); return; }
      setMyRequests(data.data ?? []);
    } catch {
      setError("Network error. Is the server running?");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAcceptedJobs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res  = await fetch("http://localhost:3001/api/service-requests/accepted", {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to load accepted jobs."); return; }
      setAcceptedJobs(data.data ?? []);
    } catch {
      setError("Network error. Is the server running?");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "my-requests") fetchMyRequests();
    else fetchAcceptedJobs();
  }, [tab, fetchMyRequests, fetchAcceptedJobs]);

  async function handleCancel(id: number) {
    const res = await fetch(`http://localhost:3001/api/service-requests/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify({ status: "rejected" }),
    });
    if (res.ok) {
      setMyRequests(prev => prev.map(r => r.request_id === id ? { ...r, status: "rejected" } : r));
      setToast("Request cancelled.");
    }
  }

  async function handleUnaccept(id: number) {
    const res = await fetch(`http://localhost:3001/api/service-requests/${id}/unaccept`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    });
    if (res.ok) {
      setAcceptedJobs(prev => prev.filter(r => r.request_id !== id));
      setToast("Job unaccepted — it's open again.");
    }
  }

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "my-requests",   label: "My Requests",   icon: "engineering" },
    { id: "accepted-jobs", label: "Accepted Jobs",  icon: "handyman"    },
  ];

  return (
    <div className="bg-background text-on-background min-h-screen">
      <Navbar />
      <Sidebar />

      <main className="lg:pl-64 pt-24 min-h-screen">
        <div className="max-w-4xl mx-auto px-8 py-10">

          {/* Header */}
          <header className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-extrabold text-on-surface tracking-tight font-headline">
                My Service Requests
              </h1>
              <p className="text-on-surface-variant mt-1">
                Requests you&apos;ve submitted and jobs you&apos;ve accepted
              </p>
            </div>
            {tab === "my-requests" && (
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-xl font-bold shadow-md hover:scale-[1.02] active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined">add</span>
                New Request
              </button>
            )}
          </header>

          {/* Tabs */}
          <div className="flex gap-2 mb-8 border-b border-slate-100 pb-1">
            {tabs.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-t-xl text-sm font-semibold transition-colors ${
                  tab === t.id
                    ? "bg-primary text-on-primary shadow-sm"
                    : "text-on-surface-variant hover:bg-surface-container"
                }`}
              >
                <span className="material-symbols-outlined text-base">{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-24 text-on-surface-variant gap-3">
              <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
              Loading...
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-2xl px-6 py-4 text-error text-sm font-medium">
              <span className="material-symbols-outlined">error</span>
              {error}
            </div>
          )}

          {/* ── MY REQUESTS TAB ── */}
          {!loading && !error && tab === "my-requests" && (
            <>
              {myRequests.length === 0 ? (
                <div className="text-center py-20 text-on-surface-variant">
                  <span className="material-symbols-outlined text-[64px] mb-4 block opacity-30">build_circle</span>
                  <p className="text-lg font-semibold">No service requests yet</p>
                  <p className="text-sm mt-1">Submit a request for your spot or vehicle.</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {myRequests.map(req => {
                    const s        = STATUS_MAP[req.status] ?? STATUS_MAP["pending"];
                    const isClosed = CLOSED.has(req.status);
                    const isAccepted = req.status === "approved" || req.status === "provider_assigned" || req.status === "in_progress";

                    return (
                      <div
                        key={req.request_id}
                        className="bg-surface-container-lowest rounded-2xl border border-slate-100 p-6 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <div className="flex-1 min-w-0">
                            {/* Status + service type */}
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-tight ${s.badge}`}>
                                {s.label}
                              </span>
                              {req.booking_id !== null && (
                                <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-tight bg-purple-100 text-purple-700">
                                  Vehicle Service
                                </span>
                              )}
                              {req.booking_id === null && req.spot_id !== null && (
                                <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-tight bg-teal-100 text-teal-700">
                                  Spot Service
                                </span>
                              )}
                              <div className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm text-primary">
                                  {serviceIcon(req.service_type)}
                                </span>
                                <span className="text-sm font-bold text-primary">{formatServiceType(req.service_type)}</span>
                              </div>
                            </div>

                            {/* Spot info */}
                            <h3 className="font-bold text-on-surface text-base mb-0.5">
                              {req.parking_spots?.address ?? `Spot #${req.spot_id}`}
                            </h3>

                            {req.booking_id !== null && (
                              <div className="flex items-center gap-1 text-xs text-slate-500 bg-surface-container-low rounded-lg px-3 py-1.5 w-fit mb-3">
                                <span className="material-symbols-outlined text-sm">directions_car</span>
                                Booking #{req.booking_id}
                              </div>
                            )}

                            {req.notes && (
                              <p className="text-sm text-on-surface-variant bg-surface-container-low rounded-lg p-3 mb-3">
                                {req.notes}
                              </p>
                            )}

                            {/* Provider info once accepted */}
                            {isAccepted && req.provider_name && (
                              <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-3">
                                <span className="material-symbols-outlined text-blue-500 text-[20px]">badge</span>
                                <div>
                                  <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Provider</p>
                                  <p className="text-sm font-bold text-on-surface">{req.provider_name}</p>
                                  {req.provider_contact && (
                                    <p className="text-xs text-slate-500">{req.provider_contact}</p>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Timestamps */}
                            <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                              <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm">calendar_today</span>
                                Submitted {formatDate(req.created_at)}
                              </span>
                              <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm">schedule</span>
                                Updated {timeAgo(req.updated_at)}
                              </span>
                            </div>
                          </div>

                          {/* Status icon */}
                          <div className={`flex-shrink-0 ${s.iconColor}`}>
                            <span className="material-symbols-outlined text-[32px]">{s.icon}</span>
                          </div>
                        </div>

                        {/* Footer actions */}
                        <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                          {isClosed ? (
                            <span className={`text-sm font-semibold flex items-center gap-1 ${s.iconColor}`}>
                              <span className="material-symbols-outlined text-sm">{s.icon}</span>
                              {req.status === "completed" ? "This request has been completed" : "This request was rejected"}
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleCancel(req.request_id)}
                              className="px-4 py-2 rounded-lg text-sm font-semibold text-error bg-red-50 hover:bg-red-100 transition-colors"
                            >
                              Cancel Request
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* ── ACCEPTED JOBS TAB ── */}
          {!loading && !error && tab === "accepted-jobs" && (
            <>
              {acceptedJobs.length === 0 ? (
                <div className="text-center py-20 text-on-surface-variant">
                  <span className="material-symbols-outlined text-[64px] mb-4 block opacity-30">handyman</span>
                  <p className="text-lg font-semibold">No accepted jobs yet</p>
                  <p className="text-sm mt-1">Browse Service Requests to find jobs to accept.</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {acceptedJobs.map(req => {
                    const s = STATUS_MAP[req.status] ?? STATUS_MAP["approved"];
                    const requesterName = req.users
                      ? `${req.users.first_name ?? ""} ${req.users.last_name ?? ""}`.trim() || req.users.username
                      : "Unknown";

                    return (
                      <div
                        key={req.request_id}
                        className="bg-surface-container-lowest rounded-2xl border border-slate-100 p-6 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <div className="flex-1 min-w-0">
                            {/* Status + service type */}
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-tight ${s.badge}`}>
                                {s.label}
                              </span>
                              <div className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm text-primary">
                                  {serviceIcon(req.service_type)}
                                </span>
                                <span className="text-sm font-bold text-primary">{formatServiceType(req.service_type)}</span>
                              </div>
                            </div>

                            {/* Location */}
                            <h3 className="font-bold text-on-surface text-base mb-0.5">
                              {req.parking_spots?.address ?? `Spot #${req.spot_id}`}
                            </h3>

                            {req.booking_id !== null && (
                              <div className="flex items-center gap-1 text-xs text-slate-500 bg-surface-container-low rounded-lg px-3 py-1.5 w-fit mb-3">
                                <span className="material-symbols-outlined text-sm">directions_car</span>
                                Booking #{req.booking_id}
                              </div>
                            )}

                            {req.notes && (
                              <p className="text-sm text-on-surface-variant bg-surface-container-low rounded-lg p-3 mb-3">
                                {req.notes}
                              </p>
                            )}

                            {/* Requester contact info */}
                            <div className="flex items-center gap-3 bg-purple-50 border border-purple-100 rounded-xl px-4 py-3 mb-3">
                              <span className="material-symbols-outlined text-purple-500 text-[20px]">person</span>
                              <div>
                                <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Requested by</p>
                                <p className="text-sm font-bold text-on-surface">{requesterName}</p>
                                {req.users?.email && (
                                  <p className="text-xs text-slate-500">{req.users.email}</p>
                                )}
                                {req.users?.phone && (
                                  <p className="text-xs text-slate-500">{req.users.phone}</p>
                                )}
                              </div>
                            </div>

                            {/* Timestamps */}
                            <div className="flex items-center gap-4 text-xs text-slate-400">
                              <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm">calendar_today</span>
                                Accepted {req.provider_assigned_at ? formatDate(req.provider_assigned_at) : "—"}
                              </span>
                              <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm">schedule</span>
                                Updated {timeAgo(req.updated_at)}
                              </span>
                            </div>
                          </div>

                          {/* Status icon */}
                          <div className={`flex-shrink-0 ${s.iconColor}`}>
                            <span className="material-symbols-outlined text-[32px]">{s.icon}</span>
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="mt-4 pt-4 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => handleUnaccept(req.request_id)}
                            className="px-4 py-2 rounded-lg text-sm font-semibold text-error bg-red-50 hover:bg-red-100 transition-colors"
                          >
                            Unaccept Job
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

        </div>
      </main>

      {showModal && (
        <ServiceRequestModal
          onClose={() => setShowModal(false)}
          onSubmitted={() => { fetchMyRequests(); setToast("Service request submitted!"); }}
        />
      )}

      {toast && <Toast message={toast} onHide={() => setToast(null)} />}
    </div>
  );
}
