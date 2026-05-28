"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import DashboardShell from "../components/DashboardShell";
import { useAuth } from "../../../hooks/useAuth";

type EstimationHistoryItem = {
  id: number;
  project_title: string;
  total_area_sqft: string;
  number_of_floors: number;
  number_of_rooms: number;
  quality_level: string;
  total_estimated_cost: string;
  created_at: string;
  pdf_url?: string;
};

export default function ClientDashboard() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [history, setHistory] = useState<EstimationHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000/api";

  useEffect(() => {
    const loadHistory = async () => {
      if (!user) return;

      setHistoryLoading(true);
      setHistoryError("");

      try {
        const token = await user.getIdToken();
        const response = await fetch(`${backendUrl}/estimations/history/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to load estimation history");
        }

        setHistory(Array.isArray(result) ? result : []);
      } catch (error) {
        console.error("Failed to load estimation history", error);
        setHistoryError("Unable to load estimation history right now.");
      } finally {
        setHistoryLoading(false);
      }
    };

    loadHistory();
  }, [backendUrl, user]);

  const navSections = [
    {
      title: "Account",
      items: [
        {
          label: "Overview",
          href: "/dashboard/client",
          description: "Project overview",
          isActive: pathname === "/dashboard/client",
        },
        {
          label: "Public Profile",
          href: "/profile",
          description: "Your public profile",
          isActive: pathname === "/profile",
        },
        {
          label: "Pending Requests",
          href: "/dashboard/requests",
          description: "Open requests",
          isActive: pathname === "/dashboard/requests",
        },
        {
          label: "Profile Settings",
          href: "/settings",
          description: "Account preferences",
          isActive: pathname === "/settings",
        },
      ],
    },
    {
      title: "Estimations",
      items: [
        {
          label: "New Estimate",
          href: "/estimation",
          description: "Create a fresh estimation",
          isActive: pathname === "/estimation",
        },
        {
          label: "Estimation History",
          href: "/dashboard/client#estimation-history",
          description: "Download previous PDFs",
          isActive: pathname.includes("#estimation-history"),
        },
      ],
    },
  ];

  return (
    <DashboardShell navSections={navSections}>
      <header className="flex justify-between items-end pb-8 border-b border-stone-200">
        <div>
          <p className="text-[#8B4434] font-semibold tracking-widest uppercase text-sm mb-2">Homeowner Dashboard</p>
          <h1 className="font-serif text-4xl text-stone-900">Welcome, {user?.displayName || 'Client'}</h1>
        </div>
        <button className="btn-primary">New Project Estimate</button>
      </header>
      
      <div className="grid md:grid-cols-3 gap-6">
        <div className="card-luxury h-48 flex flex-col justify-between">
          <h3 className="font-serif text-xl border-b border-stone-100 pb-3">Active Projects</h3>
          <p className="text-stone-400 text-sm text-center">No projects running yet.</p>
          <button className="text-[#8B4434] text-sm font-semibold uppercase tracking-wider text-left">View All →</button>
        </div>
        <div className="card-luxury h-48 flex flex-col justify-between">
          <h3 className="font-serif text-xl border-b border-stone-100 pb-3">My Estimations</h3>
          <p className="text-stone-400 text-sm text-center">No estimates created.</p>
          <button className="text-[#8B4434] text-sm font-semibold uppercase tracking-wider text-left">View History →</button>
        </div>
        <div className="card-luxury h-48 flex flex-col justify-between">
          <h3 className="font-serif text-xl border-b border-stone-100 pb-3">Saved Professionals</h3>
          <p className="text-stone-400 text-sm text-center">No saved contacts.</p>
          <button className="text-[#8B4434] text-sm font-semibold uppercase tracking-wider text-left">Browse Directory →</button>
        </div>
      </div>

      <section id="estimation-history" className="bg-white border border-[#efe6df] rounded-none p-6 shadow-sm scroll-mt-6">
        <div className="flex items-start justify-between gap-4 border-b border-[#efe6df] pb-4 mb-5">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#8B4434]/60">Estimation History</p>
            <h2 className="font-serif text-2xl text-[#281713]">Download Previous Estimates</h2>
          </div>
          <p className="text-sm text-stone-500 max-w-sm text-right">Open any previous estimate and download the PDF report for the client or your records.</p>
        </div>

        {historyLoading ? (
          <p className="text-sm text-stone-500">Loading estimation history...</p>
        ) : historyError ? (
          <p className="text-sm text-red-600">{historyError}</p>
        ) : history.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#efe6df] p-6 text-center text-sm text-stone-500">
            No estimations have been saved yet. Generate one from the estimation page to see it here.
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((item) => (
              <div key={item.id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-xl border border-[#efe6df] bg-[#fcfaf9] px-5 py-4">
                <div>
                  <p className="font-semibold text-[#281713]">{item.project_title}</p>
                  <p className="text-sm text-stone-500">
                    {item.total_area_sqft} sqft · {item.number_of_floors} floors · {item.number_of_rooms} rooms · {item.quality_level.toLowerCase()}
                  </p>
                  <p className="text-sm text-[#8B4434] font-semibold mt-1">LKR {Number(item.total_estimated_cost).toLocaleString()}</p>
                </div>

                <div className="flex items-center gap-3">
                  <a
                    href={`${backendUrl.replace('/api', '')}${item.pdf_url || `/api/estimations/${item.id}/pdf/`}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-full bg-[#8B4434] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white hover:bg-[#6f3829] transition-colors"
                  >
                    Download PDF
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </DashboardShell>
  );
}