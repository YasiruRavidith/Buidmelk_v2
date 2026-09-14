"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "../../../hooks/useAuth";
import { API_BASE_URL } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Briefcase, Send, Plus, ArrowRight, Clock, Users, MapPin, CheckCircle2 } from "lucide-react";

const TYPE_COLORS: Record<string, string> = {
  PAINTER: "bg-amber-50 text-amber-800 border-amber-200",
  PLUMBER: "bg-blue-50 text-blue-800 border-blue-200",
  ELECTRICIAN: "bg-yellow-50 text-yellow-800 border-yellow-200",
  GENERAL: "bg-stone-50 text-stone-700 border-stone-300",
  WELDER: "bg-orange-50 text-orange-800 border-orange-200",
  MASON: "bg-red-50 text-red-800 border-red-200",
  CARPENTER: "bg-lime-50 text-lime-800 border-lime-200",
  TILER: "bg-cyan-50 text-cyan-800 border-cyan-200",
  DRIVER: "bg-violet-50 text-violet-800 border-violet-200",
  HELPER: "bg-zinc-50 text-zinc-700 border-zinc-300",
};

export default function MyWorkerJobsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<"posted" | "applied">("posted");
  const [postedJobs, setPostedJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const [postedRes, appsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/workers/jobs/my_posted/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/workers/applications/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      if (postedRes.ok) setPostedJobs(await postedRes.json());
      if (appsRes.ok) {
        const data = await appsRes.json();
        setApplications(data.results ?? data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FCFAF7] flex flex-col items-center justify-center gap-4">
        <p className="font-serif text-2xl text-[#1c1108]">Login Required</p>
        <Link href="/login?redirect=/workers/my-jobs" className="text-xs text-[#EA580C] uppercase tracking-wider underline">
          Go to Login
        </Link>
      </div>
    );
  }

  const appStatusColors: Record<string, string> = {
    APPLIED: "bg-amber-50 text-amber-800 border-amber-200",
    ACCEPTED: "bg-emerald-50 text-emerald-800 border-emerald-200",
    REJECTED: "bg-rose-50 text-rose-800 border-rose-200",
  };

  const jobStatusColors: Record<string, string> = {
    OPEN: "bg-emerald-50 text-emerald-800 border-emerald-200",
    FILLED: "bg-stone-100 text-stone-700 border-stone-300",
    EXPIRED: "bg-rose-50 text-rose-800 border-rose-200",
  };

  return (
    <div className="min-h-screen bg-[#FCFAF7] text-[#1c1108]">
      {/* Header */}
      <div className="bg-[#1c1108] text-[#FCFAF7] py-12 px-4 sm:px-6 lg:px-8 border-b border-[#322318]">
        <div className="max-w-5xl mx-auto space-y-3">
          <p className="text-[10px] uppercase tracking-[0.25em] text-[#EA580C] font-semibold">Worker Marketplace</p>
          <h1 className="font-serif text-4xl sm:text-5xl">My Activity</h1>
          <p className="text-[#c9b8b0] text-sm">Manage jobs you have posted and track your job applications.</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Tab Switcher */}
        <div className="flex border border-[#e8ddd6] overflow-hidden rounded-2xl">
          <button
            onClick={() => setTab("posted")}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${
              tab === "posted"
                ? "bg-[#1c1108] text-[#FCFAF7]"
                : "bg-white text-[#606060] hover:bg-[#FCFAF7]"
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            Jobs I Posted ({postedJobs.length})
          </button>
          <button
            onClick={() => setTab("applied")}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${
              tab === "applied"
                ? "bg-[#1c1108] text-[#FCFAF7]"
                : "bg-white text-[#606060] hover:bg-[#FCFAF7]"
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            My Applications ({applications.length})
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin w-7 h-7 border-2 border-[#EA580C] border-t-transparent" />
          </div>
        ) : tab === "posted" ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-serif text-xl text-[#1c1108]">Posted Jobs</h2>
              <Link
                href="/workers/post"
                className="inline-flex items-center gap-1.5 bg-[#EA580C] text-[#FCFAF7] px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#C2410C] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Post New Job
              </Link>
            </div>
            {postedJobs.length === 0 ? (
              <div className="bg-white border border-[#e8ddd6] p-12 rounded-2xl text-center space-y-4">
                <Briefcase className="w-10 h-10 text-[#e8ddd6] mx-auto" />
                <p className="text-[#606060] text-sm">You have not posted any jobs yet.</p>
                <Link
                  href="/workers/post"
                  className="inline-block bg-[#EA580C] text-[#FCFAF7] px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#C2410C] transition-colors"
                >
                  Post Your First Job
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {postedJobs.map((job: any) => (
                  <div key={job.id} className="bg-white border border-[#e8ddd6] p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border rounded-full ${TYPE_COLORS[job.worker_type] || ""}`}>
                          {job.worker_type.replace("_", " ")}
                        </span>
                        <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border rounded-full ${jobStatusColors[job.status] || ""}`}>
                          {job.status}
                        </span>
                      </div>
                      <h3 className="font-semibold text-sm text-[#1c1108]">{job.title}</h3>
                      <div className="flex flex-wrap gap-3 text-xs text-[#908078]">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" />{job.workers_accepted}/{job.workers_needed} filled</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(job.job_date).toLocaleDateString("en-LK", { month: "short", day: "numeric" })}</span>
                      </div>
                    </div>
                    <Link
                      href={`/workers/${job.id}`}
                      className="flex items-center gap-1 text-xs text-[#EA580C] font-semibold hover:underline"
                    >
                      Manage <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="font-serif text-xl text-[#1c1108]">My Applications</h2>
            {applications.length === 0 ? (
              <div className="bg-white border border-[#e8ddd6] p-12 rounded-2xl text-center space-y-4">
                <Send className="w-10 h-10 text-[#e8ddd6] mx-auto" />
                <p className="text-[#606060] text-sm">You have not applied to any jobs yet.</p>
                <Link
                  href="/workers"
                  className="inline-block bg-[#EA580C] text-[#FCFAF7] px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#C2410C] transition-colors"
                >
                  Browse Available Jobs
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {applications.map((app: any) => (
                  <div key={app.id} className="bg-white border border-[#e8ddd6] p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {app.status === "ACCEPTED" && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                        <h3 className="font-semibold text-sm text-[#1c1108]">{app.job_title}</h3>
                        <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border rounded-full ${appStatusColors[app.status] || ""}`}>
                          {app.status}
                        </span>
                      </div>
                      {app.message && (
                        <p className="text-xs text-[#908078] italic line-clamp-1">"{app.message}"</p>
                      )}
                      <p className="text-[10px] text-[#908078]">
                        Applied {new Date(app.applied_at).toLocaleDateString("en-LK", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                    <Link
                      href={`/workers/${app.job}`}
                      className="flex items-center gap-1 text-xs text-[#EA580C] font-semibold hover:underline"
                    >
                      View Job <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
