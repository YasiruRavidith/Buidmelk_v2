"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useAuth } from "../../../hooks/useAuth";

interface MaterialDetailData {
  id: number;
  name: string;
  brand?: string | null;
  category_name?: string;
  category?: number;
  supplier_name: string;
  unit: string;
  current_price: string;
  ai_price?: string | null;
  description?: string | null;
  stock_available: number;
  images?: { image_url?: string | null }[];
}

export default function MaterialDetail() {
  const params = useParams<{ materialId?: string | string[] }>();
  const materialId = Array.isArray(params.materialId) ? params.materialId[0] : params.materialId;
  const { user } = useAuth();
  const [material, setMaterial] = useState<MaterialDetailData | null>(null);
  const [relatedMaterials, setRelatedMaterials] = useState<MaterialDetailData[]>([]);
  const [reviews, setReviews] = useState<Array<{ id: number; author_name: string; rating: number; comment: string; created_at: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSaving, setReviewSaving] = useState(false);
  const [cartSaving, setCartSaving] = useState(false);

  useEffect(() => {
    async function fetchMaterial() {
      if (!materialId) {
        return;
      }

      try {
        const res = await fetch(`http://localhost:8000/api/marketplace/materials/${materialId}/`);
        if (res.ok) {
          const data = await res.json();
          setMaterial(data);
          setActiveImage(0);
        }
      } catch {
        console.error("Failed to fetch material");
      } finally {
        setLoading(false);
      }
    }
    fetchMaterial();
  }, [materialId]);

  useEffect(() => {
    async function fetchRelatedMaterials() {
      if (!material?.category_name || !material?.id) {
        return;
      }

      try {
        const res = await fetch("http://localhost:8000/api/marketplace/materials/");
        if (res.ok) {
          const data = await res.json();
          const related = (data || [])
            .filter((item: MaterialDetailData) => item.id !== material.id && item.category_name === material.category_name)
            .slice(0, 3);
          setRelatedMaterials(related);
        }
      } catch {
        console.error("Failed to fetch related materials");
      }
    }

    fetchRelatedMaterials();
  }, [material?.category_name, material?.id]);

  useEffect(() => {
    async function fetchReviews() {
      if (!material?.id) {
        return;
      }

      try {
        const res = await fetch(`http://localhost:8000/api/marketplace/reviews/?target_type=material&target_id=${material.id}`);
        if (res.ok) {
          const data = await res.json();
          setReviews(data || []);
        }
      } catch {
        console.error("Failed to fetch material reviews");
      }
    }

    fetchReviews();
  }, [material?.id]);

  if (!materialId) return <div className="p-16 text-center">Material not found</div>;
  if (loading) return <div className="p-16 text-center">Loading...</div>;
  if (!material) return <div className="p-16 text-center">Material not found</div>;

  const images = material.images?.filter((image) => image.image_url) ?? [];
  const activeImageUrl = images[activeImage]?.image_url || images[0]?.image_url || null;
  const averageRating = reviews.length > 0 ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1) : "0.0";

  const handleAddToCart = async () => {
    if (!user) {
      alert('Please log in to add items to cart.');
      return;
    }

    setCartSaving(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch('http://localhost:8000/api/marketplace/cart/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, product_type: 'material', product_id: material.id, quantity: 1 }),
      });

      if (response.ok) {
        alert('Added to cart');
      } else {
        const data = await response.json().catch(() => ({}));
        alert(data.detail || 'Failed to add to cart');
      }
    } catch {
      alert('Failed to add to cart');
    } finally {
      setCartSaving(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!user) {
      alert('Please log in to write a review.');
      return;
    }

    setReviewSaving(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch('http://localhost:8000/api/marketplace/reviews/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          target_type: 'material',
          target_id: material.id,
          rating: reviewRating,
          comment: reviewComment,
        }),
      });

      if (response.ok) {
        const saved = await response.json();
        setReviews((prev) => [saved, ...prev.filter((review) => review.id !== saved.id)]);
        setReviewComment('');
        setReviewRating(5);
        alert('Review saved');
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

  return (
    <div className="min-h-screen bg-stone-50 py-16 px-6">
      <div className="max-w-5/6 mx-auto space-y-8">
        <Link href="/marketplace" className="text-orange-600 hover:text-orange-700 font-semibold tracking-wide text-sm uppercase">
          ← Back to Marketplace
        </Link>

        <div className="bg-white border border-stone-200 rounded-3xl p-6 md:p-8 shadow-sm">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
            <div className="space-y-4">
              <div className="relative bg-stone-100 rounded-2xl p-4 h-88 md:h-112 lg:h-128 overflow-hidden w-full">
                {activeImageUrl ? (
                  <Image
                    src={activeImageUrl}
                    alt={material.name}
                    fill
                    unoptimized
                    sizes="(max-width: 1024px) 100vw, 55vw"
                    className="object-contain"
                    style={{ objectPosition: 'center' }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-6xl">📦</span>
                  </div>
                )}
              </div>

              {images.length > 1 ? (
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                  {images.map((image, index) => (
                    <button
                      key={`${image.image_url}-${index}`}
                      type="button"
                      onClick={() => setActiveImage(index)}
                      className={`relative aspect-square overflow-hidden rounded-xl border transition-all ${
                        activeImage === index ? 'border-orange-500 ring-2 ring-orange-500/20' : 'border-stone-200 hover:border-orange-300'
                      }`}
                    >
                      <Image
                        src={image.image_url || ''}
                        alt={`${material.name} thumbnail ${index + 1}`}
                        fill
                        unoptimized
                        sizes="120px"
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="space-y-6">
              <div>
                <span className="px-3 py-1 bg-stone-100 text-stone-600 text-xs font-bold uppercase tracking-wider rounded-full mb-4 inline-block">
                  {material.category_name}
                </span>
                <h1 className="font-serif text-4xl text-stone-900">{material.name}</h1>
                <p className="text-stone-500 mt-2 text-sm uppercase tracking-wide">
                  Brand <span className="font-semibold text-stone-700">{material.brand || 'Generic'}</span>
                </p>
                <p className="text-stone-500 mt-2 text-sm uppercase tracking-wide">
                  Supplied by <span className="font-semibold text-stone-700">{material.supplier_name}</span>
                </p>
              </div>

              <div className="flex items-center gap-3 flex-wrap rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4">
                <div className="flex items-center gap-1 text-orange-500 text-sm">
                  <span>{'★'.repeat(Math.max(1, Math.round(Number(averageRating))))}</span>
                  <span className="text-stone-300">{'★'.repeat(Math.max(0, 5 - Math.round(Number(averageRating))))}</span>
                </div>
                <span className="text-sm text-stone-700 font-semibold">Ratings</span>
                <span className="text-sm text-stone-500">{reviews.length > 0 ? `${averageRating} / 5 from ${reviews.length} review(s)` : 'No verified ratings yet'}</span>
              </div>

              <div className="py-5 border-y border-stone-100">
                <p className="text-4xl font-serif text-orange-600">
                  Rs. {material.current_price} <span className="text-base font-sans text-stone-400">/ {material.unit}</span>
                </p>

                <p className="text-sm text-stone-500 mt-2">
                  Current Stock: <span className="font-semibold text-stone-800">{material.stock_available} {material.unit}s</span>
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => alert('Buying now with ' + material.supplier_name)}
                  className="btn-primary w-full py-4 justify-center"
                >
                  Buy Now
                </button>
                <button
                  onClick={handleAddToCart}
                  disabled={cartSaving}
                  className="btn-outline w-full py-4 justify-center"
                >
                  {cartSaving ? 'Adding...' : 'Add to Cart'}
                </button>
              </div>

              <div className="space-y-4">
                <h3 className="font-serif text-xl text-stone-900">Description</h3>
                <p className="text-stone-600 leading-relaxed text-sm">
                  {material.description || 'No specific details provided by the supplier.'}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_0.9fr]">
            <section className="space-y-4">
              <h2 className="font-serif text-2xl text-stone-900">Reviews</h2>
              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-6 space-y-4">
                <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
                  <label className="text-sm text-stone-600">
                    Rating
                    <select
                      value={reviewRating}
                      onChange={(event) => setReviewRating(Number(event.target.value))}
                      className="mt-2 w-full rounded-lg border border-stone-200 bg-white px-3 py-2"
                    >
                      {[5, 4, 3, 2, 1].map((value) => (
                        <option key={value} value={value}>
                          {value} star{value > 1 ? 's' : ''}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm text-stone-600">
                    Review
                    <textarea
                      value={reviewComment}
                      onChange={(event) => setReviewComment(event.target.value)}
                      rows={4}
                      placeholder="Write your review..."
                      className="mt-2 w-full rounded-lg border border-stone-200 bg-white px-3 py-2"
                    />
                  </label>
                </div>
                <button onClick={handleSubmitReview} disabled={reviewSaving} className="btn-primary px-5 py-3">
                  {reviewSaving ? 'Saving...' : 'Submit Review'}
                </button>

                <div className="space-y-3 pt-2">
                  {reviews.length > 0 ? reviews.map((review) => (
                    <div key={review.id} className="rounded-xl border border-stone-200 bg-white p-4">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-semibold text-stone-900">{review.author_name}</span>
                        <span className="text-orange-500">{'★'.repeat(review.rating)}<span className="text-stone-300">{'★'.repeat(5 - review.rating)}</span></span>
                      </div>
                      {review.comment ? <p className="mt-2 text-sm text-stone-600">{review.comment}</p> : null}
                    </div>
                  )) : <p className="text-sm text-stone-600">No reviews yet.</p>}
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="font-serif text-2xl text-stone-900">Related Items</h2>
              {relatedMaterials.length > 0 ? (
                <div className="space-y-3">
                  {relatedMaterials.map((related) => (
                    <Link
                      key={related.id}
                      href={`/marketplace/${related.id}`}
                      className="flex items-center gap-4 rounded-2xl border border-stone-200 bg-white p-4 transition-colors hover:border-orange-300 hover:bg-orange-50/40"
                    >
                      <div className="relative h-16 w-16 overflow-hidden rounded-xl bg-stone-100 shrink-0">
                        {related.images && related.images[0]?.image_url ? (
                          <Image
                            src={related.images[0].image_url}
                            alt={related.name}
                            fill
                            unoptimized
                            sizes="64px"
                            className="object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-stone-900 truncate">{related.name}</p>
                        <p className="text-xs uppercase tracking-wide text-stone-500">
                          {related.brand || 'Generic'} • Rs. {related.current_price}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-stone-200 bg-stone-50 p-6 text-sm text-stone-600">
                  Related items will appear here once more items in this category are available.
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}