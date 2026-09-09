"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "../../hooks/useAuth";
import { SlidersHorizontal, X } from "lucide-react";
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
                  <article key={material.id} className="group overflow-hidden rounded-none border border-[#e8ddd6] bg-white shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl">
                    <div className="relative aspect-4/3 bg-[#f3ebe4] border-b border-[#e8ddd6] flex items-end p-5 sm:p-6 overflow-hidden">
                      {material.images && material.images.length > 0 && material.images[0].image_url ? (
                        <Image src={material.images[0].image_url} alt={material.name} fill unoptimized sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw" className="object-cover" />
                      ) : null}
                      <div className="relative">
                        <span className="inline-flex rounded-none border border-[#8B4434] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8B4434]">{material.category_name}</span>
                        <h2 className="mt-3 font-serif text-2xl sm:text-3xl leading-tight text-[#281713]">{material.name}</h2>
                      </div>
                    </div>
                    <div className="p-4 sm:p-6 lg:p-7">
                      <div className="flex items-center justify-between gap-2 text-xs uppercase tracking-[0.22em] text-[#8B4434]/70 flex-wrap">
                        <span>{material.brand || 'Generic'}</span>
                        <span>{material.supplier_name}</span>
                        <span className={material.stock_available > 0 ? '' : 'text-red-400'}>{material.stock_available > 0 ? `${material.stock_available} in stock` : "Out of stock"}</span>
                      </div>
                      <p className="mt-4 text-sm leading-7 text-[#606060] line-clamp-3">{material.description || "No description provided."}</p>
                      <div className="mt-5 border-t border-[#efe6df] pt-4 flex items-end justify-between gap-3 flex-wrap">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.25em] text-[#8B4434]/70 mb-1">Price</p>
                          <p className="font-serif text-2xl text-[#281713]">Rs. {material.current_price}</p>
                          <p className="text-sm text-[#606060]">per {material.unit}</p>
                        </div>
                        <div className="flex flex-col gap-2 min-w-[120px]">
                          <button type="button" onClick={() => addToCart(material)} disabled={cartBusyId === material.id}
                            className="rounded-none border border-[#8B4434] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8B4434] transition-colors hover:bg-[#8B4434] hover:text-white disabled:opacity-60">
                            {cartBusyId === material.id ? 'Adding...' : 'Add to Cart'}
                          </button>
                          <Link href={`/marketplace/${material.id}`} className="rounded-none border border-[#8B4434] px-4 py-2.5 text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8B4434] transition-colors hover:bg-[#8B4434] hover:text-white">
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