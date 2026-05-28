"use client";

import Link from "next/link";
import { use, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../../../hooks/useAuth";
import DashboardShell from "../components/DashboardShell";
import { mapProfessionToSlug, normalizeProfessionType } from "../utils";

const TYPE_CONFIG: Record<string, { title: string; subtitle: string; highlight: string }> = {
  contractor: {
    title: "Contractor Dashboard",
    subtitle: "Manage bids, project pipelines, and client requests.",
    highlight: "Active contracts",
  },
  engineer: {
    title: "Engineer Dashboard",
    subtitle: "Track technical consultations and upcoming site visits.",
    highlight: "Technical reviews",
  },
  lawyer: {
    title: "Lawyer Dashboard",
    subtitle: "Monitor compliance checks and contract reviews.",
    highlight: "Legal reviews",
  },
  architect: {
    title: "Architect Dashboard",
    subtitle: "Oversee design briefs and project milestones.",
    highlight: "Design briefs",
  },
  qs: {
    title: "QS Dashboard",
    subtitle: "Review quantity takeoffs and cost summaries.",
    highlight: "Cost audits",
  },
  hardware: {
    title: "Hardware Owner Dashboard",
    subtitle: "Update your shop presence, catalog, and featured stock.",
    highlight: "Shop inquiries",
  },
  professional: {
    title: "Professional Dashboard",
    subtitle: "Manage your professional presence and active opportunities.",
    highlight: "Active bids",
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
      <header className="flex flex-col gap-4 pb-8 border-b border-stone-200">
        <div>
          <p className="text-orange-600 font-semibold tracking-widest uppercase text-sm mb-2">Professional Dashboard</p>
          <h1 className="font-serif text-4xl text-stone-900">{config.title}</h1>
          <p className="text-stone-500 mt-3 max-w-2xl">{config.subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <Link href="/profile" className="btn-secondary border-orange-200">
            Edit Public Profile
          </Link>
          {normalizedDashboardType === "HARDWARE" && (
            <Link href="/dashboard/hardware/shops" className="btn-secondary border-orange-200">
              Manage Shops
            </Link>
          )}
          <Link href="/bidding" className="btn-primary">
            Find New Opportunities
          </Link>
        </div>
      </header>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="card-luxury h-48 flex flex-col justify-between">
          <h3 className="font-serif text-xl border-b border-stone-100 pb-3">{config.highlight}</h3>
          <p className="text-stone-400 text-sm text-center">No items to show yet.</p>
          <button className="text-orange-600 text-sm font-semibold uppercase tracking-wider text-left">View Details →</button>
        </div>
        <div className="card-luxury h-48 flex flex-col justify-between">
          <h3 className="font-serif text-xl border-b border-stone-100 pb-3">Pending Requests</h3>
          <p className="text-stone-400 text-sm text-center">No new requests.</p>
          <button className="text-orange-600 text-sm font-semibold uppercase tracking-wider text-left">View Requests →</button>
        </div>
        <div className="card-luxury h-48 flex flex-col justify-between">
          <h3 className="font-serif text-xl border-b border-stone-100 pb-3">Performance</h3>
          <p className="text-stone-400 text-sm text-center">No stats available.</p>
          <button className="text-orange-600 text-sm font-semibold uppercase tracking-wider text-left">See Insights →</button>
        </div>
      </div>
    </DashboardShell>
  );
}
