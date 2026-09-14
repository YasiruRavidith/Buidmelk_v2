"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { ArrowLeft, CalendarDays, Car, CheckCircle2, Clock3, MapPin, Phone, ShoppingBag, Star } from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
import { API_BASE_URL } from "@/lib/api";

interface HardwareShopImage {
  image_url?: string;
}

interface HardwareShopItem {
  id: number;
  material: number;
  material_name: string;
  material_unit: string;
  material_unit_price: string;
  stock_quantity: number;
  image_url?: string;
}

interface HardwareShop {
  id: number;
  shop_name: string;
  shop_address?: string;
  shop_phone?: string;
  shop_email?: string;
  opening_hours?: string;
  services?: string;
  google_maps_link?: string;
  banner_image_url?: string;
  gallery_images?: HardwareShopImage[];
  items?: HardwareShopItem[];
}

interface Review {
  id: number;
  author_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export default function ShopDetailPage() {
  const { id } = useParams<{ id?: string }>();
  const { user } = useAuth();
  const [shop, setShop] = useState<HardwareShop | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewSaving, setReviewSaving] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [cartSavingId, setCartSavingId] = useState<number | null>(null);

  useEffect(() => {
    async function fetchShop() {
      if (!id) return;
      try {
        const res = await fetch(`${API_BASE_URL}/users/shops/${id}/`);
        if (res.ok) {
          const data = await res.json();
          setShop(data);
        }
      } catch {
        console.error("Failed to fetch shop");
      } finally {
        setLoading(false);
      }
    }

    fetchShop();
  }, [id]);

  useEffect(() => {
    async function fetchReviews() {
      if (!id) return;
      try {
        const res = await fetch(`${API_BASE_URL}/marketplace/reviews/?target_type=shop&target_id=${id}`);
        if (res.ok) {
          const data = await res.json();
          setReviews(data || []);
        }
      } catch {
        console.error("Failed to fetch shop reviews");
      }
    }

    fetchReviews();
  }, [id]);

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return "0.0";
    return (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1);
  }, [reviews]);

  const mapEmbedUrl = useMemo(() => {
    if (!shop) return "";

    if (shop.google_maps_link && (shop.google_maps_link.includes("/maps/embed") || shop.google_maps_link.includes("output=embed"))) {
      return shop.google_maps_link;
    }

    const query = encodeURIComponent(shop.shop_address || shop.shop_name);
    return `https://www.google.com/maps?q=${query}&output=embed`;
  }, [shop]);

  const mapLinkHref = shop?.google_maps_link || (shop ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shop.shop_address || shop.shop_name)}` : "#");

  if (loading) return <div className="p-16 text-center">Loading shop...</div>;
  if (!shop) return <div className="p-16 text-center">Shop not found</div>;

  const handleSubmitReview = async () => {
    if (!user || !id) {
      alert('Please log in to write a review.');
      return;
    }

    setReviewSaving(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch(`${API_BASE_URL}/marketplace/reviews/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, target_type: 'shop', target_id: id, rating: reviewRating, comment: reviewComment }),
      });

      if (response.ok) {
        const saved = await response.json();
        setReviews((prev) => [saved, ...prev.filter((review) => review.id !== saved.id)]);
        setReviewComment('');
        setReviewRating(5);
      } else {
        const data = await response.json().catch(() => ({}));
        alert(data.detail || 'Failed to save review');
      }
    } catch {
      alert('Failed to save review');
    } finally {
      setReviewSaving(false);
    }
  };

  const handleAddToCart = async (itemId: number) => {
    if (!user) {
      alert('Please log in to add items to cart.');
      return;
    }

    setCartSavingId(itemId);
    try {
      const token = await user.getIdToken();
      const response = await fetch(`${API_BASE_URL}/marketplace/cart/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, product_type: 'hardware_shop_item', product_id: itemId, quantity: 1 }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        alert(data.detail || 'Failed to add item to cart');
      } else {
        window.dispatchEvent(new Event("cartUpdated"));
        alert('Added to cart');
      }
    } catch {
      alert('Failed to add item to cart');
    } finally {
      setCartSavingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <section className="border-b border-stone-200 bg-[linear-gradient(135deg,rgba(252,250,247,1)_0%,rgba(247,243,239,1)_60%,rgba(244,237,231,1)_100%)]">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <Link href="/shops" className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 font-semibold tracking-wide text-sm uppercase">
            <ArrowLeft className="h-4 w-4" />
            Back to Shops
          </Link>
        </div>

        <div className="max-w-7xl mx-auto px-6 pb-16 lg:pb-20 space-y-8">
          <div className="relative h-96 md:h-120 bg-stone-100 overflow-hidden rounded-2xl border border-stone-200 shadow-sm">
            {shop.banner_image_url ? (
              <img
                src={shop.banner_image_url}
                alt={shop.shop_name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = "none";
                }}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-stone-300">
                <ShoppingBag className="h-20 w-20" />
              </div>
            )}

            <div className="absolute inset-0 bg-linear-to-r from-black/65 via-black/30 to-transparent" />
            <div className="absolute left-0 top-0 flex h-full w-full items-start justify-start p-6 md:p-10 lg:p-12">
              <div className="max-w-2xl text-white space-y-3">
                <p className="text-[10px] uppercase tracking-[0.35em] text-white/70 font-semibold">Hardware Shop</p>
                <h1 className="font-serif text-4xl md:text-6xl leading-tight drop-shadow-sm">{shop.shop_name}</h1>
                <p className="max-w-xl text-sm md:text-base text-white/85">{shop.shop_address || 'No address provided'}</p>
              </div>
            </div>
          </div>

          {shop.gallery_images && shop.gallery_images.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {shop.gallery_images.map((image, index) => (
                <div key={`${image.image_url}-${index}`} className="relative aspect-square overflow-hidden rounded-2xl border border-stone-200 bg-stone-100 shadow-sm">
                  {image.image_url ? (
                    <img
                      src={image.image_url}
                      alt={`${shop.shop_name} ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = "none";
                      }}
                    />
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-stone-500 mb-2"><Star className="h-4 w-4 text-orange-500" /> Rating</div>
              <p className="text-2xl font-serif text-stone-900">{averageRating}</p>
            </div>
            <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-stone-500 mb-2"><Clock3 className="h-4 w-4 text-[#EA580C]" /> Hours</div>
              <p className="text-lg font-semibold text-stone-900">{shop.opening_hours || 'Not listed'}</p>
            </div>
            <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-stone-500 mb-2"><CheckCircle2 className="h-4 w-4 text-[#EA580C]" /> Reviews</div>
              <p className="text-lg font-semibold text-stone-900">{reviews.length} total</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <a href={`tel:${shop.shop_phone || ''}`} className="bg-white border border-stone-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm hover:border-[#EA580C]/30 transition-colors">
              <Phone className="h-5 w-5 text-[#EA580C]" />
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-stone-500">Phone</p>
                <p className="text-sm font-semibold text-stone-900">{shop.shop_phone || 'Phone not listed'}</p>
              </div>
            </a>
            <a href={mapLinkHref} target="_blank" rel="noreferrer" className="bg-white border border-stone-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm hover:border-[#EA580C]/30 transition-colors">
              <MapPin className="h-5 w-5 text-[#EA580C]" />
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-stone-500">Location</p>
                <p className="text-sm font-semibold text-stone-900">Open in Maps</p>
              </div>
            </a>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm space-y-4">
              <h2 className="font-serif text-2xl text-stone-900">Store Details</h2>
              <div className="grid gap-3 text-sm text-stone-600">
                <div className="flex items-start gap-3"><CalendarDays className="mt-0.5 h-4 w-4 text-[#EA580C]" /><span>{shop.services || 'No services listed'}</span></div>
                <div className="flex items-start gap-3"><Car className="mt-0.5 h-4 w-4 text-[#EA580C]" /><span>{shop.shop_email || 'Email not listed'}</span></div>
              </div>
            </div>

            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm space-y-4">
              <h2 className="font-serif text-2xl text-stone-900">Location</h2>
              <div className="relative aspect-16/10 overflow-hidden rounded-xl border border-stone-200 bg-stone-100">
                <iframe
                  title={`${shop.shop_name} location map`}
                  src={mapEmbedUrl}
                  className="h-full w-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>
              <p className="text-sm text-stone-600">{shop.shop_address || 'No address provided'}</p>
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-6 py-12 space-y-12">
        <section className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-serif text-3xl text-stone-900">Shop Items</h2>
            <p className="text-sm text-stone-500">Add materials from this shop directly to your cart.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {shop.items?.length ? shop.items.map((item) => (
              <div key={item.id} className="rounded-2xl border border-stone-200 bg-white shadow-sm overflow-hidden flex flex-col">
                <div className="relative aspect-[4/3] bg-stone-100 border-b border-stone-200 overflow-hidden">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.material_name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-stone-300">
                      <ShoppingBag className="h-12 w-12" />
                    </div>
                  )}
                </div>
                <div className="p-5 space-y-4 flex-1 flex flex-col">
                  <div className="space-y-1">
                    <p className="font-semibold text-stone-900">{item.material_name}</p>
                    <p className="text-sm text-stone-500">{item.stock_quantity} in stock</p>
                  </div>
                  <div className="flex items-center justify-between gap-4 mt-auto">
                    <p className="text-sm text-stone-600">Rs. {item.material_unit_price} / {item.material_unit}</p>
                    <button
                      onClick={() => handleAddToCart(item.id)}
                      disabled={cartSavingId === item.id}
                      className="btn-primary px-4 py-2 text-sm"
                    >
                      {cartSavingId === item.id ? 'Adding...' : 'Add to Cart'}
                    </button>
                  </div>
                  <Link
                    href={`/marketplace/${item.material}`}
                    className="inline-flex justify-center rounded-xl border border-stone-300 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-700 transition-colors hover:border-[#EA580C] hover:text-[#EA580C]"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            )) : (
              <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-stone-600">No shop items listed yet.</div>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-serif text-3xl text-stone-900">Reviews</h2>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
            <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="font-serif text-2xl text-stone-900">Write a review</h3>
              <label className="block text-sm text-stone-600">
                Rating
                <select value={reviewRating} onChange={(event) => setReviewRating(Number(event.target.value))} className="mt-2 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-stone-900 outline-none focus:border-[#EA580C]/40">
                  {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} star{value > 1 ? 's' : ''}</option>)}
                </select>
              </label>
              <label className="block text-sm text-stone-600">
                Review
                <textarea value={reviewComment} onChange={(event) => setReviewComment(event.target.value)} rows={5} placeholder="Write your review..." className="mt-2 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-stone-900 outline-none placeholder:text-stone-400 focus:border-[#EA580C]/40" />
              </label>
              <button onClick={handleSubmitReview} disabled={reviewSaving} className="btn-primary px-5 py-3">
                {reviewSaving ? 'Saving...' : 'Submit Review'}
              </button>
            </div>

            <div className="space-y-3">
              {reviews.length > 0 ? reviews.map((review) => (
                <div key={review.id} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-semibold text-stone-900">{review.author_name}</span>
                    <span className="text-orange-500">{'★'.repeat(review.rating)}<span className="text-stone-300">{'★'.repeat(5 - review.rating)}</span></span>
                  </div>
                  {review.comment ? <p className="mt-2 text-sm text-stone-600">{review.comment}</p> : null}
                </div>
              )) : <div className="rounded-2xl border border-stone-200 bg-stone-50 p-6 text-sm text-stone-600">No reviews yet.</div>}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
