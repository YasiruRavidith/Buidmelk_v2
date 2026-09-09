"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { SlidersHorizontal, X, User, CheckCircle2, BadgeCheck } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

interface ProfessionalProfile {
  profession_type: string;
  company_name: string;
  location: string;
  years_of_experience: number;
  about: string;
  skills_specialization: string;
  rating: string;
  projects_completed: number;
  pricing_range: string;
  availability: string;
  is_verified?: boolean;
}

interface Professional {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  profile_image: string | null;
  professional_profile: ProfessionalProfile | null;
}

export default function FindProfessionalsPage() {
  const { user } = useAuth();
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [professionFilter, setProfessionFilter] = useState("ALL");
  const [locationFilter, setLocationFilter] = useState("");
  const [minRating, setMinRating] = useState(0);

  useEffect(() => {
    async function fetchProfessionals() {
      try {
        const res = await fetch("http://localhost:8000/api/users/professionals/");
        if (!res.ok) throw new Error("Failed to fetch professionals");
        const data = await res.json();
        setProfessionals(data);
      } catch (error: unknown) {
        setError(error instanceof Error ? error.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }
    fetchProfessionals();
  }, []);

  // Lock scroll when mobile filter panel open
  useEffect(() => {
    if (filtersOpen) {
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.documentElement.style.overflow = '';
    }
    return () => { document.documentElement.style.overflow = ''; };
  }, [filtersOpen]);

  const filteredProfessionals = professionals.filter((prof) => {
    const profType = prof.professional_profile?.profession_type || "";
    const fullName = `${prof.first_name} ${prof.last_name}`.toLowerCase();
    const company = prof.professional_profile?.company_name?.toLowerCase() || "";
    const location = prof.professional_profile?.location?.toLowerCase() || "";
    const ratingValue = parseFloat(prof.professional_profile?.rating || "0");

    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || company.includes(searchTerm.toLowerCase());
    const matchesFilter = professionFilter === "ALL" || profType === professionFilter;
    const matchesLocation = !locationFilter || location.includes(locationFilter.toLowerCase());
    const matchesRating = minRating === 0 || ratingValue >= minRating;

    return matchesSearch && matchesFilter && matchesLocation && matchesRating;
  });

  const professionTypes = [
    { value: "ALL", label: "All Professions" },
    { value: "CONTRACTOR", label: "Contractor" },
    { value: "ENGINEER", label: "Engineer" },
    { value: "LAWYER", label: "Lawyer" },
    { value: "ARCHITECT", label: "Architect" },
    { value: "QS", label: "Quantity Surveyor (QS)" },
    { value: "HARDWARE", label: "Hardware Owner" },
    { value: "WORKER", label: "General Worker" },
    { value: "ELECTRICIAN", label: "Electrician" },
    { value: "PLUMBER", label: "Plumber" },
    { value: "WELDER", label: "Welder" },
    { value: "PAINTER", label: "Painter" },
  ];

  if (loading) return <div className="p-8 text-center">Loading professionals...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  const clearFilters = () => {
    setSearchTerm("");
    setProfessionFilter("ALL");
    setLocationFilter("");
    setMinRating(0);
  };

  const activeFilterCount = [
    searchTerm !== "",
    professionFilter !== "ALL",
    locationFilter !== "",
    minRating !== 0,
  ].filter(Boolean).length;

  const FilterPanel = () => (
    <div className="space-y-5">
      <div>
        <label className="block text-[11px] uppercase tracking-[0.24em] text-[#8B4434]/70 font-semibold mb-2">Search</label>
        <input
          type="text"
          placeholder="Search by name or company..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-none border border-[#e8ddd6] bg-[#FCFAF7] px-4 py-3 text-[#281713] placeholder:text-[#8B4434]/40 focus:outline-none focus:ring-2 focus:ring-[#8B4434]/15"
        />
      </div>

      <div>
        <label className="block text-[11px] uppercase tracking-[0.24em] text-[#8B4434]/70 font-semibold mb-2">Profession</label>
        <select
          value={professionFilter}
          onChange={(e) => setProfessionFilter(e.target.value)}
          className="w-full rounded-none border border-[#e8ddd6] bg-[#FCFAF7] px-4 py-3 text-[#281713] focus:outline-none focus:ring-2 focus:ring-[#8B4434]/15"
        >
          {professionTypes.map((pt) => (
            <option key={pt.value} value={pt.value}>{pt.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-[11px] uppercase tracking-[0.24em] text-[#8B4434]/70 font-semibold mb-2">Location</label>
        <input
          type="text"
          placeholder="Colombo, Gampaha..."
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
          className="w-full rounded-none border border-[#e8ddd6] bg-[#FCFAF7] px-4 py-3 text-[#281713] placeholder:text-[#8B4434]/40 focus:outline-none focus:ring-2 focus:ring-[#8B4434]/15"
        />
      </div>

      <div>
        <label className="block text-[11px] uppercase tracking-[0.24em] text-[#8B4434]/70 font-semibold mb-2">Minimum Rating</label>
        <select
          value={minRating}
          onChange={(e) => setMinRating(Number(e.target.value))}
          className="w-full rounded-none border border-[#e8ddd6] bg-[#FCFAF7] px-4 py-3 text-[#281713] focus:outline-none focus:ring-2 focus:ring-[#8B4434]/15"
        >
          <option value={0}>Any Rating</option>
          <option value={1}>⭐ 1 &amp; above</option>
          <option value={2}>⭐⭐ 2 &amp; above</option>
          <option value={3}>⭐⭐⭐ 3 &amp; above</option>
          <option value={4}>⭐⭐⭐⭐ 4 &amp; above</option>
          <option value={5}>⭐⭐⭐⭐⭐ 5 only</option>
        </select>
      </div>

      <button
        type="button"
        onClick={clearFilters}
        className="w-full rounded-none border border-[#8B4434] bg-white px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8B4434] transition-colors hover:bg-[#8B4434] hover:text-white"
      >
        Clear Filters
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FCFAF7] text-[#281713]">
      <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-12 py-8 sm:py-14 lg:py-20">
        {/* Header */}
        <div className="max-w-3xl mb-8 sm:mb-10 lg:mb-12">
          <p className="text-[10px] uppercase tracking-[0.35em] text-[#8B4434]/70 font-semibold mb-3">Professional Directory</p>
          <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl leading-[1.02] text-[#281713]">Find Professionals</h1>
          <p className="mt-4 text-[#606060] text-sm sm:text-base max-w-2xl">
            Browse verified professionals and explore their profiles, experience, and specialties.
          </p>
        </div>

        {/* Mobile filter toggle */}
        <div className="lg:hidden mb-5 flex items-center justify-between">
          <p className="text-sm text-[#606060]">
            Showing <span className="font-semibold text-[#281713]">{filteredProfessionals.length}</span> professionals
          </p>
          <button
            onClick={() => setFiltersOpen(true)}
            className="flex items-center gap-2 border border-[#8B4434] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8B4434] hover:bg-[#8B4434] hover:text-white transition-colors"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-1 h-4 w-4 rounded-full bg-[#8B4434] text-white text-[9px] flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Mobile filter backdrop */}
        <div
          onClick={() => setFiltersOpen(false)}
          className={`fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm transition-opacity duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] lg:hidden
            ${filtersOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        />
        {/* Mobile filter drawer (slides from bottom) */}
        <aside className={`fixed bottom-0 left-0 right-0 z-[70] bg-[#FCFAF7] shadow-2xl flex flex-col max-h-[85vh] rounded-t-2xl transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] lg:hidden
          ${filtersOpen ? 'translate-y-0' : 'translate-y-full'}`}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#e8ddd6] shrink-0">
            <h2 className="font-serif text-xl text-[#281713]">Filters</h2>
            <button onClick={() => setFiltersOpen(false)} className="p-2 text-[#8B4434]"><X className="h-5 w-5" /></button>
          </div>
          <div className="overflow-y-auto p-5 flex-1">
            <FilterPanel />
          </div>
          <div className="p-4 border-t border-[#e8ddd6] shrink-0">
            <button
              onClick={() => setFiltersOpen(false)}
              className="w-full bg-[#8B4434] text-white py-3.5 text-[11px] tracking-[0.22em] uppercase font-semibold hover:bg-[#6c3426] transition-colors"
            >
              Show {filteredProfessionals.length} Results
            </button>
          </div>
        </aside>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 lg:gap-10 items-start">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block sticky top-8 border border-[#e8ddd6] bg-white p-6 shadow-sm rounded-none">
            <div className="mb-6">
              <p className="text-[10px] uppercase tracking-[0.3em] text-[#8B4434]/70 font-semibold mb-2">Filters</p>
              <h2 className="font-serif text-3xl text-[#281713]">Side Panel</h2>
              <p className="mt-2 text-sm text-[#606060]">Narrow the list by profession, name, and location.</p>
            </div>
            <FilterPanel />
          </aside>

          {/* Results */}
          <section>
            <div className="mb-6 hidden lg:flex items-end justify-between gap-4">
              <p className="text-sm text-[#606060]">
                Showing <span className="font-semibold text-[#281713]">{filteredProfessionals.length}</span> professionals
              </p>
            </div>

            {filteredProfessionals.length === 0 ? (
              <div className="text-center py-16 text-[#606060] bg-white border border-[#e8ddd6] rounded-none shadow-sm">No professionals found.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-5 sm:gap-8">
                {filteredProfessionals.map((prof) => (
                  <article key={prof.id} className="group overflow-hidden rounded-none border border-[#e8ddd6] bg-white shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl">
                    <div className="relative h-[280px] sm:h-[320px] lg:h-[360px] bg-[#efe6df] overflow-hidden">
                      {prof.professional_profile?.is_verified && (
                        <div className="absolute top-4 right-4 z-10 inline-flex items-center gap-1 bg-[#8B4434] text-white px-2.5 py-1 text-[10px] uppercase font-bold tracking-widest shadow-md">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                        </div>
                      )}

                      {prof.profile_image ? (
                        <Image src={prof.profile_image} alt={`${prof.first_name} ${prof.last_name}`} fill sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#f6ece6] to-[#fcfaf7] text-[#8B4434]">
                          <User className="w-16 h-16 opacity-60" />
                        </div>
                      )}

                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#101010]/85 via-[#101010]/30 to-transparent p-5 sm:p-6">
                        <p className="text-[10px] uppercase tracking-[0.28em] text-white/70 mb-2">
                          {prof.professional_profile?.profession_type?.replace(/_/g, " ") || "Professional"}
                        </p>
                        <h3 className="font-serif text-2xl sm:text-3xl text-white leading-tight flex items-center gap-2">
                          <span>{prof.first_name} {prof.last_name}</span>
                          {prof.professional_profile?.is_verified && (
                            <BadgeCheck className="w-5 h-5 text-white fill-[#8B4434] shrink-0" />
                          )}
                        </h3>
                        {prof.professional_profile?.company_name && (
                          <p className="mt-1.5 text-sm text-white/80">{prof.professional_profile.company_name}</p>
                        )}
                      </div>
                    </div>

                    <div className="p-4 sm:p-6 lg:p-7">
                      <div className="grid grid-cols-2 gap-3 text-sm text-[#606060]">
                        {prof.professional_profile?.location && (
                          <div>
                            <p className="text-[10px] uppercase tracking-[0.22em] text-[#8B4434]/70 mb-1">Location</p>
                            <p className="text-xs sm:text-sm">{prof.professional_profile.location}</p>
                          </div>
                        )}
                        {prof.professional_profile?.years_of_experience !== undefined && (
                          <div>
                            <p className="text-[10px] uppercase tracking-[0.22em] text-[#8B4434]/70 mb-1">Experience</p>
                            <p className="text-xs sm:text-sm">{prof.professional_profile.years_of_experience} years</p>
                          </div>
                        )}
                        {prof.professional_profile?.rating && (
                          <div className="col-span-2">
                            <p className="text-[10px] uppercase tracking-[0.22em] text-[#8B4434]/70 mb-1">Rating</p>
                            <p className="text-xs sm:text-sm">{prof.professional_profile.rating} ⭐ ({prof.professional_profile.projects_completed} projects)</p>
                          </div>
                        )}
                      </div>

                      {prof.professional_profile?.skills_specialization && (
                        <p className="mt-4 text-sm leading-7 text-[#606060] line-clamp-3">
                          {prof.professional_profile.skills_specialization}
                        </p>
                      )}

                      <div className="mt-5 sm:mt-7 flex gap-3">
                        <Link
                          href={`/professionals/${prof.id}`}
                          className="flex-1 rounded-none border border-[#8B4434] px-3 sm:px-4 py-2.5 sm:py-3 text-center text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8B4434] transition-colors hover:bg-[#8B4434] hover:text-white"
                        >
                          View Profile
                        </Link>
                        <button
                          className="flex-1 rounded-none bg-[#8B4434] px-3 sm:px-4 py-2.5 sm:py-3 text-center text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.22em] text-[#FCFAF7] transition-colors hover:bg-[#6c3426]"
                          onClick={() => alert('Connect feature coming soon!')}
                        >
                          Connect
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
