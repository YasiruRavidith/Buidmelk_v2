"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "../../hooks/useAuth";

interface Material {
  id: number;
  name: string;
  brand?: string | null;
  category_name: string;
  supplier_name: string;
  unit: string;
  current_price: string;
  description: string;
  stock_available: number;
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

  useEffect(() => {
    async function fetchMaterials() {
      try {
        const res = await fetch("http://localhost:8000/api/marketplace/materials/");
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

    return matchesSearch && matchesCategory && matchesBrand && matchesSupplier && matchesStock;
  });

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setSelectedBrand("all");
    setSelectedSupplier("all");
    setInStockOnly(false);
  };

  const addToCart = async (material: Material) => {
    if (!user) {
      alert("Please log in to add items to cart.");
      return;
    }

    setCartBusyId(material.id);
    try {
      const token = await user.getIdToken();
      const response = await fetch("http://localhost:8000/api/marketplace/cart/", {
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
      <div className="max-w-5/6 mx-auto px-6 sm:px-10 lg:px-12 py-14 lg:py-20 space-y-10">
        <header className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] items-end border-b border-[#e8ddd6] pb-8 lg:pb-10">
          <div className="max-w-3xl">
            <p className="text-[10px] uppercase tracking-[0.35em] text-[#8B4434]/70 font-semibold mb-3">Hardware Store</p>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl leading-[1.02]">Material Marketplace</h1>
            <p className="mt-4 text-[#606060] text-sm sm:text-base max-w-2xl">
              Find the best construction materials from verified suppliers, curated in a quiet-luxury marketplace.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="border border-[#e8ddd6] bg-white p-5 rounded-none shadow-sm">
              <p className="text-[10px] uppercase tracking-[0.25em] text-[#8B4434]/70">Available Materials</p>
              <p className="mt-2 font-serif text-3xl text-[#281713]">{materials.length}</p>
            </div>
            <div className="border border-[#e8ddd6] bg-white p-5 rounded-none shadow-sm">
              <p className="text-[10px] uppercase tracking-[0.25em] text-[#8B4434]/70">Verified Supply</p>
              <p className="mt-2 font-serif text-3xl text-[#281713]">24/7</p>
            </div>
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)] items-start">
          <aside className="border border-[#e8ddd6] bg-white shadow-sm p-6 lg:sticky lg:top-8">
            <div className="flex items-start justify-between gap-4 border-b border-[#efe6df] pb-5">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-[#8B4434]/70 font-semibold">Filters</p>
                <h2 className="mt-2 font-serif text-2xl text-[#281713]">Refine results</h2>
              </div>
              <button
                type="button"
                onClick={clearFilters}
                className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8B4434] hover:underline"
              >
                Reset
              </button>
            </div>

            <div className="mt-5 space-y-5">
              <label className="block">
                <span className="block text-[10px] uppercase tracking-[0.25em] text-[#8B4434]/70 mb-2">Search</span>
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search materials, brands, suppliers..."
                  className="w-full border border-[#e2d8d0] bg-[#FCFAF7] px-4 py-3 text-sm outline-none transition-colors focus:border-[#8B4434]"
                />
              </label>

              <label className="block">
                <span className="block text-[10px] uppercase tracking-[0.25em] text-[#8B4434]/70 mb-2">Category</span>
                <select
                  value={selectedCategory}
                  onChange={(event) => setSelectedCategory(event.target.value)}
                  className="w-full border border-[#e2d8d0] bg-[#FCFAF7] px-4 py-3 text-sm outline-none transition-colors focus:border-[#8B4434]"
                >
                  <option value="all">All categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="block text-[10px] uppercase tracking-[0.25em] text-[#8B4434]/70 mb-2">Brand</span>
                <select
                  value={selectedBrand}
                  onChange={(event) => setSelectedBrand(event.target.value)}
                  className="w-full border border-[#e2d8d0] bg-[#FCFAF7] px-4 py-3 text-sm outline-none transition-colors focus:border-[#8B4434]"
                >
                  <option value="all">All brands</option>
                  {brands.map((brand) => (
                    <option key={brand} value={brand}>
                      {brand}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="block text-[10px] uppercase tracking-[0.25em] text-[#8B4434]/70 mb-2">Supplier</span>
                <select
                  value={selectedSupplier}
                  onChange={(event) => setSelectedSupplier(event.target.value)}
                  className="w-full border border-[#e2d8d0] bg-[#FCFAF7] px-4 py-3 text-sm outline-none transition-colors focus:border-[#8B4434]"
                >
                  <option value="all">All suppliers</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier} value={supplier}>
                      {supplier}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex items-center gap-3 rounded-none border border-[#e2d8d0] px-4 py-3 text-sm text-[#606060]">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(event) => setInStockOnly(event.target.checked)}
                  className="h-4 w-4 accent-[#8B4434]"
                />
                Show in-stock only
              </label>

              <div className="border-t border-[#efe6df] pt-5 text-sm text-[#606060] space-y-1">
                <p>
                  Showing <span className="font-semibold text-[#281713]">{filteredMaterials.length}</span> of {materials.length}
                </p>
                <p>Use the filters to narrow down materials by category, brand, supplier, and stock.</p>
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
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-8">
                {filteredMaterials.map((material) => (
                  <article key={material.id} className="group overflow-hidden rounded-none border border-[#e8ddd6] bg-white shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl">
                    <div className="relative aspect-4/3 bg-[#f3ebe4] border-b border-[#e8ddd6] flex items-end p-6">
                      {material.images && material.images.length > 0 && material.images[0].image_url ? (
                        <Image
                          src={material.images[0].image_url}
                          alt={material.name}
                          fill
                          unoptimized
                          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                          className="object-cover"
                        />
                      ) : null}

                      <div className="relative">
                        <span className="inline-flex rounded-none border border-[#8B4434] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8B4434]">
                          {material.category_name}
                        </span>
                        <h2 className="mt-4 font-serif text-3xl leading-tight text-[#281713]">{material.name}</h2>
                      </div>
                    </div>

                    <div className="p-6 lg:p-7">
                      <div className="flex items-center justify-between gap-4 text-xs uppercase tracking-[0.22em] text-[#8B4434]/70">
                        <span>{material.brand || 'Generic'}</span>
                        <span>{material.supplier_name}</span>
                        <span>{material.stock_available > 0 ? `${material.stock_available} in stock` : "Out of stock"}</span>
                      </div>

                      <p className="mt-5 text-sm leading-7 text-[#606060] line-clamp-3">
                        {material.description || "No description provided."}
                      </p>

                      <div className="mt-6 border-t border-[#efe6df] pt-5 flex items-end justify-between gap-4">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.25em] text-[#8B4434]/70 mb-1">Price</p>
                          <p className="font-serif text-2xl text-[#281713]">Rs. {material.current_price}</p>
                          <p className="text-sm text-[#606060]">per {material.unit}</p>
                        </div>

                        <div className="flex flex-col gap-2 min-w-35">
                          <button
                            type="button"
                            onClick={() => addToCart(material)}
                            disabled={cartBusyId === material.id}
                            className="rounded-none border border-[#8B4434] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8B4434] transition-colors hover:bg-[#8B4434] hover:text-white disabled:opacity-60"
                          >
                            {cartBusyId === material.id ? 'Adding...' : 'Add to Cart'}
                          </button>
                          <Link href={`/marketplace/${material.id}`} className="rounded-none border border-[#8B4434] px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8B4434] transition-colors hover:bg-[#8B4434] hover:text-white">
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