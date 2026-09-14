"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../hooks/useAuth";
import { API_BASE_URL } from "@/lib/api";
import { ArrowLeft, AlertCircle, MapPin, Calendar, Users, Banknote } from "lucide-react";

const WORKER_TYPES = [
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

export default function PostJobPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({
    title: "",
    worker_type: "GENERAL",
    workers_needed: 1,
    location: "",
    description: "",
    daily_rate: "",
    job_date: new Date().toISOString().split("T")[0],
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const set = (field: string, value: string | number) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError("Please log in to post a job.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const token = await user.getIdToken();
      const payload: any = {
        title: form.title,
        worker_type: form.worker_type,
        workers_needed: form.workers_needed,
        location: form.location,
        description: form.description,
        job_date: form.job_date,
      };
      if (form.daily_rate) payload.daily_rate = form.daily_rate;

      const res = await fetch(`${API_BASE_URL}/workers/jobs/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        router.push(`/workers/${data.id}`);
      } else {
        setError(Object.values(data).flat().join(" ") || "Failed to post job.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FCFAF7] flex flex-col items-center justify-center gap-4">
        <p className="font-serif text-2xl text-[#1c1108]">Login Required</p>
        <Link href="/login?redirect=/workers/post" className="text-xs text-[#EA580C] uppercase tracking-wider underline">
          Go to Login
        </Link>
      </div>
    );
  }

  const inputCls =
    "w-full bg-[#FCFAF7] border border-[#e8ddd6] px-4 py-3 text-sm text-[#1c1108] placeholder-[#908078] focus:outline-none focus:border-[#EA580C] rounded-xl transition-colors";
  const labelCls = "block text-[10px] uppercase tracking-[0.2em] font-semibold text-[#606060] mb-2";

  return (
    <div className="min-h-screen bg-[#FCFAF7] text-[#1c1108]">
      {/* Header */}
      <div className="bg-[#1c1108] text-[#FCFAF7] py-12 px-4 sm:px-6 lg:px-8 border-b border-[#322318]">
        <div className="max-w-3xl mx-auto space-y-3">
          <Link
            href="/workers"
            className="inline-flex items-center gap-1 text-xs uppercase tracking-widest text-[#EA580C] hover:text-white font-semibold transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Worker Marketplace
          </Link>
          <h1 className="font-serif text-4xl sm:text-5xl">Post a Daily Job</h1>
          <p className="text-[#c9b8b0] text-sm">
            Describe what kind of worker you need and when — available workers will apply instantly.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Title */}
          <div className="bg-white border border-[#e8ddd6] p-6 sm:p-8 rounded-2xl space-y-6">
            <h2 className="font-serif text-xl text-[#1c1108] border-b border-[#e8ddd6] pb-3">Job Information</h2>

            <div>
              <label className={labelCls}>Job Title *</label>
              <input
                required
                type="text"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                className={inputCls}
                placeholder='e.g. "Need 2 painters today" or "Looking for an electrician"'
              />
              <p className="text-[10px] text-[#908078] mt-1.5">Be specific — workers see this first.</p>
            </div>

            <div>
              <label className={labelCls}>Worker Type Required *</label>
              <select
                required
                value={form.worker_type}
                onChange={(e) => set("worker_type", e.target.value)}
                className={inputCls}
              >
                {WORKER_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelCls}>Description</label>
              <textarea
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                rows={4}
                className={inputCls + " resize-none"}
                placeholder="Describe the scope of work, tools needed, site conditions..."
              />
            </div>
          </div>

          {/* Logistics */}
          <div className="bg-white border border-[#e8ddd6] p-6 sm:p-8 rounded-2xl space-y-6">
            <h2 className="font-serif text-xl text-[#1c1108] border-b border-[#e8ddd6] pb-3">Logistics</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className={labelCls}>
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> Location *</span>
                </label>
                <input
                  required
                  type="text"
                  value={form.location}
                  onChange={(e) => set("location", e.target.value)}
                  className={inputCls}
                  placeholder="e.g. Colombo 03, Kandy Road..."
                />
              </div>

              <div>
                <label className={labelCls}>
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Job Date *</span>
                </label>
                <input
                  required
                  type="date"
                  value={form.job_date}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => set("job_date", e.target.value)}
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" /> Workers Needed *</span>
                </label>
                <input
                  required
                  type="number"
                  min={1}
                  max={50}
                  value={form.workers_needed}
                  onChange={(e) => set("workers_needed", parseInt(e.target.value))}
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>
                  <span className="flex items-center gap-1"><Banknote className="w-3 h-3" /> Daily Rate (LKR, Optional)</span>
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.daily_rate}
                  onChange={(e) => set("daily_rate", e.target.value)}
                  className={inputCls}
                  placeholder="e.g. 3500"
                />
                <p className="text-[10px] text-[#908078] mt-1.5">Leave blank if to be negotiated.</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-rose-700 text-xs bg-rose-50 border border-rose-200 rounded-xl p-4">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 sm:flex-none bg-[#EA580C] text-[#FCFAF7] py-4 px-10 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#C2410C] disabled:opacity-70 transition-colors"
            >
              {submitting ? "Posting..." : "Post Job — Free"}
            </button>
            <Link href="/workers" className="text-xs text-[#908078] hover:text-[#1c1108] transition-colors">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
