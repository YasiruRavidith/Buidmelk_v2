"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "../../hooks/useAuth";
import { API_BASE_URL } from "@/lib/api";

interface Project {
  id: number;
  title: string;
  client_name: string;
  location: string;
  budget_range: string;
  bids_count: number;
  status: string;
  created_at: string;
  description: string;
}

export default function BiddingFeed() {
  const { user } = useAuth();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [locationQuery, setLocationQuery] = useState("");
  const [budgetQuery, setBudgetQuery] = useState("");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  useEffect(() => {
    async function fetchProjects() {
      try {
        const res = await fetch(`${API_BASE_URL}/bidding/projects/`);
        if (res.ok) {
          const data = await res.json();
          setProjects(data);
        }
      } catch (err) {
        console.error("Failed to fetch projects", err);
      } finally {
        setLoading(false);
      }
    }
    fetchProjects();
  }, []);

  // Lock body scroll when mobile filter is open
  useEffect(() => {
    if (isMobileFilterOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileFilterOpen]);

  const fmtDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('en-LK', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return iso;
    }
  };

  const filteredProjects = projects.filter(project => {
    // Search in title, description, client_name
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = project.title?.toLowerCase().includes(q);
      const matchDesc = project.description?.toLowerCase().includes(q);
      const matchClient = project.client_name?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchClient) return false;
    }

    // Status filter
    if (selectedStatus !== "ALL") {
      if (project.status?.toUpperCase() !== selectedStatus) return false;
    }

    // Location filter
    if (locationQuery.trim()) {
      const locQ = locationQuery.toLowerCase();
      if (!project.location?.toLowerCase().includes(locQ)) return false;
    }

    // Budget filter
    if (budgetQuery.trim()) {
      const budQ = budgetQuery.toLowerCase();
      if (!project.budget_range?.toLowerCase().includes(budQ)) return false;
    }

    return true;
  });

  const activeFilterCount = (selectedStatus !== "ALL" ? 1 : 0) + 
                            (locationQuery.trim() ? 1 : 0) + 
                            (budgetQuery.trim() ? 1 : 0) + 
                            (searchQuery.trim() ? 1 : 0);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedStatus("ALL");
    setLocationQuery("");
    setBudgetQuery("");
  };

  return (
    <div className="min-h-screen bg-[#FCFAF7] text-[#1c1108]">
      {/* Top Banner / Hero Header */}
      <div className="bg-[#1c1108] text-[#FCFAF7] relative overflow-hidden py-10 sm:py-14 px-4 sm:px-6 lg:px-8 border-b border-[#322318]">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#EA580C_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-[#EA580C] font-semibold mb-2">Open Tenders &amp; Requests</p>
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-[#FCFAF7]">Bidding Feed</h1>
              <p className="text-[#c9b8b0] mt-2 text-sm sm:text-base max-w-xl">
                Explore active construction tenders, review project requirements, and submit competitive proposals.
              </p>
            </div>
            {user && (
              <Link href="/estimation" className="btn-primary bg-[#EA580C] hover:bg-[#C2410C] text-white text-xs tracking-wider uppercase py-3.5 px-6 self-start md:self-auto whitespace-nowrap shadow-lg">
                + Post New Project
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Mobile Filter Toggle & Quick Search */}
        <div className="lg:hidden mb-6 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-[#e8ddd6] px-4 py-2.5 text-sm text-[#1c1108] placeholder-[#908078] focus:outline-none focus:border-[#EA580C] rounded-xl"
              />
            </div>
            <button
              onClick={() => setIsMobileFilterOpen(true)}
              className="flex items-center gap-2 bg-[#1c1108] text-[#FCFAF7] px-4 py-2.5 text-xs uppercase tracking-wider font-medium rounded-xl"
            >
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="bg-[#EA580C] text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 items-start">
          
          {/* Desktop Filter Sidebar */}
          <aside className="hidden lg:block sticky top-8 space-y-6 bg-white border border-[#e8ddd6] p-6 shadow-sm rounded-2xl">
            <div className="flex items-center justify-between border-b border-[#e8ddd6] pb-4">
              <h2 className="font-serif text-lg text-[#1c1108]">Filter Projects</h2>
              {activeFilterCount > 0 && (
                <button 
                  onClick={clearFilters}
                  className="text-xs text-[#EA580C] hover:underline font-medium"
                >
                  Reset all
                </button>
              )}
            </div>

            {/* Search Input */}
            <div className="space-y-2">
              <label className="block text-xs uppercase tracking-wider text-[#606060] font-semibold">Search Keywords</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. Modern Villa, Colombo..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-[#FCFAF7] border border-[#e8ddd6] px-3.5 py-2 text-sm text-[#1c1108] placeholder-[#908078] focus:outline-none focus:border-[#EA580C] rounded-xl"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <label className="block text-xs uppercase tracking-wider text-[#606060] font-semibold">Tender Status</label>
              <div className="space-y-1.5">
                {[
                  { id: "ALL", label: "All Statuses" },
                  { id: "OPEN", label: "Open Tenders" },
                  { id: "CLOSED", label: "Closed Tenders" },
                  { id: "AWARDED", label: "Awarded" },
                ].map((st) => (
                  <label key={st.id} className="flex items-center gap-2 text-sm text-[#1c1108] cursor-pointer py-1 hover:text-[#EA580C]">
                    <input
                      type="radio"
                      name="desktop-status"
                      checked={selectedStatus === st.id}
                      onChange={() => setSelectedStatus(st.id)}
                      className="accent-[#EA580C]"
                    />
                    <span>{st.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Location Filter */}
            <div className="space-y-2">
              <label className="block text-xs uppercase tracking-wider text-[#606060] font-semibold">Location</label>
              <input
                type="text"
                placeholder="e.g. Kandy, Galle..."
                value={locationQuery}
                onChange={e => setLocationQuery(e.target.value)}
                className="w-full bg-[#FCFAF7] border border-[#e8ddd6] px-3.5 py-2 text-sm text-[#1c1108] placeholder-[#908078] focus:outline-none focus:border-[#EA580C] rounded-xl"
              />
            </div>

            {/* Budget Filter */}
            <div className="space-y-2">
              <label className="block text-xs uppercase tracking-wider text-[#606060] font-semibold">Budget Range</label>
              <input
                type="text"
                placeholder="e.g. 15 Million, 25M..."
                value={budgetQuery}
                onChange={e => setBudgetQuery(e.target.value)}
                className="w-full bg-[#FCFAF7] border border-[#e8ddd6] px-3.5 py-2 text-sm text-[#1c1108] placeholder-[#908078] focus:outline-none focus:border-[#EA580C] rounded-xl"
              />
            </div>

            {activeFilterCount > 0 && (
              <div className="pt-2 border-t border-[#e8ddd6]">
                <button
                  onClick={clearFilters}
                  className="w-full text-center py-2 text-xs uppercase tracking-wider border border-[#EA580C] text-[#EA580C] hover:bg-[#EA580C] hover:text-white transition-colors rounded-xl"
                >
                  Clear Filters ({activeFilterCount})
                </button>
              </div>
            )}
          </aside>

          {/* Main Feed Content */}
          <main className="space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e8ddd6] pb-4">
              <div>
                <p className="text-xs text-[#606060]">
                  Showing <span className="font-semibold text-[#1c1108]">{filteredProjects.length}</span> of {projects.length} open tenders
                </p>
              </div>

              {/* Active Badges */}
              {activeFilterCount > 0 && (
                <div className="flex flex-wrap gap-2 items-center">
                  {selectedStatus !== "ALL" && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#EA580C]/10 text-[#EA580C] text-xs rounded-full">
                      Status: {selectedStatus}
                      <button onClick={() => setSelectedStatus("ALL")} className="hover:text-black">x</button>
                    </span>
                  )}
                  {locationQuery && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#EA580C]/10 text-[#EA580C] text-xs rounded-full">
                      Location: {locationQuery}
                      <button onClick={() => setLocationQuery("")} className="hover:text-black">x</button>
                    </span>
                  )}
                  {budgetQuery && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#EA580C]/10 text-[#EA580C] text-xs rounded-full">
                      Budget: {budgetQuery}
                      <button onClick={() => setBudgetQuery("")} className="hover:text-black">x</button>
                    </span>
                  )}
                </div>
              )}
            </div>

            {loading ? (
              <div className="text-center py-24 text-[#606060]">
                <div className="inline-block animate-spin w-8 h-8 border-2 border-[#EA580C] border-t-transparent mb-3" />
                <p className="text-sm">Fetching construction tenders...</p>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="text-center py-20 bg-white border border-[#e8ddd6] p-8 space-y-4 rounded-2xl">
                <p className="text-[#606060] text-lg font-serif">No matching tenders found.</p>
                <p className="text-xs text-[#908078] max-w-md mx-auto">
                  Try adjusting your filter search criteria or reset filters to browse all projects.
                </p>
                <button
                  onClick={clearFilters}
                  className="btn-outline text-xs uppercase tracking-wider py-2.5 px-6"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid gap-5 sm:gap-6">
                {filteredProjects.map((project) => {
                  const statusStyles: Record<string, string> = {
                    OPEN: "bg-emerald-50 text-emerald-800 border-emerald-200",
                    CLOSED: "bg-stone-100 text-stone-700 border-stone-300",
                    AWARDED: "bg-amber-50 text-amber-800 border-amber-200",
                  };

                  return (
                    <div
                      key={project.id}
                      className="bg-white border border-[#e8ddd6] p-6 sm:p-8 shadow-sm flex flex-col justify-between gap-6 hover:border-[#EA580C]/50 transition-all hover:shadow-md group rounded-2xl"
                    >
                      <div className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#FCFAF7] pb-3">
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border rounded-full ${statusStyles[project.status?.toUpperCase()] || 'bg-stone-50 text-stone-700 border-stone-200'}`}>
                              {project.status}
                            </span>
                            <span className="text-xs text-[#908078]">
                              Posted {fmtDate(project.created_at)}
                            </span>
                          </div>
                          <span className="text-xs text-[#606060] font-medium bg-[#FCFAF7] px-3 py-1 border border-[#e8ddd6] rounded-full">
                            Client: <strong className="text-[#1c1108]">{project.client_name}</strong>
                          </span>
                        </div>

                        <div>
                          <Link href={`/bidding/${project.id}`}>
                            <h2 className="font-serif text-xl sm:text-2xl text-[#1c1108] group-hover:text-[#EA580C] transition-colors">
                              {project.title}
                            </h2>
                          </Link>
                          <p className="text-[#606060] mt-2.5 text-sm leading-relaxed line-clamp-3">
                            {project.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-[#e8ddd6]">
                        <div className="flex flex-wrap gap-4 sm:gap-6 text-xs text-[#606060]">
                          <div className="flex items-center gap-1.5 font-medium">
                            <span className="text-[#EA580C] uppercase text-[10px] font-bold tracking-wider">Location:</span>
                            <span>{project.location}</span>
                          </div>
                          <div className="flex items-center gap-1.5 font-medium">
                            <span className="text-[#EA580C] uppercase text-[10px] font-bold tracking-wider">Budget:</span>
                            <span>{project.budget_range}</span>
                          </div>
                          <div className="flex items-center gap-1.5 font-medium">
                            <span className="text-[#EA580C] uppercase text-[10px] font-bold tracking-wider">Bids:</span>
                            <span>{project.bids_count} submitted</span>
                          </div>
                        </div>

                        <Link
                          href={`/bidding/${project.id}`}
                          className="btn-primary text-[11px] uppercase tracking-wider py-3 px-6 text-center self-stretch sm:self-auto whitespace-nowrap"
                        >
                          View Tender &amp; Bid
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </main>

        </div>
      </div>

      {/* Mobile Filter Drawer Bottom-Sheet */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileFilterOpen(false)}
          />

          {/* Drawer Box */}
          <div className="relative z-[70] bg-[#FCFAF7] border-t border-[#e8ddd6] p-6 space-y-6 max-h-[85vh] overflow-y-auto shadow-2xl rounded-t-3xl">
            <div className="flex items-center justify-between border-b border-[#e8ddd6] pb-4">
              <h3 className="font-serif text-xl text-[#1c1108]">Filter Projects</h3>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="w-8 h-8 flex items-center justify-center text-lg text-[#606060] rounded-full hover:bg-stone-100"
              >
                x
              </button>
            </div>

            {/* Status Options */}
            <div className="space-y-2">
              <label className="block text-xs uppercase tracking-wider text-[#606060] font-semibold">Tender Status</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "ALL", label: "All Statuses" },
                  { id: "OPEN", label: "Open Tenders" },
                  { id: "CLOSED", label: "Closed Tenders" },
                  { id: "AWARDED", label: "Awarded" },
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => setSelectedStatus(st.id)}
                    className={`py-2 px-3 text-xs border text-center font-medium transition-colors rounded-xl ${
                      selectedStatus === st.id
                        ? "bg-[#1c1108] text-[#FCFAF7] border-[#1c1108]"
                        : "bg-white text-[#1c1108] border-[#e8ddd6]"
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Location Input */}
            <div className="space-y-2">
              <label className="block text-xs uppercase tracking-wider text-[#606060] font-semibold">Location</label>
              <input
                type="text"
                placeholder="e.g. Colombo, Kandy..."
                value={locationQuery}
                onChange={e => setLocationQuery(e.target.value)}
                className="w-full bg-white border border-[#e8ddd6] p-3 text-sm text-[#1c1108] focus:outline-none focus:border-[#EA580C] rounded-xl"
              />
            </div>

            {/* Budget Input */}
            <div className="space-y-2">
              <label className="block text-xs uppercase tracking-wider text-[#606060] font-semibold">Budget Range</label>
              <input
                type="text"
                placeholder="e.g. 20M, 50 Million..."
                value={budgetQuery}
                onChange={e => setBudgetQuery(e.target.value)}
                className="w-full bg-white border border-[#e8ddd6] p-3 text-sm text-[#1c1108] focus:outline-none focus:border-[#EA580C] rounded-xl"
              />
            </div>

            <div className="pt-4 border-t border-[#e8ddd6] flex gap-3">
              <button
                onClick={clearFilters}
                className="flex-1 py-3 text-xs uppercase tracking-wider border border-[#EA580C] text-[#EA580C] rounded-xl font-semibold hover:bg-[#EA580C] hover:text-white transition-colors"
              >
                Reset
              </button>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="flex-1 py-3 text-xs uppercase tracking-wider bg-[#1c1108] text-white rounded-xl font-semibold hover:bg-[#322318] transition-colors"
              >
                Apply Filters ({filteredProjects.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

