"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "../../hooks/useAuth";
import { API_BASE_URL } from "@/lib/api";
import {
  Search, SlidersHorizontal, X, MapPin, Calendar, Users,
  Zap, Clock, ArrowRight, Plus, Briefcase
} from "lucide-react";

const WORKER_TYPES = [
  { value: "ALL", label: "All Types" },
  { value: "PAINTER", label: "Painter" },
  { value: "PLUMBER", label: "Plumber" },
  { value: "ELECTRICIAN", label: "Electrician" },
  { value: "GENERAL", label: "General Worker" },
  { value: "WELDER", label: "Welder" },
  { value: "MASON", label: "Mason / Bricklayer" },
  { value: "CARPENTER", label: "Carpenter" },
  { value: "TILER", label: "Tiler" },
  { value: "DRIVER", label: "Driver / Delivery" },
  { value: "HELPER", label: "Site Helper / Labour" },
];

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

interface DailyJob {
  id: number;
  title: string;
  worker_type: string;
  workers_needed: number;
  workers_accepted: number;
  location: string;
  description: string;
  daily_rate: string | null;
  job_date: string;
  status: string;
  posted_by_name: string;
  is_still_open: boolean;
  applications_count: number;
  created_at: string;
}

const fmt = (n: string | number) =>
  new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(n));

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function WorkersPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<DailyJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [workerType, setWorkerType] = useState("ALL");
  const [location, setLocation] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const fetchJobs = async () => {
    setLoading(true);
    const params = new URLSearchParams({ status: "OPEN" });
    if (workerType !== "ALL") params.append("worker_type", workerType);
    if (location) params.append("location", location);

    try {
      const res = await fetch(`${API_BASE_URL}/workers/jobs/?${params}`);
      if (res.ok) {
        const data = await res.json();
        setJobs(data.results ?? data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workerType, location]);

  return (
    <div className="min-h-screen bg-[#FCFAF7] text-[#1c1108]">
      {/* Hero */}
      <div className="bg-[#1c1108] text-[#FCFAF7] relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06] bg-[radial-gradient(#EA580C_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
            <div className="space-y-3">
              <p className="text-[10px] uppercase tracking-[0.25em] text-[#EA580C] font-semibold">
                BuildMe.lk — Daily Labour
              </p>
              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl leading-tight max-w-2xl">
                Worker Marketplace
              </h1>
              <p className="text-[#c9b8b0] text-sm sm:text-base max-w-xl leading-relaxed">
                Site managers post urgent labour needs — painters, plumbers, electricians — and available workers accept instantly.
              </p>
            </div>
            <div className="flex gap-3 shrink-0">
              {user && (
                <Link
                  href="/workers/post"
                  className="inline-flex items-center gap-2 bg-[#EA580C] text-[#FCFAF7] px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#C2410C] transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Post a Job
                </Link>
              )}
              <Link
                href="/workers/my-jobs"
                className="inline-flex items-center gap-2 border border-[#FCFAF7]/20 text-[#FCFAF7] px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#FCFAF7]/10 transition-colors"
              >
                <Briefcase className="w-4 h-4" />
                My Activity
              </Link>
            </div>
          </div>

          {/* Stats bar */}
          <div className="mt-10 pt-8 border-t border-[#322318] flex flex-wrap gap-8 text-xs text-[#c9b8b0]">
            <div>
              <span className="block text-[10px] uppercase tracking-widest text-[#908078]">Open Jobs Today</span>
              <span className="text-xl font-serif text-white">{jobs.filter(j => j.job_date === today).length}</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase tracking-widest text-[#908078]">Total Open</span>
              <span className="text-xl font-serif text-white">{jobs.length}</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase tracking-widest text-[#908078]">Worker Types</span>
              <span className="text-xl font-serif text-white">{WORKER_TYPES.length - 1}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-[#e8ddd6] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center gap-3">
          {/* Type pills */}
          <div className="flex items-center gap-2 flex-wrap">
            {WORKER_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => setWorkerType(t.value)}
                className={`px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider border rounded-full transition-all ${
                  workerType === t.value
                    ? "bg-[#1c1108] text-[#FCFAF7] border-[#1c1108]"
                    : "bg-white text-[#606060] border-[#e8ddd6] hover:border-[#EA580C] hover:text-[#EA580C]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Location search */}
          <div className="ml-auto flex items-center gap-2 bg-[#FCFAF7] border border-[#e8ddd6] px-3 py-2 rounded-xl">
            <Search className="w-3.5 h-3.5 text-[#908078]" />
            <input
              type="text"
              placeholder="Filter by location..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="bg-transparent text-xs text-[#1c1108] placeholder-[#908078] focus:outline-none w-40"
            />
            {location && (
              <button onClick={() => setLocation("")}>
                <X className="w-3 h-3 text-[#908078]" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Job Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-[#606060]">
            <div className="inline-block animate-spin w-8 h-8 border-2 border-[#EA580C] border-t-transparent mb-3" />
            <p className="text-sm">Loading available jobs...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-24 space-y-4">
            <div className="w-16 h-16 bg-[#e8ddd6] flex items-center justify-center mx-auto rounded-2xl">
              <Briefcase className="w-7 h-7 text-[#EA580C]" />
            </div>
            <h2 className="font-serif text-2xl text-[#1c1108]">No Jobs Posted Yet</h2>
            <p className="text-[#606060] text-sm max-w-sm mx-auto">
              Be the first to post a labour request for your construction site.
            </p>
            {user && (
              <Link
                href="/workers/post"
                className="inline-block bg-[#EA580C] text-[#FCFAF7] px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#C2410C] transition-colors mt-2"
              >
                Post a Job Now
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job) => {
              const colorClass = TYPE_COLORS[job.worker_type] || "bg-stone-50 text-stone-700 border-stone-200";
              const spotsLeft = job.workers_needed - job.workers_accepted;
              const isToday = job.job_date === today;

              return (
                <Link
                  key={job.id}
                  href={`/workers/${job.id}`}
                  className="group bg-white border border-[#e8ddd6] p-6 rounded-2xl flex flex-col gap-4 hover:border-[#EA580C] hover:shadow-md transition-all duration-200"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border rounded-full ${colorClass}`}>
                          {job.worker_type.replace("_", " ")}
                        </span>
                        {isToday && (
                          <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full flex items-center gap-1">
                            <Zap className="w-2.5 h-2.5" />
                            Today
                          </span>
                        )}
                      </div>
                      <h3 className="font-serif text-lg text-[#1c1108] leading-snug group-hover:text-[#EA580C] transition-colors">
                        {job.title}
                      </h3>
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="space-y-2 text-xs text-[#606060]">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-[#EA580C] shrink-0" />
                      <span>{job.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-[#EA580C] shrink-0" />
                      <span>
                        {new Date(job.job_date).toLocaleDateString("en-LK", {
                          weekday: "short", month: "short", day: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-[#EA580C] shrink-0" />
                      <span>
                        <strong className="text-[#1c1108]">{spotsLeft}</strong> of {job.workers_needed} spot{job.workers_needed > 1 ? "s" : ""} open
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  {job.description && (
                    <p className="text-xs text-[#908078] leading-relaxed line-clamp-2">
                      {job.description}
                    </p>
                  )}

                  {/* Footer */}
                  <div className="mt-auto pt-4 border-t border-[#e8ddd6] flex items-center justify-between">
                    <div>
                      {job.daily_rate ? (
                        <span className="text-sm font-serif font-bold text-[#EA580C]">
                          {fmt(job.daily_rate)}
                          <span className="text-xs font-sans font-normal text-[#908078]">/day</span>
                        </span>
                      ) : (
                        <span className="text-xs text-[#908078] italic">Rate to be discussed</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-[#908078]">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {timeAgo(job.created_at)}
                      </span>
                      <ArrowRight className="w-4 h-4 text-[#EA580C] group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
