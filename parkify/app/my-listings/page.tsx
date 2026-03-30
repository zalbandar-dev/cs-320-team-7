"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import Sidebar from "@/app/components/Sidebar";
import { ParkingSpot } from "@/app/lib/types";

const STATUS_COLORS: Record<string, string> = {
  available: "bg-green-100 text-green-800",
  occupied:  "bg-red-100 text-red-800",
  reserved:  "bg-yellow-100 text-yellow-800",
};

export default function MyListingsPage() {
  const [spots, setSpots] = useState<ParkingSpot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/listAvailableSpots")
      .then((r) => r.json())
      .then((data) => setSpots(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-background text-on-background min-h-screen">
      <Navbar />
      <Sidebar />

      <main className="lg:pl-64 pt-24 min-h-screen">
        <div className="max-w-7xl mx-auto px-8 py-10">

          {/* Header */}
          <header className="flex items-center justify-between mb-10">
            <div>
              <h1 className="text-4xl font-extrabold text-on-surface tracking-tight font-headline">My Listings</h1>
              <p className="text-on-surface-variant mt-1">{spots.length} spots in your portfolio</p>
            </div>
            <button type="button" className="flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-xl font-bold shadow-md hover:scale-[1.02] active:scale-95 transition-all">
              <span className="material-symbols-outlined">add</span>
              New Listing
            </button>
          </header>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-surface-container-lowest rounded-2xl overflow-hidden animate-pulse">
                  <div className="h-48 bg-slate-200" />
                  <div className="p-6 space-y-3">
                    <div className="h-4 bg-slate-200 rounded w-3/4" />
                    <div className="h-3 bg-slate-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {spots.map((spot) => (
                <div key={spot.id} className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm border border-slate-100 flex flex-col group">
                  {/* Image */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={spot.image_url}
                      alt={spot.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 flex gap-2">
                      <span className="bg-white/90 backdrop-blur px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-primary">
                        {spot.spot_type}
                      </span>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${STATUS_COLORS[spot.status]}`}>
                        {spot.status}
                      </span>
                    </div>
                    <div className="absolute bottom-3 right-3 bg-primary text-on-primary px-3 py-1 rounded-lg font-bold text-sm">
                      ${spot.price_per_hour.toFixed(2)}<span className="text-[10px] opacity-80">/hr</span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="font-bold text-base text-on-surface mb-1">{spot.title}</h3>
                    <p className="text-sm text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">location_on</span>
                      {spot.address}, {spot.city}, {spot.state}
                    </p>
                    <div className="flex items-center gap-1 mt-1 text-sm text-on-surface-variant">
                      <span className="text-amber-400">★</span>
                      <span className="font-semibold text-on-surface">{spot.rating}</span>
                      <span>({spot.review_count} reviews)</span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                      <Link href={`/spots/${spot.id}`} className="flex-1 no-underline">
                        <button type="button" className="w-full py-2 rounded-lg border border-slate-200 text-sm font-semibold text-on-surface hover:bg-slate-50 transition-colors">
                          View
                        </button>
                      </Link>
                      <button type="button" className="flex-1 py-2 rounded-lg bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/20 transition-colors">
                        Edit
                      </button>
                      <button type="button" className="py-2 px-3 rounded-lg bg-red-50 text-error text-sm font-semibold hover:bg-red-100 transition-colors">
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
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
