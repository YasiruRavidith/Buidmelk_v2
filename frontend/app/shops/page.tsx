"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Building2, MapPin, Phone, Search, Star } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

interface HardwareShopImage {
  image_url?: string;
}

interface HardwareShopItem {
  id: number;
  material_name: string;
  material_unit: string;
  material_unit_price: string;
  stock_quantity: number;
}

interface HardwareShop {
  id: number;
  shop_name: string;
  shop_address?: string;
  shop_phone?: string;
  shop_email?: string;
  opening_hours?: string;
  services?: string;
  banner_image_url?: string;
  gallery_images?: HardwareShopImage[];
  items?: HardwareShopItem[];
}

export default function ShopsPage() {
  const [shops, setShops] = useState<HardwareShop[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchShops() {
      try {
        const res = await fetch(`${API_BASE_URL}/users/shops/`);
        if (res.ok) {
          const data = await res.json();
          setShops(data || []);
        }
      } catch {
        console.error("Failed to fetch hardware shops");
      } finally {
        setLoading(false);
      }
    }

    fetchShops();
  }, []);

  const filteredShops = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return shops;

    return shops.filter((shop) => {
      const searchable = [shop.shop_name, shop.shop_address, shop.shop_phone, shop.services, shop.opening_hours]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(normalizedQuery);
    });
  }, [query, shops]);

  if (loading) return <div className="p-16 text-center">Loading shops...</div>;

  return (
    <div className="min-h-screen bg-stone-50">
      <section className="border-b border-stone-200 bg-[linear-gradient(135deg,rgba(252,250,247,1)_0%,rgba(247,243,239,1)_60%,rgba(244,237,231,1)_100%)]">
        <div className="max-w-7xl mx-auto px-6 py-16 lg:py-20">
          <div className="max-w-3xl space-y-5">
            <p className="text-[10px] uppercase tracking-[0.35em] text-[#8B4434]/70 font-semibold">Hardware Shops</p>
            <h1 className="font-serif text-4xl md:text-5xl text-stone-900 leading-tight">Find hardware shops, compare stock, and visit the right supplier faster.</h1>
            <p className="text-stone-600 text-base md:text-lg max-w-2xl">Browse trusted shops across Sri Lanka, open each profile for inventory, contact details, reviews, and quick add-to-cart actions.</p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="bg-white border border-stone-200 rounded-none p-5 shadow-sm">
              <p className="text-[10px] uppercase tracking-[0.3em] text-stone-500 mb-2">Shops Listed</p>
              <p className="text-3xl font-serif text-stone-900">{shops.length}</p>
            </div>
            <div className="bg-white border border-stone-200 rounded-none p-5 shadow-sm">
              <p className="text-[10px] uppercase tracking-[0.3em] text-stone-500 mb-2">Fast Search</p>
              <p className="text-3xl font-serif text-stone-900">Live</p>
            </div>
            <div className="bg-white border border-stone-200 rounded-none p-5 shadow-sm">
              <p className="text-[10px] uppercase tracking-[0.3em] text-stone-500 mb-2">Best For</p>
              <p className="text-3xl font-serif text-stone-900">Builders</p>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-12 space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.35em] text-[#8B4434]/70 font-semibold mb-3">Search Shops</p>
            <h2 className="font-serif text-3xl text-stone-900">Browse by location, service, or name</h2>
          </div>

          <label className="w-full lg:w-105">
            <span className="sr-only">Search hardware shops</span>
            <div className="flex items-center gap-3 border border-stone-200 bg-white px-4 py-3 rounded-none shadow-sm focus-within:border-[#8B4434]/40">
              <Search className="h-4 w-4 text-stone-400" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by shop name, address, phone, or service"
                className="w-full bg-transparent text-sm text-stone-900 outline-none placeholder:text-stone-400"
              />
            </div>
          </label>
        </div>

        {filteredShops.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredShops.map((shop) => (
              <Link key={shop.id} href={`/shops/${shop.id}`} className="group overflow-hidden rounded-none border border-stone-200 bg-white shadow-sm transition-transform hover:-translate-y-1 hover:shadow-xl">
                <div className="relative h-56 bg-stone-100 overflow-hidden">
                  {shop.banner_image_url ? (
                    <img
                      src={shop.banner_image_url}
                      alt={shop.shop_name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-stone-300">
                      <Building2 className="h-14 w-14" />
                    </div>
                  )}
                </div>

                <div className="p-6 space-y-4">
                  <div className="space-y-2">
                    <h2 className="font-serif text-2xl text-stone-900">{shop.shop_name}</h2>
                    <div className="flex items-start gap-2 text-sm text-stone-500">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{shop.shop_address || 'No address provided'}</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-stone-500">
                      <Phone className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{shop.shop_phone || 'Phone not listed'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-stone-100 pt-4">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-stone-500">
                      <Star className="h-4 w-4 text-orange-500" />
                      View details, items and reviews
                    </div>
                    <span className="inline-flex items-center gap-2 text-xs uppercase tracking-wide text-[#8B4434] font-semibold">
                      Open shop
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-stone-300 bg-white p-10 text-center text-stone-600 rounded-none">
            No hardware shops matched your search.
          </div>
        )}
      </section>
    </div>
  );
}
