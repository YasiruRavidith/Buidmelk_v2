"use client";

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  ChevronLeft,
  ChevronRight,
  BadgeCheck,
  Star,
  ShoppingCart,
  Check,
  ArrowRight,
  MapPin,
} from 'lucide-react'
import { API_BASE_URL, BACKEND_ROOT_URL } from '../lib/api'
import { useAuth } from '../hooks/useAuth'

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
  is_badge_active?: boolean;
}

interface Professional {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  profile_image: string | null;
  profile_image_url?: string | null;
  professional_profile: ProfessionalProfile | null;
}

interface Material {
  id: number;
  name: string;
  category_name?: string;
  supplier_name?: string;
  current_price: string;
  unit?: string;
  images?: Array<{ id: number; image_url?: string; image?: string }>;
}

const CATEGORY_IMAGES: Record<string, string> = {
  "Cement & Concrete": "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=800&auto=format&fit=crop",
  "Cement": "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=800&auto=format&fit=crop",
  "Steel & Reinforcement": "https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?q=80&w=800&auto=format&fit=crop",
  "Steel": "https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?q=80&w=800&auto=format&fit=crop",
  "Bricks & Blocks": "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?q=80&w=800&auto=format&fit=crop",
  "Bricks": "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?q=80&w=800&auto=format&fit=crop",
  "Sand": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800&auto=format&fit=crop",
  "Aggregates": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800&auto=format&fit=crop",
  "Roofing & Ceiling": "https://images.unsplash.com/photo-1632759145351-1d592919f522?q=80&w=800&auto=format&fit=crop",
  "Paints & Finishes": "https://images.unsplash.com/photo-1562259949-e8e7689d7828?q=80&w=800&auto=format&fit=crop",
  "Flooring & Tiles": "https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?q=80&w=800&auto=format&fit=crop",
  "Electrical & Lighting": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=800&auto=format&fit=crop",
  "Electrical": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=800&auto=format&fit=crop",
  "Plumbing & Sanitaryware": "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?q=80&w=800&auto=format&fit=crop",
  "Plumbing": "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?q=80&w=800&auto=format&fit=crop",
};

const PROFESSION_PORTRAITS: Record<string, string> = {
  CONTRACTOR: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop",
  ENGINEER: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=800&auto=format&fit=crop",
  ARCHITECT: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop",
  QS: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=800&auto=format&fit=crop",
  LAWYER: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=800&auto=format&fit=crop",
  HARDWARE: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=800&auto=format&fit=crop",
  ELECTRICIAN: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=800&auto=format&fit=crop",
  PLUMBER: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=800&auto=format&fit=crop",
  WORKER: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=800&auto=format&fit=crop",
  PAINTER: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=800&auto=format&fit=crop",
  WELDER: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=800&auto=format&fit=crop",
};

const DEFAULT_PORTRAIT = "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=800&auto=format&fit=crop";
const DEFAULT_MATERIAL_IMG = "https://images.unsplash.com/photo-1541888946425-d0fbb186f5f8?q=80&w=800&auto=format&fit=crop";

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();

  // Verified Professionals State
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [prosLoading, setProsLoading] = useState(true);
  const [prosIndex, setProsIndex] = useState(0);

  // Materials State
  const [materials, setMaterials] = useState<Material[]>([]);
  const [materialsLoading, setMaterialsLoading] = useState(true);
  const [addingCartId, setAddingCartId] = useState<number | null>(null);
  const [addedCartIds, setAddedCartIds] = useState<Record<number, boolean>>({});

  // 1. Fetch Verified Professionals
  useEffect(() => {
    async function fetchPros() {
      try {
        const res = await fetch(`${API_BASE_URL}/users/professionals/`);
        if (res.ok) {
          const data = await res.json();
          setProfessionals(data);
        }
      } catch (err) {
        console.error("Failed to load professionals:", err);
      } finally {
        setProsLoading(false);
      }
    }
    fetchPros();
  }, []);

  // Filter only verified professionals
  const verifiedPros = useMemo(() => {
    return professionals.filter(
      (p) =>
        p.professional_profile?.is_verified ||
        p.professional_profile?.is_badge_active
    );
  }, [professionals]);

  // Handle 4-in-a-row pagination/sliding for verified professionals
  const handlePrevPros = () => {
    if (verifiedPros.length <= 4) return;
    setProsIndex((prev) => (prev - 4 + verifiedPros.length) % verifiedPros.length);
  };

  const handleNextPros = () => {
    if (verifiedPros.length <= 4) return;
    setProsIndex((prev) => (prev + 4) % verifiedPros.length);
  };

  // Exactly 4 items visible in a row on desktop
  const visiblePros = useMemo(() => {
    if (verifiedPros.length === 0) return [];
    if (verifiedPros.length <= 4) return verifiedPros;
    const list: Professional[] = [];
    for (let i = 0; i < 4; i++) {
      list.push(verifiedPros[(prosIndex + i) % verifiedPros.length]);
    }
    return list;
  }, [verifiedPros, prosIndex]);

  // 2. Fetch Best Selling Materials
  useEffect(() => {
    async function fetchMaterials() {
      try {
        const res = await fetch(`${API_BASE_URL}/marketplace/materials/`);
        if (res.ok) {
          const data = await res.json();
          setMaterials(data);
        }
      } catch (err) {
        console.error("Failed to load materials:", err);
      } finally {
        setMaterialsLoading(false);
      }
    }
    fetchMaterials();
  }, []);

  // Top 4 best selling materials
  const bestSellingMaterials = useMemo(() => {
    return materials.slice(0, 4);
  }, [materials]);

  // Handle Quick Add to Cart with live Navbar refresh
  const handleAddToCart = async (mat: Material) => {
    if (!user) {
      router.push('/login?redirect=/');
      return;
    }

    setAddingCartId(mat.id);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${API_BASE_URL}/marketplace/cart/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          product_type: 'material',
          product_id: mat.id,
          quantity: 1,
        }),
      });

      if (res.ok) {
        // Trigger live cart update in Navbar immediately
        window.dispatchEvent(new Event('cartUpdated'));
        setAddedCartIds((prev) => ({ ...prev, [mat.id]: true }));
        setTimeout(() => {
          setAddedCartIds((prev) => ({ ...prev, [mat.id]: false }));
        }, 2500);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.detail || 'Failed to add item to cart');
      }
    } catch {
      alert('Error adding item to cart');
    } finally {
      setAddingCartId(null);
    }
  };

  const fmtPrice = (val: string | number) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num)) return 'LKR 0';
    return `LKR ${num.toLocaleString('en-LK', { maximumFractionDigits: 0 })}`;
  };

  const getMaterialImage = (mat: Material) => {
    if (mat.images && mat.images.length > 0) {
      const img = mat.images[0];
      const url = img.image_url || img.image;
      if (url) {
        if (url.startsWith('http')) return url;
        return `${BACKEND_ROOT_URL}${url.startsWith('/') ? '' : '/'}${url}`;
      }
    }
    if (mat.category_name && CATEGORY_IMAGES[mat.category_name]) {
      return CATEGORY_IMAGES[mat.category_name];
    }
    return DEFAULT_MATERIAL_IMG;
  };

  const getProfileImage = (prof: Professional) => {
    const url = prof.profile_image_url || prof.profile_image;
    if (url) {
      if (url.startsWith('http')) return url;
      return `${BACKEND_ROOT_URL}${url.startsWith('/') ? '' : '/'}${url}`;
    }
    const type = prof.professional_profile?.profession_type?.toUpperCase() || '';
    return PROFESSION_PORTRAITS[type] || DEFAULT_PORTRAIT;
  };

  return (
    <div className="bg-[#FCFAF7] font-sans pb-0">
      {/* Hero Image Section */}
      <section className="relative w-full h-[70vh] sm:h-[80vh] lg:h-[90vh] min-h-[480px] flex flex-col justify-end">
        <Image
          src="/1778355227728.png"
          alt="Hero Image"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center z-0"
        />
        <div className="absolute inset-0 z-10 bg-[#303030]/10" />
        <div className="absolute inset-0 z-20 bg-gradient-to-t from-[#101010]/90 via-[#101010]/20 to-transparent" />

        <div className="relative z-30 w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-12 pb-10 sm:pb-16">
          <p className="text-white/80 text-[10px] tracking-[0.25em] uppercase font-bold mb-3">
            BuildMe.lk
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl md:text-7xl lg:text-[5rem] text-white leading-[1.05] tracking-tight">
            Constructing <br className="hidden sm:block" />The Future
          </h1>
          <p className="text-white/80 text-xs sm:text-sm mt-3 max-w-lg font-light">
            Instant estimations, verified experts, transparent tenders, and direct building supplies.
          </p>
        </div>
      </section>

      {/* SECTION 1: VERIFIED PROFESSIONALS (Big photos, minimal text, 4 in a row, <> controls) */}
      <section className="bg-white py-14 sm:py-20 border-b border-[#8B4434]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
          {/* Section Header */}
          <div className="flex items-end justify-between gap-6 mb-8">
            <div>
              <p className="text-[9px] uppercase tracking-[0.25em] text-[#8B4434] font-semibold mb-1.5">
                Verified Directory
              </p>
              <h2 className="font-serif text-3xl md:text-4xl text-[#1c1108]">
                Verified Professionals
              </h2>
            </div>

            {/* Carousel Controls */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handlePrevPros}
                disabled={verifiedPros.length <= 4}
                className={`w-9 h-9 rounded-full border border-[#8B4434]/30 flex items-center justify-center transition-all ${
                  verifiedPros.length <= 4
                    ? 'opacity-30 cursor-not-allowed text-[#8B4434]/50'
                    : 'text-[#8B4434] hover:bg-[#8B4434] hover:text-white active:scale-95'
                }`}
                title="Previous"
                aria-label="Previous"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextPros}
                disabled={verifiedPros.length <= 4}
                className={`w-9 h-9 rounded-full border border-[#8B4434]/30 flex items-center justify-center transition-all ${
                  verifiedPros.length <= 4
                    ? 'opacity-30 cursor-not-allowed text-[#8B4434]/50'
                    : 'text-[#8B4434] hover:bg-[#8B4434] hover:text-white active:scale-95'
                }`}
                title="Next"
                aria-label="Next"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <Link
                href="/professionals"
                className="hidden md:inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.15em] text-[#8B4434] font-semibold hover:underline ml-2"
              >
                <span>All Pros</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* 4 In A Row Grid with BIG Photos & Minimal Text */}
          {prosLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-96 bg-stone-100 animate-pulse" />
              ))}
            </div>
          ) : visiblePros.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {visiblePros.map((prof, idx) => {
                const p = prof.professional_profile;
                const displayName =
                  `${prof.first_name} ${prof.last_name}`.trim() ||
                  p?.company_name ||
                  prof.username;
                const photoUrl = getProfileImage(prof);

                return (
                  <Link
                    href={`/professionals/${prof.id}`}
                    key={`${prof.id}-${idx}`}
                    className="group bg-white border border-[#8B4434]/15 hover:border-[#8B4434] transition-all duration-300 shadow-sm hover:shadow-lg flex flex-col overflow-hidden"
                  >
                    {/* BIG Photo Container */}
                    <div className="relative h-64 sm:h-72 w-full bg-stone-100 overflow-hidden">
                      <img
                        src={photoUrl}
                        alt={displayName}
                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                      />
                      {/* Verified Badge Overlay */}
                      <div className="absolute top-3 right-3 bg-emerald-700/90 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1 uppercase tracking-wider">
                        <BadgeCheck className="w-3.5 h-3.5" />
                        <span>Verified</span>
                      </div>
                      {/* Profession Overlay Pill */}
                      <div className="absolute bottom-3 left-3 bg-[#1c1108]/85 backdrop-blur-md text-white text-[9px] uppercase tracking-widest font-semibold px-2.5 py-1 rounded-sm">
                        {p?.profession_type || 'PROFESSIONAL'}
                      </div>
                    </div>

                    {/* Minimal Sleek Content */}
                    <div className="p-4 flex flex-col justify-between flex-1">
                      <div>
                        <h3 className="font-serif text-lg text-[#1c1108] group-hover:text-[#8B4434] transition-colors truncate">
                          {displayName}
                        </h3>
                        <p className="text-xs text-[#606060] flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-[#8B4434]" />
                          <span className="truncate">{p?.location || 'Western Province'}</span>
                        </p>
                      </div>

                      <div className="mt-3 pt-3 border-t border-[#8B4434]/10 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1 font-semibold text-[#b44d08]">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span>{p?.rating ? Number(p.rating).toFixed(1) : '4.8'}</span>
                          <span className="text-[10px] text-[#908078] font-normal">({p?.projects_completed ?? 12})</span>
                        </div>
                        <span className="text-[11px] font-semibold text-[#8B4434] group-hover:underline flex items-center gap-0.5">
                          View Profile &rarr;
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-[#606060] py-8 text-center">
              No verified professionals found at this moment.
            </p>
          )}
        </div>
      </section>

      {/* SECTION 2: BEST SELLING MATERIALS (4 in a row, simple & clean) */}
      <section className="bg-[#FAEBE7] py-14 sm:py-20 border-b border-[#8B4434]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
          {/* Section Header */}
          <div className="flex items-end justify-between gap-6 mb-8">
            <div>
              <p className="text-[9px] uppercase tracking-[0.25em] text-[#8B4434] font-semibold mb-1.5">
                Marketplace Supplies
              </p>
              <h2 className="font-serif text-3xl md:text-4xl text-[#8B4434]">
                Best Selling Materials
              </h2>
            </div>

            <Link
              href="/marketplace"
              className="inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.15em] text-[#8B4434] font-semibold hover:underline shrink-0"
            >
              <span>Explore All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* 4 In A Row Grid */}
          {materialsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-72 bg-white/60 animate-pulse" />
              ))}
            </div>
          ) : bestSellingMaterials.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {bestSellingMaterials.map((mat) => {
                const imgUrl = getMaterialImage(mat);
                const isAdding = addingCartId === mat.id;
                const isAdded = !!addedCartIds[mat.id];

                return (
                  <div
                    key={mat.id}
                    className="bg-white border border-[#8B4434]/15 hover:border-[#8B4434] transition-all duration-300 flex flex-col justify-between shadow-sm hover:shadow-md group overflow-hidden"
                  >
                    {/* Material Image */}
                    <div className="relative h-44 w-full bg-stone-100 overflow-hidden">
                      <img
                        src={imgUrl}
                        alt={mat.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <span className="absolute top-3 left-3 bg-[#1c1108]/85 text-white text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5">
                        {mat.category_name || 'Material'}
                      </span>
                    </div>

                    {/* Simple Content */}
                    <div className="p-4 flex flex-col justify-between flex-1 space-y-3">
                      <div>
                        <h3 className="font-serif text-base text-[#1c1108] group-hover:text-[#8B4434] transition-colors line-clamp-1">
                          {mat.name}
                        </h3>
                        <p className="text-[11px] text-[#606060] truncate mt-0.5">
                          {mat.supplier_name || 'Verified Supplier'}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-[#8B4434]/10 flex items-baseline justify-between">
                        <p className="font-serif text-lg font-bold text-[#8B4434]">
                          {fmtPrice(mat.current_price)}
                        </p>
                        {mat.unit && (
                          <span className="text-[10px] text-[#606060]">per {mat.unit}</span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <Link
                          href={`/marketplace/${mat.id}`}
                          className="border border-[#8B4434]/30 text-[#8B4434] hover:bg-[#8B4434]/5 py-2 text-center text-[10px] font-semibold uppercase tracking-wider transition-colors"
                        >
                          Details
                        </Link>
                        <button
                          onClick={() => handleAddToCart(mat)}
                          disabled={isAdding}
                          className={`flex items-center justify-center gap-1 py-2 text-[10px] font-semibold uppercase tracking-wider transition-all text-white ${
                            isAdded
                              ? 'bg-emerald-600'
                              : 'bg-[#8B4434] hover:bg-[#723628] active:scale-95'
                          }`}
                        >
                          {isAdded ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Added!</span>
                            </>
                          ) : isAdding ? (
                            <span>Adding...</span>
                          ) : (
                            <>
                              <ShoppingCart className="w-3.5 h-3.5" />
                              <span>Add Cart</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-[#8B4434]/80 py-8 text-center">
              No materials listed at this moment.
            </p>
          )}
        </div>
      </section>

      {/* SECTION 3: FEATURED PROJECTS */}
      <section className="bg-[#FCFAF7] py-14 sm:py-24 border-b border-[#8B4434]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
          <div className="flex items-end justify-between gap-6 mb-10">
            <div>
              <p className="text-[9px] uppercase tracking-[0.2em] text-[#8B4434]/70 font-semibold mb-1.5">
                Architectural Showcase
              </p>
              <h2 className="font-serif text-3xl md:text-4xl text-[#8B4434]">
                Featured Projects
              </h2>
            </div>
            <Link
              href="/bidding"
              className="text-[9px] uppercase tracking-[0.2em] text-[#8B4434] font-semibold border-b border-[#8B4434]/30 pb-1 hover:border-[#8B4434] transition-colors"
            >
              Open Projects &rarr;
            </Link>
          </div>

          <div className="grid gap-8 md:grid-cols-12">
            <article className="md:col-span-8">
              <div className="relative h-[260px] sm:h-[320px] md:h-[360px] overflow-hidden bg-[#efe6df] border border-[#8B4434]/10">
                <img
                  src="https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1600&auto=format&fit=crop"
                  alt="The Monolith Pavilion"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="mt-3 flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-serif text-xl text-[#8B4434]">The Monolith Pavilion</h3>
                  <p className="text-[9px] uppercase tracking-[0.2em] text-[#8B4434]/70 mt-0.5">Zurich, Switzerland</p>
                </div>
                <p className="text-[9px] uppercase tracking-[0.2em] text-[#8B4434]/70">2023</p>
              </div>
            </article>

            <article className="md:col-span-4 md:mt-10">
              <div className="relative h-[260px] sm:h-[320px] md:h-[260px] overflow-hidden bg-[#efe6df] border border-[#8B4434]/10">
                <img
                  src="https://images.unsplash.com/photo-1511818966892-d7d671e672a2?q=80&w=1400&auto=format&fit=crop"
                  alt="Kensington Retreat"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="mt-3 flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-serif text-xl text-[#8B4434]">Kensington Retreat</h3>
                  <p className="text-[9px] uppercase tracking-[0.2em] text-[#8B4434]/70 mt-0.5">London, UK</p>
                </div>
                <p className="text-[9px] uppercase tracking-[0.2em] text-[#8B4434]/70">2022</p>
              </div>
            </article>

            <article className="md:col-span-4 md:mt-4">
              <div className="relative h-[260px] sm:h-[320px] md:h-[340px] overflow-hidden bg-[#efe6df] border border-[#8B4434]/10">
                <img
                  src="https://images.unsplash.com/photo-1494526585095-c41746248156?q=80&w=1400&auto=format&fit=crop"
                  alt="Obsidian Gallery"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="mt-3 flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-serif text-xl text-[#8B4434]">Obsidian Gallery</h3>
                  <p className="text-[9px] uppercase tracking-[0.2em] text-[#8B4434]/70 mt-0.5">Tokyo, Japan</p>
                </div>
                <p className="text-[9px] uppercase tracking-[0.2em] text-[#8B4434]/70">2024</p>
              </div>
            </article>

            <article className="md:col-span-8 md:mt-12">
              <div className="relative h-[260px] sm:h-[320px] md:h-[340px] overflow-hidden bg-[#efe6df] border border-[#8B4434]/10">
                <img
                  src="https://images.unsplash.com/photo-1511818966892-d7d671e672a2?q=80&w=1400&auto=format&fit=crop"
                  alt="Aegean Residence"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="mt-3 flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-serif text-xl text-[#8B4434]">Aegean Residence</h3>
                  <p className="text-[9px] uppercase tracking-[0.2em] text-[#8B4434]/70 mt-0.5">Mykonos, Greece</p>
                </div>
                <p className="text-[9px] uppercase tracking-[0.2em] text-[#8B4434]/70">2021</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* SECTION 4: PLATFORM HUB (Simple, punchy text, no walls of text) */}
      <section className="bg-[#FCFAF7] max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-14 sm:py-24 flex flex-col lg:flex-row gap-10 lg:gap-20">
        {/* Left column: Overview */}
        <div className="lg:w-1/3 space-y-4">
          <p className="text-[9px] uppercase tracking-[0.25em] text-[#8B4434] font-semibold">
            The Platform
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl text-[#1c1108] leading-tight">
            Build with clarity, speed, and trust.
          </h2>
          <p className="text-xs sm:text-sm text-[#606060] leading-relaxed">
            From smart cost estimations to verified contractors and competitive tender bidding, everything you need is unified in one ecosystem.
          </p>
        </div>

        {/* Right column: 4 Simple Value Cards & Quick Actions */}
        <div className="lg:w-2/3 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 bg-white border border-[#8B4434]/15">
              <p className="font-serif text-base text-[#1c1108] font-semibold mb-1">AI Cost Estimation</p>
              <p className="text-xs text-[#606060]">Instant structural BOQ detailing linked directly to current Sri Lankan market prices.</p>
            </div>
            <div className="p-5 bg-white border border-[#8B4434]/15">
              <p className="font-serif text-base text-[#1c1108] font-semibold mb-1">Verified Network</p>
              <p className="text-xs text-[#606060]">Directly hire certified architects, engineers, and builders with zero contact fees.</p>
            </div>
            <div className="p-5 bg-white border border-[#8B4434]/15">
              <p className="font-serif text-base text-[#1c1108] font-semibold mb-1">Open Bidding Space</p>
              <p className="text-xs text-[#606060]">Publish your tender with 1 ticket and compare competitive bids from top professionals.</p>
            </div>
            <div className="p-5 bg-white border border-[#8B4434]/15">
              <p className="font-serif text-base text-[#1c1108] font-semibold mb-1">Direct Supplies</p>
              <p className="text-xs text-[#606060]">Source authentic cement, steel, bricks, and electricals with transparent pricing.</p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-[#8B4434]/15">
            <Link
              href="/professionals"
              className="group flex items-center justify-between border border-[#8B4434] p-5 hover:bg-[#8B4434] transition-colors"
            >
              <span className="text-xs uppercase tracking-widest font-semibold text-[#8B4434] group-hover:text-white">
                Find Professionals
              </span>
              <span className="text-base text-[#8B4434] group-hover:text-white group-hover:translate-x-1 transition-transform">&rarr;</span>
            </Link>

            <Link
              href="/estimation"
              className="group flex items-center justify-between border border-[#8B4434] p-5 hover:bg-[#8B4434] transition-colors"
            >
              <span className="text-xs uppercase tracking-widest font-semibold text-[#8B4434] group-hover:text-white">
                Start an Estimation
              </span>
              <span className="text-base text-[#8B4434] group-hover:text-white group-hover:translate-x-1 transition-transform">&rarr;</span>
            </Link>

            <Link
              href="/bidding"
              className="group flex items-center justify-between border border-[#8B4434] p-5 hover:bg-[#8B4434] transition-colors"
            >
              <span className="text-xs uppercase tracking-widest font-semibold text-[#8B4434] group-hover:text-white">
                Project Bidding Space
              </span>
              <span className="text-base text-[#8B4434] group-hover:text-white group-hover:translate-x-1 transition-transform">&rarr;</span>
            </Link>

            <Link
              href="/marketplace"
              className="group flex items-center justify-between border border-[#8B4434] p-5 hover:bg-[#8B4434] transition-colors"
            >
              <span className="text-xs uppercase tracking-widest font-semibold text-[#8B4434] group-hover:text-white">
                Material Marketplace
              </span>
              <span className="text-base text-[#8B4434] group-hover:text-white group-hover:translate-x-1 transition-transform">&rarr;</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
