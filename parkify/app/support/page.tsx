"use client";

import Navbar from "@/app/components/Navbar";
import Sidebar from "@/app/components/Sidebar";

const faqs = [
  {
    q: "How do I cancel a booking?",
    a: "Go to My Bookings, find the booking you'd like to cancel, and click the Cancel button. Cancellations must be made at least 1 hour before the start time.",
  },
  {
    q: "How do I list my parking spot?",
    a: "Navigate to My Listings and click 'Add New Spot'. Fill in the address, hourly rate, and availability, then submit.",
  },
  {
    q: "How are payments handled?",
    a: "Payments are handled entirely by a third-party payment processor. Parkify is not liable for any payment disputes, charges, or refunds — please contact your payment provider directly for any billing issues.",
  },
  {
    q: "What is a Service Request?",
    a: "Service Requests let you ask for help with parking-related tasks (e.g., a jump-start or tire change). Other users can accept and fulfill them.",
  },
];

export default function SupportPage() {
  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col">
      <Navbar />
      <Sidebar />

      <main className="flex-1 md:ml-64 pt-24 px-8 md:px-12 lg:px-20 pb-20">
        <div className="max-w-4xl mx-auto">

          <header className="mb-12">
            <h1 className="text-4xl md:text-5xl font-extrabold text-on-surface tracking-tight mb-2 font-headline">
              Support Center
            </h1>
            <p className="text-on-surface-variant text-lg">
              Need help? Reach out to our team or browse common questions below.
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">

            {/* Phone */}
            <div className="bg-surface-container-lowest rounded-xl p-8 shadow-sm border border-slate-100 flex items-start gap-5">
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary">call</span>
              </div>
              <div>
                <p className="text-xs font-bold text-outline uppercase tracking-widest mb-1">Phone</p>
                <p className="text-xl font-bold text-on-surface">(617) 555-0192</p>
                <p className="text-sm text-on-surface-variant mt-1">Mon – Fri, 9 am – 6 pm ET</p>
              </div>
            </div>

            {/* Email */}
            <div className="bg-surface-container-lowest rounded-xl p-8 shadow-sm border border-slate-100 flex items-start gap-5">
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-green-600">mail</span>
              </div>
              <div>
                <p className="text-xs font-bold text-outline uppercase tracking-widest mb-1">Email</p>
                <p className="text-xl font-bold text-on-surface">support@parkify.app</p>
                <p className="text-sm text-on-surface-variant mt-1">Typical response within 24 hours</p>
              </div>
            </div>

            {/* Live Chat */}
            <div className="bg-surface-container-lowest rounded-xl p-8 shadow-sm border border-slate-100 flex items-start gap-5">
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-purple-600">chat</span>
              </div>
              <div>
                <p className="text-xs font-bold text-outline uppercase tracking-widest mb-1">Live Chat</p>
                <p className="text-xl font-bold text-on-surface">Chat with us</p>
                <p className="text-sm text-on-surface-variant mt-1">Available Mon – Fri, 10 am – 5 pm ET</p>
              </div>
            </div>

            {/* Address */}
            <div className="bg-surface-container-lowest rounded-xl p-8 shadow-sm border border-slate-100 flex items-start gap-5">
              <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-orange-500">location_on</span>
              </div>
              <div>
                <p className="text-xs font-bold text-outline uppercase tracking-widest mb-1">Office</p>
                <p className="text-xl font-bold text-on-surface">140 Governors Dr</p>
                <p className="text-sm text-on-surface-variant mt-1">Amherst, MA 01003</p>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <section className="bg-surface-container-lowest rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-8 py-6 bg-surface-container-low border-b border-slate-100">
              <h3 className="text-xl font-bold text-on-surface font-headline">Frequently Asked Questions</h3>
            </div>
            <ul className="divide-y divide-slate-100">
              {faqs.map((faq) => (
                <li key={faq.q} className="px-8 py-6">
                  <p className="font-bold text-on-surface mb-1">{faq.q}</p>
                  <p className="text-on-surface-variant text-sm leading-relaxed">{faq.a}</p>
                </li>
              ))}
            </ul>
          </section>

        </div>
      </main>

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
