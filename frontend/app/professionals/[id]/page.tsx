"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../../hooks/useAuth";

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

export default function ProfessionalProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [prof, setProf] = useState<Professional | null>(null);
  const [reviews, setReviews] = useState<Array<{ id: number; author_name: string; rating: number; comment: string; created_at: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSaving, setReviewSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    async function fetchProfessional() {
      try {
        const res = await fetch(`http://localhost:8000/api/users/professionals/${id}/`);
        if (!res.ok) {
          if (res.status === 404) throw new Error("Professional not found");
          throw new Error("Failed to fetch professional details");
        }
        const data = await res.json();
        setProf(data);
      } catch (err: any) {
        setError(err.message || "An error occurred");
      } finally {
        setLoading(false);
      }
    }
    fetchProfessional();
  }, [id]);

  useEffect(() => {
    async function fetchReviews() {
      if (!id) {
        return;
      }

      try {
        const res = await fetch(`http://localhost:8000/api/marketplace/reviews/?target_type=professional&target_id=${id}`);
        if (res.ok) {
          const data = await res.json();
          setReviews(data || []);
        }
      } catch {
        console.error('Failed to fetch professional reviews');
      }
    }

    fetchReviews();
  }, [id]);

  if (loading) return <div className="p-8 text-center text-[#8B4434]/60 pt-40">Loading profile...</div>;
  if (error) {
    return (
      <div className="p-8 text-center pt-40">
        <p className="text-red-500 mb-4">{error}</p>
        <button onClick={() => router.back()} className="text-[#8B4434] hover:underline text-xs tracking-widest uppercase">
          Go Back
        </button>
      </div>
    );
  }
  if (!prof) return null;

  const profile = prof.professional_profile;
  const averageRating = reviews.length > 0 ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1) : '0.0';

  const handleSubmitReview = async () => {
    if (!user || !id) {
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
          target_type: 'professional',
          target_id: id,
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
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pt-32 pb-32">
      <button onClick={() => router.back()} className="text-[#8B4434] text-[9px] uppercase tracking-[0.2em] font-semibold border-b border-[#8B4434]/30 pb-0.5 hover:border-[#8B4434] transition-colors mb-12 inline-flex items-center gap-2">
        <span>&larr;</span> Back to Directory
      </button>

      <div className="flex flex-col lg:flex-row gap-16 lg:gap-24">
        {/* Sidebar Header Section */}
        <aside className="lg:w-1/3 flex flex-col items-start text-center lg:text-left">
          
          <div className="w-40 h-40 bg-[#FAEBE7] border border-[#8B4434]/10 rounded-full flex items-center justify-center overflow-hidden shrink-0 mb-8 mx-auto lg:mx-0">
            {prof.profile_image ? (
              <img src={prof.profile_image} alt={prof.first_name} className="w-full h-full object-cover grayscale mix-blend-multiply" />
            ) : (
              <span className="text-[#8B4434]/50 text-5xl font-serif italic">
                {(prof.first_name?.[0] || prof.username.charAt(0)).toUpperCase()}
              </span>
            )}
          </div>
          
          <div className="w-full">
            <h1 className="font-serif text-4xl sm:text-5xl text-[#8B4434] leading-[1.1] mb-4">
              {prof.first_name} <br className="hidden lg:block"/>{prof.last_name}
            </h1>
            <p className="text-[#8B4434]/80 text-[10px] tracking-[0.2em] uppercase font-semibold mb-6">
              {profile?.profession_type?.replace(/_/g, " ") || "Professional"}
            </p>
            {profile?.company_name && (
              <p className="text-[#606060] font-light mb-8 italic">{profile.company_name}</p>
            )}

            <div className="flex flex-col gap-6 text-[#606060] text-xs font-light mb-12 border-t border-[#8B4434]/10 pt-8 w-full">
              {profile?.location && (
                <div className="flex justify-between items-center w-full">
                  <span className="text-[#8B4434] font-semibold uppercase tracking-widest text-[9px]">Location</span> 
                  <span>{profile.location}</span>
                </div>
              )}
              {profile?.years_of_experience !== undefined && (
                <div className="flex justify-between items-center w-full">
                  <span className="text-[#8B4434] font-semibold uppercase tracking-widest text-[9px]">Experience</span> 
                  <span>{profile.years_of_experience} Years</span>
                </div>
              )}
              {profile?.pricing_range && (
                <div className="flex justify-between items-center w-full">
                  <span className="text-[#8B4434] font-semibold uppercase tracking-widest text-[9px]">Pricing</span> 
                  <span>{profile.pricing_range}</span>
                </div>
              )}
              {profile?.rating && (
                <div className="flex justify-between items-center w-full">
                  <span className="text-[#8B4434] font-semibold uppercase tracking-widest text-[9px]">Rating</span> 
                  <span>{profile.rating} ⭐ ({profile.projects_completed} projects)</span>
                </div>
              )}
              <div className="flex justify-between items-center w-full">
                <span className="text-[#8B4434] font-semibold uppercase tracking-widest text-[9px]">Reviews</span>
                <span>{averageRating} ⭐ ({reviews.length})</span>
              </div>
            </div>

            <div className="flex flex-col gap-4 w-full">
              <button className="btn-primary w-full" onClick={() => alert('Contact feature coming soon!')}>
                Private Enquiry
              </button>
              <button className="btn-secondary w-full" onClick={() => alert('Invite to bid feature coming soon!')}>
                Send Bid Invite
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Section */}
        <main className="lg:w-2/3 border-t lg:border-t-0 lg:border-l border-[#8B4434]/10 pt-12 lg:pt-0 lg:pl-16">
          <h2 className="font-serif text-3xl text-[#8B4434] mb-8">About the Practice</h2>
          <p className="text-[#606060] whitespace-pre-wrap leading-[1.8] font-light text-[13px] mb-16">
            {profile?.about || "This professional hasn't added a dedicated practice description yet."}
          </p>

          <h2 className="font-serif text-3xl text-[#8B4434] mb-8">Skills & Specialization</h2>
          <div className="mb-16">
            {profile?.skills_specialization ? (
              <div className="flex flex-wrap gap-3">
                {profile.skills_specialization.split(',').map((skill, index) => (
                  <span key={index} className="border border-[#8B4434]/20 text-[#8B4434] px-4 py-2 text-[10px] tracking-wider uppercase">
                    {skill.trim()}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[#606060] font-light text-[13px] italic">No technical skills listed.</p>
            )}
          </div>

          <h2 className="font-serif text-3xl text-[#8B4434] mb-8">Contact Information</h2>
          <div className="card-luxury">
            <ul className="space-y-6 text-[13px] font-light text-[#606060]">
              <li className="grid grid-cols-1 sm:grid-cols-3 gap-2 border-b border-[#8B4434]/10 pb-4">
                <p className="text-[#8B4434] text-[9px] uppercase tracking-widest font-semibold flex items-center">Email Address</p>
                <p className="sm:col-span-2">
                  <a href={`mailto:${prof.email}`} className="hover:text-[#8B4434] hover:underline transition-colors">{prof.email}</a>
                </p>
              </li>
              <li className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <p className="text-[#8B4434] text-[9px] uppercase tracking-widest font-semibold flex items-center">Availability</p>
                <p className="sm:col-span-2">{profile?.availability || "Status unknown. Please inquire."}</p>
              </li>
            </ul>
          </div>

          <h2 className="font-serif text-3xl text-[#8B4434] mb-8 mt-16">Reviews</h2>
          <div className="space-y-6 mb-16">
            <div className="rounded-2xl border border-[#8B4434]/10 bg-white p-6 space-y-4">
              <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
                <label className="text-sm text-[#606060]">
                  Rating
                  <select
                    value={reviewRating}
                    onChange={(event) => setReviewRating(Number(event.target.value))}
                    className="mt-2 w-full rounded-lg border border-[#8B4434]/15 bg-[#FCFAF7] px-3 py-2"
                  >
                    {[5, 4, 3, 2, 1].map((value) => (
                      <option key={value} value={value}>{value} star{value > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </label>
                <label className="text-sm text-[#606060]">
                  Review
                  <textarea
                    value={reviewComment}
                    onChange={(event) => setReviewComment(event.target.value)}
                    rows={4}
                    placeholder="Write your review..."
                    className="mt-2 w-full rounded-lg border border-[#8B4434]/15 bg-[#FCFAF7] px-3 py-2"
                  />
                </label>
              </div>
              <button onClick={handleSubmitReview} disabled={reviewSaving} className="btn-primary px-5 py-3">
                {reviewSaving ? 'Saving...' : 'Submit Review'}
              </button>
            </div>

            {reviews.length > 0 ? reviews.map((review) => (
              <div key={review.id} className="rounded-2xl border border-[#8B4434]/10 bg-white p-6">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-semibold text-[#281713]">{review.author_name}</span>
                  <span className="text-[#8B4434]">{'★'.repeat(review.rating)}<span className="text-[#8B4434]/20">{'★'.repeat(5 - review.rating)}</span></span>
                </div>
                {review.comment ? <p className="mt-3 text-[#606060] text-sm leading-7">{review.comment}</p> : null}
              </div>
            )) : (
              <div className="rounded-2xl border border-[#8B4434]/10 bg-white p-6 text-sm text-[#606060]">
                No reviews yet for this professional.
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
