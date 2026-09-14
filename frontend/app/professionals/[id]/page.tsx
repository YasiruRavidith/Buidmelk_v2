"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin, Briefcase, Star, Clock, Mail, ChevronLeft, Shield,
  Send, User, BadgeCheck, CheckCircle2, Lock, Ticket, ArrowRight,
  Phone, Building2, Sparkles, ShieldCheck, Award, GraduationCap, X, ExternalLink,
  MessageSquare, Check, CheckCheck, RefreshCw, ShieldAlert
} from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
import { API_BASE_URL } from "@/lib/api";

function renderCensoredMessage(text: string, isMe: boolean) {
  const pattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})|((?:\+?94[\s.-]?)?0?7[0-8][\s.-]?\d{3}[\s.-]?\d{4})|((?:\+?94[\s.-]?)?0?(?:11|2[1-7]|3[1-8]|4[1-7]|5[1-7]|6[3-7]|81|91)[\s.-]?\d{3}[\s.-]?\d{4})|(\b(?:\+?\d{1,3}[\s.-]?)?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}\b)|(\b\d{9,12}\b)/gi;

  const parts = [];
  let lastIndex = 0;
  let match;
  let hasContact = false;

  while ((match = pattern.exec(text)) !== null) {
    hasContact = true;
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    parts.push(
      <span
        key={match.index}
        className={`inline-block filter blur-[5px] select-none pointer-events-none px-1.5 py-0.5 rounded font-mono text-[11px] mx-0.5 border border-dashed ${
          isMe
            ? "bg-white/20 text-transparent border-white/40"
            : "bg-stone-300/80 text-transparent border-stone-400"
        }`}
        title="Contact details automatically blurred for privacy & security"
      >
        {match[0]}
      </span>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return (
    <>
      <span>{parts}</span>
      {hasContact && (
        <span
          className={`block text-[9px] mt-1.5 font-medium flex items-center gap-1 ${
            isMe ? "text-rose-100/90" : "text-amber-700"
          }`}
        >
          <ShieldAlert className="w-3 h-3 inline shrink-0" />
          <span>Contact details hidden for privacy &amp; safety</span>
        </span>
      )}
    </>
  );
}

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
  portfolio_images?: { id: number; image?: string; image_url?: string; uploaded_at?: string }[];
  certification_images?: { id: number; image?: string; image_url?: string; uploaded_at?: string }[];
  hardware_profile?: {
    shop_name?: string;
    shop_address?: string;
    shop_phone?: string;
    shop_email?: string;
    business_registration?: string;
    opening_hours?: string;
    services?: string;
    banner_image_url?: string;
    gallery_images?: { id: number; image_url?: string }[];
    google_maps_link?: string;
  } | null;
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
  const { user, backendUser } = useAuth();
  const [prof, setProf] = useState<Professional | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSaving, setReviewSaving] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  // QS Ticket Connection State
  const [qsUnlocked, setQsUnlocked] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [qsCredits, setQsCredits] = useState(0);
  const [unlockingQS, setUnlockingQS] = useState(false);
  const [qsSuccessMsg, setQsSuccessMsg] = useState<string | null>(null);

  // QS Private Chat State
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatSending, setChatSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Lightbox modal for portfolio & certification images
  const [selectedImageModal, setSelectedImageModal] = useState<{
    url: string;
    title: string;
  } | null>(null);

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
    async function checkQSStatus() {
      try {
        const headers: Record<string, string> = {};
        if (user) {
          const token = await user.getIdToken();
          headers["Authorization"] = `Bearer ${token}`;
        }
        const res = await fetch(`${API_BASE_URL}/bidding/tickets/qs-status/${id}/`, { headers });
        if (res.ok) {
          const data = await res.json();
          setQsUnlocked(data.unlocked || false);
          setIsOwner(data.is_owner || false);
          setQsCredits(data.qs_credits_remaining || 0);
        }
      } catch {
        /* silent */
      }
    }
    checkQSStatus();
  }, [id, user]);

  const handleUnlockQS = async () => {
    if (!user) {
      router.push(`/login?redirect=/professionals/${id}`);
      return;
    }
    setUnlockingQS(true);
    setQsSuccessMsg(null);
    try {
      const token = await user.getIdToken();

      // If client has 0 QS tickets, automatically purchase 1 first
      if (qsCredits === 0) {
        const purchaseRes = await fetch(`${API_BASE_URL}/bidding/tickets/purchase/`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ticket_type: "QS",
            quantity: 1,
            transaction_ref: "MOCK_PAYMENT",
          }),
        });
        if (!purchaseRes.ok) {
          const pErr = await purchaseRes.json();
          throw new Error(pErr.error || "Failed to purchase QS ticket.");
        }
      }

      // Unlock connection
      const unlockRes = await fetch(`${API_BASE_URL}/bidding/tickets/unlock-qs/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ qs_id: id }),
      });

      if (unlockRes.ok) {
        const uData = await unlockRes.json();
        setQsUnlocked(true);
        setQsCredits(uData.qs_credits_remaining || 0);
        setQsSuccessMsg("Successfully connected with Quantity Surveyor! Contact details & private chat unlocked.");
        window.dispatchEvent(new Event("ticketsUpdated"));
        // Automatically open chat room upon unlock
        setChatOpen(true);
      } else {
        const uErr = await unlockRes.json();
        alert(uErr.error || "Failed to unlock Quantity Surveyor.");
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error unlocking Quantity Surveyor.");
    } finally {
      setUnlockingQS(false);
    }
  };

  // Auto-open chat if ?chat=open query param is present
  useEffect(() => {
    if (typeof window !== "undefined") {
      const search = new URLSearchParams(window.location.search);
      if (search.get("chat") === "open" && (qsUnlocked || search.get("unlock"))) {
        setChatOpen(true);
      }
    }
  }, [qsUnlocked]);

  // Fetch QS chat messages
  const fetchQSChat = async (silent = false) => {
    if (!id || !user) return;
    if (!silent) setChatLoading(true);
    setChatError(null);
    try {
      const search = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
      const targetId = search?.get("unlock") || id;
      const token = await user.getIdToken();
      const res = await fetch(`${API_BASE_URL}/bidding/qs-chat/${targetId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setChatMessages(data.messages || []);
        if (!silent) {
          window.dispatchEvent(new Event("chatUpdated"));
        }
      } else {
        const errData = await res.json();
        if (!silent) setChatError(errData.error || "Failed to load QS chat.");
      }
    } catch {
      if (!silent) setChatError("Could not connect to QS chat server.");
    } finally {
      if (!silent) setChatLoading(false);
    }
  };

  // Poll QS chat every 3 seconds while modal is open
  useEffect(() => {
    if (!chatOpen || !user || !id) return;
    fetchQSChat(false);
    const timer = setInterval(() => {
      fetchQSChat(true);
    }, 3000);
    return () => clearInterval(timer);
  }, [chatOpen, user, id]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, chatOpen]);

  // Send message in QS chat
  const handleSendQSMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text || !user || chatSending) return;
    setChatSending(true);
    setChatError(null);
    try {
      const search = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
      const targetId = search?.get("unlock") || id;
      const token = await user.getIdToken();
      const res = await fetch(`${API_BASE_URL}/bidding/qs-chat/${targetId}/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: text }),
      });
      if (res.ok) {
        const newMsg = await res.json();
        setChatMessages((prev) => [...prev, newMsg]);
        setChatInput("");
        window.dispatchEvent(new Event("chatUpdated"));
      } else {
        const errData = await res.json();
        setChatError(errData.error || "Failed to send message.");
      }
    } catch {
      setChatError("Network error while sending message.");
    } finally {
      setChatSending(false);
    }
  };

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

            {/* ── Portfolio Showcase Gallery ── */}
            {profile?.portfolio_images && profile.portfolio_images.length > 0 && (
              <section>
                <div className="flex items-end justify-between gap-4 mb-6 flex-wrap">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.35em] text-[#8B4434]/60 font-semibold mb-2">Past Projects</p>
                    <h2 className="font-serif text-3xl sm:text-4xl text-[#1c1108]">Project Portfolio</h2>
                  </div>
                  <span className="text-xs text-stone-500 uppercase tracking-widest font-medium">
                    {profile.portfolio_images.length} completed work{profile.portfolio_images.length !== 1 ? "s" : ""}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  {profile.portfolio_images.map((item, index) => {
                    const imgUrl = item.image_url || item.image || "";
                    return (
                      <div
                        key={item.id || index}
                        onClick={() => setSelectedImageModal({ url: imgUrl, title: `${displayName} — Project #${index + 1}` })}
                        className="group relative aspect-[4/3] bg-stone-100 border border-[#e8ddd6] overflow-hidden cursor-pointer shadow-xs"
                      >
                        <img
                          src={imgUrl}
                          alt={`Project ${index + 1}`}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = "none";
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-4 text-white">
                          <span className="text-xs uppercase tracking-wider font-semibold flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" /> View Photo
                          </span>
                          <span className="text-[10px] bg-[#8B4434] px-2 py-0.5 tracking-widest uppercase font-bold">
                            Watermarked
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ── Verified Certifications & Accreditations ── */}
            {((profile?.certification_images && profile.certification_images.length > 0) || profile?.certifications) && (
              <section>
                <div className="flex items-end justify-between gap-4 mb-6 flex-wrap">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.35em] text-[#8B4434]/60 font-semibold mb-2">Qualifications</p>
                    <h2 className="font-serif text-3xl sm:text-4xl text-[#1c1108]">Certifications &amp; Licenses</h2>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Verified Credentials
                  </span>
                </div>

                {profile?.certifications && (
                  <div className="bg-[#FCFAF7] border border-[#e8ddd6] p-5 sm:p-6 mb-6">
                    <div className="flex items-center gap-2 mb-2 text-[#8B4434] font-semibold text-xs uppercase tracking-wider">
                      <Award className="w-4 h-4" />
                      <span>Accreditations &amp; Registrations</span>
                    </div>
                    <p className="text-sm text-[#3a2820] leading-relaxed whitespace-pre-wrap">
                      {profile.certifications}
                    </p>
                  </div>
                )}

                {profile?.certification_images && profile.certification_images.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {profile.certification_images.map((cert, index) => {
                      const imgUrl = cert.image_url || cert.image || "";
                      return (
                        <div
                          key={cert.id || index}
                          onClick={() => setSelectedImageModal({ url: imgUrl, title: `${displayName} — Verified Certificate #${index + 1}` })}
                          className="group relative aspect-[3/4] bg-white border border-[#e8ddd6] overflow-hidden p-2.5 shadow-xs cursor-pointer hover:border-[#8B4434] transition-colors"
                        >
                          <div className="relative w-full h-full bg-stone-50 overflow-hidden flex items-center justify-center">
                            <img
                              src={imgUrl}
                              alt={`Certificate ${index + 1}`}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = "none";
                              }}
                            />
                          </div>
                          <div className="absolute top-3 right-3 bg-[#8B4434] text-white text-[9px] font-bold px-1.5 py-0.5 tracking-wider uppercase shadow-xs">
                            Verified
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {/* ── Academic & Technical Education ── */}
            {profile?.education && (
              <section>
                <div className="flex items-center gap-2 mb-2 text-[#8B4434]/60 font-semibold text-[10px] uppercase tracking-[0.35em]">
                  <GraduationCap className="w-4 h-4 text-[#8B4434]" />
                  <span>Academic &amp; Vocational</span>
                </div>
                <h2 className="font-serif text-3xl sm:text-4xl text-[#1c1108] mb-4">Education &amp; Background</h2>
                <div className="bg-white border border-[#e8ddd6] p-5 sm:p-6 shadow-xs">
                  <p className="text-sm text-[#3a2820] leading-relaxed whitespace-pre-wrap">
                    {profile.education}
                  </p>
                </div>
              </section>
            )}

            {/* ── Service Areas ── */}
            {profile?.service_areas && profile.service_areas.length > 0 && (
              <section>
                <p className="text-[10px] uppercase tracking-[0.35em] text-[#8B4434]/60 font-semibold mb-2">Coverage</p>
                <h2 className="font-serif text-3xl sm:text-4xl text-[#1c1108] mb-4">Service Locations</h2>
                <div className="flex flex-wrap gap-2">
                  {profile.service_areas.map((area, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 border border-[#e8ddd6] bg-white px-3.5 py-2 text-xs font-medium text-[#281713] shadow-2xs">
                      <MapPin className="w-3 h-3 text-[#8B4434]" />
                      {area}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* ── Hardware Storefront Details (if HARDWARE) ── */}
            {profile?.hardware_profile && (
              <section className="border border-[#e8ddd6] bg-[#FCFAF7] p-6 sm:p-8 space-y-4 shadow-xs">
                <div className="flex items-center gap-2 text-[#8B4434] text-xs uppercase tracking-widest font-semibold">
                  <Building2 className="w-4 h-4" />
                  <span>Hardware Merchant Storefront</span>
                </div>
                <h3 className="font-serif text-2xl sm:text-3xl text-[#1c1108]">
                  {profile.hardware_profile.shop_name || "Hardware Store"}
                </h3>
                {profile.hardware_profile.shop_address && (
                  <p className="text-xs text-[#606060] flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-[#8B4434]" />
                    {profile.hardware_profile.shop_address}
                  </p>
                )}
                {profile.hardware_profile.opening_hours && (
                  <p className="text-xs text-[#606060] flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-[#8B4434]" />
                    Hours: {profile.hardware_profile.opening_hours}
                  </p>
                )}
                {profile.hardware_profile.services && (
                  <p className="text-xs text-[#3a2820] leading-relaxed pt-2 border-t border-[#e8ddd6]">
                    {profile.hardware_profile.services}
                  </p>
                )}
                {profile.hardware_profile.gallery_images && profile.hardware_profile.gallery_images.length > 0 && (
                  <div className="pt-2">
                    <p className="text-[10px] uppercase tracking-wider text-[#8B4434]/60 font-semibold mb-2">Shop Gallery</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {profile.hardware_profile.gallery_images.map((g, idx) => (
                        <div
                          key={g.id || idx}
                          onClick={() => setSelectedImageModal({ url: g.image_url || "", title: `${profile.hardware_profile?.shop_name || "Shop"} — Photo ${idx + 1}` })}
                          className="aspect-square bg-stone-100 border border-[#e8ddd6] overflow-hidden cursor-pointer"
                        >
                          <img src={g.image_url || ""} alt="Shop" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {profile.hardware_profile.google_maps_link && (
                  <div className="pt-2">
                    <iframe
                      src={profile.hardware_profile.google_maps_link}
                      className="w-full h-56 border border-[#e8ddd6]"
                      loading="lazy"
                    />
                  </div>
                )}
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

                {/* ── CONTACT DETAILS: BLURRED BY DEFAULT / QS TICKET GATED ── */}
                <div className="pt-3 border-t border-[#e8ddd6]">
                  {profile?.profession_type === 'QS' ? (
                    // ── QUANTITY SURVEYOR (QS) WORKFLOW ──
                    <div className="space-y-4">
                      {isOwner || (backendUser && prof && backendUser.id === prof.id) ? (
                        // Owner viewing their own QS profile
                        <div className="space-y-3">
                          <div className="flex items-center gap-1.5 text-[10px] text-stone-800 font-semibold uppercase tracking-wider bg-stone-100 border border-stone-300 p-2.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-[#8B4434] shrink-0" />
                            <span>Your Public Professional Profile</span>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 border border-[#e8ddd6] flex items-center justify-center shrink-0">
                              <Mail className="h-3.5 w-3.5 text-[#8B4434]" />
                            </div>
                            <span className="text-xs text-[#1c1108] truncate font-medium">{prof.email}</span>
                          </div>

                          {prof.phone_number && (
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 border border-[#e8ddd6] flex items-center justify-center shrink-0">
                                <Phone className="h-3.5 w-3.5 text-[#8B4434]" />
                              </div>
                              <span className="text-xs text-[#1c1108] font-medium">{prof.phone_number}</span>
                            </div>
                          )}

                          <Link
                            href="/dashboard/professional"
                            className="w-full bg-[#1c1108] text-[#FCFAF7] py-3 text-[10px] tracking-[0.22em] uppercase font-bold hover:bg-[#8B4434] transition-colors flex items-center justify-center gap-2 shadow-sm text-center"
                          >
                            <MessageSquare className="w-4 h-4 text-[#8B4434]" />
                            <span>View Inquiries &amp; Consultations in Dashboard</span>
                          </Link>
                        </div>
                      ) : qsUnlocked ? (
                        // Unlocked QS: Revealed contact details
                        <div className="space-y-3">
                          <div className="flex items-center gap-1.5 text-[10px] text-emerald-800 font-semibold uppercase tracking-wider bg-emerald-50 border border-emerald-200 p-2.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Connected via QS Ticket &bull; Direct Consultation Active</span>
                          </div>

                          <a
                            href={`mailto:${prof.email}`}
                            className="flex items-center gap-3 hover:text-[#8B4434] transition-colors group"
                          >
                            <div className="w-8 h-8 border border-[#e8ddd6] flex items-center justify-center group-hover:border-[#8B4434]/30 transition-colors shrink-0">
                              <Mail className="h-3.5 w-3.5 text-[#8B4434]" />
                            </div>
                            <span className="text-xs text-[#1c1108] truncate font-medium">{prof.email}</span>
                          </a>

                          {prof.phone_number ? (
                            <a
                              href={`tel:${prof.phone_number}`}
                              className="flex items-center gap-3 hover:text-[#8B4434] transition-colors group"
                            >
                              <div className="w-8 h-8 border border-[#e8ddd6] flex items-center justify-center group-hover:border-[#8B4434]/30 transition-colors shrink-0">
                                <Phone className="h-3.5 w-3.5 text-[#8B4434]" />
                              </div>
                              <span className="text-xs text-[#1c1108] font-medium">{prof.phone_number}</span>
                            </a>
                          ) : (
                            <p className="text-xs text-[#908078] italic">Phone number not provided</p>
                          )}

                          <button
                            type="button"
                            onClick={() => setChatOpen(true)}
                            className="w-full bg-[#1c1108] text-[#FCFAF7] py-3 text-[10px] tracking-[0.22em] uppercase font-bold hover:bg-[#8B4434] transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                          >
                            <MessageSquare className="w-4 h-4 text-[#8B4434]" />
                            <span>Open Private QS Chat Room</span>
                          </button>

                          <a
                            href={`mailto:${prof.email}?subject=BOQ%20Estimation%20Consultation%20via%20BuildMe.lk`}
                            className="block w-full border border-[#8B4434] text-[#8B4434] hover:bg-[#8B4434] hover:text-white py-2.5 text-[10px] tracking-[0.22em] uppercase font-bold transition-colors text-center"
                          >
                            Email Consultation Request
                          </a>
                        </div>
                      ) : (
                        // Gated QS: Blurred details + Unlock CTA
                        <div className="space-y-3.5">
                          {/* Blurred contact previews */}
                          <div className="space-y-2 select-none relative">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 border border-[#e8ddd6] flex items-center justify-center shrink-0">
                                <Mail className="h-3.5 w-3.5 text-[#8B4434]" />
                              </div>
                              <span className="text-xs text-[#1c1108] filter blur-sm truncate pointer-events-none select-none">
                                {prof.email || "qs.expert@buildmelk.lk"}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 border border-[#e8ddd6] flex items-center justify-center shrink-0">
                                <Phone className="h-3.5 w-3.5 text-[#8B4434]" />
                              </div>
                              <span className="text-xs text-[#1c1108] filter blur-sm pointer-events-none select-none">
                                {prof.phone_number || "+94 77 123 4567"}
                              </span>
                            </div>
                          </div>

                          <div className="bg-[#1c1108] text-[#FCFAF7] p-4 space-y-2 border border-[#322318]">
                            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-[#8B4434] font-bold">
                              <Lock className="w-3.5 h-3.5" /> QS Consultation Ticket Required
                            </div>
                            <p className="text-xs text-[#c9b8b0] leading-relaxed">
                              Connect with this certified Quantity Surveyor for cost auditing, BOQ reviews, and rate analysis.
                            </p>
                            <div className="pt-2 border-t border-[#322318] flex items-center justify-between text-xs">
                              <span className="text-[#908078]">Consultation Price</span>
                              <span className="font-serif text-sm text-white font-bold">LKR 2,500</span>
                            </div>
                          </div>

                          {user ? (
                            <div className="space-y-2">
                              <button
                                onClick={handleUnlockQS}
                                disabled={unlockingQS}
                                className="w-full bg-[#8B4434] text-white py-3 text-xs font-bold uppercase tracking-widest hover:bg-[#723628] disabled:opacity-70 transition-colors shadow-sm cursor-pointer"
                              >
                                {unlockingQS
                                  ? "Unlocking..."
                                  : qsCredits > 0
                                  ? `Unlock Contact (${qsCredits} QS Credit${qsCredits > 1 ? 's' : ''} available)`
                                  : "Buy QS Ticket (LKR 2,500) & Connect"}
                              </button>
                              <Link
                                href="/tickets"
                                className="block text-center text-[10px] uppercase tracking-wider text-[#8B4434] hover:underline font-semibold"
                              >
                                View Ticket Pro Plans (Bundle &amp; Save) &rarr;
                              </Link>
                            </div>
                          ) : (
                            <Link
                              href={`/login?redirect=/professionals/${id}`}
                              className="block w-full bg-[#8B4434] text-white py-3 text-[10px] tracking-[0.26em] uppercase font-bold hover:bg-[#723628] transition-colors text-center cursor-pointer"
                            >
                              Login to Connect with QS
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    // ── ALL OTHER PROFESSIONALS (CONTRACTOR, ENGINEER, ARCHITECT, TRADES) ──
                    // Contact details blurred to protect platform communication & bidding
                    <div className="space-y-4">
                      {/* Blurred details preview */}
                      <div className="space-y-2 select-none relative">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 border border-[#e8ddd6] flex items-center justify-center shrink-0">
                            <Mail className="h-3.5 w-3.5 text-[#8B4434]" />
                          </div>
                          <span className="text-xs text-[#1c1108] filter blur-sm truncate pointer-events-none select-none">
                            {prof.email || "professional@buildmelk.lk"}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 border border-[#e8ddd6] flex items-center justify-center shrink-0">
                            <Phone className="h-3.5 w-3.5 text-[#8B4434]" />
                          </div>
                          <span className="text-xs text-[#1c1108] filter blur-sm pointer-events-none select-none">
                            {prof.phone_number || "+94 77 123 4567"}
                          </span>
                        </div>
                      </div>

                      <div className="bg-[#FCFAF7] border border-[#e8ddd6] p-4 space-y-2">
                        <div className="flex items-center gap-1.5 text-[10px] text-[#8B4434] font-bold uppercase tracking-wider">
                          <Lock className="w-3.5 h-3.5 text-[#8B4434]" /> Contact Details Protected
                        </div>
                        <p className="text-xs text-[#606060] leading-relaxed">
                          Direct phone numbers and emails are kept confidential. To hire or collaborate with this professional, invite them to submit a proposal on your tender.
                        </p>
                      </div>

                      <Link
                        href="/estimation"
                        className="block w-full bg-[#1c1108] text-[#FCFAF7] py-3 text-[10px] tracking-[0.24em] uppercase font-bold hover:bg-[#8B4434] transition-colors text-center cursor-pointer"
                      >
                        Post Tender &bull; Invite to Bid
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

      {/* ── Image Lightbox Modal ── */}
      {selectedImageModal && (
        <div
          onClick={() => setSelectedImageModal(null)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl max-h-[90vh] bg-[#1c1108] border border-[#8B4434]/40 overflow-hidden flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#FCFAF7]/10 bg-black/40">
              <span className="text-xs font-serif text-[#FCFAF7] tracking-wider truncate">
                {selectedImageModal.title}
              </span>
              <button
                onClick={() => setSelectedImageModal(null)}
                className="text-stone-400 hover:text-white transition-colors p-1 cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-2 flex items-center justify-center overflow-auto max-h-[80vh]">
              <img
                src={selectedImageModal.url}
                alt={selectedImageModal.title}
                className="max-h-[75vh] w-auto object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── QS PRIVATE 1-ON-1 CHAT ROOM MODAL ── */}
      {chatOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-[#e8ddd6] shadow-2xl w-full max-w-2xl h-[90vh] sm:h-[600px] max-h-[700px] flex flex-col overflow-hidden relative">
            
            {/* Header */}
            <div className="p-4 bg-[#1c1108] text-white flex items-center justify-between border-b border-[#322318] shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative">
                  {prof?.profile_image ? (
                    <img
                      src={prof.profile_image}
                      alt={displayName}
                      className="w-10 h-10 object-cover border border-[#8B4434]/40"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-[#8B4434] text-white font-serif flex items-center justify-center font-bold">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif text-base text-[#FCFAF7] leading-none">
                      {displayName}
                    </h3>
                    <span className="text-[9px] uppercase tracking-wider font-bold bg-[#8B4434] text-white px-1.5 py-0.5">
                      Quantity Surveyor
                    </span>
                  </div>
                  <p className="text-[11px] text-[#c9b8b0] mt-0.5">
                    Private 1-on-1 Consultation &bull; Ticket Verified
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fetchQSChat(false)}
                  disabled={chatLoading}
                  className="text-stone-400 hover:text-white p-1.5 transition-colors cursor-pointer"
                  title="Refresh chat"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${chatLoading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={() => setChatOpen(false)}
                  className="text-stone-400 hover:text-white p-1.5 transition-colors cursor-pointer"
                  title="Close chat"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Message Feed */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#FCFAF7]">
              {chatLoading && chatMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-stone-400">
                  <RefreshCw className="w-5 h-5 animate-spin text-[#8B4434]" />
                  <p className="text-xs">Loading consultation messages...</p>
                </div>
              ) : chatMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-2">
                  <div className="w-12 h-12 bg-[#8B4434]/10 rounded-full flex items-center justify-center text-[#8B4434]">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <h4 className="font-serif text-lg text-[#1c1108]">Start Private Consultation</h4>
                  <p className="text-xs text-[#606060] max-w-sm leading-relaxed">
                    Say hello! Coordinate Bill of Quantities (BOQ) preparation, material price audit, site measurement, or contract rate verification.
                  </p>
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const isMe = msg.is_me;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 px-1">
                        <span className="text-[10px] font-semibold text-[#908078]">
                          {isMe ? "You" : msg.sender_name}
                        </span>
                        {!isMe && (
                          <span className="text-[9px] uppercase px-1.5 py-0.2 bg-stone-200 text-stone-700 font-bold">
                            {msg.sender_role}
                          </span>
                        )}
                        <span className="text-[9px] text-[#c9b8b0]">
                          {new Date(msg.created_at).toLocaleTimeString("en-LK", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>

                      <div
                        className={`max-w-[82%] sm:max-w-[75%] px-4 py-3 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                          isMe
                            ? "bg-[#8B4434] text-white rounded-2xl rounded-tr-none shadow-sm"
                            : "bg-white border border-[#e8ddd6] text-[#1c1108] rounded-2xl rounded-tl-none shadow-sm"
                        }`}
                      >
                        {renderCensoredMessage(msg.message, isMe)}
                      </div>

                      {isMe && (
                        <div className="flex items-center gap-1 text-[9px] text-[#908078] mt-0.5 px-1">
                          {msg.is_read ? (
                            <span className="flex items-center gap-0.5 text-emerald-600">
                              <CheckCheck className="w-3 h-3" /> Read
                            </span>
                          ) : (
                            <span className="flex items-center gap-0.5">
                              <Check className="w-3 h-3" /> Sent
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Error banner if any */}
            {chatError && (
              <div className="bg-rose-50 border-t border-rose-200 px-4 py-2 text-xs text-rose-800 flex items-center justify-between">
                <span>{chatError}</span>
                <button
                  type="button"
                  onClick={() => setChatError(null)}
                  className="text-rose-600 font-bold text-sm cursor-pointer"
                >
                  &times;
                </button>
              </div>
            )}

            {/* Input Form */}
            <form
              onSubmit={handleSendQSMessage}
              className="p-3 sm:p-4 bg-white border-t border-[#e8ddd6] flex items-center gap-2 shrink-0"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about BOQ, rates, material estimations..."
                disabled={chatSending}
                className="flex-1 bg-[#FCFAF7] border border-[#c9b8b0] px-4 py-2.5 text-xs sm:text-sm text-[#1c1108] placeholder-[#908078] focus:outline-none focus:border-[#8B4434] transition-colors"
              />
              <button
                type="submit"
                disabled={chatSending || !chatInput.trim()}
                className="bg-[#8B4434] hover:bg-[#723628] disabled:opacity-50 text-white px-4 sm:px-5 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors shrink-0 shadow-sm cursor-pointer"
              >
                {chatSending ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin" />
                ) : (
                  <>
                    <span>Send</span>
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

            <div className="px-4 py-2 bg-stone-50 border-t border-[#e8ddd6] text-center shrink-0">
              <p className="text-[10px] text-[#908078] flex items-center justify-center gap-1.5">
                <Shield className="w-3 h-3 text-[#8B4434] shrink-0" />
                <span>Phone numbers and emails in consultation chats are automatically blurred for platform security.</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
