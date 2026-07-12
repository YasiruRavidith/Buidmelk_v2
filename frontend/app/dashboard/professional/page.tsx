"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import DashboardShell from "../components/DashboardShell";
import { useAuth } from "../../../hooks/useAuth";
import { normalizeProfessionType } from "../utils";

export default function ProfessionalDashboard() {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000/api";

  const [professionType, setProfessionType] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [bids, setBids] = useState<any[]>([]);
  const [bidsLoading, setBidsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (loading) return;

      if (!user) {
        setIsLoading(false);
        setBidsLoading(false);
        return;
      }

      try {
        const token = await user.getIdToken();
        
        // 1. Fetch user role
        const profileRes = await fetch(`${backendUrl}/users/auth/verify/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const profileResult = await profileRes.json();
        if (profileRes.ok && profileResult?.user) {
          setProfessionType(normalizeProfessionType(profileResult.user.professional_profile?.profession_type) || null);
        }

        // 2. Fetch professional bids
        const bidsRes = await fetch(`${backendUrl}/bidding/bids/`, {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });
        if (bidsRes.ok) {
          const bidsData = await bidsRes.json();
          setBids(bidsData);
        }
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setIsLoading(false);
        setBidsLoading(false);
      }
    };

    loadData();
  }, [backendUrl, loading, user]);

  const isHardware = professionType === "HARDWARE";
  const navItems = [
    {
      label: "Overview",
      href: "/dashboard/professional",
      description: "Dashboard summary",
      isActive: pathname === "/dashboard/professional",
    },
    {
      label: "Public Profile",
      href: "/profile",
      description: "Update your public profile",
      isActive: pathname === "/profile",
    },
    ...(isHardware
      ? [
          {
            label: "Manage Shops",
            href: "/dashboard/hardware/shops",
            description: "Add or update shop locations",
            isActive: pathname === "/dashboard/hardware/shops",
          },
        ]
      : []),
    {
      label: "Pending Requests",
      href: "/dashboard/requests",
      description: "New inquiries and tasks",
      isActive: pathname === "/dashboard/requests",
    },
    {
      label: "Profile Settings",
      href: "/settings",
      description: "Account preferences",
      isActive: pathname === "/settings",
    },
  ];

  const activeBidsCount = bids.filter((bid: any) => bid.status === 'PENDING').length;
  const jobsWonCount = bids.filter((bid: any) => bid.status === 'ACCEPTED').length;

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6 py-24">
        <div className="text-stone-600 text-sm">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <DashboardShell navItems={navItems}>
      <header className="flex justify-between items-end pb-8 border-b border-stone-200">
        <div>
          <p className="text-[#8B4434] font-semibold tracking-widest uppercase text-sm mb-2">Professional Dashboard</p>
          <h1 className="font-serif text-4xl text-stone-900">Welcome, {user?.displayName || 'Partner'}</h1>
        </div>
        <button className="btn-secondary border-orange-200">Edit Public Profile</button>
      </header>

      <div className="grid md:grid-cols-4 gap-6">
        <div className="card-luxury flex flex-col justify-center items-center text-center py-8">
          <span className="text-4xl font-serif text-stone-900">
            {bidsLoading ? "..." : activeBidsCount}
          </span>
          <span className="text-sm text-stone-500 mt-2 uppercase tracking-wider">Active Bids</span>
        </div>
        <div className="card-luxury flex flex-col justify-center items-center text-center py-8">
          <span className="text-4xl font-serif text-stone-900">
            {bidsLoading ? "..." : jobsWonCount}
          </span>
          <span className="text-sm text-stone-500 mt-2 uppercase tracking-wider">Jobs Won</span>
        </div>
        <div className="card-luxury flex flex-col justify-center items-center text-center py-8">
          <span className="text-4xl font-serif text-stone-900">0.0</span>
          <span className="text-sm text-stone-500 mt-2 uppercase tracking-wider">Avg Rating</span>
        </div>
        <Link 
          href="/bidding" 
          className="card-luxury flex flex-col justify-center items-center text-center py-8 bg-[#8B4434] text-[#FCFAF7] border-transparent hover:bg-[#6c3426] transition-colors cursor-pointer"
        >
          <span className="text-xl font-serif mb-2 text-[#FCFAF7]">Find Work</span>
          <span className="text-sm text-[#FCFAF7]/70 uppercase tracking-wider">Open public bids →</span>
        </Link>
      </div>

      <section className="bg-white border border-[#efe6df] rounded-none p-6 shadow-sm mt-8">
        <div className="flex items-start justify-between gap-4 border-b border-[#efe6df] pb-4 mb-5">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#8B4434]/60">Bidding History</p>
            <h2 className="font-serif text-2xl text-[#281713]">My Applied Proposals</h2>
          </div>
          <p className="text-sm text-stone-500 max-w-sm text-right">
            Track and monitor the status of proposals you have submitted to homeowners.
          </p>
        </div>

        {bidsLoading ? (
          <p className="text-sm text-stone-500">Loading applied bids...</p>
        ) : bids.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#efe6df] p-6 text-center text-sm text-stone-500">
            You haven't submitted any bids yet. Go to the Bidding Feed to find active tenders.
          </div>
        ) : (
          <div className="space-y-4">
            {bids.map((bid) => {
              const statusColors: any = {
                'PENDING': 'bg-amber-50 text-amber-700 border border-amber-200',
                'ACCEPTED': 'bg-green-50 text-green-700 border border-green-200',
                'REJECTED': 'bg-rose-50 text-rose-700 border border-rose-200'
              };
              
              return (
                <div key={bid.id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-xl border border-[#efe6df] bg-[#FCFAF7] px-5 py-4">
                  <div className="space-y-1">
                    <p className="font-semibold text-[#281713] text-lg">{bid.project_title || `Project #${bid.project}`}</p>
                    <p className="text-sm text-stone-500">
                      Bid Amount: <span className="font-semibold text-orange-600">LKR {Number(bid.bid_amount).toLocaleString('en-LK')}</span> · Estimated: <span className="font-semibold text-stone-800">{bid.estimated_days} Days</span>
                    </p>
                    <p className="text-xs text-stone-400">
                      Submitted on {new Date(bid.created_at).toLocaleDateString('en-LK')}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className={`px-2.5 py-0.5 text-xs font-semibold uppercase rounded-full ${statusColors[bid.status] || 'bg-stone-50 text-stone-500'}`}>
                      {bid.status}
                    </span>
                    <Link
                      href={`/bidding/${bid.project}`}
                      className="inline-flex items-center justify-center rounded-full bg-[#8B4434] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white hover:bg-[#6f3829] transition-colors"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </DashboardShell>
  );
}