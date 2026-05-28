"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import DashboardShell from "../components/DashboardShell";
import { useAuth } from "../../../hooks/useAuth";
import { normalizeProfessionType } from "../utils";

type RoleInfo = {
  role: "CLIENT" | "PROFESSIONAL" | "ADMIN" | null;
  professionType?: string | null;
};

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

  useEffect(() => {
    const loadRole = async () => {
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
      } catch (error) {
        console.error("Failed to load role", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadRole();
  }, [backendUrl, loading, router, user]);

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6 py-24">
        <div className="text-stone-600 text-sm">Loading requests...</div>
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
      description: "New inquiries and tasks",
      isActive: pathname === "/dashboard/requests",
    },
    {
      label: "Profile Settings",
      href: "/settings",
      description: "Account preferences",
      isActive: pathname === "/settings",
    }
  );

  return (
    <DashboardShell navItems={navItems}>
      <header className="pb-6 border-b border-stone-200">
        <p className="text-[#8B4434] font-semibold tracking-widest uppercase text-sm mb-2">Requests</p>
        <h1 className="font-serif text-4xl text-stone-900">Pending Requests</h1>
        <p className="text-stone-500 mt-2">Incoming requests and opportunities will appear here.</p>
      </header>

      <div className="bg-white border border-stone-200 rounded-2xl p-8 text-stone-500">
        No pending requests yet.
      </div>
    </DashboardShell>
  );
}
