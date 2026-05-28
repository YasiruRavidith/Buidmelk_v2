"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  { label: "Painter", value: "PAINTER" }
];

export default function Onboarding() {
  const { user, loading } = useAuth();
  const [role, setRole] = useState<'CLIENT' | 'PROFESSIONAL' | null>(null);
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
        role: 'CLIENT' | 'PROFESSIONAL';
        profession_type?: string;
        location?: string;
      } = { token, role };

      if (role === 'PROFESSIONAL') {
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

      router.push('/dashboard');
    } catch (error) {
      console.error(error);
      alert("Network Error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || isCheckingRole) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6 py-24">
        <div className="text-stone-600 text-sm">Checking your profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6 py-24">
      <div className="max-w-3xl w-full">
        <div className="text-center mb-12">
          <p className="text-orange-600 font-semibold tracking-widest uppercase text-sm mb-3">Welcome to the Network</p>
          <h1 className="font-serif text-4xl md:text-5xl text-stone-900 leading-tight">
            How will you use BuildMe.lk?
          </h1>
          <p className="text-stone-500 text-lg mt-4 max-w-lg mx-auto">
            Tailor your experience by telling us whether you are building a home or providing professional construction services.
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-12">
          {/* Step 1: Primary Role */}
          <div className="grid md:grid-cols-2 gap-6">
            <div 
              onClick={() => setRole('CLIENT')} 
              className={`p-8 rounded-2xl cursor-pointer transition-all border ${
                role === 'CLIENT' 
                  ? 'border-orange-500 bg-orange-50/50 shadow-md ring-1 ring-orange-500/20' 
                  : 'border-stone-200 bg-white hover:border-orange-300 hover:shadow-sm'
              }`}
            >
              <div className={`h-12 w-12 rounded-full mb-6 flex items-center justify-center ${role === 'CLIENT' ? 'bg-orange-600 text-white' : 'bg-stone-100 text-stone-400'}`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
              </div>
              <h3 className="font-serif text-2xl mb-2 text-stone-900">I am a Homeowner</h3>
              <p className="text-stone-500 leading-relaxed text-sm">
                I want to estimate building costs, find verified professionals, and hire contractors for my project.
              </p>
            </div>

            <div 
              onClick={() => setRole('PROFESSIONAL')} 
              className={`p-8 rounded-2xl cursor-pointer transition-all border ${
                role === 'PROFESSIONAL' 
                  ? 'border-orange-500 bg-orange-50/50 shadow-md ring-1 ring-orange-500/20' 
                  : 'border-stone-200 bg-white hover:border-orange-300 hover:shadow-sm'
              }`}
            >
              <div className={`h-12 w-12 rounded-full mb-6 flex items-center justify-center ${role === 'PROFESSIONAL' ? 'bg-orange-600 text-white' : 'bg-stone-100 text-stone-400'}`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
              </div>
              <h3 className="font-serif text-2xl mb-2 text-stone-900">I am a Professional</h3>
              <p className="text-stone-500 leading-relaxed text-sm">
                I want to offer my services, bid on ongoing construction projects, and build my professional portfolio.
              </p>
            </div>
          </div>

          {/* Step 2: Professional Details */}
          {role === 'PROFESSIONAL' && (
            <div className="bg-white p-8 border border-stone-200 rounded-2xl space-y-6 shadow-sm animate-fade-in-up">
              <h2 className="font-serif text-2xl text-stone-900 border-b border-stone-100 pb-4">Professional Details</h2>
              <div className="grid md:grid-cols-2 gap-6 pt-2">
                <div>
                  <label className="block text-stone-500 font-medium text-sm tracking-wide mb-2">PROFESSION CATEGORY</label>
                  <select 
                    required 
                    value={professionType} 
                    onChange={(e) => setProfessionType(e.target.value)}
                    className="w-full border border-stone-300 text-stone-700 rounded-lg px-4 py-3 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
                  >
                    <option value="" disabled>Select your expertise...</option>
                    {PROFESSIONS.map(prof => (
                      <option key={prof.value} value={prof.value}>{prof.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-stone-500 font-medium text-sm tracking-wide mb-2">PRIMARY LOCATION</label>
                  <input 
                    required 
                    type="text" 
                    placeholder="e.g., Colombo, Island-wide"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full border border-stone-300 text-stone-700 rounded-lg px-4 py-3 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          {role && (
            <div className="pt-6 animate-fade-in-up">
              <button type="submit" className="w-full btn-primary text-lg py-4" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Enter Dashboard"}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}