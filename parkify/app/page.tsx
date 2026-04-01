"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import Sidebar from "@/app/components/Sidebar";
import { ParkingSpot } from "@/app/lib/types";

export default function ListingsPage() {
  const [spots, setSpots] = useState<ParkingSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [zip, setZip] = useState("");
  const [activeZip, setActiveZip] = useState("");

  const fetchSpots = async (zipCode?: string) => {
    setLoading(true);
    try {
      const url = zipCode && zipCode.length > 0
        ? `/api/listSpotsByZip?zip=${zipCode}`
        : `/api/listAvailableSpots`;
      const res = await fetch(url);
      const data = await res.json();
      setSpots(Array.isArray(data) ? data : []);
    } catch {
      setSpots([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSpots(); }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveZip(zip.trim());
    fetchSpots(zip.trim());
  };

  const clearSearch = () => {
    setZip("");
    setActiveZip("");
    fetchSpots();
  };

  return (
    <div className="bg-background text-on-background min-h-screen">
      <Navbar />
      <Sidebar />

      <main className="lg:pl-64 pt-24 min-h-screen">
        <div className="max-w-7xl mx-auto px-8 py-10">

          {/* Header + search */}
          <header className="mb-10">
            <h1 className="text-4xl font-extrabold text-on-surface tracking-tight mb-1 font-headline">
              Listings Near You
            </h1>
            <p className="text-on-surface-variant mb-6">Browse available parking spots in your area.</p>

            {/* Search bar */}
            <form onSubmit={handleSearch} className="flex items-center gap-3 max-w-lg">
              <div className="flex flex-1 items-center bg-surface-container-lowest border border-slate-200 rounded-xl overflow-hidden shadow-sm focus-within:border-primary transition-colors">
                <span className="material-symbols-outlined text-slate-400 pl-4">search</span>
                <input
                  type="text"
                  placeholder="Search by zip code..."
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                  className="flex-1 px-3 py-3 bg-transparent outline-none text-sm text-primary placeholder:text-slate-400"
                />
                {activeZip && (
                  <button type="button" onClick={clearSearch}
                    className="px-3 text-slate-400 hover:text-slate-600 transition-colors">
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                )}
              </div>
              <button type="submit"
                className="px-6 py-3 bg-primary text-on-primary rounded-xl font-semibold text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-md">
                Search
              </button>
            </form>

            {/* Active filter chip */}
            {activeZip && (
              <div className="flex items-center gap-2 mt-4">
                <span className="text-sm text-on-surface-variant">Showing results for:</span>
                <span className="flex items-center gap-1.5 bg-primary/10 text-primary text-sm font-semibold px-3 py-1 rounded-full">
                  📍 {activeZip}
                  <button type="button" onClick={clearSearch} className="hover:text-primary/60 transition-colors">
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </span>
              </div>
            )}
          </header>

          {/* Results count */}
          {!loading && (
            <p className="text-sm text-on-surface-variant mb-6">
              {spots.length} spot{spots.length !== 1 ? "s" : ""} found
            </p>
          )}

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-surface-container-lowest rounded-2xl overflow-hidden animate-pulse">
                  <div className="h-48 bg-slate-200" />
                  <div className="p-6 space-y-3">
                    <div className="h-4 bg-slate-200 rounded w-3/4" />
                    <div className="h-3 bg-slate-200 rounded w-1/2" />
                    <div className="h-3 bg-slate-200 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : spots.length === 0 ? (
            <div className="text-center py-24 text-on-surface-variant">
              <span className="material-symbols-outlined text-[64px] mb-4 block opacity-30">local_parking</span>
              <p className="text-lg font-semibold text-on-surface">No spots found</p>
              <p className="text-sm mt-1">Try a different zip code or clear your search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {spots.map((spot) => (
                <Link key={spot.id} href={`/spots/${spot.id}`} className="no-underline block">
                  <div className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow group flex flex-col">
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
                      </div>
                      <div className="absolute bottom-3 right-3 bg-primary text-on-primary px-3 py-1 rounded-lg font-bold text-sm">
                        ${spot.price_per_hour.toFixed(2)}<span className="text-[10px] opacity-80">/hr</span>
                      </div>
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-bold text-base text-on-surface">{spot.city}, {spot.state}</h3>
                        <span className="text-sm font-semibold text-on-surface-variant flex items-center gap-0.5">
                          <span className="text-amber-400">★</span>{spot.rating}
                        </span>
                      </div>
                      <p className="text-sm text-on-surface-variant">{spot.title}</p>
                      <p className="text-sm text-on-surface-variant">{spot.address}</p>
                      <p className="mt-3 text-sm">
                        <span className="font-bold text-on-surface">${spot.price_per_hour.toFixed(2)}</span>
                        <span className="text-on-surface-variant"> / hour · </span>
                        <span className="font-bold text-on-surface">${spot.price_per_day.toFixed(2)}</span>
                        <span className="text-on-surface-variant"> / day</span>
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
