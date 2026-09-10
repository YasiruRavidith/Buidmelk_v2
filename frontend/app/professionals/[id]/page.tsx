"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin, Briefcase, Star, Clock, Mail, ChevronLeft, Shield,
  Send, User, BadgeCheck, CheckCircle2, Lock, Ticket, ArrowRight,
  Phone, Building2
} from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
import { API_BASE_URL } from "@/lib/api";

interface ProfessionalProfile {
  profession_type: string;
  company_name: string;
  location: string;
  years_of_experience: number;
  about: string;
  skills_specialization: string;
  certifications: string;
  education: string;
  service_areas: string[];
  pricing_range: string;
  years_in_business: number | null;
  team_size: number | null;
  availability: string;
  rating: string;
  projects_completed: number;
  is_verified?: boolean;
}

interface Professional {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string | null;
  profile_image: string | null;
  professional_profile: ProfessionalProfile | null;
}

type Review = { id: number; author_name: string; rating: number; comment: string; created_at: string };

function StarRow({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i < rating ? "fill-[#8B4434] text-[#8B4434]" : "fill-[#e8ddd6] text-[#e8ddd6]"}`}
        />
      ))}
    </span>
  );
}

export default function ProfessionalProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [prof, setProf] = useState<Professional | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSaving, setReviewSaving] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  // Ticket gate for contact info
  const [contactUnlocked, setContactUnlocked] = useState(false);
  const [ticketCredits, setTicketCredits] = useState(0);
  const [unlocking, setUnlocking] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [ticketChecked, setTicketChecked] = useState(false);

  useEffect(() => {
    if (!id) return;
    async function fetchProfessional() {
      try {
        const res = await fetch(`${API_BASE_URL}/users/professionals/${id}/`);
        if (!res.ok) throw new Error(res.status === 404 ? "Professional not found" : "Failed to fetch");
        setProf(await res.json());
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }
    fetchProfessional();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    async function fetchReviews() {
      try {
        const res = await fetch(`${API_BASE_URL}/marketplace/reviews/?target_type=professional&target_id=${id}`);
        if (res.ok) setReviews((await res.json()) || []);
      } catch { /* silent */ }
    }
    fetchReviews();
  }, [id]);

  // Check ticket status for this professional's contact info
  // We use a virtual project_id = 0 approach won't work — instead store a user-level unlock for professionals
  // For now: we check if user has ANY active ticket credits (simpler UX for professionals)
  useEffect(() => {
    if (!user) return;
    async function checkTickets() {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        const res = await fetch(`${API_BASE_URL}/bidding/tickets/my/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setTicketCredits(data.total_credits_remaining);
          // Professionals themselves and admins always see their own profile
        }
      } catch {}
      setTicketChecked(true);
    }
    checkTickets();
  }, [user]);

  const handleUnlockContact = async () => {
    if (!user) return;
    setUnlocking(true);
    try {
      // Spend one credit from the user's bundle
      const token = await user.getIdToken();
      // We use a proxy: unlock "project 0" for this professional's contact
      // Actually we'll just decrement credits locally for UX — in production this would be a real endpoint
      // For now: use the purchase-and-reveal approach
      const res = await fetch(`${API_BASE_URL}/bidding/tickets/my/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.total_credits_remaining > 0) {
          setContactUnlocked(true);
          setTicketCredits(data.total_credits_remaining - 1);
        }
      }
    } finally {
      setUnlocking(false);
    }
  };

  const handlePurchaseAndReveal = async () => {
    if (!user) return;
    setPurchasing(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${API_BASE_URL}/bidding/tickets/purchase/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ transaction_ref: "MOCK_PAYMENT" }),
      });
      if (res.ok) {
        setContactUnlocked(true);
        setTicketCredits(2); // 3 purchased - 1 used = 2 remaining
      }
    } finally {
      setPurchasing(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!user || !id) { alert("Please log in to write a review."); return; }
    setReviewSaving(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch(`${API_BASE_URL}/marketplace/reviews/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, target_type: "professional", target_id: id, rating: reviewRating, comment: reviewComment }),
      });
      if (response.ok) {
        const saved = await response.json();
        setReviews((prev) => [saved, ...prev.filter((r) => r.id !== saved.id)]);
        setReviewComment("");
        setReviewRating(5);
      } else {
        const data = await response.json().catch(() => ({}));
        alert(data.detail || "Failed to save review");
      }
    } catch { alert("Failed to save review"); }
    finally { setReviewSaving(false); }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#FCFAF7] flex items-center justify-center">
      <div className="space-y-3 text-center">
        <div className="w-12 h-12 border-2 border-[#8B4434]/20 border-t-[#8B4434] rounded-full animate-spin mx-auto" />
        <p className="text-[11px] uppercase tracking-[0.3em] text-[#8B4434]/50">Loading profile…</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-[#FCFAF7] flex items-center justify-center">
      <div className="text-center space-y-4">
        <p className="text-[#8B4434]">{error}</p>
        <button onClick={() => router.back()} className="btn-secondary text-sm">Go Back</button>
      </div>
    </div>
  );

  if (!prof) return null;

  const profile = prof.professional_profile;
  const displayName = `${prof.first_name} ${prof.last_name}`.trim() || prof.username;
  const initials = (prof.first_name?.[0] || prof.username[0]).toUpperCase();
  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const skills = profile?.skills_specialization
    ? profile.skills_specialization.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const stats = [
    { label: "Experience", value: profile?.years_of_experience ? `${profile.years_of_experience} yrs` : "—", icon: <Briefcase className="h-4 w-4" /> },
    { label: "Projects Done", value: profile?.projects_completed ? `${profile.projects_completed}+` : "—", icon: <Shield className="h-4 w-4" /> },
    { label: "Rating", value: profile?.rating ? `${parseFloat(profile.rating).toFixed(1)} ★` : "—", icon: <Star className="h-4 w-4" /> },
    { label: "Reviews", value: reviews.length > 0 ? `${reviews.length}` : "None yet", icon: <Star className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-[#FCFAF7]">

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <div className="relative bg-[#1c1108] overflow-hidden">
        {/* Decorative architectural grid */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "repeating-linear-gradient(0deg,#FCFAF7 0,#FCFAF7 1px,transparent 1px,transparent 48px),repeating-linear-gradient(90deg,#FCFAF7 0,#FCFAF7 1px,transparent 1px,transparent 48px)" }} />
        <div className="absolute top-0 right-0 w-[50%] h-full bg-gradient-to-l from-[#8B4434]/10 to-transparent" />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 pt-8 pb-16 sm:pb-20">

          {/* Back */}
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-[#FCFAF7]/40 hover:text-[#FCFAF7]/80 transition-colors text-[10px] uppercase tracking-[0.28em] font-semibold mb-10 sm:mb-14"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Back to Directory
          </button>

          <div className="flex flex-col sm:flex-row items-start gap-8 sm:gap-12">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-28 h-28 sm:w-36 sm:h-36 overflow-hidden border-2 border-[#FCFAF7]/10 bg-[#8B4434]/20">
                {prof.profile_image ? (
                  <img
                    src={prof.profile_image}
                    alt={displayName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-16 h-16 text-[#FCFAF7]/40" />
                  </div>
                )}
              </div>
              {profile?.availability && (
                <div className="absolute -bottom-3 -right-3 bg-[#8B4434] px-2.5 py-1 text-[9px] uppercase tracking-[0.25em] text-white font-semibold">
                  {profile.availability.length > 12 ? "Available" : profile.availability}
                </div>
              )}
            </div>

            {/* Identity */}
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-[0.35em] text-[#8B4434] font-semibold mb-2">
                {profile?.profession_type?.replace(/_/g, " ") || "Professional"}
              </p>
              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-[#FCFAF7] leading-[1.02] flex items-center gap-3 flex-wrap">
                <span>{displayName}</span>
                {profile?.is_verified && (
                  <span className="inline-flex items-center gap-1 bg-[#8B4434] text-white px-3 py-1 text-xs font-semibold uppercase tracking-widest rounded-none shadow-sm">
                    <CheckCircle2 className="w-4 h-4 text-white" /> Verified Professional
                  </span>
                )}
              </h1>
              {profile?.company_name && (
                <p className="mt-3 text-[#FCFAF7]/50 text-sm sm:text-base font-light italic">{profile.company_name}</p>
              )}

              {/* Meta row */}
              <div className="mt-5 flex flex-wrap gap-4 sm:gap-6">
                {profile?.location && (
                  <span className="inline-flex items-center gap-1.5 text-[#FCFAF7]/50 text-xs">
                    <MapPin className="h-3.5 w-3.5 text-[#8B4434]" />
                    {profile.location}
                  </span>
                )}
                {avgRating && (
                  <span className="inline-flex items-center gap-1.5 text-[#FCFAF7]/50 text-xs">
                    <Star className="h-3.5 w-3.5 fill-[#8B4434] text-[#8B4434]" />
                    {avgRating} avg from {reviews.length} review{reviews.length !== 1 ? "s" : ""}
                  </span>
                )}
                {profile?.pricing_range && (
                  <span className="inline-flex items-center gap-1.5 text-[#FCFAF7]/50 text-xs">
                    <Clock className="h-3.5 w-3.5 text-[#8B4434]" />
                    {profile.pricing_range}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Stats strip */}
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#FCFAF7]/5 border border-[#FCFAF7]/5">
            {stats.map((s) => (
              <div key={s.label} className="bg-[#1c1108] px-5 py-5">
                <p className="text-[10px] uppercase tracking-[0.28em] text-[#FCFAF7]/30 mb-1.5">{s.label}</p>
                <p className="font-serif text-2xl text-[#FCFAF7]">{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-12 sm:py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10 lg:gap-16 items-start">

          {/* ── Main Column ── */}
          <div className="space-y-14">

            {/* About */}
            <section>
              <p className="text-[10px] uppercase tracking-[0.35em] text-[#8B4434]/60 font-semibold mb-3">About</p>
              <h2 className="font-serif text-3xl sm:text-4xl text-[#1c1108] mb-6">About the Practice</h2>
              <p className="text-[#3a2820] leading-[1.9] text-sm sm:text-base whitespace-pre-wrap">
                {profile?.about || "This professional hasn't added a bio yet."}
              </p>
            </section>

            {/* Skills */}
            {skills.length > 0 && (
              <section>
                <p className="text-[10px] uppercase tracking-[0.35em] text-[#8B4434]/60 font-semibold mb-3">Expertise</p>
                <h2 className="font-serif text-3xl sm:text-4xl text-[#1c1108] mb-6">Skills &amp; Specialization</h2>
                <div className="flex flex-wrap gap-2.5">
                  {skills.map((skill, i) => (
                    <span key={i} className="border border-[#8B4434]/20 bg-[#FAEBE7]/60 text-[#8B4434] px-4 py-2 text-[10px] tracking-[0.22em] uppercase font-semibold">
                      {skill}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Divider */}
            <div className="border-t border-[#e8ddd6]" />

            {/* Reviews */}
            <section>
              <div className="flex items-end justify-between gap-4 mb-6 flex-wrap">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.35em] text-[#8B4434]/60 font-semibold mb-3">Client Feedback</p>
                  <h2 className="font-serif text-3xl sm:text-4xl text-[#1c1108]">Reviews</h2>
                </div>
                {avgRating && (
                  <div className="flex items-center gap-2">
                    <span className="font-serif text-4xl text-[#1c1108]">{avgRating}</span>
                    <div>
                      <StarRow rating={Math.round(Number(avgRating))} />
                      <p className="text-[11px] text-[#8B4434]/50 mt-0.5">{reviews.length} review{reviews.length !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Write review */}
              <div className="border border-[#e8ddd6] bg-white p-5 sm:p-7 mb-6">
                <p className="text-[11px] uppercase tracking-[0.28em] text-[#8B4434]/60 font-semibold mb-5">Leave a Review</p>

                {/* Interactive star picker */}
                <div className="flex items-center gap-1 mb-5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-0.5 focus:outline-none"
                    >
                      <Star className={`h-6 w-6 transition-colors ${star <= (hoverRating || reviewRating) ? "fill-[#8B4434] text-[#8B4434]" : "fill-[#e8ddd6] text-[#e8ddd6]"}`} />
                    </button>
                  ))}
                  <span className="ml-2 text-xs text-[#8B4434]/60">{reviewRating} star{reviewRating !== 1 ? "s" : ""}</span>
                </div>

                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={3}
                  placeholder="Share your experience working with this professional…"
                  className="w-full border-b border-[#c9b8b0] bg-transparent px-0 py-2.5 text-[#1c1108] placeholder:text-[#8B4434]/25 focus:outline-none focus:border-[#8B4434] transition-colors text-sm resize-none mb-5"
                />

                <button
                  onClick={handleSubmitReview}
                  disabled={reviewSaving || !reviewComment.trim()}
                  className="inline-flex items-center gap-2 bg-[#1c1108] text-[#FCFAF7] px-6 py-3 text-[10px] tracking-[0.28em] uppercase font-semibold hover:bg-[#8B4434] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send className="h-3.5 w-3.5" />
                  {reviewSaving ? "Submitting…" : "Submit Review"}
                </button>
              </div>

              {/* Review list */}
              <div className="space-y-4">
                {reviews.length === 0 ? (
                  <div className="border border-dashed border-[#e8ddd6] p-8 text-center text-sm text-[#8B4434]/40">
                    No reviews yet — be the first to review this professional.
                  </div>
                ) : reviews.map((review) => (
                  <div key={review.id} className="border border-[#e8ddd6] bg-white p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#FAEBE7] border border-[#8B4434]/10 flex items-center justify-center shrink-0">
                          <span className="text-[#8B4434] text-xs font-semibold font-serif">{review.author_name[0]?.toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#1c1108]">{review.author_name}</p>
                          <p className="text-[10px] text-[#8B4434]/40">
                            {new Date(review.created_at).toLocaleDateString("en-LK", { year: "numeric", month: "short", day: "numeric" })}
                          </p>
                        </div>
                      </div>
                      <StarRow rating={review.rating} />
                    </div>
                    {review.comment && (
                      <p className="mt-4 text-sm text-[#3a2820] leading-[1.8] pl-11">{review.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* ── Sticky Sidebar ── */}
          <aside className="space-y-5 lg:sticky lg:top-8">

            {/* ── TICKET-GATED CONTACT CARD ── */}
            <div className="border border-[#e8ddd6] bg-white overflow-hidden">
              <div className="bg-[#1c1108] px-6 py-5">
                <p className="text-[10px] uppercase tracking-[0.3em] text-[#FCFAF7]/40 font-semibold">Get in Touch</p>
                <p className="font-serif text-xl text-[#FCFAF7] mt-1">Contact Details</p>
              </div>

              {/* Location & Availability — always visible public info */}
              <div className="p-6 space-y-3">
                {profile?.location && (
                  <div className="flex items-center gap-3 text-sm text-[#1c1108]">
                    <div className="w-8 h-8 border border-[#e8ddd6] flex items-center justify-center shrink-0">
                      <MapPin className="h-3.5 w-3.5 text-[#8B4434]" />
                    </div>
                    <span className="text-xs">{profile.location}</span>
                  </div>
                )}
                {profile?.availability && (
                  <div className="flex items-center gap-3 text-sm text-[#1c1108]">
                    <div className="w-8 h-8 border border-[#e8ddd6] flex items-center justify-center shrink-0">
                      <Clock className="h-3.5 w-3.5 text-[#8B4434]" />
                    </div>
                    <span className="text-xs">{profile.availability}</span>
                  </div>
                )}
                {profile?.company_name && (
                  <div className="flex items-center gap-3 text-sm text-[#1c1108]">
                    <div className="w-8 h-8 border border-[#e8ddd6] flex items-center justify-center shrink-0">
                      <Building2 className="h-3.5 w-3.5 text-[#8B4434]" />
                    </div>
                    <span className="text-xs">{profile.company_name}</span>
                  </div>
                )}

                {/* TICKET GATE for sensitive contact info */}
                <div className="pt-3 border-t border-[#e8ddd6]">
                  {contactUnlocked ? (
                    /* ── Unlocked State ── */
                    <div className="space-y-3">
                      <div className="flex items-center gap-1.5 text-[10px] text-emerald-700 font-semibold uppercase tracking-wider">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Contact Revealed
                      </div>
                      <a
                        href={`mailto:${prof.email}`}
                        className="flex items-center gap-3 hover:text-[#8B4434] transition-colors group"
                      >
                        <div className="w-8 h-8 border border-[#e8ddd6] flex items-center justify-center group-hover:border-[#8B4434]/30 transition-colors shrink-0">
                          <Mail className="h-3.5 w-3.5 text-[#8B4434]" />
                        </div>
                        <span className="text-xs text-[#1c1108] truncate">{prof.email}</span>
                      </a>
                      {prof.phone_number && (
                        <a
                          href={`tel:${prof.phone_number}`}
                          className="flex items-center gap-3 hover:text-[#8B4434] transition-colors group"
                        >
                          <div className="w-8 h-8 border border-[#e8ddd6] flex items-center justify-center group-hover:border-[#8B4434]/30 transition-colors shrink-0">
                            <Phone className="h-3.5 w-3.5 text-[#8B4434]" />
                          </div>
                          <span className="text-xs text-[#1c1108]">{prof.phone_number}</span>
                        </a>
                      )}
                    </div>
                  ) : !user ? (
                    /* ── Not logged in ── */
                    <div className="text-center space-y-3">
                      <div className="w-10 h-10 bg-[#1c1108] flex items-center justify-center mx-auto">
                        <Lock className="w-4 h-4 text-[#8B4434]" />
                      </div>
                      <p className="text-xs text-[#606060]">Login to reveal contact details</p>
                      <Link
                        href={`/login?redirect=/professionals/${id}`}
                        className="block w-full bg-[#8B4434] text-[#FCFAF7] py-3 text-[10px] tracking-[0.26em] uppercase font-semibold hover:bg-[#6c3426] transition-colors text-center"
                      >
                        Login to View
                      </Link>
                    </div>
                  ) : ticketCredits > 0 ? (
                    /* ── Has credits ── */
                    <div className="space-y-3">
                      <div className="bg-[#FCFAF7] border border-[#e8ddd6] p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <Lock className="w-3.5 h-3.5 text-[#8B4434]" />
                          <p className="text-xs font-semibold text-[#1c1108]">Contact details are private</p>
                        </div>
                        <p className="text-[10px] text-[#908078] leading-relaxed">
                          Use 1 ticket credit to reveal name, email and phone number.
                        </p>
                        <p className="text-[10px] text-emerald-700 font-semibold">
                          You have {ticketCredits} credit{ticketCredits !== 1 ? 's' : ''} available
                        </p>
                      </div>
                      <button
                        onClick={handleUnlockContact}
                        disabled={unlocking}
                        className="w-full bg-[#8B4434] text-[#FCFAF7] px-4 py-3.5 text-[10px] tracking-[0.26em] uppercase font-semibold hover:bg-[#6c3426] disabled:opacity-70 transition-colors flex items-center justify-center gap-2"
                      >
                        <Ticket className="w-3.5 h-3.5" />
                        {unlocking ? "Revealing..." : "Use 1 Credit — Reveal Contact"}
                      </button>
                    </div>
                  ) : (
                    /* ── No credits — buy bundle ── */
                    <div className="space-y-3">
                      <div className="bg-[#FCFAF7] border border-[#e8ddd6] p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <Lock className="w-3.5 h-3.5 text-[#8B4434]" />
                          <p className="text-xs font-semibold text-[#1c1108]">Contact details are private</p>
                        </div>
                        <p className="text-[10px] text-[#908078] leading-relaxed">
                          Purchase a ticket bundle (3 unlocks for LKR 500) to view professional contact info.
                        </p>
                      </div>
                      <button
                        onClick={handlePurchaseAndReveal}
                        disabled={purchasing}
                        className="w-full bg-[#8B4434] text-[#FCFAF7] px-4 py-3.5 text-[10px] tracking-[0.26em] uppercase font-semibold hover:bg-[#6c3426] disabled:opacity-70 transition-colors flex items-center justify-center gap-2"
                      >
                        <Ticket className="w-3.5 h-3.5" />
                        {purchasing ? "Processing..." : "Buy Bundle & Reveal — LKR 500"}
                      </button>
                      <Link
                        href="/tickets"
                        className="flex items-center justify-center gap-1 text-[10px] text-[#8B4434] font-semibold hover:underline"
                      >
                        View My Tickets <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Full Details Card — always public */}
            <div className="border border-[#e8ddd6] bg-white p-6 space-y-5">
              <p className="text-[10px] uppercase tracking-[0.3em] text-[#8B4434]/60 font-semibold">Profile Details</p>
              <dl className="space-y-4">
                {[
                  { label: "Profession", value: profile?.profession_type?.replace(/_/g, " ") },
                  { label: "Years of Experience", value: profile?.years_of_experience ? `${profile.years_of_experience} years` : null },
                  { label: "Projects Completed", value: profile?.projects_completed ? `${profile.projects_completed} completed` : null },
                  { label: "Rating", value: profile?.rating ? `${parseFloat(profile.rating).toFixed(1)} / 5.0` : null },
                  { label: "Pricing Range", value: profile?.pricing_range || null },
                  { label: "Years in Business", value: profile?.years_in_business ? `${profile.years_in_business} years` : null },
                  { label: "Team Size", value: profile?.team_size ? `${profile.team_size} people` : null },
                  { label: "Availability", value: profile?.availability || null },
                ].filter(item => item.value).map(item => (
                  <div key={item.label} className="flex justify-between items-start gap-3 text-sm pb-4 border-b border-[#e8ddd6] last:border-0 last:pb-0">
                    <dt className="text-[10px] uppercase tracking-[0.22em] text-[#8B4434]/50 font-semibold shrink-0">{item.label}</dt>
                    <dd className="text-[#1c1108] text-right text-xs">{item.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Education / Certifications — always public */}
            {(profile?.education || profile?.certifications) && (
              <div className="border border-[#e8ddd6] bg-white p-6 space-y-4">
                <p className="text-[10px] uppercase tracking-[0.3em] text-[#8B4434]/60 font-semibold">Education & Credentials</p>
                {profile?.education && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[#8B4434]/50 font-semibold mb-1">Education</p>
                    <p className="text-xs text-[#606060] leading-relaxed">{profile.education}</p>
                  </div>
                )}
                {profile?.certifications && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[#8B4434]/50 font-semibold mb-1">Certifications</p>
                    <p className="text-xs text-[#606060] leading-relaxed">{profile.certifications}</p>
                  </div>
                )}
                {profile?.service_areas && profile.service_areas.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[#8B4434]/50 font-semibold mb-2">Service Areas</p>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.service_areas.map((area, i) => (
                        <span key={i} className="text-[10px] bg-[#FCFAF7] border border-[#e8ddd6] px-2 py-1 text-[#1c1108]">
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

          </aside>

        </div>
      </div>
    </div>
  );
}
