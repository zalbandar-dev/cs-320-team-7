"use client";

import Navbar from "@/app/components/Navbar";
import Sidebar from "@/app/components/Sidebar";
import { getAuthHeaders } from "@/app/lib/auth";
import Toast from "@/app/components/Toast";
import { useRouter } from "next/navigation"; // Added for redirection
import { useEffect, useState } from "react";

const empty = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  role: "",
  timezone: "Eastern Time (ET)",
};

export default function AccountPage() {
  const router = useRouter(); // Initialize router
  const [form, setForm] = useState(empty);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [listingCount, setListingCount] = useState<number>(0);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/mySpots", { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((data) => setListingCount(Array.isArray(data?.data) ? data.data.length : 0));
  }, []);

  useEffect(() => {
  fetch("/api/user", { headers: getAuthHeaders() })
    .then((r) => r.json())
    .then((data) => {
      // Logic check: make sure 'data' actually has these keys
      setForm({
        first_name: data.firstName || data.first_name || "", 
        last_name:  data.lastName  || data.last_name  || "",
        email:      data.email ?? "",
        phone:      data.phone ?? "",
        role:       data.role ?? "",
        timezone: "Eastern Time (ET)",
      });
    })
    .finally(() => setLoading(false));
}, []);

  const set = (field: string, value: string) => {
    setForm((p) => ({ ...p, [field]: value }));
    setSaved(false);
  };

  // --- NEW: LOGOUT HANDLER ---
  const handleLogout = async () => {
    try {
      await fetch("/api/logout", {
        method: "POST",
        headers: getAuthHeaders(),
      });
    } finally {
      // Always clear local storage and redirect regardless of server response
      localStorage.removeItem("accessToken");
      router.push("/login");
    }
  };

  // --- NEW: DEACTIVATE HANDLER ---
  const handleDeactivate = async () => {
    const confirm = window.confirm(
      "Are you sure you want to deactivate your account? This will permanently remove your listings and profile."
    );
    if (!confirm) return;

    try {
      const res = await fetch("/api/user", {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (res.ok) {
        localStorage.removeItem("accessToken");
        router.push("/register");
      } else {
        alert("Failed to deactivate account. Please try again.");
      }
    } catch (err) {
      alert("Network error. Could not complete deactivation.");
    }
  };

  const handleSave = async () => {
    setSaveError(null);
    try {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          first_name: form.first_name,
          last_name:  form.last_name,
          email:      form.email,
          phone:      form.phone,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setSaveError(json.error ?? "Failed to save");
        return;
      }
      setSaved(true);
      setToast("Profile saved successfully!");
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setSaveError("Network error — could not save changes");
    }
  };

  if (loading) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <span className="text-on-surface-variant">Loading...</span>
      </div>
    );
  }

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col">
      <Navbar />
      <Sidebar />

      <main className="flex-1 md:ml-64 pt-24 px-8 md:px-12 lg:px-20 pb-20">
        <div className="max-w-4xl mx-auto">

          <header className="mb-12 flex justify-between items-end">
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-on-surface tracking-tight mb-2 font-headline">
                Account Settings
              </h1>
              <p className="text-on-surface-variant text-lg">
                Manage your personal details and account preferences.
              </p>
            </div>
            {/* LOGOUT BUTTON ADDED TO HEADER */}
            <button 
              onClick={handleLogout}
              className="mb-2 px-4 py-2 border border-outline text-on-surface-variant font-bold rounded-xl hover:bg-surface-container transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">logout</span>
              Sign Out
            </button>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Profile card */}
            <div className="md:col-span-2 bg-surface-container-lowest rounded-xl p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row gap-8 items-start">
              <div className="relative">
                <div className="h-32 w-32 rounded-full bg-primary flex items-center justify-center text-on-primary text-4xl font-bold select-none">
                  {form.first_name[0]}{form.last_name[0]}
                </div>
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="text-2xl font-bold text-on-surface">{form.first_name} {form.last_name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-3 py-0.5 bg-purple-100 text-purple-800 text-xs font-bold rounded-full uppercase tracking-wider capitalize">
                      {form.role}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                  <div>
                    <p className="text-xs font-bold text-outline uppercase tracking-widest mb-1">Email Address</p>
                    <p className="text-on-surface font-medium">{form.email}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-outline uppercase tracking-widest mb-1">Phone Number</p>
                    <p className="text-on-surface font-medium">{form.phone}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats card */}
            <div className="bg-primary text-on-primary rounded-xl p-8 flex flex-col justify-between overflow-hidden relative">
              <div className="relative z-10">
                <p className="text-white/60 font-bold text-sm mb-1 uppercase tracking-widest">Active Listings</p>
                <h4 className="text-5xl font-black">{listingCount}</h4>
              </div>
              <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
            </div>

            <div className="md:col-span-3 space-y-6">
              {/* Personal Information form */}
              <section className="bg-surface-container-lowest rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="px-8 py-6 bg-surface-container-low border-b border-slate-100">
                  <h3 className="text-xl font-bold text-on-surface font-headline">Personal Information</h3>
                </div>
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                  {[
                    { label: "First Name",    field: "first_name", type: "text"  },
                    { label: "Last Name",     field: "last_name",  type: "text"  },
                    { label: "Email",         field: "email",      type: "email" },
                    { label: "Phone Number",  field: "phone",      type: "tel"   },
                  ].map(({ label, field, type }) => (
                    <div key={field} className="space-y-2">
                      <label className="text-sm font-semibold text-on-surface-variant ml-1">{label}</label>
                      <input
                        type={type}
                        title={label}
                        value={(form as Record<string, string>)[field]}
                        onChange={(e) => set(field, e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-transparent focus:border-primary outline-none transition-all text-on-surface font-medium"
                      />
                    </div>
                  ))}
                </div>
                <div className="px-8 py-6 bg-surface-container-lowest flex items-center justify-end gap-4 border-t border-slate-100">
                  {saveError && (
                    <p className="text-sm text-red-600 mr-auto">{saveError}</p>
                  )}
                  <button type="button" onClick={handleSave}
                    className="px-8 py-2.5 rounded-full font-bold bg-primary text-on-primary shadow-lg hover:scale-[1.02] active:scale-95 transition-all">
                    {saved ? "Saved!" : "Save Changes"}
                  </button>
                </div>
              </section>

              {/* Security & Deactivation */}
              <section className="bg-surface-container-lowest rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="px-8 py-6 bg-surface-container-low border-b border-slate-100">
                  <h3 className="text-xl font-bold text-on-surface font-headline">Security &amp; Session</h3>
                </div>
                <div className="p-8 space-y-4">
                  <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-red-50 rounded-full flex items-center justify-center text-error">
                        <span className="material-symbols-outlined">delete_forever</span>
                      </div>
                      <div>
                        <p className="font-bold text-error">Deactivate Account</p>
                        <p className="text-sm text-on-surface-variant">Permanently delete your profile and all data.</p>
                      </div>
                    </div>
                    {/* ATTACHED DEACTIVATE HANDLER */}
                    <button 
                      type="button" 
                      onClick={handleDeactivate}
                      className="text-error font-bold hover:underline"
                    >
                      Deactivate Now
                    </button>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>

      {toast && <Toast message={toast} onHide={() => setToast(null)} />}

      {/* Footer */}
      <footer className="md:ml-64 w-auto py-12 border-t mt-auto bg-white border-slate-100">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col items-start gap-2">
            <span className="font-bold text-slate-900 font-headline">Parkify</span>
            <p className="text-xs text-slate-500">© 2024 Parkify. All rights reserved.</p>
          </div>
          <div className="flex gap-8">
            <a href="#" className="text-xs text-slate-500 hover:text-blue-600 transition-colors">Privacy Policy</a>
            <a href="#" className="text-xs text-slate-500 hover:text-blue-600 transition-colors">Terms of Service</a>
            <a href="#" className="text-xs text-slate-500 hover:text-blue-600 transition-colors">Help Center</a>
            <a href="#" className="text-xs text-slate-500 hover:text-blue-600 transition-colors">Contact Us</a>
          </div>
        </div>
      </footer>
    </div>
  );
}