"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Calculator, FolderKanban, Users, FileText, Download, Plus, ArrowRight, Sparkles, Trash2 } from "lucide-react";
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
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000/api";

  const handleDeleteEstimation = async (id: number) => {
    if (!user) return;
    if (!confirm("Are you sure you want to delete this saved estimation?")) return;
    setDeletingId(id);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${backendUrl}/estimations/${id}/delete/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setHistory((prev) => prev.filter((item) => item.id !== id));
      } else {
        alert("Failed to delete estimation.");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting estimation.");
    } finally {
      setDeletingId(null);
    }
  };

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
      {/* Top Banner Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-[#efe6df]">
        <div>
          <p className="text-[#8B4434] font-semibold tracking-widest uppercase text-xs mb-1">
            Homeowner Workspace
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#281713]">
            Welcome, {user?.displayName || "Client"}
          </h1>
          <p className="text-xs text-[#606060] mt-1">
            Manage your construction estimates, active projects, and hired professionals.
          </p>
        </div>
        <Link
          href="/estimation"
          className="btn-primary flex items-center gap-2 text-xs uppercase tracking-wider py-3 px-5 shrink-0"
        >
          <Plus className="w-4 h-4" /> New Project Estimate
        </Link>
      </header>

      {/* KPI Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white border border-[#efe6df] p-5 rounded-none shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8B4434]/70">Estimations</span>
            <Calculator className="w-4 h-4 text-[#8B4434]" />
          </div>
          <div className="text-3xl font-serif font-bold text-[#281713]">
            {historyLoading ? "..." : history.length}
          </div>
          <p className="text-[11px] text-[#606060]">Calculated project reports</p>
        </div>

        <div className="bg-white border border-[#efe6df] p-5 rounded-none shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8B4434]/70">Active Bids</span>
            <FolderKanban className="w-4 h-4 text-[#8B4434]" />
          </div>
          <div className="text-3xl font-serif font-bold text-[#281713]">0</div>
          <p className="text-[11px] text-[#606060]">Ongoing contractor bids</p>
        </div>

        <div className="bg-white border border-[#efe6df] p-5 rounded-none shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8B4434]/70">Saved Contacts</span>
            <Users className="w-4 h-4 text-[#8B4434]" />
          </div>
          <div className="text-3xl font-serif font-bold text-[#281713]">0</div>
          <p className="text-[11px] text-[#606060]">Contractors & engineers</p>
        </div>

        <div className="bg-white border border-[#efe6df] p-5 rounded-none shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8B4434]/70">Pending Tasks</span>
            <FileText className="w-4 h-4 text-[#8B4434]" />
          </div>
          <div className="text-3xl font-serif font-bold text-[#281713]">0</div>
          <p className="text-[11px] text-[#606060]">Inquiries awaiting review</p>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <section className="bg-[#fcfaf9] border border-[#efe6df] p-6 rounded-none space-y-4">
        <h3 className="font-serif text-lg font-semibold text-[#281713]">Quick Actions</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          <Link
            href="/estimation"
            className="p-4 bg-white border border-[#efe6df] hover:border-[#8B4434] transition-colors flex items-center justify-between group"
          >
            <div>
              <div className="text-xs font-semibold text-[#281713]">Create Estimation</div>
              <div className="text-[11px] text-[#606060] mt-0.5">Calculate costs by sqft</div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#8B4434] group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            href="/professionals"
            className="p-4 bg-white border border-[#efe6df] hover:border-[#8B4434] transition-colors flex items-center justify-between group"
          >
            <div>
              <div className="text-xs font-semibold text-[#281713]">Find Professionals</div>
              <div className="text-[11px] text-[#606060] mt-0.5">Contractors & QS Experts</div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#8B4434] group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            href="/bidding"
            className="p-4 bg-white border border-[#efe6df] hover:border-[#8B4434] transition-colors flex items-center justify-between group"
          >
            <div>
              <div className="text-xs font-semibold text-[#281713]">Post Project for Bids</div>
              <div className="text-[11px] text-[#606060] mt-0.5">Receive competitive quotes</div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#8B4434] group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* Estimation History Table / List */}
      <section id="estimation-history" className="bg-white border border-[#efe6df] rounded-none p-6 shadow-xs scroll-mt-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#efe6df] pb-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#8B4434]/70 font-semibold">Saved Reports</p>
            <h2 className="font-serif text-2xl text-[#281713]">Estimation History</h2>
          </div>
          <p className="text-xs text-[#606060] max-w-sm">
            Open any saved estimate and download the official PDF report.
          </p>
        </div>

        {historyLoading ? (
          <div className="py-8 text-center text-xs text-[#606060]">Loading estimation history...</div>
        ) : historyError ? (
          <div className="py-4 text-center text-xs text-red-600 font-medium">{historyError}</div>
        ) : history.length === 0 ? (
          <div className="rounded-none border border-dashed border-[#efe6df] p-10 text-center space-y-3">
            <Calculator className="w-8 h-8 text-[#8B4434]/40 mx-auto" />
            <p className="text-sm font-serif text-[#281713]">No estimations saved yet</p>
            <p className="text-xs text-[#606060] max-w-sm mx-auto">
              Use our smart cost estimation tool to estimate building costs for your land, floors, and rooms.
            </p>
            <Link
              href="/estimation"
              className="btn-primary inline-flex items-center gap-2 text-xs px-5 py-2.5 mt-2"
            >
              Start First Estimation
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((item) => (
              <div
                key={item.id}
                className="flex flex-col md:flex-row md:items-center justify-between gap-4 border border-[#efe6df] bg-[#fcfaf9] p-5 transition-colors hover:border-[#8B4434]/50"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="font-serif text-base font-semibold text-[#281713]">
                      {item.project_title}
                    </span>
                    <span className="px-2.5 py-0.5 text-[10px] uppercase tracking-wider font-semibold bg-[#8B4434]/10 text-[#8B4434]">
                      {item.quality_level}
                    </span>
                  </div>
                  <p className="text-xs text-[#606060]">
                    {item.total_area_sqft} sqft · {item.number_of_floors} floors · {item.number_of_rooms} rooms
                  </p>
                  <p className="text-xs font-semibold text-[#8B4434]">
                    LKR {Number(item.total_estimated_cost).toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <a
                    href={`${backendUrl.replace("/api", "")}${item.pdf_url || `/api/estimations/${item.id}/pdf/`}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-primary inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider"
                  >
                    <Download className="w-3.5 h-3.5" /> Download PDF
                  </a>
                  <button
                    type="button"
                    onClick={() => handleDeleteEstimation(item.id)}
                    disabled={deletingId === item.id}
                    className="p-2.5 text-[#8B4434] hover:bg-rose-50 border border-[#efe6df] hover:border-rose-200 transition-colors disabled:opacity-50"
                    title="Delete estimation"
                  >
                    <Trash2 className="w-4 h-4 text-rose-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </DashboardShell>
  );
}