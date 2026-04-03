"use client";

import Navbar from "@/app/components/Navbar";
import Sidebar from "@/app/components/Sidebar";

const requests = [
  {
    id: 1,
    requester: "Sarah Jenkins",
    initials: "SJ",
    requesterRole: "Parker",
    spot: "Central Plaza Garage",
    spotLocation: "400 Market St, San Francisco, CA",
    serviceType: "Oil Change",
    vehicleInfo: "Tesla Model 3 · ABC-1234",
    description: "Need a standard oil change while my car is parked. Window is open until 4pm.",
    status: "Pending",
    time: "12 mins ago",
  },
  {
    id: 2,
    requester: "David Chen",
    initials: "DC",
    requesterRole: "Spot Owner",
    spot: "Downtown Spot #42",
    spotLocation: "88 Howard St, San Francisco, CA",
    serviceType: "Snow Shoveling",
    vehicleInfo: null,
    description: "Spot needs to be cleared of snow and ice before tenant arrival at 3pm.",
    status: "Pending",
    time: "45 mins ago",
  },
  {
    id: 3,
    requester: "Marcus Lee",
    initials: "ML",
    requesterRole: "Spot Owner",
    spot: "Airport Adjacent Lot",
    spotLocation: "1200 Aviation Way, Denver, CO",
    serviceType: "Leaf Raking",
    vehicleInfo: null,
    description: "Lot surface needs to be cleared of leaves and debris before weekend rush.",
    status: "Pending",
    time: "3 hrs ago",
  },
  {
    id: 4,
    requester: "Tanya Brooks",
    initials: "TB",
    requesterRole: "Parker",
    spot: "Stadium Event Parking",
    spotLocation: "1 Stadium Dr, Los Angeles, CA",
    serviceType: "Tyre Change",
    vehicleInfo: "Ford F-150 · LMN-5432",
    description: "Flat tyre on rear driver side. Need a spare swap or replacement.",
    status: "Pending",
    time: "5 hrs ago",
  },
];

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

export default function ServiceRequestsPage() {
  return (
    <div className="bg-background text-on-background min-h-screen">
      <Navbar />
      <Sidebar />

      <main className="lg:pl-64 pt-24 min-h-screen">
        <div className="max-w-5xl mx-auto px-8 py-10">

          {/* Header */}
          <header className="flex items-center justify-between mb-10">
            <div>
              <h1 className="text-4xl font-extrabold text-on-surface tracking-tight font-headline">
                Service Requests
              </h1>
              <p className="text-on-surface-variant mt-1">
                Open requests available to accept across all listings
              </p>
            </div>
            <div className="flex items-center gap-3">
              {["All", "Vehicle Services", "Spot Services"].map((f) => (
                <button
                  key={f}
                  type="button"
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                    f === "All"
                      ? "bg-primary text-on-primary"
                      : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </header>

          {/* Requests list */}
          <div className="space-y-4">
            {requests.map((req) => (
              <div
                key={req.id}
                className="bg-surface-container-lowest rounded-2xl border border-slate-100 p-6 flex items-start gap-5 hover:shadow-md transition-shadow"
              >
                {/* Avatar */}
                <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-on-primary font-bold text-sm flex-shrink-0">
                  {req.initials}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Top row */}
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-bold text-on-surface">{req.requester}</span>
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-tight ${ROLE_STYLES[req.requesterRole]}`}>
                      {req.requesterRole}
                    </span>
                  </div>

                  {/* Service type */}
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="material-symbols-outlined text-base text-primary">
                      {SERVICE_ICONS[req.serviceType] ?? "build"}
                    </span>
                    <p className="text-sm font-semibold text-primary">{req.serviceType}</p>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-on-surface-variant mb-2">{req.description}</p>

                  {/* Vehicle info (parkers only) */}
                  {req.vehicleInfo && (
                    <div className="flex items-center gap-1 text-xs text-slate-500 bg-surface-container-low rounded-lg px-3 py-1.5 w-fit mb-2">
                      <span className="material-symbols-outlined text-sm">directions_car</span>
                      {req.vehicleInfo}
                    </div>
                  )}

                  {/* Location + time */}
                  <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                    <span className="material-symbols-outlined text-sm">location_on</span>
                    {req.spot} · {req.spotLocation}
                    <span className="mx-1">·</span>
                    <span className="material-symbols-outlined text-sm">schedule</span>
                    {req.time}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    type="button"
                    className="h-9 px-4 rounded-full border border-slate-200 text-sm font-semibold hover:bg-slate-50 transition-colors"
                  >
                    Dismiss
                  </button>
                  <button
                    type="button"
                    className="h-9 px-4 rounded-full bg-primary text-on-primary text-sm font-semibold shadow-sm hover:scale-[1.02] transition-all"
                  >
                    Accept
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}