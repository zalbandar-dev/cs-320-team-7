"use client";

import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md shadow-sm">
      <div className="flex justify-between items-center px-8 h-20 w-full max-w-screen-2xl mx-auto">
        {/* Left: brand + nav links */}
        <div className="flex items-center gap-12">
          <Link href="/homepage" style={{ fontFamily: "Manrope, sans-serif" }}
            className="text-2xl font-black text-blue-700 tracking-tighter no-underline">
            Parkly
          </Link>
          <div className="hidden md:flex gap-8 font-semibold tracking-tight">
            <Link href="/" className="text-slate-600 hover:text-blue-600 transition-colors duration-200 no-underline">
              Find Parking
            </Link>
            <Link href="/my-listings?new=true" className="text-slate-600 hover:text-blue-600 transition-colors duration-200 no-underline">
              List Your Space
            </Link>
          </div>
        </div>

        {/* Right: icons + avatar */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-slate-600">
            <button type="button" className="p-2 hover:bg-slate-50 rounded-full transition-colors">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button type="button" className="p-2 hover:bg-slate-50 rounded-full transition-colors">
              <span className="material-symbols-outlined">help_outline</span>
            </button>
          </div>
          <Link href="/account">
            <div className="h-10 w-10 rounded-full bg-blue-700 border-2 border-blue-600 ring-4 ring-blue-100 flex items-center justify-center text-white font-bold text-sm cursor-pointer select-none">
              JS
            </div>
          </Link>
        </div>
      </div>
    </nav>
  );
}
