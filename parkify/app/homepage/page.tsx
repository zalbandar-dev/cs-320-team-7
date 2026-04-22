"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import Sidebar from "@/app/components/Sidebar";
import { ParkingSpot } from "@/app/lib/types";

const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800&q=80";
const DAILY_DISCOUNT_RATE = 0.75;

type SpotReview = { average: number; count: number };

/**
 * Extract city/town from a full address string.
 * Tries to pull "City, ST" from typical US address formats.
 * Falls back to the full address if parsing fails.
 */
function extractCityFromAddress(address: string): string {
  // Typical format: "123 Main St, Springfield, IL 62704, United States of America"
  // or: "123 Main St, Springfield, IL"
  const parts = address.split(",").map((p) => p.trim());

  if (parts.length >= 3) {
    // parts[0] = street, parts[1] = city, parts[2] = "ST ZIP" or "ST"
    const city = parts[parts.length - 3];
    const stateZip = parts[parts.length - 2];
    // Extract just the state abbreviation (first word)
    const state = stateZip.split(" ")[0];
    if (state && state.length === 2 && state === state.toUpperCase()) {
      return `${city}, ${state}`;
    }
    return stateZip;
  }

  if (parts.length === 2) {
    return parts[0];
  }

  return address;
}

export default function ListingsPage() {
  const [spots, setSpots] = useState<ParkingSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [zip, setZip] = useState("");
  const [activeZip, setActiveZip] = useState("");
  const [reviews, setReviews] = useState<Record<number, SpotReview>>({});
  const [maxPrice, setMaxPrice] = useState<number>(50);
  const [spotTypeFilter, setSpotTypeFilter] = useState<string>("all");

  const fetchReviewsForSpots = async (spotList: ParkingSpot[]) => {
    const reviewMap: Record<number, SpotReview> = {};
    await Promise.all(
      spotList.map(async (spot) => {
        try {
          const res = await fetch(`/api/getSpotReviews/${spot.spot_id}`);
          const data = await res.json();
          if (data.success) {
            reviewMap[spot.spot_id] = data.data;
          }
        } catch {
          // silently ignore
        }
      })
    );
    setReviews(reviewMap);
  };

  const fetchSpots = async (zipCode?: string) => {
    setLoading(true);
    try {
      const url =
        zipCode && zipCode.length > 0
          ? `/api/listSpotsByZip?zip=${zipCode}`
          : `/api/listAvailableSpots`;
      const res = await fetch(url);
      const data = await res.json();
      const Data = data.data;
      const spotList = Array.isArray(Data) ? Data : [];
      setSpots(spotList);
      await fetchReviewsForSpots(spotList);
    } catch {
      setSpots([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpots();
  }, []);

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

  const getPricePerDay = (pricePerHour: number) => {
    return pricePerHour * 24 * DAILY_DISCOUNT_RATE;
  };

  const filteredSpots = spots.filter((s) => {
    if (s.hourly_rate > maxPrice) return false;
    if (spotTypeFilter !== "all" && s.spot_type !== spotTypeFilter) return false;
    return true;
  });

  return (
    <div className="bg-background text-on-background min-h-screen">
      <Navbar />
      <Sidebar />

      <main className="lg:pl-64 pt-24 min-h-screen">
        <div className="max-w-7xl mx-auto px-8 py-10">
          <header className="mb-10">
            <h1 className="text-4xl font-extrabold text-on-surface tracking-tight mb-1 font-headline">
              Listings Near You
            </h1>
            <p className="text-on-surface-variant mb-6">
              Browse available parking spots in your area.
            </p>

            <form
              onSubmit={handleSearch}
              className="flex items-center gap-3 max-w-lg"
            >
              <div className="flex flex-1 items-center bg-surface-container-lowest border border-slate-200 rounded-xl overflow-hidden shadow-sm focus-within:border-primary transition-colors">
                <span className="material-symbols-outlined text-slate-400 pl-4">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Search by zip code..."
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                  className="flex-1 px-3 py-3 bg-transparent outline-none text-sm text-primary placeholder:text-slate-400"
                />
                {activeZip && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="px-3 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">
                      close
                    </span>
                  </button>
                )}
              </div>
              <button
                type="submit"
                className="px-6 py-3 bg-primary text-on-primary rounded-xl font-semibold text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-md"
              >
                Search
              </button>
            </form>

            {activeZip && (
              <div className="flex items-center gap-2 mt-4">
                <span className="text-sm text-on-surface-variant">
                  Showing results for:
                </span>
                <span className="flex items-center gap-1.5 bg-primary/10 text-primary text-sm font-semibold px-3 py-1 rounded-full">
                  📍 {activeZip}
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="hover:text-primary/60 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">
                      close
                    </span>
                  </button>
                </span>
              </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-5 mt-5 pt-5 border-t border-slate-100">
              {/* Spot type */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Type</label>
                <select
                  title="Spot type"
                  value={spotTypeFilter}
                  onChange={(e) => setSpotTypeFilter(e.target.value)}
                  className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-on-surface bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">All types</option>
                  {["compact", "standard", "large", "motorcycle", "rv"].map((t) => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>

              {/* Price range */}
              <div className="flex items-center gap-3">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">
                  Max price
                </label>
                <input
                  type="range"
                  min={1}
                  max={50}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-32 accent-blue-600"
                />
                <span className="text-sm font-bold text-primary w-16">${maxPrice}/hr</span>
              </div>

              {(spotTypeFilter !== "all" || maxPrice < 50) && (
                <button
                  type="button"
                  onClick={() => { setSpotTypeFilter("all"); setMaxPrice(50); }}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-700 flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                  Clear filters
                </button>
              )}
            </div>
          </header>

          {!loading && (
            <p className="text-sm text-on-surface-variant mb-6">
              {filteredSpots.length} spot{filteredSpots.length !== 1 ? "s" : ""} found
            </p>
          )}

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-surface-container-lowest rounded-2xl overflow-hidden animate-pulse"
                >
                  <div className="h-48 bg-slate-200" />
                  <div className="p-6 space-y-3">
                    <div className="h-4 bg-slate-200 rounded w-3/4" />
                    <div className="h-3 bg-slate-200 rounded w-1/2" />
                    <div className="h-3 bg-slate-200 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredSpots.length === 0 ? (
            <div className="text-center py-24 text-on-surface-variant">
              <span className="material-symbols-outlined text-[64px] mb-4 block opacity-30">
                local_parking
              </span>
              <p className="text-lg font-semibold text-on-surface">
                No spots found
              </p>
              <p className="text-sm mt-1">
                Try a different zip code, raise the price limit, or change the spot type.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredSpots.map((spot) => {
                const review = reviews[spot.spot_id];
                const hasReviews = review && review.count > 0;
                const imgSrc = spot.image?.trim() || PLACEHOLDER_IMAGE;
                const cityTitle = extractCityFromAddress(spot.address);

                return (
                  <Link
                    key={spot.spot_id}
                    href={`/spots/${spot.spot_id}`}
                    className="no-underline block"
                  >
                    <div className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow group flex flex-col">
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={imgSrc}
                          alt={spot.spot_type}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              PLACEHOLDER_IMAGE;
                          }}
                        />
                        <div className="absolute top-3 left-3 flex gap-2">
                          <span className="bg-white/90 backdrop-blur px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-primary">
                            {spot.spot_type}
                          </span>
                        </div>
                        <div className="absolute bottom-3 right-3 bg-primary text-on-primary px-3 py-1 rounded-lg font-bold text-sm">
                          ${spot.hourly_rate.toFixed(2)}
                          <span className="text-[10px] opacity-80">/hr</span>
                        </div>
                      </div>
                      <div className="p-5 flex-1 flex flex-col">
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="font-bold text-base text-on-surface leading-snug">
                            {cityTitle}
                          </h3>
                          {hasReviews ? (
                            <span className="text-sm font-semibold text-on-surface-variant flex items-center gap-0.5 flex-shrink-0">
                              <span className="text-amber-400">★</span>
                              {review.average.toFixed(1)}
                              <span className="text-xs font-normal text-on-surface-variant/60 ml-0.5">
                                ({review.count})
                              </span>
                            </span>
                          ) : (
                            <span className="text-xs font-medium text-on-surface-variant/50 flex items-center gap-0.5 flex-shrink-0">
                              <span className="text-slate-300">★</span>
                              No reviews
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-on-surface-variant truncate">
                          {spot.address}
                        </p>
                        <p className="text-xs text-on-surface-variant/60 mt-0.5">
                          {spot.zip_code}
                        </p>
                        <p className="mt-3 text-sm">
                          <span className="font-bold text-on-surface">
                            ${spot.hourly_rate.toFixed(2)}
                          </span>
                          <span className="text-on-surface-variant">
                            {" "}
                            / hour ·{" "}
                          </span>
                          <span className="font-bold text-on-surface">
                            ${getPricePerDay(spot.hourly_rate).toFixed(2)}
                          </span>
                          <span className="text-on-surface-variant">
                            {" "}
                            / day
                          </span>
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}