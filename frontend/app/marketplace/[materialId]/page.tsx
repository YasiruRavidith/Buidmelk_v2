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
      if (!materialId) return;

      try {
        const res = await fetch(`http://localhost:8000/api/marketplace/materials/${materialId}/`);
        if (res.ok) {
          const data = await res.json();
          setMaterial(data);
          setActiveImage(0);
        }
      } catch (err) {
        console.error("Failed to fetch material", err);
      } finally {
        setLoading(false);
      }
    }
    fetchMaterial();
  }, [materialId]);

  useEffect(() => {
    async function fetchRelatedMaterials() {
      if (!material?.category_name || !material?.id) return;

      try {
        const res = await fetch("http://localhost:8000/api/marketplace/materials/");
        if (res.ok) {
          const data = await res.json();
          const related = (data || [])
            .filter((item: MaterialDetailData) => item.id !== material.id && item.category_name === material.category_name)
            .slice(0, 3);
          setRelatedMaterials(related);
        }
      } catch (err) {
        console.error("Failed to fetch related materials", err);
      }
    }

    fetchRelatedMaterials();
  }, [material?.category_name, material?.id]);

  useEffect(() => {
    async function fetchReviews() {
      if (!material?.id) return;

      try {
        const res = await fetch(`http://localhost:8000/api/marketplace/reviews/?target_type=material&target_id=${material.id}`);
        if (res.ok) {
          const data = await res.json();
          setReviews(data || []);
        }
      } catch (err) {
        console.error("Failed to fetch material reviews", err);
      }
    }

    fetchReviews();
  }, [material?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FCFAF7] flex flex-col items-center justify-center py-24 text-[#606060]">
        <div className="inline-block animate-spin w-8 h-8 border-2 border-[#8B4434] border-t-transparent mb-3" />
        <p className="text-sm">Loading material specifications...</p>
      </div>
    );
  }

  if (!materialId || !material) {
    return (
      <div className="min-h-screen bg-[#FCFAF7] flex flex-col items-center justify-center py-24 text-[#1c1108]">
        <p className="font-serif text-2xl mb-4">Material Item Not Found</p>
        <Link href="/marketplace" className="btn-outline text-xs uppercase tracking-wider py-2.5 px-6">
          Back to Marketplace
        </Link>
      </div>
    );
  }

  const images = material.images?.filter((image) => image.image_url) ?? [];
  const activeImageUrl = images[activeImage]?.image_url || images[0]?.image_url || null;
  const averageRating = reviews.length > 0 ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1) : "0.0";

  const handleAddToCart = async () => {
    if (!user) {
      alert("Please log in to add items to cart.");
      return;
    }

    setCartSaving(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch("http://localhost:8000/api/marketplace/cart/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, product_type: "material", product_id: material.id, quantity: 1 }),
      });

      if (response.ok) {
        alert("Added to cart successfully");
      } else {
        const data = await response.json().catch(() => ({}));
        alert(data.detail || "Failed to add to cart");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to add to cart");
    } finally {
      setCartSaving(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!user) {
      alert("Please log in to write a review.");
      return;
    }

    setReviewSaving(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch("http://localhost:8000/api/marketplace/reviews/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          target_type: "material",
          target_id: material.id,
          rating: reviewRating,
          comment: reviewComment,
        }),
      });

      if (response.ok) {
        const saved = await response.json();
        setReviews((prev) => [saved, ...prev.filter((review) => review.id !== saved.id)]);
        setReviewComment("");
        setReviewRating(5);
        alert("Review submitted successfully");
      } else {
        const data = await response.json().catch(() => ({}));
        alert(data.detail || "Failed to save review");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to save review");
    } finally {
      setReviewSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FCFAF7] text-[#1c1108] py-8 sm:py-14 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Navigation back link */}
        <Link 
          href="/marketplace" 
          className="inline-flex items-center gap-1 text-xs uppercase tracking-widest text-[#8B4434] hover:underline font-semibold"
        >
          Back to Marketplace
        </Link>

        {/* Main Product Container */}
        <div className="bg-white border border-[#e8ddd6] p-6 sm:p-10 shadow-sm space-y-10">
          
          <div className="grid gap-10 lg:grid-cols-2 items-start">
            
            {/* Left Column: Image Gallery */}
            <div className="space-y-4">
              <div className="relative bg-[#FCFAF7] border border-[#e8ddd6] p-4 h-80 sm:h-96 md:h-112 overflow-hidden w-full flex items-center justify-center">
                {activeImageUrl ? (
                  <Image
                    src={activeImageUrl}
                    alt={material.name}
                    fill
                    unoptimized
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-contain p-4"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#908078] text-sm uppercase tracking-wider font-semibold">
                    No Image Available
                  </div>
                )}
              </div>

              {images.length > 1 && (
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                  {images.map((image, index) => (
                    <button
                      key={`${image.image_url}-${index}`}
                      type="button"
                      onClick={() => setActiveImage(index)}
                      className={`relative aspect-square overflow-hidden border transition-all ${
                        activeImage === index ? "border-[#8B4434] ring-2 ring-[#8B4434]/20" : "border-[#e8ddd6] hover:border-[#8B4434]/50"
                      }`}
                    >
                      <Image
                        src={image.image_url || ""}
                        alt={`${material.name} thumbnail ${index + 1}`}
                        fill
                        unoptimized
                        sizes="120px"
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Material Information */}
            <div className="space-y-6">
              
              <div>
                <span className="px-3 py-1 bg-[#FCFAF7] border border-[#e8ddd6] text-[#8B4434] text-[10px] font-bold uppercase tracking-wider mb-3 inline-block">
                  {material.category_name || "Construction Material"}
                </span>
                <h1 className="font-serif text-3xl sm:text-4xl text-[#1c1108] font-normal leading-tight">
                  {material.name}
                </h1>
                
                <div className="mt-3 flex flex-wrap gap-4 text-xs text-[#606060] uppercase tracking-wider border-b border-[#e8ddd6] pb-4">
                  <p>
                    Brand: <strong className="text-[#1c1108]">{material.brand || "Generic"}</strong>
                  </p>
                  <p>
                    Supplier: <strong className="text-[#1c1108]">{material.supplier_name}</strong>
                  </p>
                </div>
              </div>

              {/* Rating display */}
              <div className="flex items-center gap-3 flex-wrap bg-[#FCFAF7] border border-[#e8ddd6] p-4 text-xs">
                <div className="flex items-center gap-1 text-[#8B4434] font-semibold">
                  <span>Rating: {averageRating} / 5</span>
                </div>
                <span className="text-[#908078]">|</span>
                <span className="text-[#606060]">
                  {reviews.length > 0 ? `${reviews.length} verified review(s)` : "No reviews yet"}
                </span>
              </div>

              {/* Price & Availability */}
              <div className="py-4 border-y border-[#e8ddd6] space-y-1">
                <p className="text-3xl sm:text-4xl font-serif text-[#8B4434] font-semibold">
                  Rs. {material.current_price} <span className="text-sm font-sans text-[#606060] font-normal">/ {material.unit}</span>
                </p>

                <p className="text-xs text-[#606060] uppercase tracking-wider pt-1">
                  Stock Available: <strong className="text-[#1c1108]">{material.stock_available} {material.unit}s</strong>
                </p>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => alert("Contacting " + material.supplier_name + " for purchase")}
                  className="btn-primary w-full py-4 text-xs uppercase tracking-wider text-center"
                >
                  Buy Now
                </button>
                <button
                  onClick={handleAddToCart}
                  disabled={cartSaving}
                  className="btn-outline w-full py-4 text-xs uppercase tracking-wider text-center disabled:opacity-50"
                >
                  {cartSaving ? "Adding..." : "Add to Cart"}
                </button>
              </div>

              {/* Description */}
              <div className="space-y-3 pt-2">
                <h3 className="font-serif text-xl text-[#1c1108] border-b border-[#e8ddd6] pb-2">
                  Product Overview
                </h3>
                <p className="text-[#606060] leading-relaxed text-sm whitespace-pre-wrap">
                  {material.description || "No specific technical details provided by the supplier."}
                </p>
              </div>

            </div>

          </div>

          {/* Bottom Grid: Reviews & Related Items */}
          <div className="pt-8 border-t border-[#e8ddd6] grid gap-10 lg:grid-cols-[1fr_360px]">
            
            {/* Reviews Section */}
            <section className="space-y-6">
              <h2 className="font-serif text-2xl text-[#1c1108]">Customer Reviews</h2>
              
              {/* Review Input Box */}
              <div className="bg-[#FCFAF7] border border-[#e8ddd6] p-6 space-y-4">
                <h3 className="font-serif text-lg text-[#1c1108]">Write a Review</h3>
                <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#606060] font-semibold mb-2">Rating</label>
                    <select
                      value={reviewRating}
                      onChange={(e) => setReviewRating(Number(e.target.value))}
                      className="w-full bg-white border border-[#e8ddd6] px-3 py-2.5 text-sm text-[#1c1108] focus:outline-none focus:border-[#8B4434]"
                    >
                      {[5, 4, 3, 2, 1].map((value) => (
                        <option key={value} value={value}>
                          {value} Star{value > 1 ? "s" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#606060] font-semibold mb-2">Your Feedback</label>
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      rows={3}
                      placeholder="Share your experience with this construction material..."
                      className="w-full bg-white border border-[#e8ddd6] p-3 text-sm text-[#1c1108] placeholder-[#908078] focus:outline-none focus:border-[#8B4434] leading-relaxed"
                    />
                  </div>
                </div>
                <button
                  onClick={handleSubmitReview}
                  disabled={reviewSaving}
                  className="btn-primary py-3 px-6 text-xs uppercase tracking-wider disabled:opacity-50"
                >
                  {reviewSaving ? "Saving..." : "Submit Review"}
                </button>
              </div>

              {/* Reviews List */}
              <div className="space-y-4 pt-2">
                {reviews.length > 0 ? (
                  reviews.map((review) => (
                    <div key={review.id} className="bg-white border border-[#e8ddd6] p-5 space-y-2">
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <span className="font-semibold text-[#1c1108] text-sm">{review.author_name}</span>
                        <span className="text-[#8B4434] font-semibold">{review.rating} / 5 Stars</span>
                      </div>
                      {review.comment && (
                        <p className="text-xs text-[#606060] leading-relaxed">{review.comment}</p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[#908078] italic">No customer reviews recorded yet.</p>
                )}
              </div>
            </section>

            {/* Related Items Section */}
            <section className="space-y-6">
              <h2 className="font-serif text-2xl text-[#1c1108]">Related Materials</h2>
              {relatedMaterials.length > 0 ? (
                <div className="space-y-4">
                  {relatedMaterials.map((related) => (
                    <Link
                      key={related.id}
                      href={`/marketplace/${related.id}`}
                      className="flex items-center gap-4 border border-[#e8ddd6] bg-white p-4 hover:border-[#8B4434]/50 transition-all hover:shadow-sm group"
                    >
                      <div className="relative h-16 w-16 bg-[#FCFAF7] border border-[#e8ddd6] shrink-0 overflow-hidden">
                        {related.images && related.images[0]?.image_url ? (
                          <Image
                            src={related.images[0].image_url}
                            alt={related.name}
                            fill
                            unoptimized
                            sizes="64px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-[#908078]">
                            No Img
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-[#1c1108] group-hover:text-[#8B4434] transition-colors truncate">
                          {related.name}
                        </p>
                        <p className="text-xs text-[#606060] mt-0.5">
                          {related.brand || "Generic"} - <strong className="text-[#8B4434]">Rs. {related.current_price}</strong>
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="border border-[#e8ddd6] bg-[#FCFAF7] p-6 text-xs text-[#908078] text-center">
                  No related items found in this category.
                </div>
              )}
            </section>

          </div>

        </div>

      </div>
    </div>
  );
}