"use client";

import { useState, useEffect } from "react";
import Navbar from "@/app/components/Navbar";
import Sidebar from "@/app/components/Sidebar";

interface RequestType {
  request_id: string;
  requester_name: string;
  requester_role: string;
  user_initials: string;
  service_type: string;
  notes: string;
  spot_name: string;
  created_at: string;
  vehicle_info?: string | null;
}

export const formatRelativeTime = (isoString: string) => {
  const date = new Date(isoString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} mins ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hrs ago`;
  return `${Math.floor(diffInSeconds / 86400)} days ago`;
};

const ROLE_STYLES: Record<string, string> = {
  "Parker": "bg-purple-100 text-purple-700",
  "Spot Owner": "bg-teal-100 text-teal-700",
};

const SERVICE_ICONS: Record<string, string> = {
  "Snow Shoveling": "weather_snowy",
  "Leaf Raking": "yard",
  "Oil Change": "oil_barrel",
  "Tyre Change": "tire_repair",
  "Detailing": "local_car_wash",
};

export default function ServiceRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRequests() {
      try {
        const res = await fetch("http://localhost:3001/api/service-requests");
        const json = await res.json();
        console.log(json.data)
        if (json.success) setRequests(json.data);
      } catch (err) {
        console.error("Error fetching requests:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchRequests();
  }, []);

  return (
    <div className="bg-background text-on-background min-h-screen">
      <Navbar />
      <Sidebar />

      <main className="lg:pl-64 pt-24 min-h-screen">
        <div className="max-w-5xl mx-auto px-8 py-10">
          <header className="flex items-center justify-between mb-10">
            <div>
              <h1 className="text-4xl font-extrabold text-on-surface">Service Requests</h1>
              <p className="text-on-surface-variant mt-1">Open requests available to accept</p>
            </div>
          </header>

          {loading ? (
            <div className="flex justify-center p-20">Loading...</div>
          ) : (
            <div className="space-y-4">
              {requests.map((req: RequestType) => (
                <div key={req.request_id} className="bg-surface-container-lowest rounded-2xl border border-slate-100 p-6 flex items-start gap-5">
                  <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-on-primary font-bold text-sm">
                    {/* Assuming you add a 'user_initials' field to your API response via a join */}
                    {req.user_initials || "??"} 
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-on-surface">{req.requester_name}</span>
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${ROLE_STYLES[req.requester_role]}`}>
                        {req.requester_role}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="material-symbols-outlined text-base text-primary">
                        {SERVICE_ICONS[req.service_type] ?? "build"}
                      </span>
                      <p className="text-sm font-semibold text-primary">{req.service_type}</p>
                    </div>

                    <p className="text-sm text-on-surface-variant mb-2">{req.notes}</p>

                    <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                      <span className="material-symbols-outlined text-sm">location_on</span>
                      {req.spot_name}
                      <span className="mx-1">·</span>
                      <span className="material-symbols-outlined text-sm">schedule</span>
                      {formatRelativeTime(req.created_at)}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button className="h-9 px-4 rounded-full border border-slate-200 text-sm font-semibold hover:bg-slate-50">Dismiss</button>
                    <button className="h-9 px-4 rounded-full bg-primary text-on-primary text-sm font-semibold hover:scale-[1.02] transition-all">Accept</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}