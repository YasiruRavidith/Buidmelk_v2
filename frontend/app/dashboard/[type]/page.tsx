"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Briefcase, Store, UserCheck, Inbox, Award, ArrowUpRight, ChevronRight, Sparkles } from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
import DashboardShell from "../components/DashboardShell";
import { mapProfessionToSlug, normalizeProfessionType } from "../utils";

const TYPE_CONFIG: Record<string, { title: string; subtitle: string; highlight: string }> = {
  contractor: {
    title: "Contractor Workspace",
    subtitle: "Manage bids, project pipelines, material orders, and client inquiries.",
    highlight: "Active Bids",
  },
  engineer: {
    title: "Engineer Workspace",
    subtitle: "Track technical consultations, structural site reviews, and project assignments.",
    highlight: "Consultations",
  },
  lawyer: {
    title: "Legal Advisor Workspace",
    subtitle: "Monitor compliance reviews, deed verification, and contract consultations.",
    highlight: "Legal Audits",
  },
  architect: {
    title: "Architect Workspace",
    subtitle: "Oversee architectural design briefs, floor plans, and client milestones.",
    highlight: "Design Briefs",
  },
  qs: {
    title: "Quantity Surveyor Workspace",
    subtitle: "Review bill of quantities (BOQ), material takeoffs, and budget audits.",
    highlight: "Cost Estimates",
  },
  hardware: {
    title: "Hardware Owner Workspace",
    subtitle: "Manage hardware store branches, catalog items, pricing, and buyer inquiries.",
    highlight: "Shop Locations",
  },
  professional: {
    title: "Professional Workspace",
    subtitle: "Manage your professional profile, active bids, and project opportunities.",
    highlight: "Active Opportunities",
  },
};

export default function ProfessionalTypeDashboard({ params }: { params: Promise<{ type: string }> }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000/api";
  const normalizedPathname = pathname.replace(/\/$/, "");
  const resolvedParams = use(params);
  const dashboardType = resolvedParams.type;
  const normalizedDashboardType = normalizeProfessionType(dashboardType);

  const [bidsCount, setBidsCount] = useState<number>(0);

  useEffect(() => {
    const checkAccess = async () => {
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

        if (backendUser.role !== "PROFESSIONAL") {
          router.replace("/dashboard");
          return;
        }

        const professionType = backendUser.professional_profile?.profession_type;
        const expectedSlug = mapProfessionToSlug(professionType);

        if (dashboardType !== expectedSlug) {
          router.replace(`/dashboard/${expectedSlug}`);
        }

        // Fetch submitted bids count
        try {
          const bidsRes = await fetch(`${backendUrl}/bidding/bids/`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (bidsRes.ok) {
            const bidsData = await bidsRes.json();
            const list = Array.isArray(bidsData) ? bidsData : bidsData.results || [];
            setBidsCount(list.length);
          }
        } catch {}

      } catch (error) {
        console.error("Failed to validate dashboard", error);
        router.replace("/login");
      }
    };

    checkAccess();
  }, [backendUrl, dashboardType, loading, router, user]);

  const config = TYPE_CONFIG[dashboardType] || TYPE_CONFIG.professional;
  const overviewPath = `/dashboard/${dashboardType}`;
  const navItems = [
    {
      label: "Overview",
      href: overviewPath,
      description: "Dashboard summary",
      isActive: normalizedPathname === overviewPath || normalizedPathname.startsWith(`${overviewPath}/`),
    },
    {
      label: "Public Profile",
      href: "/profile",
      description: "Update your public profile",
      isActive: normalizedPathname === "/profile",
    },
  ];

  if (normalizedDashboardType === "HARDWARE") {
    navItems.push({
      label: "Manage Shops",
      href: "/dashboard/hardware/shops",
      description: "Add or update shop locations",
      isActive: normalizedPathname === "/dashboard/hardware/shops",
    });
  }

  navItems.push(
    {
      label: "Pending Requests",
      href: "/dashboard/requests",
      description: "New inquiries and tasks",
      isActive: normalizedPathname === "/dashboard/requests",
    },
    {
      label: "Profile Settings",
      href: "/settings",
      description: "Account preferences",
      isActive: normalizedPathname === "/settings",
    }
  );

  return (
    <DashboardShell navItems={navItems}>
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pb-6 border-b border-[#efe6df]">
        <div>
          <p className="text-[#EA580C] font-semibold tracking-widest uppercase text-xs mb-1">
            Professional Portal
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#281713]">{config.title}</h1>
          <p className="text-xs text-[#606060] mt-1 max-w-xl">{config.subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/profile" className="btn-secondary text-xs py-2.5 px-4">
            Edit Public Profile
          </Link>
          {normalizedDashboardType === "HARDWARE" && (
            <Link href="/dashboard/hardware/shops" className="btn-secondary text-xs py-2.5 px-4">
              Manage Shops
            </Link>
          )}
          <Link href="/bidding" className="btn-primary text-xs py-2.5 px-4">
            Find Opportunities
          </Link>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white border border-[#efe6df] p-5 rounded-2xl shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#EA580C]/70">
              Submitted Proposals
            </span>
            <Briefcase className="w-4 h-4 text-[#EA580C]" />
          </div>
          <div className="text-3xl font-serif font-bold text-[#281713]">{bidsCount}</div>
          <p className="text-[11px] text-[#606060]">Active bids &amp; submissions</p>
        </div>

        <div className="bg-white border border-[#efe6df] p-5 rounded-2xl shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#EA580C]/70">Inquiries</span>
            <Inbox className="w-4 h-4 text-[#EA580C]" />
          </div>
          <div className="text-3xl font-serif font-bold text-[#281713]">0</div>
          <p className="text-[11px] text-[#606060]">New client messages</p>
        </div>

        <div className="bg-white border border-[#efe6df] p-5 rounded-2xl shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#EA580C]/70">Verification</span>
            <UserCheck className="w-4 h-4 text-[#EA580C]" />
          </div>
          <div className="text-3xl font-serif font-bold text-[#281713]">Active</div>
          <p className="text-[11px] text-[#606060]">Verified professional status</p>
        </div>

        <div className="bg-white border border-[#efe6df] p-5 rounded-2xl shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#EA580C]/70">Rating</span>
            <Award className="w-4 h-4 text-[#EA580C]" />
          </div>
          <div className="text-3xl font-serif font-bold text-[#281713]">5.0</div>
          <p className="text-[11px] text-[#606060]">Client satisfaction score</p>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white border border-[#efe6df] p-6 rounded-2xl shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#efe6df] pb-3 mb-3">
              <h3 className="font-serif text-lg text-[#281713] font-semibold">{config.highlight}</h3>
              <span className="text-[10px] font-semibold uppercase tracking-wider bg-[#EA580C]/10 text-[#EA580C] px-2.5 py-0.5 rounded-full">
                Overview
              </span>
            </div>
            <p className="text-xs text-[#606060] leading-relaxed">
              Browse open projects posted by homeowners and property developers looking for certified professionals.
            </p>
          </div>
          <Link
            href="/bidding"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#EA580C] uppercase tracking-wider hover:text-[#C2410C]"
          >
            Browse Open Projects <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="bg-white border border-[#efe6df] p-6 rounded-2xl shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#efe6df] pb-3 mb-3">
              <h3 className="font-serif text-lg text-[#281713] font-semibold">Pending Requests</h3>
              <span className="text-[10px] font-semibold uppercase tracking-wider bg-[#EA580C]/10 text-[#EA580C] px-2.5 py-0.5 rounded-full">
                Inbox
              </span>
            </div>
            <p className="text-xs text-[#606060] leading-relaxed">
              Review direct message inquiries, site appointment requests, and consultation bookings.
            </p>
          </div>
          <Link
            href="/dashboard/requests"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#EA580C] uppercase tracking-wider hover:text-[#C2410C]"
          >
            Open Requests <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="bg-white border border-[#efe6df] p-6 rounded-2xl shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#efe6df] pb-3 mb-3">
              <h3 className="font-serif text-lg text-[#281713] font-semibold">Public Showcase</h3>
              <span className="text-[10px] font-semibold uppercase tracking-wider bg-[#EA580C]/10 text-[#EA580C] px-2.5 py-0.5 rounded-full">
                Profile
              </span>
            </div>
            <p className="text-xs text-[#606060] leading-relaxed">
              Keep your profile picture, portfolio photos, certifications, and pricing updated for potential clients.
            </p>
          </div>
          <Link
            href="/profile"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#EA580C] uppercase tracking-wider hover:text-[#C2410C]"
          >
            Manage Profile <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </DashboardShell>
  );
}
