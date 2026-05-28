"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import DashboardShell from "../components/DashboardShell";
import { useAuth } from "../../../hooks/useAuth";
import { normalizeProfessionType } from "../utils";

export default function ProfessionalDashboard() {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000/api";

  const [professionType, setProfessionType] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadRole = async () => {
      if (loading) return;

      if (!user) {
        setIsLoading(false);
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
        if (response.ok && result?.user) {
          setProfessionType(normalizeProfessionType(result.user.professional_profile?.profession_type) || null);
        }
      } catch (error) {
        console.error("Failed to load profile type", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadRole();
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
          <span className="text-4xl font-serif text-stone-900">0</span>
          <span className="text-sm text-stone-500 mt-2 uppercase tracking-wider">Active Bids</span>
        </div>
        <div className="card-luxury flex flex-col justify-center items-center text-center py-8">
          <span className="text-4xl font-serif text-stone-900">0</span>
          <span className="text-sm text-stone-500 mt-2 uppercase tracking-wider">Jobs Won</span>
        </div>
        <div className="card-luxury flex flex-col justify-center items-center text-center py-8">
          <span className="text-4xl font-serif text-stone-900">0.0</span>
          <span className="text-sm text-stone-500 mt-2 uppercase tracking-wider">Avg Rating</span>
        </div>
        <div className="card-luxury flex flex-col justify-center items-center text-center py-8 bg-orange-600 text-white border-transparent">
          <span className="text-xl font-serif mb-2">Find Work</span>
          <span className="text-sm text-orange-200 uppercase tracking-wider">Open public bids →</span>
        </div>
      </div>
    </DashboardShell>
  );
}