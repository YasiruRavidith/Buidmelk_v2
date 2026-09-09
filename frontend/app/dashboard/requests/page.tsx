"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Trash2, ExternalLink, Briefcase, FileText, Lock, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import DashboardShell from "../components/DashboardShell";
import { useAuth } from "../../../hooks/useAuth";
import { normalizeProfessionType } from "../utils";

type RoleInfo = {
  role: "CLIENT" | "PROFESSIONAL" | "ADMIN" | null;
  professionType?: string | null;
};

interface BidItem {
  id: number;
  project: number;
  project_title?: string;
  bid_amount: string;
  cover_letter: string;
  estimated_days: number;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  created_at: string;
}

interface ProjectItem {
  id: number;
  title: string;
  description: string;
  location: string;
  budget_range: string;
  status: string;
  created_at: string;
  bids_count?: number;
}

const mapProfessionToSlug = (professionType?: string | null) => {
  switch (professionType) {
    case "CONTRACTOR":
      return "contractor";
    case "ENGINEER":
      return "engineer";
    case "LAWYER":
      return "lawyer";
    case "ARCHITECT":
      return "architect";
    case "QS":
      return "qs";
    case "HARDWARE":
      return "hardware";
    default:
      return "professional";
  }
};

export default function PendingRequestsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000/api";

  const [roleInfo, setRoleInfo] = useState<RoleInfo>({ role: null, professionType: null });
  const [isLoading, setIsLoading] = useState(true);

  // Bids state (for professionals)
  const [myBids, setMyBids] = useState<BidItem[]>([]);
  const [bidsLoading, setBidsLoading] = useState(false);
  const [deletingBidId, setDeletingBidId] = useState<number | null>(null);

  // Projects state (for clients)
  const [myProjects, setMyProjects] = useState<ProjectItem[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);

  useEffect(() => {
    const loadRoleAndData = async () => {
      if (loading) return;

      if (!user) {
        router.replace("/login");
        return;
      }

      try {
        const token = await user.getIdToken();
        const response = await fetch(`${backendUrl}/users/auth/verify/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const result = await response.json();
        const backendUser = result?.user;

        if (!response.ok || !backendUser) {
          router.replace("/login");
          return;
        }

        setRoleInfo({
          role: backendUser.role || null,
          professionType: backendUser.professional_profile?.profession_type || null,
        });

        // Fetch Submitted Bids
        setBidsLoading(true);
        try {
          const bidsRes = await fetch(`${backendUrl}/bidding/bids/`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (bidsRes.ok) {
            const bidsData = await bidsRes.json();
            setMyBids(Array.isArray(bidsData) ? bidsData : bidsData.results || []);
          }
        } catch (e) {
          console.error("Failed to load bids", e);
        } finally {
          setBidsLoading(false);
        }

        // Fetch My Projects (Tenders)
        setProjectsLoading(true);
        try {
          const projRes = await fetch(`${backendUrl}/bidding/projects/`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (projRes.ok) {
            const projData = await projRes.json();
            const list = Array.isArray(projData) ? projData : projData.results || [];
            // Filter projects owned by this user
            const owned = list.filter((p: any) => p.client_firebase_uid === user.uid || p.client === backendUser.id);
            setMyProjects(owned.length > 0 ? owned : list);
          }
        } catch (e) {
          console.error("Failed to load projects", e);
        } finally {
          setProjectsLoading(false);
        }

      } catch (error) {
        console.error("Failed to load role & data", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadRoleAndData();
  }, [backendUrl, loading, router, user]);

  // Delete bid handler
  const handleDeleteBid = async (bidId: number) => {
    if (!user) return;
    if (!confirm("Are you sure you want to withdraw/delete this submitted bid? This action cannot be undone.")) return;

    setDeletingBidId(bidId);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${backendUrl}/bidding/bids/${bidId}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setMyBids((prev) => prev.filter((b) => b.id !== bidId));
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to delete bid.");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting bid.");
    } finally {
      setDeletingBidId(null);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6 py-24">
        <div className="text-stone-600 text-sm">Loading requests &amp; proposals...</div>
      </div>
    );
  }

  const overviewPath = roleInfo.role === "CLIENT"
    ? "/dashboard/client"
    : roleInfo.role === "PROFESSIONAL"
      ? `/dashboard/${mapProfessionToSlug(roleInfo.professionType)}`
      : "/dashboard";

  const navItems = [
    {
      label: "Overview",
      href: overviewPath,
      description: "Dashboard summary",
      isActive: pathname === overviewPath,
    },
    {
      label: "Public Profile",
      href: "/profile",
      description: "Update your public profile",
      isActive: pathname === "/profile",
    },
  ];

  if (roleInfo.role === "PROFESSIONAL" && normalizeProfessionType(roleInfo.professionType) === "HARDWARE") {
    navItems.push({
      label: "Manage Shops",
      href: "/dashboard/hardware/shops",
      description: "Add or update shop locations",
      isActive: pathname === "/dashboard/hardware/shops",
    });
  }

  navItems.push(
    {
      label: "Pending Requests",
      href: "/dashboard/requests",
      description: "New inquiries and submitted bids",
      isActive: pathname === "/dashboard/requests",
    },
    {
      label: "Profile Settings",
      href: "/settings",
      description: "Account preferences",
      isActive: pathname === "/settings",
    }
  );

  const fmt = (num: string | number) =>
    new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Number(num));

  const statusColors: Record<string, string> = {
    PENDING: "bg-amber-50 text-amber-800 border-amber-200",
    ACCEPTED: "bg-emerald-50 text-emerald-800 border-emerald-200",
    REJECTED: "bg-rose-50 text-rose-800 border-rose-200",
    OPEN: "bg-emerald-50 text-emerald-800 border-emerald-200",
    IN_PROGRESS: "bg-blue-50 text-blue-800 border-blue-200",
  };

  return (
    <DashboardShell navItems={navItems}>
      <header className="pb-6 border-b border-[#efe6df] space-y-1">
        <p className="text-[#8B4434] font-semibold tracking-widest uppercase text-xs">Activity Center</p>
        <h1 className="font-serif text-3xl sm:text-4xl text-[#281713]">My Proposals &amp; Requests</h1>
        <p className="text-xs text-[#606060]">
          Manage your submitted proposals, withdraw bids, and review project inquiries.
        </p>
      </header>

      {/* SECTION 1: MY SUBMITTED BIDS / PROPOSALS (FOR PROFESSIONALS & EVERYONE) */}
      <section className="bg-white border border-[#efe6df] p-6 rounded-none space-y-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-[#efe6df] pb-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#8B4434] font-semibold">Contractor / Professional</p>
            <h2 className="font-serif text-2xl text-[#281713]">My Submitted Bids ({myBids.length})</h2>
          </div>
          <Link
            href="/bidding"
            className="btn-primary text-[10px] uppercase tracking-wider py-2 px-4 inline-flex items-center gap-1.5"
          >
            Find New Projects <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        {bidsLoading ? (
          <div className="py-8 text-center text-xs text-[#606060]">Loading your submitted bids...</div>
        ) : myBids.length === 0 ? (
          <div className="border border-dashed border-[#efe6df] p-8 text-center space-y-3">
            <Briefcase className="w-8 h-8 text-[#8B4434]/30 mx-auto" />
            <p className="text-sm font-serif text-[#281713]">No bids submitted yet</p>
            <p className="text-xs text-[#606060] max-w-sm mx-auto">
              Browse open project tenders on the bidding feed and submit competitive proposals.
            </p>
            <Link href="/bidding" className="btn-primary inline-flex items-center gap-2 text-xs px-5 py-2.5 mt-2">
              Browse Open Bids
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {myBids.map((bid) => (
              <div
                key={bid.id}
                className="border border-[#efe6df] bg-[#FCFAF7] p-5 space-y-4 transition-colors hover:border-[#8B4434]/40"
              >
                {/* Header Row */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#efe6df] pb-3">
                  <div>
                    <h3 className="font-serif text-base font-semibold text-[#281713]">
                      {bid.project_title || `Project Tender #${bid.project}`}
                    </h3>
                    <p className="text-[10px] text-[#908078] mt-0.5">
                      Submitted on {new Date(bid.created_at).toLocaleDateString("en-LK", { year: "numeric", month: "short", day: "numeric" })}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${statusColors[bid.status] || "bg-stone-50 text-stone-700"}`}>
                      {bid.status}
                    </span>
                    <Link
                      href={`/bidding/${bid.project}`}
                      className="text-xs text-[#8B4434] font-semibold hover:underline inline-flex items-center gap-1 border border-[#8B4434]/20 px-3 py-1 bg-white"
                    >
                      View Tender <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>

                {/* Proposal Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-[#908078] font-semibold block">Your Bid Amount</span>
                    <span className="font-serif text-lg font-bold text-[#8B4434]">{fmt(bid.bid_amount)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-[#908078] font-semibold block">Timeline</span>
                    <span className="font-semibold text-[#281713] text-sm">{bid.estimated_days} Days</span>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <span className="text-[10px] uppercase tracking-wider text-[#908078] font-semibold block">Proposal Status</span>
                    <span className="text-xs text-[#281713]">
                      {bid.status === "PENDING" && "Under client review"}
                      {bid.status === "ACCEPTED" && "🎉 Accepted by Client"}
                      {bid.status === "REJECTED" && "Not selected"}
                    </span>
                  </div>
                </div>

                {/* Cover letter snippet */}
                {bid.cover_letter && (
                  <div className="bg-white border border-[#efe6df] p-3 text-xs text-[#606060] leading-relaxed">
                    <p className="text-[9px] uppercase tracking-wider font-semibold text-[#908078] mb-1">Cover Letter Snippet</p>
                    <p className="line-clamp-2">{bid.cover_letter}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-[#efe6df]">
                  <p className="text-[10px] text-[#908078]">
                    {bid.status === "PENDING" ? "You can withdraw your proposal before the client accepts it." : "Proposal completed."}
                  </p>

                  <button
                    type="button"
                    onClick={() => handleDeleteBid(bid.id)}
                    disabled={deletingBidId === bid.id}
                    className="inline-flex items-center gap-1.5 text-xs text-rose-700 font-semibold hover:bg-rose-50 border border-rose-200 px-3 py-1.5 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {deletingBidId === bid.id ? "Deleting..." : "Delete Bid"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SECTION 2: MY POSTED PROJECTS / TENDERS (FOR CLIENTS / OWNERS) */}
      <section className="bg-white border border-[#efe6df] p-6 rounded-none space-y-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-[#efe6df] pb-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#8B4434] font-semibold">Homeowner / Client</p>
            <h2 className="font-serif text-2xl text-[#281713]">My Posted Project Tenders ({myProjects.length})</h2>
          </div>
          <Link
            href="/bidding"
            className="btn-primary text-[10px] uppercase tracking-wider py-2 px-4 inline-flex items-center gap-1.5"
          >
            Post New Tender <FileText className="w-3 h-3" />
          </Link>
        </div>

        {projectsLoading ? (
          <div className="py-8 text-center text-xs text-[#606060]">Loading posted project tenders...</div>
        ) : myProjects.length === 0 ? (
          <div className="border border-dashed border-[#efe6df] p-8 text-center space-y-3">
            <FileText className="w-8 h-8 text-[#8B4434]/30 mx-auto" />
            <p className="text-sm font-serif text-[#281713]">No posted tenders found</p>
            <p className="text-xs text-[#606060] max-w-sm mx-auto">
              Post a project tender to invite certified contractors and engineers to submit competitive bids.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {myProjects.map((proj) => (
              <div
                key={proj.id}
                className="border border-[#efe6df] bg-[#FCFAF7] p-5 space-y-3 transition-colors hover:border-[#8B4434]/40"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-serif text-lg font-semibold text-[#281713]">{proj.title}</h3>
                    <p className="text-xs text-[#606060] mt-0.5">
                      Location: {proj.location} • Budget: <span className="font-semibold text-[#8B4434]">{proj.budget_range}</span>
                    </p>
                  </div>
                  <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${statusColors[proj.status] || "bg-stone-50 text-stone-700"}`}>
                    {proj.status}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[#efe6df] text-xs">
                  <span className="text-[#908078]">
                    Proposals Submitted: <strong>{proj.bids_count ?? 0}</strong>
                  </span>
                  <Link
                    href={`/bidding/${proj.id}`}
                    className="btn-primary text-[10px] uppercase tracking-widest px-4 py-2"
                  >
                    View Proposals &amp; Unlock
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </DashboardShell>
  );
}
