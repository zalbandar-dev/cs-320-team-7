"use client";

import Navbar from "@/app/components/Navbar";
import Sidebar from "@/app/components/Sidebar";

const myRequests = [
  {
    id: 1,
    requestedBy: "me",
    requestedByRole: "Spot Owner",
    spot: "Secure Downtown Garage Spot",
    spotLocation: "123 Main Street, San Francisco, CA",
    serviceType: "Snow Shoveling",
    vehicleInfo: null,
    description: "Spot needs clearing before my tenant arrives at 6pm. Snow is about 4 inches deep at the entrance.",
    status: "In Progress",
    providerName: "QuickClear Services",
    providerContact: "415-555-0192",
    submitted: "Mar 28, 2026",
    updated: "2 hrs ago",
  },
  {
    id: 2,
    requestedBy: "me",
    requestedByRole: "Parker",
    spot: "Premium Underground Parking",
    spotLocation: "789 Pearl Blvd, Portland, OR",
    serviceType: "Oil Change",
    vehicleInfo: "Toyota Camry · PDX-4421",
    description: "Standard 5W-30 oil change needed. I'll be parked here overnight so there's a full window.",
    status: "Pending",
    providerName: null,
    providerContact: null,
    submitted: "Mar 27, 2026",
    updated: "1 day ago",
  },
  {
    id: 3,
    requestedBy: "me",
    requestedByRole: "Parker",
    spot: "Airport Adjacent Lot",
    spotLocation: "1200 Aviation Way, Denver, CO",
    serviceType: "Detailing",
    vehicleInfo: "Honda CR-V · COL-8812",
    description: "Full exterior and interior detail. Spot owner allows detailing. Vehicle will be there for 5 days.",
    status: "Resolved",
    providerName: "ShineRight Auto Detail",
    providerContact: "720-555-0387",
    submitted: "Mar 20, 2026",
    updated: "Mar 22, 2026",
  },
];

const STATUS_STYLES: Record<string, { badge: string; icon: string; iconColor: string }> = {
  "Pending":     { badge: "bg-yellow-100 text-yellow-800", icon: "hourglass_empty", iconColor: "text-yellow-500" },
  "In Progress": { badge: "bg-blue-100 text-blue-800",    icon: "autorenew",        iconColor: "text-blue-500"   },
  "Resolved":    { badge: "bg-green-100 text-green-800",  icon: "check_circle",     iconColor: "text-green-500"  },
};

const ROLE_STYLES: Record<string, string> = {
  "Parker":     "bg-purple-100 text-purple-700",
  "Spot Owner": "bg-teal-100 text-teal-700",
};

const SERVICE_ICONS: Record<string, string> = {
  "Snow Shoveling": "weather_snowy",
  "Leaf Raking":    "yard",
  "Oil Change":     "oil_barrel",
  "Tyre Change":    "tire_repair",
  "Detailing":      "local_car_wash",
};

export default function MyServiceRequestsPage() {
  return (
    <div className="bg-background text-on-background min-h-screen">
      <Navbar />
      <Sidebar />

      <main className="lg:pl-64 pt-24 min-h-screen">
        <div className="max-w-4xl mx-auto px-8 py-10">

          {/* Header */}
          <header className="flex items-center justify-between mb-10">
            <div>
              <h1 className="text-4xl font-extrabold text-on-surface tracking-tight font-headline">
                My Service Requests
              </h1>
              <p className="text-on-surface-variant mt-1">
                Requests you&apos;ve submitted as a spot owner or parker
              </p>
            </div>
            <button
              type="button"
              className="flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-xl font-bold shadow-md hover:scale-[1.02] active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined">add</span>
              New Request
            </button>
          </header>

          {myRequests.length === 0 ? (
            <div className="text-center py-20 text-on-surface-variant">
              <span className="material-symbols-outlined text-[64px] mb-4 block opacity-30">build_circle</span>
              <p className="text-lg font-semibold">No service requests yet</p>
              <p className="text-sm mt-1">Submit a request for your spot or vehicle.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {myRequests.map((req) => {
                const s = STATUS_STYLES[req.status];
                return (
                  <div
                    key={req.id}
                    className="bg-surface-container-lowest rounded-2xl border border-slate-100 p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">

                        {/* Status + role + service type */}
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-tight ${s.badge}`}>
                            {req.status}
                          </span>
                          <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-tight ${ROLE_STYLES[req.requestedByRole]}`}>
                            {req.requestedByRole}
                          </span>
                          <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm text-primary">
                              {SERVICE_ICONS[req.serviceType] ?? "build"}
                            </span>
                            <span className="text-sm font-bold text-primary">{req.serviceType}</span>
                          </div>
                        </div>

                        {/* Spot info */}
                        <h3 className="font-bold text-on-surface text-base mb-0.5">{req.spot}</h3>
                        <p className="text-sm text-on-surface-variant flex items-center gap-1 mb-3">
                          <span className="material-symbols-outlined text-sm">location_on</span>
                          {req.spotLocation}
                        </p>

                        {/* Vehicle info (if parker) */}
                        {req.vehicleInfo && (
                          <div className="flex items-center gap-1 text-xs text-slate-500 bg-surface-container-low rounded-lg px-3 py-1.5 w-fit mb-3">
                            <span className="material-symbols-outlined text-sm">directions_car</span>
                            {req.vehicleInfo}
                          </div>
                        )}

                        {/* Description */}
                        <p className="text-sm text-on-surface-variant bg-surface-container-low rounded-lg p-3 mb-3">
                          {req.description}
                        </p>

                        {/* Assigned provider */}
                        {req.providerName && (
                          <div className="flex items-center gap-2 text-sm text-on-surface-variant mb-3">
                            <span className="material-symbols-outlined text-sm text-primary">handyman</span>
                            <span className="font-semibold text-on-surface">{req.providerName}</span>
                            {req.providerContact && (
                              <span className="text-slate-400">· {req.providerContact}</span>
                            )}
                          </div>
                        )}

                        {/* Timestamps */}
                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">calendar_today</span>
                            Submitted {req.submitted}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">schedule</span>
                            Updated {req.updated}
                          </span>
                        </div>
                      </div>

                      {/* Status icon */}
                      <div className={`flex-shrink-0 ${s.iconColor}`}>
                        <span className="material-symbols-outlined text-[32px]">{s.icon}</span>
                      </div>
                    </div>

                    {/* Footer actions */}
                    {req.status !== "Resolved" && (
                      <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                        <button
                          type="button"
                          className="px-4 py-2 rounded-lg text-sm font-semibold border border-slate-200 hover:bg-slate-50 transition-colors"
                        >
                          Add Comment
                        </button>
                        <button
                          type="button"
                          className="px-4 py-2 rounded-lg text-sm font-semibold text-error bg-red-50 hover:bg-red-100 transition-colors"
                        >
                          Cancel Request
                        </button>
                      </div>
                    )}
                    {req.status === "Resolved" && (
                      <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                        <span className="text-sm text-green-600 font-semibold flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">check_circle</span>
                          This request has been resolved
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}