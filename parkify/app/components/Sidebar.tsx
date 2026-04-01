"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/",                    label: "Listings",             icon: "dashboard"   },
  { href: "/my-listings",         label: "My Listings",          icon: "garage"      },
  { href: "/service-requests",    label: "Service Requests",     icon: "handyman"    },
  { href: "/my-service-requests", label: "My Service Requests",  icon: "engineering" },
];

export default function Sidebar() {
  const pathname = usePathname();

  const linkClass = (href: string) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium no-underline ${
      pathname === href
        ? "text-blue-700 font-bold bg-blue-50 translate-x-1"
        : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
    }`;

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 pt-24 bg-slate-50 border-r border-slate-100 hidden md:block z-40">
      <div className="flex flex-col h-full px-4 gap-2">
        {/* Header */}
        <div className="px-4 mb-6">
          <h2 className="text-lg font-bold text-slate-900 font-headline">
            Management
          </h2>
          <p className="text-xs text-slate-500 font-medium">Partner Portal</p>
        </div>

        {/* Nav items */}
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className={linkClass(item.href)}>
              <span className="material-symbols-outlined">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="mt-auto pb-8 flex flex-col gap-1">
          <Link href="/account" className={linkClass("/account")}>
            <span className="material-symbols-outlined">person</span>
            <span>Account</span>
          </Link>
          <button type="button"
            className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all text-sm font-medium w-full text-left">
            <span className="material-symbols-outlined">headset_mic</span>
            <span>Support</span>
          </button>
          <button type="button"
            className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all text-sm font-medium w-full text-left">
            <span className="material-symbols-outlined">logout</span>
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
