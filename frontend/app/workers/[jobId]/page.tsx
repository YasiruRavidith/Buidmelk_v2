"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useAuth } from "../../../hooks/useAuth";
import { API_BASE_URL } from "@/lib/api";
import {
  ArrowLeft, MapPin, Calendar, Users, Zap, Clock,
  CheckCircle2, Send, Briefcase, AlertCircle
} from "lucide-react";

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

const fmt = (n: string | number) =>
  new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    minimumFractionDigits: 0,
  }).format(Number(n));

export default function JobDetailPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = use(params);
  const { user } = useAuth();

  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [myApplication, setMyApplication] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState("");
  const [acceptingId, setAcceptingId] = useState<number | null>(null);

  const today = new Date().toISOString().split("T")[0];

  const fetchJob = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/workers/jobs/${jobId}/`);
      if (res.ok) setJob(await res.json());
    } finally {
      setLoading(false);
    }
  };

  const fetchMyApplication = async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${API_BASE_URL}/workers/jobs/${jobId}/my_application/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.id) setMyApplication(data);
      }
    } catch {}
  };

  useEffect(() => {
    fetchJob();
  }, [jobId]);

  useEffect(() => {
    if (user) fetchMyApplication();
  }, [user, jobId]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setApplying(true);
    setApplyError("");
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${API_BASE_URL}/workers/jobs/${jobId}/apply/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      if (res.ok) {
        setMyApplication(data);
        fetchJob();
      } else {
        setApplyError(data.error || "Failed to apply.");
      }
    } catch {
      setApplyError("Network error. Please try again.");
    } finally {
      setApplying(false);
    }
  };

  const handleAccept = async (applicationId: number) => {
    if (!user) return;
    setAcceptingId(applicationId);
    try {
      const token = await user.getIdToken();
      const res = await fetch(
        `${API_BASE_URL}/workers/applications/${applicationId}/accept/`,
        { method: "POST", headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) fetchJob();
    } finally {
      setAcceptingId(null);
    }
  };

  const handleReject = async (applicationId: number) => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      await fetch(`${API_BASE_URL}/workers/applications/${applicationId}/reject/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchJob();
    } catch {}
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FCFAF7] flex flex-col items-center justify-center text-[#606060]">
        <div className="animate-spin w-8 h-8 border-2 border-[#8B4434] border-t-transparent mb-3" />
        <p className="text-sm">Loading job details...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-[#FCFAF7] flex flex-col items-center justify-center gap-4 text-[#1c1108]">
        <p className="font-serif text-2xl">Job Not Found</p>
        <Link href="/workers" className="text-xs uppercase tracking-wider text-[#8B4434] underline">
          Back to Worker Marketplace
        </Link>
      </div>
    );
  }

  const isOwner = user && job.posted_by_firebase_uid === user.uid;
  const spotsLeft = job.workers_needed - job.workers_accepted;
  const colorClass = TYPE_COLORS[job.worker_type] || "bg-stone-50 text-stone-700 border-stone-300";
  const isToday = job.job_date === today;

  const appStatusColors: Record<string, string> = {
    APPLIED: "bg-amber-50 text-amber-800 border-amber-200",
    ACCEPTED: "bg-emerald-50 text-emerald-800 border-emerald-200",
    REJECTED: "bg-rose-50 text-rose-800 border-rose-200",
  };

  return (
    <div className="min-h-screen bg-[#FCFAF7] text-[#1c1108]">
      {/* Dark Header */}
      <div className="bg-[#1c1108] text-[#FCFAF7] relative overflow-hidden py-12 sm:py-16 px-4 sm:px-6 lg:px-8 border-b border-[#322318]">
        <div className="absolute inset-0 opacity-[0.06] bg-[radial-gradient(#8B4434_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />
        <div className="max-w-6xl mx-auto relative z-10 space-y-4">
          <Link
            href="/workers"
            className="inline-flex items-center gap-1 text-xs uppercase tracking-widest text-[#8B4434] hover:text-white font-semibold transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Worker Marketplace
          </Link>

          <div className="flex flex-wrap items-center gap-2.5">
            <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider border ${colorClass}`}>
              {job.worker_type.replace("_", " ")}
            </span>
            {isToday && (
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <Zap className="w-3 h-3" />
                Needed Today
              </span>
            )}
            <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider border ${
              job.status === "OPEN"
                ? "bg-[#8B4434]/20 text-[#e8a090] border-[#8B4434]/30"
                : "bg-stone-800 text-stone-400 border-stone-700"
            }`}>
              {job.status}
            </span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl leading-tight max-w-3xl">{job.title}</h1>

          <div className="flex flex-wrap gap-6 pt-4 border-t border-[#322318] text-xs text-[#c9b8b0]">
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-[#8B4434]" />
              <span>{job.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-[#8B4434]" />
              <span>
                {new Date(job.job_date).toLocaleDateString("en-LK", {
                  weekday: "long", year: "numeric", month: "long", day: "numeric",
                })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-[#8B4434]" />
              <span>
                <strong className="text-white">{spotsLeft}</strong> of {job.workers_needed} spot{job.workers_needed > 1 ? "s" : ""} remaining
              </span>
            </div>
            {job.daily_rate && (
              <div>
                <span className="text-[#908078] uppercase tracking-wider text-[10px] block">Daily Rate</span>
                <span className="text-[#8B4434] font-serif text-sm font-bold">{fmt(job.daily_rate)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
          {/* Left */}
          <div className="space-y-8">
            {/* Description */}
            <div className="bg-white border border-[#e8ddd6] p-6 sm:p-8 space-y-4">
              <h2 className="font-serif text-2xl text-[#1c1108] border-b border-[#e8ddd6] pb-4">Job Details</h2>
              {job.description ? (
                <p className="text-[#606060] text-sm leading-relaxed whitespace-pre-wrap">{job.description}</p>
              ) : (
                <p className="text-[#908078] text-sm italic">No additional details provided.</p>
              )}
              <div className="text-[11px] text-[#908078]">
                Posted by <strong className="text-[#1c1108]">{job.posted_by_name}</strong>
              </div>
            </div>

            {/* Applicants list — only visible to job poster */}
            {isOwner && (
              <div className="bg-white border border-[#e8ddd6] p-6 sm:p-8 space-y-6">
                <h2 className="font-serif text-2xl text-[#1c1108] border-b border-[#e8ddd6] pb-4">
                  Applicants ({job.applications?.length || 0})
                </h2>
                {!job.applications || job.applications.length === 0 ? (
                  <p className="text-[#908078] text-sm text-center py-8">No applications yet.</p>
                ) : (
                  <div className="space-y-4">
                    {job.applications.map((app: any) => (
                      <div key={app.id} className="p-5 border border-[#e8ddd6] bg-[#FCFAF7] space-y-3">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div>
                            <p className="font-semibold text-sm text-[#1c1108]">
                              {app.worker_details?.first_name} {app.worker_details?.last_name || app.worker_details?.username}
                            </p>
                            <p className="text-xs text-[#908078]">{app.worker_details?.email}</p>
                          </div>
                          <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${appStatusColors[app.status] || ""}`}>
                            {app.status}
                          </span>
                        </div>
                        {app.message && (
                          <p className="text-xs text-[#606060] leading-relaxed italic">"{app.message}"</p>
                        )}
                        {app.status === "APPLIED" && job.is_still_open && (
                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={() => handleAccept(app.id)}
                              disabled={acceptingId === app.id}
                              className="px-4 py-2 bg-[#8B4434] text-[#FCFAF7] text-[10px] font-bold uppercase tracking-widest hover:bg-[#6f3829] disabled:opacity-50 transition-colors"
                            >
                              {acceptingId === app.id ? "Accepting..." : "Accept"}
                            </button>
                            <button
                              onClick={() => handleReject(app.id)}
                              className="px-4 py-2 border border-[#e8ddd6] text-[#606060] text-[10px] font-bold uppercase tracking-widest hover:border-rose-300 hover:text-rose-700 transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                        {app.status === "ACCEPTED" && (
                          <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Accepted
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Sidebar — Apply Panel */}
          <aside className="lg:sticky lg:top-8 space-y-4">
            <div className="bg-white border border-[#e8ddd6] p-6 space-y-6">
              <div className="border-b border-[#e8ddd6] pb-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#8B4434] font-semibold">For Workers</p>
                <h3 className="font-serif text-2xl text-[#1c1108]">Apply Instantly</h3>
              </div>

              {/* Already accepted my app */}
              {myApplication ? (
                <div className={`p-5 border space-y-2 ${appStatusColors[myApplication.status] || ""}`}>
                  <p className="text-xs font-bold uppercase tracking-wider">Application Status</p>
                  <p className="text-2xl font-serif font-semibold">{myApplication.status}</p>
                  {myApplication.status === "ACCEPTED" && (
                    <p className="text-xs">
                      Congratulations! The site manager has accepted you. They will contact you with further instructions.
                    </p>
                  )}
                  {myApplication.status === "APPLIED" && (
                    <p className="text-xs">Your application is under review. The site manager will get back to you shortly.</p>
                  )}
                  {myApplication.status === "REJECTED" && (
                    <p className="text-xs">Unfortunately your application was not selected for this job.</p>
                  )}
                </div>
              ) : job.status !== "OPEN" || !job.is_still_open ? (
                <div className="p-5 bg-stone-50 border border-stone-200 text-center">
                  <Briefcase className="w-8 h-8 text-stone-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-stone-700">
                    {job.status === "FILLED" ? "All spots filled" : "This job is closed"}
                  </p>
                  <p className="text-xs text-stone-500 mt-1">Check other available jobs.</p>
                </div>
              ) : !user ? (
                <div className="space-y-3 text-center">
                  <p className="text-[#606060] text-xs">Login to apply for this job.</p>
                  <Link
                    href={`/login?redirect=/workers/${jobId}`}
                    className="block w-full bg-[#8B4434] text-[#FCFAF7] py-3 text-xs font-bold uppercase tracking-widest hover:bg-[#6f3829] transition-colors text-center"
                  >
                    Login to Apply
                  </Link>
                </div>
              ) : isOwner ? (
                <div className="text-center py-4 text-[#908078] text-sm">
                  This is your job posting. Manage applicants on the left.
                </div>
              ) : (
                <form onSubmit={handleApply} className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#606060] mb-2">
                      Message (Optional)
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={4}
                      className="w-full bg-[#FCFAF7] border border-[#e8ddd6] p-3 text-sm text-[#1c1108] placeholder-[#908078] focus:outline-none focus:border-[#8B4434] resize-none"
                      placeholder="Describe your experience, availability..."
                    />
                  </div>
                  {applyError && (
                    <div className="flex items-center gap-2 text-rose-700 text-xs bg-rose-50 border border-rose-200 p-3">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {applyError}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={applying}
                    className="w-full bg-[#8B4434] text-[#FCFAF7] py-3.5 text-xs font-bold uppercase tracking-widest hover:bg-[#6f3829] disabled:opacity-70 transition-colors flex items-center justify-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {applying ? "Submitting..." : "Apply Now — Free"}
                  </button>
                  <p className="text-[10px] text-center text-[#908078]">
                    No ticket required. Applying to daily jobs is always free.
                  </p>
                </form>
              )}
            </div>

            {/* Quick info card */}
            <div className="bg-[#1c1108] text-[#FCFAF7] p-5 space-y-3">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#8B4434] font-semibold">Job Summary</p>
              <div className="space-y-2 text-xs text-[#c9b8b0]">
                <div className="flex justify-between">
                  <span>Workers needed</span>
                  <span className="font-semibold text-white">{job.workers_needed}</span>
                </div>
                <div className="flex justify-between">
                  <span>Spots remaining</span>
                  <span className={`font-semibold ${spotsLeft > 0 ? "text-emerald-400" : "text-rose-400"}`}>{spotsLeft}</span>
                </div>
                <div className="flex justify-between">
                  <span>Applications</span>
                  <span className="font-semibold text-white">{job.applications_count}</span>
                </div>
                {job.daily_rate && (
                  <div className="flex justify-between">
                    <span>Daily rate</span>
                    <span className="font-semibold text-[#8B4434]">{fmt(job.daily_rate)}</span>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
