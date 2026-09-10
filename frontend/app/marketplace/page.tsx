"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "../../hooks/useAuth";
import { SlidersHorizontal, X, Package, Clock, Sparkles } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

interface Material {
  id: number;
  name: string;
  brand?: string | null;
  category_name: string;
  supplier_name: string;
  supplier_location?: string | null;
  unit: string;
  current_price: string;
  description: string;
  stock_available: number;
  rating?: string | null;
  images?: { image_url?: string }[];
  last_ai_update?: string | null;
  created_at?: string;
}

function formatAiUpdateTime(dateStr?: string | null) {
  if (!dateStr) return "AI price sync active";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "AI price sync active";

  const now = new Date();
  const diffMs = Math.max(0, now.getTime() - date.getTime());
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 5) return "AI updated just now";
  if (diffMins < 60) return `AI updated ${diffMins}m ago`;
  if (diffHours < 24) return `AI updated ${diffHours}h ago`;
  if (diffDays === 1) return "AI updated yesterday";
  if (diffDays < 7) return `AI updated ${diffDays}d ago`;

  return `AI updated ${date.toLocaleDateString("en-LK", { month: "short", day: "numeric" })}`;
}

export default function MarketplaceFeed() {
  const { user } = useAuth();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartBusyId, setCartBusyId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [selectedSupplier, setSelectedSupplier] = useState("all");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [minRating, setMinRating] = useState(0);
  const [minStock, setMinStock] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Lock scroll when mobile filter drawer open
  useEffect(() => {
    if (filtersOpen) {
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.documentElement.style.overflow = '';
    }
    return () => { document.documentElement.style.overflow = ''; };
  }, [filtersOpen]);

  useEffect(() => {
    async function fetchMaterials() {
      try {
        const res = await fetch(`${API_BASE_URL}/marketplace/materials/`);
        if (res.ok) {
          const data = await res.json();
          setMaterials(data);
        }
      } catch {
        console.error("Failed to fetch materials");
      } finally {
        setLoading(false);
      }
    }
    fetchMaterials();
  }, []);

  const categories = Array.from(new Set(materials.map((material) => material.category_name))).sort();
  const brands = Array.from(
    new Set(materials.map((material) => material.brand?.trim()).filter((brand): brand is string => Boolean(brand))),
  ).sort();
  const suppliers = Array.from(new Set(materials.map((material) => material.supplier_name))).sort();

  const filteredMaterials = materials.filter((material) => {
    const matchesSearch =
      searchTerm.trim().length === 0 ||
      [material.name, material.brand, material.category_name, material.supplier_name, material.description]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(searchTerm.trim().toLowerCase());

    const matchesCategory = selectedCategory === "all" || material.category_name === selectedCategory;
    const matchesBrand = selectedBrand === "all" || (material.brand || "") === selectedBrand;
    const matchesSupplier = selectedSupplier === "all" || material.supplier_name === selectedSupplier;
    const matchesStock = !inStockOnly || material.stock_available > 0;

    const price = parseFloat(material.current_price);
    const matchesMinPrice = minPrice === "" || price >= parseFloat(minPrice);
    const matchesMaxPrice = maxPrice === "" || price <= parseFloat(maxPrice);

    const supplierLocation = (material.supplier_location || "").toLowerCase();
    const matchesLocation = locationFilter === "" || supplierLocation.includes(locationFilter.toLowerCase());

    const ratingValue = parseFloat(material.rating || "0");
    const matchesRating = minRating === 0 || ratingValue >= minRating;

    const stockQty = parseInt(minStock, 10);
    const matchesMinStock = isNaN(stockQty) || material.stock_available >= stockQty;

    return matchesSearch && matchesCategory && matchesBrand && matchesSupplier && matchesStock
      && matchesMinPrice && matchesMaxPrice && matchesLocation && matchesRating && matchesMinStock;
  });

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setSelectedBrand("all");
    setSelectedSupplier("all");
    setInStockOnly(false);
    setMinPrice("");
    setMaxPrice("");
    setLocationFilter("");
    setMinRating(0);
    setMinStock("");
  };

  const addToCart = async (material: Material) => {
    if (!user) {
      alert("Please log in to add items to cart.");
      return;
    }

    setCartBusyId(material.id);
    try {
      const token = await user.getIdToken();
      const response = await fetch(`${API_BASE_URL}/marketplace/cart/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, product_type: "material", product_id: material.id, quantity: 1 }),
      });

      if (response.ok) {
        alert(`${material.name} added to cart`);
      } else {
        const data = await response.json().catch(() => ({}));
        alert(data.detail || "Failed to add item to cart");
      }
    } catch {
      alert("Failed to add item to cart");
    } finally {
      setCartBusyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#FCFAF7] text-[#281713]">
      <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-12 py-8 sm:py-14 lg:py-20 space-y-8 sm:space-y-10">
        <header className="border-b border-[#e8ddd6] pb-6 sm:pb-8 lg:pb-10">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">
            <div>
              <p className="text-[10px] uppercase tracking-[0.35em] text-[#8B4434]/70 font-semibold mb-3">Hardware Store</p>
              <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl leading-[1.02]">Material Marketplace</h1>
              <p className="mt-4 text-[#606060] text-sm sm:text-base max-w-2xl">
                Find the best construction materials from verified suppliers, curated in a quiet-luxury marketplace.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 shrink-0">
              <div className="border border-[#e8ddd6] bg-white p-4 sm:p-5 rounded-none shadow-sm">
                <p className="text-[10px] uppercase tracking-[0.25em] text-[#8B4434]/70">Materials</p>
                <p className="mt-1 font-serif text-2xl sm:text-3xl text-[#281713]">{materials.length}</p>
              </div>
              <div className="border border-[#e8ddd6] bg-white p-4 sm:p-5 rounded-none shadow-sm">
                <p className="text-[10px] uppercase tracking-[0.25em] text-[#8B4434]/70">Verified Supply</p>
                <p className="mt-1 font-serif text-2xl sm:text-3xl text-[#281713]">24/7</p>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile filter toggle */}
        <div className="lg:hidden flex items-center justify-between">
          <p className="text-sm text-[#606060]">
            Showing <span className="font-semibold text-[#281713]">{filteredMaterials.length}</span> of {materials.length}
          </p>
          <button
            onClick={() => setFiltersOpen(true)}
            className="flex items-center gap-2 border border-[#8B4434] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8B4434] hover:bg-[#8B4434] hover:text-white transition-colors"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </button>
        </div>

        {/* Mobile filter backdrop */}
        <div
          onClick={() => setFiltersOpen(false)}
          className={`fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm transition-opacity duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] lg:hidden
            ${filtersOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        />
        {/* Mobile filter bottom-sheet */}
        <aside className={`fixed bottom-0 left-0 right-0 z-[70] bg-[#FCFAF7] shadow-2xl flex flex-col max-h-[88vh] rounded-t-2xl transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] lg:hidden
          ${filtersOpen ? 'translate-y-0' : 'translate-y-full'}`}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#efe6df] shrink-0">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-[#8B4434]/70 font-semibold">Filters</p>
              <h2 className="mt-1 font-serif text-xl text-[#281713]">Refine results</h2>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={clearFilters} className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8B4434] hover:underline">Reset</button>
              <button onClick={() => setFiltersOpen(false)} className="p-2 text-[#8B4434]"><X className="h-5 w-5" /></button>
            </div>
          </div>
          <div className="overflow-y-auto p-5 flex-1 space-y-5">
            <label className="block">
              <span className="block text-[10px] uppercase tracking-[0.25em] text-[#8B4434]/70 mb-2">Search</span>
              <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search materials, brands, suppliers..." className="w-full border border-[#e2d8d0] bg-[#FCFAF7] px-4 py-3 text-sm outline-none focus:border-[#8B4434]" />
            </label>
            <label className="block">
              <span className="block text-[10px] uppercase tracking-[0.25em] text-[#8B4434]/70 mb-2">Category</span>
              <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full border border-[#e2d8d0] bg-[#FCFAF7] px-4 py-3 text-sm outline-none focus:border-[#8B4434]">
                <option value="all">All categories</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="block text-[10px] uppercase tracking-[0.25em] text-[#8B4434]/70 mb-2">Brand</span>
              <select value={selectedBrand} onChange={(e) => setSelectedBrand(e.target.value)} className="w-full border border-[#e2d8d0] bg-[#FCFAF7] px-4 py-3 text-sm outline-none focus:border-[#8B4434]">
                <option value="all">All brands</option>
                {brands.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="block text-[10px] uppercase tracking-[0.25em] text-[#8B4434]/70 mb-2">Supplier</span>
              <select value={selectedSupplier} onChange={(e) => setSelectedSupplier(e.target.value)} className="w-full border border-[#e2d8d0] bg-[#FCFAF7] px-4 py-3 text-sm outline-none focus:border-[#8B4434]">
                <option value="all">All suppliers</option>
                {suppliers.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <label className="flex items-center gap-3 border border-[#e2d8d0] px-4 py-3 text-sm text-[#606060]">
              <input type="checkbox" checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} className="h-4 w-4 accent-[#8B4434]" />
              Show in-stock only
            </label>
            <div>
              <span className="block text-[10px] uppercase tracking-[0.25em] text-[#8B4434]/70 mb-2">Price Range (Rs.)</span>
              <div className="flex gap-2">
                <input type="number" min={0} placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="w-full border border-[#e2d8d0] bg-[#FCFAF7] px-3 py-3 text-sm outline-none focus:border-[#8B4434]" />
                <input type="number" min={0} placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="w-full border border-[#e2d8d0] bg-[#FCFAF7] px-3 py-3 text-sm outline-none focus:border-[#8B4434]" />
              </div>
            </div>
            <label className="block">
              <span className="block text-[10px] uppercase tracking-[0.25em] text-[#8B4434]/70 mb-2">Supplier Location</span>
              <input type="text" placeholder="Colombo, Gampaha..." value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} className="w-full border border-[#e2d8d0] bg-[#FCFAF7] px-4 py-3 text-sm outline-none focus:border-[#8B4434]" />
            </label>
            <label className="block">
              <span className="block text-[10px] uppercase tracking-[0.25em] text-[#8B4434]/70 mb-2">Minimum Rating</span>
              <select value={minRating} onChange={(e) => setMinRating(Number(e.target.value))} className="w-full border border-[#e2d8d0] bg-[#FCFAF7] px-4 py-3 text-sm outline-none focus:border-[#8B4434]">
                <option value={0}>Any Rating</option>
                <option value={1}>⭐ 1 &amp; above</option>
                <option value={2}>⭐⭐ 2 &amp; above</option>
                <option value={3}>⭐⭐⭐ 3 &amp; above</option>
                <option value={4}>⭐⭐⭐⭐ 4 &amp; above</option>
                <option value={5}>⭐⭐⭐⭐⭐ 5 only</option>
              </select>
            </label>
            <label className="block">
              <span className="block text-[10px] uppercase tracking-[0.25em] text-[#8B4434]/70 mb-2">Min. Stock Qty (units)</span>
              <input type="number" min={1} placeholder="e.g. 100 bags" value={minStock} onChange={(e) => setMinStock(e.target.value)} className="w-full border border-[#e2d8d0] bg-[#FCFAF7] px-4 py-3 text-sm outline-none focus:border-[#8B4434]" />
              <p className="mt-1 text-[11px] text-[#8B4434]/50">Only show suppliers with at least this much in stock</p>
            </label>
          </div>
          <div className="p-4 border-t border-[#efe6df] shrink-0">
            <button onClick={() => setFiltersOpen(false)} className="w-full bg-[#8B4434] text-white py-3.5 text-[11px] tracking-[0.22em] uppercase font-semibold hover:bg-[#6c3426] transition-colors">
              Show {filteredMaterials.length} Results
            </button>
          </div>
        </aside>

        <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)] items-start">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block border border-[#e8ddd6] bg-white shadow-sm p-6 lg:sticky lg:top-8">
            <div className="flex items-start justify-between gap-4 border-b border-[#efe6df] pb-5">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-[#8B4434]/70 font-semibold">Filters</p>
                <h2 className="mt-2 font-serif text-2xl text-[#281713]">Refine results</h2>
              </div>
              <button type="button" onClick={clearFilters} className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8B4434] hover:underline">Reset</button>
            </div>
            <div className="mt-5 space-y-5">
              <label className="block">
                <span className="block text-[10px] uppercase tracking-[0.25em] text-[#8B4434]/70 mb-2">Search</span>
                <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search materials, brands, suppliers..." className="w-full border border-[#e2d8d0] bg-[#FCFAF7] px-4 py-3 text-sm outline-none transition-colors focus:border-[#8B4434]" />
              </label>
              <label className="block">
                <span className="block text-[10px] uppercase tracking-[0.25em] text-[#8B4434]/70 mb-2">Category</span>
                <select value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)} className="w-full border border-[#e2d8d0] bg-[#FCFAF7] px-4 py-3 text-sm outline-none transition-colors focus:border-[#8B4434]">
                  <option value="all">All categories</option>
                  {categories.map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="block text-[10px] uppercase tracking-[0.25em] text-[#8B4434]/70 mb-2">Brand</span>
                <select value={selectedBrand} onChange={(event) => setSelectedBrand(event.target.value)} className="w-full border border-[#e2d8d0] bg-[#FCFAF7] px-4 py-3 text-sm outline-none transition-colors focus:border-[#8B4434]">
                  <option value="all">All brands</option>
                  {brands.map((brand) => <option key={brand} value={brand}>{brand}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="block text-[10px] uppercase tracking-[0.25em] text-[#8B4434]/70 mb-2">Supplier</span>
                <select value={selectedSupplier} onChange={(event) => setSelectedSupplier(event.target.value)} className="w-full border border-[#e2d8d0] bg-[#FCFAF7] px-4 py-3 text-sm outline-none transition-colors focus:border-[#8B4434]">
                  <option value="all">All suppliers</option>
                  {suppliers.map((supplier) => <option key={supplier} value={supplier}>{supplier}</option>)}
                </select>
              </label>
              <label className="flex items-center gap-3 rounded-none border border-[#e2d8d0] px-4 py-3 text-sm text-[#606060]">
                <input type="checkbox" checked={inStockOnly} onChange={(event) => setInStockOnly(event.target.checked)} className="h-4 w-4 accent-[#8B4434]" />
                Show in-stock only
              </label>
              <div>
                <span className="block text-[10px] uppercase tracking-[0.25em] text-[#8B4434]/70 mb-2">Price Range (Rs.)</span>
                <div className="flex gap-2">
                  <input type="number" min={0} placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="w-full border border-[#e2d8d0] bg-[#FCFAF7] px-3 py-3 text-sm outline-none transition-colors focus:border-[#8B4434]" />
                  <input type="number" min={0} placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="w-full border border-[#e2d8d0] bg-[#FCFAF7] px-3 py-3 text-sm outline-none transition-colors focus:border-[#8B4434]" />
                </div>
              </div>
              <label className="block">
                <span className="block text-[10px] uppercase tracking-[0.25em] text-[#8B4434]/70 mb-2">Supplier Location</span>
                <input type="text" placeholder="Colombo, Gampaha..." value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} className="w-full border border-[#e2d8d0] bg-[#FCFAF7] px-4 py-3 text-sm outline-none transition-colors focus:border-[#8B4434]" />
              </label>
              <label className="block">
                <span className="block text-[10px] uppercase tracking-[0.25em] text-[#8B4434]/70 mb-2">Minimum Rating</span>
                <select value={minRating} onChange={(e) => setMinRating(Number(e.target.value))} className="w-full border border-[#e2d8d0] bg-[#FCFAF7] px-4 py-3 text-sm outline-none transition-colors focus:border-[#8B4434]">
                  <option value={0}>Any Rating</option>
                  <option value={1}>⭐ 1 &amp; above</option>
                  <option value={2}>⭐⭐ 2 &amp; above</option>
                  <option value={3}>⭐⭐⭐ 3 &amp; above</option>
                  <option value={4}>⭐⭐⭐⭐ 4 &amp; above</option>
                  <option value={5}>⭐⭐⭐⭐⭐ 5 only</option>
                </select>
              </label>
              <label className="block">
                <span className="block text-[10px] uppercase tracking-[0.25em] text-[#8B4434]/70 mb-2">Min. Stock Qty (units)</span>
                <input type="number" min={1} placeholder="e.g. 100 bags" value={minStock} onChange={(e) => setMinStock(e.target.value)} className="w-full border border-[#e2d8d0] bg-[#FCFAF7] px-4 py-3 text-sm outline-none transition-colors focus:border-[#8B4434]" />
                <p className="mt-1 text-[11px] text-[#8B4434]/50">Only show suppliers with at least this much in stock</p>
              </label>
              <div className="border-t border-[#efe6df] pt-5 text-sm text-[#606060]">
                <p>Showing <span className="font-semibold text-[#281713]">{filteredMaterials.length}</span> of {materials.length}</p>
              </div>
            </div>
          </aside>

          <main>
            {loading ? (
              <div className="py-24 text-center text-[#606060] border border-[#e8ddd6] bg-white shadow-sm">Loading materials...</div>
            ) : filteredMaterials.length === 0 ? (
              <div className="text-center py-24 bg-white border border-[#e8ddd6] shadow-sm">
                <p className="text-[#606060]">No materials match the selected filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-5 sm:gap-8">
                {filteredMaterials.map((material) => (
                  <article key={material.id} className="group overflow-hidden rounded-none border border-[#e8ddd6] bg-white shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col h-full">
                    {/* Top Image Container */}
                    <div className="relative aspect-4/3 bg-[#f8f5f2] border-b border-[#e8ddd6] overflow-hidden flex items-center justify-center">
                      {material.images && material.images.length > 0 && material.images[0].image_url ? (
                        <img
                          src={material.images[0].image_url}
                          alt={material.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-[#8B4434]/40 gap-2">
                          <Package className="w-10 h-10" />
                          <span className="text-[10px] uppercase tracking-wider font-medium">No image</span>
                        </div>
                      )}
                      {/* Floating Category Badge */}
                      <div className="absolute top-3 left-3 z-10">
                        <span className="inline-flex rounded-none border border-[#8B4434]/30 bg-white/90 backdrop-blur-xs px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8B4434] shadow-xs">
                          {material.category_name}
                        </span>
                      </div>
                      {material.stock_available <= 0 && (
                        <div className="absolute top-3 right-3 z-10">
                          <span className="inline-flex rounded-none bg-red-600 text-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-xs">
                            Out of Stock
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content Section */}
                    <div className="p-5 sm:p-6 flex flex-col flex-1 justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2 text-[11px] uppercase tracking-[0.2em] text-[#8B4434]/70">
                          <span className="font-semibold">{material.brand || 'Generic'}</span>
                          <span className="truncate max-w-[140px] text-stone-500">{material.supplier_name}</span>
                        </div>
                        <h2 className="font-serif text-xl sm:text-2xl font-semibold leading-snug text-[#281713] line-clamp-2 group-hover:text-[#8B4434] transition-colors">
                          {material.name}
                        </h2>
                        <p className="text-xs leading-relaxed text-[#606060] line-clamp-2">
                          {material.description || "No description provided."}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-[#efe6df] space-y-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] uppercase tracking-[0.25em] text-[#8B4434]/70 font-semibold">Price</span>
                            <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-wider font-semibold text-[#8B4434] bg-[#8B4434]/10 px-1.5 py-0.5 rounded-none">
                              <Sparkles className="w-2.5 h-2.5" />
                              AI Index
                            </span>
                          </div>
                          <p className="font-serif text-2xl font-bold text-[#281713]">Rs. {material.current_price}</p>
                          <p className="text-xs text-[#606060]">per {material.unit}</p>

                          {/* Last AI automatic price updated time */}
                          <div
                            className="pt-1 flex items-center gap-1.5 text-[10px] text-stone-500"
                            title={material.last_ai_update ? `Last AI price update: ${new Date(material.last_ai_update).toLocaleString('en-LK')}` : "Automated AI market price sync"}
                          >
                            <Clock className="w-3 h-3 text-[#8B4434]/70 shrink-0" />
                            <span className="font-medium tracking-tight">
                              {formatAiUpdateTime(material.last_ai_update || material.created_at)}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 w-full pt-1">
                          <button
                            type="button"
                            onClick={() => addToCart(material)}
                            disabled={cartBusyId === material.id || material.stock_available <= 0}
                            className="w-full rounded-none border border-[#8B4434] bg-[#8B4434] px-4 py-2.5 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#6e3528] disabled:opacity-50 cursor-pointer"
                          >
                            {cartBusyId === material.id ? 'Adding...' : 'Add to Cart'}
                          </button>
                          <Link
                            href={`/marketplace/${material.id}`}
                            className="w-full rounded-none border border-[#8B4434] px-4 py-2.5 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8B4434] transition-colors hover:bg-[#8B4434] hover:text-white"
                          >
                            View Details
                          </Link>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}