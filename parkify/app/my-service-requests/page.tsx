"use client";

import Navbar from "@/app/components/Navbar";
import Sidebar from "@/app/components/Sidebar";

const myRequests = [
  {
    id: 1,
    spot: "Secure Downtown Garage Spot",
    spotLocation: "123 Main Street, San Francisco, CA",
    type: "Access Issue",
    description: "The key fob provided is not granting access to the garage entrance on Level B.",
    status: "In Progress",
    submitted: "Mar 28, 2026",
    updated: "2 hrs ago",
  },
  {
    id: 2,
    spot: "Premium Underground Parking",
    spotLocation: "789 Pearl Blvd, Portland, OR",
    type: "Billing Question",
    description: "I was charged for an extra day but I picked up my car before the end time.",
    status: "Pending",
    submitted: "Mar 27, 2026",
    updated: "1 day ago",
  },
  {
    id: 3,
    spot: "Airport Adjacent Lot",
    spotLocation: "1200 Aviation Way, Denver, CO",
    type: "Shuttle Delay",
    description: "Shuttle did not arrive within the 15-minute window as advertised.",
    status: "Resolved",
    submitted: "Mar 20, 2026",
    updated: "Mar 22, 2026",
  },
];

const STATUS_STYLES: Record<string, { badge: string; icon: string; iconColor: string }> = {
  "Pending":     { badge: "bg-yellow-100 text-yellow-800", icon: "hourglass_empty",  iconColor: "text-yellow-500" },
  "In Progress": { badge: "bg-blue-100 text-blue-800",    icon: "autorenew",         iconColor: "text-blue-500"   },
  "Resolved":    { badge: "bg-green-100 text-green-800",  icon: "check_circle",      iconColor: "text-green-500"  },
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
              <h1 className="text-4xl font-extrabold text-on-surface tracking-tight font-headline">My Service Requests</h1>
              <p className="text-on-surface-variant mt-1">Requests you have submitted</p>
            </div>
            <button type="button" className="flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-xl font-bold shadow-md hover:scale-[1.02] active:scale-95 transition-all">
              <span className="material-symbols-outlined">add</span>
              New Request
            </button>
          </header>

          {myRequests.length === 0 ? (
            <div className="text-center py-20 text-on-surface-variant">
              <span className="material-symbols-outlined text-[64px] mb-4 block opacity-30">inbox</span>
              <p className="text-lg font-semibold">No service requests yet</p>
              <p className="text-sm mt-1">Submit a request if you need help with a booking.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {myRequests.map((req) => {
                const s = STATUS_STYLES[req.status];
                return (
                  <div key={req.id} className="bg-surface-container-lowest rounded-2xl border border-slate-100 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        {/* Status + type */}
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-tight ${s.badge}`}>
                            {req.status}
                          </span>
                          <span className="text-sm font-bold text-primary">{req.type}</span>
                        </div>

                        {/* Spot info */}
                        <h3 className="font-bold text-on-surface text-base mb-0.5">{req.spot}</h3>
                        <p className="text-sm text-on-surface-variant flex items-center gap-1 mb-3">
                          <span className="material-symbols-outlined text-sm">location_on</span>
                          {req.spotLocation}
                        </p>

                        {/* Description */}
                        <p className="text-sm text-on-surface-variant bg-surface-container-low rounded-lg p-3">
                          {req.description}
                        </p>

                        {/* Timestamps */}
                        <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
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
                        <button type="button" className="px-4 py-2 rounded-lg text-sm font-semibold border border-slate-200 hover:bg-slate-50 transition-colors">
                          Add Comment
                        </button>
                        <button type="button" className="px-4 py-2 rounded-lg text-sm font-semibold text-error bg-red-50 hover:bg-red-100 transition-colors">
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
