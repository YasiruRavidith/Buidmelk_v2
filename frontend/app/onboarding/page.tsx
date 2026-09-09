"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, HardHat, Check, ArrowRight, ShieldCheck } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

const PROFESSIONS = [
  { label: "Contractor", value: "CONTRACTOR" },
  { label: "Engineer", value: "ENGINEER" },
  { label: "Lawyer", value: "LAWYER" },
  { label: "Architect", value: "ARCHITECT" },
  { label: "QS (Quantity Surveyor)", value: "QS" },
  { label: "Hardware Owner", value: "HARDWARE" },
  { label: "Worker", value: "WORKER" },
  { label: "Electrician", value: "ELECTRICIAN" },
  { label: "Plumber", value: "PLUMBER" },
  { label: "Welder", value: "WELDER" },
  { label: "Painter", value: "PAINTER" },
];

export default function Onboarding() {
  const { user, loading } = useAuth();
  const [role, setRole] = useState<"CLIENT" | "PROFESSIONAL" | null>(null);
  const [professionType, setProfessionType] = useState("");
  const [location, setLocation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingRole, setIsCheckingRole] = useState(true);
  const router = useRouter();
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000/api";

  useEffect(() => {
    const checkExistingRole = async () => {
      if (loading) {
        return;
      }

      if (!user) {
        setIsCheckingRole(false);
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
        const backendRole = result?.user?.role;

        if (backendRole === "CLIENT" || backendRole === "PROFESSIONAL") {
          router.replace("/dashboard");
          return;
        }
      } catch (error) {
        console.error("Error checking onboarding role:", error);
      } finally {
        setIsCheckingRole(false);
      }
    };

    checkExistingRole();
  }, [backendUrl, loading, router, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      alert("Please sign in to continue.");
      return;
    }

    if (!role) {
      return;
    }

    setIsSubmitting(true);

    try {
      const token = await user.getIdToken();
      const payload: {
        token: string;
        role: "CLIENT" | "PROFESSIONAL";
        profession_type?: string;
        location?: string;
      } = { token, role };

      if (role === "PROFESSIONAL") {
        payload.profession_type = professionType;
        payload.location = location;
      }

      const response = await fetch(`${backendUrl}/users/onboarding/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.error || "Failed to update your role.");
        return;
      }

      router.push("/dashboard");
    } catch (error) {
      console.error(error);
      alert("Network Error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || isCheckingRole) {
    return (
      <div className="min-h-screen bg-[#FCFAF7] text-[#281713] flex items-center justify-center p-6 py-24">
        <div className="text-[#606060] text-xs font-semibold uppercase tracking-widest flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-[#8B4434] border-t-transparent rounded-full animate-spin" />
          <span>Setting up your workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FCFAF7] text-[#281713] flex items-center justify-center p-6 py-12">
      <div className="max-w-3xl w-full space-y-10">
        {/* Header */}
        <div className="text-center space-y-3">
          <p className="text-[#8B4434] font-semibold tracking-widest uppercase text-xs">
            Welcome to BuildMe.lk
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#281713] leading-tight">
            How Will You Use Your Workspace?
          </h1>
          <p className="text-xs sm:text-sm text-[#606060] max-w-lg mx-auto leading-relaxed">
            Select your primary goal to tailor your dashboard tools, estimation preferences, and professional features.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Role Choice Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            <div
              onClick={() => setRole("CLIENT")}
              className={`p-8 cursor-pointer transition-all border relative ${
                role === "CLIENT"
                  ? "border-[#8B4434] bg-[#fff7ed] shadow-md"
                  : "border-[#efe6df] bg-white hover:border-[#8B4434]/50 hover:bg-[#fcfaf9]"
              }`}
            >
              <div
                className={`h-12 w-12 mb-6 flex items-center justify-center border ${
                  role === "CLIENT"
                    ? "bg-[#8B4434] text-white border-[#8B4434]"
                    : "bg-[#f3ebe4] text-[#8B4434] border-[#efe6df]"
                }`}
              >
                <User className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-2xl mb-2 text-[#281713]">I am a Homeowner</h3>
              <p className="text-xs text-[#606060] leading-relaxed">
                I want to calculate construction estimates, view material price trends, find certified contractors, and manage home builds.
              </p>
              {role === "CLIENT" && (
                <div className="absolute top-4 right-4 text-[#8B4434]">
                  <Check className="w-5 h-5" />
                </div>
              )}
            </div>

            <div
              onClick={() => setRole("PROFESSIONAL")}
              className={`p-8 cursor-pointer transition-all border relative ${
                role === "PROFESSIONAL"
                  ? "border-[#8B4434] bg-[#fff7ed] shadow-md"
                  : "border-[#efe6df] bg-white hover:border-[#8B4434]/50 hover:bg-[#fcfaf9]"
              }`}
            >
              <div
                className={`h-12 w-12 mb-6 flex items-center justify-center border ${
                  role === "PROFESSIONAL"
                    ? "bg-[#8B4434] text-white border-[#8B4434]"
                    : "bg-[#f3ebe4] text-[#8B4434] border-[#efe6df]"
                }`}
              >
                <HardHat className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-2xl mb-2 text-[#281713]">I am a Professional</h3>
              <p className="text-xs text-[#606060] leading-relaxed">
                I offer construction services, bid on active client projects, list hardware inventory, and showcase my professional profile.
              </p>
              {role === "PROFESSIONAL" && (
                <div className="absolute top-4 right-4 text-[#8B4434]">
                  <Check className="w-5 h-5" />
                </div>
              )}
            </div>
          </div>

          {/* Professional Details Section */}
          {role === "PROFESSIONAL" && (
            <div className="bg-white p-6 sm:p-8 border border-[#efe6df] space-y-6 shadow-xs">
              <h2 className="font-serif text-xl sm:text-2xl text-[#281713] border-b border-[#efe6df] pb-4">
                Professional Specialty
              </h2>
              <div className="grid md:grid-cols-2 gap-6 pt-1">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8B4434]">
                    Profession Category
                  </label>
                  <select
                    required
                    value={professionType}
                    onChange={(e) => setProfessionType(e.target.value)}
                    className="w-full border border-[#efe6df] bg-[#FCFAF7] text-[#281713] px-4 py-3 text-sm focus:outline-none focus:border-[#8B4434] transition-colors"
                  >
                    <option value="" disabled>
                      Select your primary field...
                    </option>
                    {PROFESSIONS.map((prof) => (
                      <option key={prof.value} value={prof.value}>
                        {prof.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8B4434]">
                    Primary Location / Province
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Colombo, Western Province"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full border border-[#efe6df] bg-[#FCFAF7] text-[#281713] px-4 py-3 text-sm focus:outline-none focus:border-[#8B4434] transition-colors"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Submit Action */}
          {role && (
            <div className="pt-2">
              <button
                type="submit"
                className="w-full btn-primary py-4 text-xs font-semibold uppercase tracking-widest flex items-center justify-center gap-2"
                disabled={isSubmitting}
              >
                <span>{isSubmitting ? "Saving Preferences..." : "Enter Workspace Dashboard"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}