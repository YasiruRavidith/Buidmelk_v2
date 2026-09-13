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
  const { user, loading, refreshUser } = useAuth();
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

      // If professional, record registration fee
      if (role === "PROFESSIONAL") {
        try {
          await fetch(`${backendUrl}/users/professional/pay-registration/`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
              token,
              transaction_ref: "ONBOARDING_REGISTRATION"
            })
          });
        } catch (feeErr) {
          console.error("Registration fee error:", feeErr);
        }
      }

      await refreshUser();
      window.dispatchEvent(new Event("userUpdated"));
      window.dispatchEvent(new Event("ticketsUpdated"));
      window.dispatchEvent(new Event("cartUpdated"));

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
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`h-12 w-12 flex items-center justify-center border ${
                    role === "CLIENT"
                      ? "bg-[#8B4434] text-white border-[#8B4434]"
                      : "bg-[#f3ebe4] text-[#8B4434] border-[#efe6df]"
                  }`}
                >
                  <User className="w-6 h-6" />
                </div>
                <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1">
                  100% Free
                </span>
              </div>
              <h3 className="font-serif text-2xl mb-2 text-[#281713]">I am a Homeowner</h3>
              <p className="text-xs text-[#606060] leading-relaxed">
                Free registration. Calculate civil engineering BOQ estimates, browse material prices, and contact verified contractors freely.
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
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`h-12 w-12 flex items-center justify-center border ${
                    role === "PROFESSIONAL"
                      ? "bg-[#8B4434] text-white border-[#8B4434]"
                      : "bg-[#f3ebe4] text-[#8B4434] border-[#efe6df]"
                  }`}
                >
                  <HardHat className="w-6 h-6" />
                </div>
                <span className="bg-[#8B4434]/10 text-[#8B4434] border border-[#8B4434]/30 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1">
                  LKR 1,000 One-Time
                </span>
              </div>
              <h3 className="font-serif text-2xl mb-2 text-[#281713]">I am a Professional</h3>
              <p className="text-xs text-[#606060] leading-relaxed">
                Offer construction services, submit proposals on client project tenders, showcase your portfolio, and list hardware items.
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
              <div className="border-b border-[#efe6df] pb-4">
                <h2 className="font-serif text-xl sm:text-2xl text-[#281713]">
                  Professional Specialty &amp; Activation
                </h2>
                <p className="text-xs text-[#606060] mt-1">
                  Set up your business category and complete your verified registration.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
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

              {/* One-Time Registration Fee Card */}
              <div className="p-5 bg-[#8B4434]/5 border border-[#8B4434]/20 space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-serif text-base text-[#1c1108]">One-Time Registration Fee</h4>
                    <p className="text-xs text-[#606060]">Activates your professional profile &amp; verified listing</p>
                  </div>
                  <span className="font-serif text-2xl text-[#8B4434]">LKR 1,000</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-700 font-semibold pt-1 border-t border-[#8B4434]/15">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Instant activation enabled for verification &amp; onboarding demo</span>
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
                <span>
                  {isSubmitting 
                    ? "Setting up workspace..." 
                    : role === "PROFESSIONAL" 
                    ? "Pay Registration Fee (LKR 1,000) & Enter Dashboard" 
                    : "Complete Free Registration & Enter"}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}