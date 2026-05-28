"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../hooks/useAuth";
import { mapProfessionToSlug, normalizeProfessionType } from "./utils";

export default function DashboardRedirect() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000/api";

  useEffect(() => {
    const redirectToDashboard = async () => {
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

        if (!backendUser.role) {
          router.replace("/onboarding");
          return;
        }

        if (backendUser.role === "CLIENT") {
          router.replace("/dashboard/client");
          return;
        }

        if (backendUser.role === "PROFESSIONAL") {
          const professionType = normalizeProfessionType(backendUser.professional_profile?.profession_type);
          const slug = mapProfessionToSlug(professionType);
          router.replace(`/dashboard/${slug}`);
          return;
        }

        router.replace("/");
      } catch (error) {
        console.error("Failed to load dashboard", error);
        router.replace("/login");
      }
    };

    redirectToDashboard();
  }, [backendUrl, loading, router, user]);

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6 py-24">
      <div className="text-stone-600 text-sm">Loading your dashboard...</div>
    </div>
  );
}
