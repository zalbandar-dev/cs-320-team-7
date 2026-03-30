"use client";

import Navbar from "@/app/components/Navbar";
import Sidebar from "@/app/components/Sidebar";

const requests = [
  {
    id: 1,
    requester: "Sarah Jenkins",
    initials: "SJ",
    spot: "Central Plaza Garage",
    type: "Arrival Assistance",
    description: "Guest needs help navigating to the spot with a Tesla Model 3.",
    status: "Pending",
    time: "12 mins ago",
  },
  {
    id: 2,
    requester: "David Chen",
    initials: "DC",
    spot: "Downtown Spot #42",
    type: "EV Charger Setup",
    description: "EV charger initialization required before guest arrival.",
    status: "In Progress",
    time: "45 mins ago",
  },
  {
    id: 3,
    requester: "Priya Nair",
    initials: "PN",
    spot: "Noe Valley Smart Driveway",
    type: "Access Issue",
    description: "Gate code is not working for the guest.",
    status: "Resolved",
    time: "2 hrs ago",
  },
  {
    id: 4,
    requester: "Marcus Lee",
    initials: "ML",
    spot: "Airport Adjacent Lot",
    type: "Shuttle Request",
    description: "Guest is requesting a shuttle to the terminal.",
    status: "Pending",
    time: "3 hrs ago",
  },
  {
    id: 5,
    requester: "Tanya Brooks",
    initials: "TB",
    spot: "Stadium Event Parking",
    type: "Spot Dispute",
    description: "Another vehicle is parked in the reserved spot.",
    status: "In Progress",
    time: "5 hrs ago",
  },
];

const STATUS_STYLES: Record<string, string> = {
  "Pending":     "bg-yellow-100 text-yellow-800",
  "In Progress": "bg-blue-100 text-blue-800",
  "Resolved":    "bg-green-100 text-green-800",
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
              <h1 className="text-4xl font-extrabold text-on-surface tracking-tight font-headline">Service Requests</h1>
              <p className="text-on-surface-variant mt-1">All incoming requests across your listings</p>
            </div>
            <div className="flex items-center gap-3">
              {["All", "Pending", "In Progress", "Resolved"].map((f) => (
                <button key={f} type="button"
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${f === "All" ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"}`}>
                  {f}
                </button>
              ))}
            </div>
          </header>

          {/* Requests list */}
          <div className="space-y-4">
            {requests.map((req) => (
              <div key={req.id} className="bg-surface-container-lowest rounded-2xl border border-slate-100 p-6 flex items-start gap-5 hover:shadow-md transition-shadow">
                {/* Avatar */}
                <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-on-primary font-bold text-sm flex-shrink-0">
                  {req.initials}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-bold text-on-surface">{req.requester}</span>
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-tight ${STATUS_STYLES[req.status]}`}>
                      {req.status}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-primary mb-1">{req.type}</p>
                  <p className="text-sm text-on-surface-variant">{req.description}</p>
                  <div className="flex items-center gap-1 text-xs text-slate-400 mt-2">
                    <span className="material-symbols-outlined text-sm">location_on</span>
                    {req.spot}
                    <span className="mx-1">·</span>
                    <span className="material-symbols-outlined text-sm">schedule</span>
                    {req.time}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-shrink-0">
                  {req.status === "Pending" && (
                    <>
                      <button type="button" className="h-9 px-4 rounded-full border border-slate-200 text-sm font-semibold hover:bg-slate-50 transition-colors">
                        Dismiss
                      </button>
                      <button type="button" className="h-9 px-4 rounded-full bg-primary text-on-primary text-sm font-semibold shadow-sm hover:scale-[1.02] transition-all">
                        Accept
                      </button>
                    </>
                  )}
                  {req.status !== "Pending" && (
                    <button type="button" className="h-9 w-9 flex items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors">
                      <span className="material-symbols-outlined text-sm">more_vert</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
