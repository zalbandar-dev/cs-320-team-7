"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { logout, getAuthHeaders } from "@/app/lib/auth";
import ServiceRequestModal from "@/app/components/ServiceRequestModal";

interface Notification {
  notification_id: number;
  type: string;
  message: string;
  read: boolean;
  created_at: string;
}

function timeAgo(iso: string): string {
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 60)    return "just now";
  if (sec < 3600)  return `${Math.floor(sec / 60)} min ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)} hr ago`;
  return `${Math.floor(sec / 86400)} days ago`;
}

export default function Navbar() {
  const [initials, setInitials]           = useState("?");
  const [showModal, setShowModal]         = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showBell, setShowBell]           = useState(false);
  const bellRef                           = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const username = localStorage.getItem("username") ?? "";
    if (username.length > 0) setInitials(username.slice(0, 2).toUpperCase());
  }, []);

  async function fetchNotifications() {
    try {
      const res = await fetch("http://localhost:3001/api/notifications", { headers: getAuthHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.data ?? []);
    } catch { /* no-op */ }
  }

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(interval);
  }, []);

  async function handleOpenBell() {
    setShowBell(prev => !prev);
    if (unreadCount > 0) {
      await fetch("http://localhost:3001/api/notifications/read-all", {
        method: "PATCH",
        headers: getAuthHeaders(),
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setShowBell(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <>
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md shadow-sm">
        <div className="flex justify-between items-center px-8 h-20 w-full max-w-screen-2xl mx-auto">
          {/* Left: brand + nav links */}
          <div className="flex items-center gap-12">
            <Link href="/homepage" style={{ fontFamily: "Montserrat, sans-serif" }}
              className="text-2xl font-semibold italic text-blue-700 tracking-tighter no-underline">
              Parkify
            </Link>
            <div className="hidden md:flex gap-8 font-semibold tracking-tight">
              <Link href="/homepage" className="text-slate-600 hover:text-blue-600 transition-colors duration-200 no-underline">
                Find Parking
              </Link>
              <Link href="/my-listings?new=true" className="text-slate-600 hover:text-blue-600 transition-colors duration-200 no-underline">
                List Your Space
              </Link>
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="text-slate-600 hover:text-blue-600 transition-colors duration-200 font-semibold tracking-tight bg-transparent border-none p-0 cursor-pointer"
              >
                Request Service
              </button>
            </div>
          </div>

          {/* Right: icons + avatar */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-slate-600">
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="md:hidden p-2 hover:bg-slate-50 rounded-full transition-colors"
                title="Request a service"
              >
                <span className="material-symbols-outlined">build_circle</span>
              </button>

              {/* Notification bell */}
              <div ref={bellRef} className="relative">
                <button
                  type="button"
                  onClick={handleOpenBell}
                  className="p-2 hover:bg-slate-50 rounded-full transition-colors relative"
                >
                  <span className="material-symbols-outlined">notifications</span>
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {showBell && (
                  <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 z-[200] overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                      <span className="text-sm font-bold text-on-surface">Notifications</span>
                      {notifications.length > 0 && (
                        <span className="text-xs text-slate-400">{notifications.length} total</span>
                      )}
                    </div>

                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-slate-400">
                        <span className="material-symbols-outlined text-[32px] mb-2 block opacity-40">notifications_off</span>
                        <p className="text-sm">No notifications yet</p>
                      </div>
                    ) : (
                      <ul className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                        {notifications.map(n => (
                          <li
                            key={n.notification_id}
                            className={`px-4 py-3 flex gap-3 items-start ${!n.read ? "bg-blue-50/60" : ""}`}
                          >
                            <span className="material-symbols-outlined text-[18px] mt-0.5 flex-shrink-0 text-amber-500">
                              info
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-on-surface leading-snug">{n.message}</p>
                              <p className="text-xs text-slate-400 mt-0.5">{timeAgo(n.created_at)}</p>
                            </div>
                            {!n.read && (
                              <span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              <button type="button" className="p-2 hover:bg-slate-50 rounded-full transition-colors">
                <span className="material-symbols-outlined">help_outline</span>
              </button>
              <button type="button" onClick={logout} className="p-2 hover:bg-slate-50 rounded-full transition-colors" title="Sign out">
                <span className="material-symbols-outlined">logout</span>
              </button>
            </div>
            <Link href="/account">
              <div className="h-10 w-10 rounded-full bg-blue-700 border-2 border-blue-600 ring-4 ring-blue-100 flex items-center justify-center text-white font-bold text-sm cursor-pointer select-none">
                {initials}
              </div>
            </Link>
          </div>
        </div>
      </nav>

      {showModal && (
        <ServiceRequestModal onClose={() => setShowModal(false)} />
      )}
    </>
  );
}
