"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useAuth } from "../../../hooks/useAuth";
import { API_BASE_URL } from "@/lib/api";
import { Lock, Ticket, ShieldCheck, ArrowRight, AlertCircle } from "lucide-react";

export default function ProjectDetail({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const { user } = useAuth();
  const [bidAmount, setBidAmount] = useState("");
  const [days, setDays] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [acceptingBidId, setAcceptingBidId] = useState<number | null>(null);

  // Ticket gate state
  const [ticketStatus, setTicketStatus] = useState<{
    unlocked: boolean;
    credits_remaining: number;
    needs_purchase: boolean;
    is_owner?: boolean;
    is_professional?: boolean;
  } | null>(null);
  const [unlocking, setUnlocking] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [ticketError, setTicketError] = useState("");

  // Accordion Expand/Collapse States for long sections
  const [showAiStrategy, setShowAiStrategy] = useState(false);
  const [showTechSpecs, setShowTechSpecs] = useState(false);
  const [showCostBreakdown, setShowCostBreakdown] = useState(false);

  const fmt = (num: string | number) => 
    new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Number(num));

  const fetchProject = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/bidding/projects/${projectId}/`);
      if (res.ok) {
        const data = await res.json();
        setProject(data);
      }
    } catch (err) {
      console.error("Failed to fetch project", err);
    } finally {
      setLoading(false);
    }
  };

  const checkTicket = async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${API_BASE_URL}/bidding/tickets/check/${projectId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setTicketStatus(await res.json());
    } catch {}
  };

  const handleUnlock = async () => {
    if (!user) return;
    setUnlocking(true);
    setTicketError("");
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${API_BASE_URL}/bidding/tickets/unlock/${projectId}/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setTicketStatus((prev) => prev ? { ...prev, unlocked: true } : null);
        fetchProject();
      } else {
        setTicketError(data.error || "Failed to unlock project.");
      }
    } finally {
      setUnlocking(false);
    }
  };

  const handlePurchaseAndUnlock = async () => {
    if (!user) return;
    setPurchasing(true);
    setTicketError("");
    try {
      const token = await user.getIdToken();
      // 1. Purchase a new bundle
      const buyRes = await fetch(`${API_BASE_URL}/bidding/tickets/purchase/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ transaction_ref: "MOCK_PAYMENT" }),
      });
      if (!buyRes.ok) {
        setTicketError("Purchase failed. Please try again.");
        return;
      }
      // 2. Immediately spend one unlock credit
      const unlockRes = await fetch(`${API_BASE_URL}/bidding/tickets/unlock/${projectId}/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (unlockRes.ok) {
        setTicketStatus((prev) => prev ? { ...prev, unlocked: true, credits_remaining: 2 } : null);
        fetchProject();
      }
    } finally {
      setPurchasing(false);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  useEffect(() => {
    if (user) checkTicket();
  }, [user, projectId]);

  const handleAcceptBid = async (bidId: number) => {
    if (!user) return;
    setAcceptingBidId(bidId);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${API_BASE_URL}/bidding/bids/${bidId}/accept/`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      if (res.ok) {
        alert("Bid accepted successfully!");
        fetchProject();
      } else {
        alert("Failed to accept bid.");
      }
    } catch (err) {
      console.error(err);
      alert("Error accepting bid.");
    } finally {
      setAcceptingBidId(null);
    }
  };

  const handleBidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Please login first.");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${API_BASE_URL}/bidding/bids/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          project: projectId,
          bid_amount: bidAmount,
          estimated_days: days,
          cover_letter: coverLetter
        })
      });

      if (res.ok) {
        setSubmitted(true);
        fetchProject();
      } else {
        alert("Failed to submit bid.");
      }
    } catch (err) {
      console.error(err);
      alert("Error submitting bid.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FCFAF7] flex flex-col items-center justify-center py-24 text-[#606060]">
        <div className="inline-block animate-spin w-8 h-8 border-2 border-[#8B4434] border-t-transparent mb-3" />
        <p className="text-sm">Loading project details...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-[#FCFAF7] flex flex-col items-center justify-center py-24 text-[#1c1108]">
        <p className="font-serif text-2xl mb-4">Project Tender Not Found</p>
        <Link href="/bidding" className="btn-outline text-xs uppercase tracking-wider py-2.5 px-6">
          Back to Bidding Feed
        </Link>
      </div>
    );
  }

  const statusStyles: Record<string, string> = {
    OPEN: "bg-emerald-50 text-emerald-800 border-emerald-200",
    CLOSED: "bg-stone-100 text-stone-700 border-stone-300",
    AWARDED: "bg-amber-50 text-amber-800 border-amber-200",
  };

  return (
    <div className="min-h-screen bg-[#FCFAF7] text-[#1c1108]">
      
      {/* Dark Header Banner */}
      <div className="bg-[#1c1108] text-[#FCFAF7] relative overflow-hidden py-10 sm:py-14 px-4 sm:px-6 lg:px-8 border-b border-[#322318]">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#8B4434_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10 space-y-4">
          <Link
            href="/bidding"
            className="inline-flex items-center gap-1 text-xs uppercase tracking-widest text-[#8B4434] hover:text-white font-semibold transition-colors"
          >
            Back to Feed
          </Link>

          <div className="flex flex-wrap items-center gap-3">
            <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider border ${statusStyles[project.status?.toUpperCase()] || 'bg-stone-50 text-stone-700 border-stone-200'}`}>
              {project.status}
            </span>
            {project.created_at && (
              <span className="text-xs text-[#c9b8b0]">
                Posted on {new Date(project.created_at).toLocaleDateString('en-LK', { year: 'numeric', month: 'short', day: 'numeric' })}
              </span>
            )}
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#FCFAF7] max-w-4xl leading-tight">
            {project.title}
          </h1>

          <div className="flex flex-wrap gap-6 pt-4 border-t border-[#322318] text-xs text-[#c9b8b0]">
            <div>
              <span className="text-[#908078] uppercase tracking-wider block text-[10px]">Posted By</span>
              <span className="font-semibold text-white text-sm">{project.client_name}</span>
            </div>
            <div>
              <span className="text-[#908078] uppercase tracking-wider block text-[10px]">Location</span>
              <span className="font-semibold text-white text-sm">{project.location}</span>
            </div>
            <div>
              <span className="text-[#908078] uppercase tracking-wider block text-[10px]">Client Budget</span>
              <span className="font-semibold text-[#8B4434] text-sm">{project.budget_range}</span>
            </div>
            <div>
              <span className="text-[#908078] uppercase tracking-wider block text-[10px]">Proposals</span>
              <span className="font-semibold text-white text-sm">{project.bids?.length || project.bids_count || 0} Submitted</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">
          
          {/* Left Main Details Column */}
          <div className="space-y-8">
            
            {/* Project Description */}
            <div className="bg-white border border-[#e8ddd6] p-6 sm:p-8 shadow-sm space-y-4">
              <h2 className="font-serif text-2xl text-[#1c1108] border-b border-[#e8ddd6] pb-4">
                Project Overview &amp; Requirements
              </h2>
              <p className="text-[#606060] leading-relaxed text-sm sm:text-base whitespace-pre-wrap">
                {project.description}
              </p>
            </div>

            {/* Linked AI Estimation Section (with Collapsible Accordions) */}
            {project.estimation_details && (
              <div className="space-y-6">
                <div className="border-t border-[#e8ddd6] pt-6">
                  <p className="text-[#8B4434] text-xs font-semibold tracking-widest uppercase">Smart Construction Data</p>
                  <h2 className="font-serif text-2xl sm:text-3xl text-[#1c1108]">Linked AI Cost Estimation</h2>
                  <p className="text-xs text-[#606060] mt-1">This project tender includes automated AI system structural calculations.</p>
                </div>

                {/* AI Cost Summary Banner (Always visible summary) */}
                <div className="bg-[#1c1108] text-[#FCFAF7] border border-[#322318] p-6 sm:p-8 text-center space-y-2">
                  <p className="text-xs uppercase tracking-widest text-[#8B4434] font-semibold">AI Calculated Benchmark Cost</p>
                  <h3 className="font-serif text-3xl sm:text-4xl text-[#8B4434]">
                    {fmt(project.estimation_details.total_estimated_cost)}
                  </h3>
                  <p className="text-[#c9b8b0] text-xs">
                    Target parameters: {project.estimation_details.total_area_sqft} sqft, {project.estimation_details.number_of_floors}-story structure ({project.estimation_details.quality_level?.toLowerCase()} quality grade).
                  </p>
                </div>

                {/* Accordion 1: AI Design & Material Strategy */}
                {project.estimation_details.design_recommendation_json && (
                  <div className="bg-white border border-[#e8ddd6] shadow-sm">
                    <button
                      onClick={() => setShowAiStrategy(!showAiStrategy)}
                      className="w-full p-6 sm:px-8 text-left flex items-center justify-between hover:bg-[#FCFAF7] transition-colors"
                    >
                      <h3 className="font-serif text-xl text-[#1c1108]">
                        AI Design &amp; Material Strategy
                      </h3>
                      <span className="text-xs font-semibold uppercase tracking-wider text-[#8B4434] bg-[#8B4434]/10 px-3 py-1">
                        {showAiStrategy ? "- Collapse" : "+ Expand"}
                      </span>
                    </button>

                    {showAiStrategy && (
                      <div className="p-6 sm:p-8 border-t border-[#e8ddd6] space-y-6">
                        <div className="space-y-4 text-sm text-[#606060]">
                          <div>
                            <p className="text-xs uppercase tracking-[0.2em] text-[#8B4434] font-semibold">
                              {project.estimation_details.design_recommendation_json.design_title}
                            </p>
                            <p className="mt-1.5 leading-relaxed text-sm">{project.estimation_details.design_recommendation_json.style_summary}</p>
                          </div>
                          {project.estimation_details.design_recommendation_json.recommended_layout?.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-[#1c1108] mb-2 text-xs uppercase tracking-wider">Recommended Layout Strategy</h4>
                              <ul className="grid sm:grid-cols-2 gap-2">
                                {project.estimation_details.design_recommendation_json.recommended_layout.map((item: string, index: number) => (
                                  <li key={index} className="text-xs bg-[#FCFAF7] p-2.5 border border-[#e8ddd6] text-[#1c1108]">
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {project.estimation_details.design_recommendation_json.material_strategy?.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-[#1c1108] mb-2 text-xs uppercase tracking-wider">Material Procurement Strategy</h4>
                              <ul className="grid sm:grid-cols-2 gap-2">
                                {project.estimation_details.design_recommendation_json.material_strategy.map((item: string, index: number) => (
                                  <li key={index} className="text-xs bg-[#FCFAF7] p-2.5 border border-[#e8ddd6] text-[#1c1108]">
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Accordion 2: Technical Specifications */}
                {project.estimation_details.project_details_json && (
                  <div className="bg-white border border-[#e8ddd6] shadow-sm">
                    <button
                      onClick={() => setShowTechSpecs(!showTechSpecs)}
                      className="w-full p-6 sm:px-8 text-left flex items-center justify-between hover:bg-[#FCFAF7] transition-colors"
                    >
                      <h3 className="font-serif text-xl text-[#1c1108]">
                        Detailed Technical Specifications
                      </h3>
                      <span className="text-xs font-semibold uppercase tracking-wider text-[#8B4434] bg-[#8B4434]/10 px-3 py-1">
                        {showTechSpecs ? "- Collapse" : "+ Expand"}
                      </span>
                    </button>

                    {showTechSpecs && (
                      <div className="p-6 sm:p-8 border-t border-[#e8ddd6]">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-[#1c1108]">
                          {Object.entries(project.estimation_details.project_details_json).map(([key, val]) => (
                            <div key={key} className="border border-[#e8ddd6] p-3.5 bg-[#FCFAF7]">
                              <p className="text-[10px] uppercase tracking-[0.15em] text-[#8B4434] font-semibold">{key.replaceAll('_', ' ')}</p>
                              <p className="mt-1 font-medium text-sm text-[#1c1108]">{String(val)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Accordion 3: Cost Breakdown */}
                {project.estimation_details.breakdown_json && (
                  <div className="bg-white border border-[#e8ddd6] shadow-sm">
                    <button
                      onClick={() => setShowCostBreakdown(!showCostBreakdown)}
                      className="w-full p-6 sm:px-8 text-left flex items-center justify-between hover:bg-[#FCFAF7] transition-colors"
                    >
                      <h3 className="font-serif text-xl text-[#1c1108]">
                        AI Cost Breakdown
                      </h3>
                      <span className="text-xs font-semibold uppercase tracking-wider text-[#8B4434] bg-[#8B4434]/10 px-3 py-1">
                        {showCostBreakdown ? "- Collapse" : "+ Expand"}
                      </span>
                    </button>

                    {showCostBreakdown && (
                      <div className="p-6 sm:p-8 border-t border-[#e8ddd6]">
                        <div className="divide-y divide-[#e8ddd6]">
                          {Object.entries(project.estimation_details.breakdown_json).map(([key, val]) => (
                            <div key={key} className="flex justify-between items-center py-2.5 text-xs text-[#606060]">
                              <span className="capitalize">{key.replaceAll('_', ' ')}</span>
                              <span className="font-semibold text-[#1c1108]">{fmt(val as number)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Submitted Proposals Section — Ticket Gated */}
            <div className="bg-white p-6 sm:p-8 border border-[#e8ddd6] shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-[#e8ddd6] pb-4">
                <h3 className="font-serif text-xl sm:text-2xl text-[#1c1108]">
                  Submitted Proposals ({project.bids?.length || project.bids_count || 0})
                </h3>
                {ticketStatus?.unlocked && (
                  <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-emerald-700 font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5" /> Unlocked
                  </span>
                )}
              </div>

              {/* Ticket Gate Block */}
              {user && ticketStatus && !ticketStatus.unlocked && !ticketStatus.is_professional && (
                <div className="border border-[#8B4434]/30 bg-[#FCFAF7] shadow-sm">
                  {/* Blurred preview hint */}
                  <div className="relative overflow-hidden p-6 pointer-events-none select-none">
                    {[1,2,3].map((i) => (
                      <div key={i} className="mb-4 p-4 border border-[#e8ddd6] bg-white opacity-40 space-y-2">
                        <div className="h-3 w-32 bg-[#e8ddd6] rounded" />
                        <div className="h-2 w-48 bg-[#e8ddd6] rounded" />
                        <div className="h-2 w-24 bg-[#8B4434]/20 rounded" />
                      </div>
                    ))}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#FCFAF7]/70 to-[#FCFAF7]" />
                  </div>
                  {/* Lock UI */}
                  <div className="px-6 pb-8 text-center space-y-5">
                    <div className="w-14 h-14 bg-[#1c1108] flex items-center justify-center mx-auto">
                      <Lock className="w-6 h-6 text-[#8B4434]" />
                    </div>
                    <div>
                      <h4 className="font-serif text-xl sm:text-2xl text-[#1c1108]">
                        {ticketStatus.is_owner ? "Unlock Proposals & Contractor Identities" : "Proposals & Contractor Details are Locked"}
                      </h4>
                      <p className="text-xs sm:text-sm text-[#606060] mt-2 max-w-md mx-auto leading-relaxed">
                        {ticketStatus.is_owner
                          ? "As the project owner, spend 1 ticket credit to unlock ALL proposals submitted for your tender, reveal contractor names & contact details, view professional profiles, and accept a bid."
                          : "Use 1 ticket credit to unlock ALL proposals submitted for this project tender, reveal professional names & contact details, and view full professional profiles."}
                      </p>
                      <p className="text-[11px] text-[#8B4434] font-semibold mt-1">
                        ✨ 1 credit unlocks ALL proposals for this project tender.
                      </p>
                    </div>

                    {ticketError && (
                      <div className="flex items-center gap-2 text-rose-700 text-xs bg-rose-50 border border-rose-200 p-3 text-left">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        {ticketError}
                      </div>
                    )}

                    {ticketStatus.credits_remaining > 0 ? (
                      <div className="space-y-3">
                        <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 py-2 px-4 inline-block font-medium">
                          You have <strong>{ticketStatus.credits_remaining}</strong> unlock credit{ticketStatus.credits_remaining > 1 ? "s" : ""} available
                        </p>
                        <button
                          onClick={handleUnlock}
                          disabled={unlocking}
                          className="block w-full max-w-xs mx-auto bg-[#8B4434] text-[#FCFAF7] py-3.5 text-xs font-bold uppercase tracking-widest hover:bg-[#6f3829] disabled:opacity-70 transition-colors shadow-sm"
                        >
                          {unlocking ? "Unlocking..." : "Use 1 Credit — Unlock All Proposals"}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
                          <button
                            onClick={handlePurchaseAndUnlock}
                            disabled={purchasing}
                            className="flex items-center gap-2 bg-[#8B4434] text-[#FCFAF7] py-3.5 px-8 text-xs font-bold uppercase tracking-widest hover:bg-[#6f3829] disabled:opacity-70 transition-colors"
                          >
                            <Ticket className="w-3.5 h-3.5" />
                            {purchasing ? "Processing..." : "Buy Ticket Bundle & Unlock — LKR 500"}
                          </button>
                          <Link href="/tickets" className="flex items-center gap-1 text-xs text-[#8B4434] font-semibold hover:underline">
                            View My Tickets <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                        <p className="text-[10px] text-[#908078]">
                          LKR 500 for 3 project unlocks (1 unlock per project tender).
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Not logged in */}
              {!user && (
                <div className="text-center py-8 space-y-3">
                  <Lock className="w-8 h-8 text-[#8B4434] mx-auto" />
                  <p className="text-[#606060] text-sm">Login to view submitted proposals.</p>
                  <Link href={`/login?redirect=/bidding/${projectId}`} className="inline-block bg-[#8B4434] text-[#FCFAF7] px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-[#6f3829] transition-colors">
                    Login to View Bids
                  </Link>
                </div>
              )}

              {/* Show bids feed */}
              {(ticketStatus?.unlocked || ticketStatus?.is_owner || ticketStatus?.is_professional || (!user)) && (
              <>
              {!project.bids || project.bids.length === 0 ? (
                <div className="text-center py-10 text-[#908078] text-sm">
                  No proposals submitted for this project tender yet.
                </div>
                ) : (
                <div className="space-y-5">
                  {project.bids.map((bid: any) => {
                    const isProjectOwner = user && project.client_firebase_uid === user.uid;
                    const isBidder = user && bid.professional_details?.firebase_uid === user.uid;

                    // Identity is revealed ONLY when user has unlocked or is the bidder themselves
                    const identityRevealed = Boolean(ticketStatus?.unlocked || isBidder);
                    const canAccept = isProjectOwner && ticketStatus?.unlocked && bid.status === 'PENDING' && project.status === 'OPEN';

                    const bidStatusColors: Record<string, string> = {
                      PENDING: 'bg-amber-50 text-amber-800 border-amber-200',
                      ACCEPTED: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                      REJECTED: 'bg-rose-50 text-rose-800 border-rose-200'
                    };

                    const displayName = bid.professional_details
                      ? `${bid.professional_details.first_name || ''} ${bid.professional_details.last_name || ''}`.trim() || bid.professional_details.username
                      : "Professional Contractor";

                    const profRating = bid.professional_rating ? parseFloat(bid.professional_rating) : null;
                    const profProjects = bid.professional_projects_completed;

                    return (
                      <div key={bid.id} className="border border-[#e8ddd6] bg-[#FCFAF7] overflow-hidden">
                        {/* Card Header */}
                        <div className="p-5 sm:p-6 flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            {/* Avatar — anonymous if locked */}
                            <div className={`w-10 h-10 flex items-center justify-center font-serif text-sm font-semibold shrink-0 ${identityRevealed ? 'bg-[#1c1108] text-[#FCFAF7]' : 'bg-[#e8ddd6] text-[#908078]'}`}>
                              {identityRevealed
                                ? displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "PR"
                                : "?"}
                            </div>
                            <div>
                              {identityRevealed ? (
                                <>
                                  <h4 className="font-medium text-[#1c1108] text-sm">{displayName}</h4>
                                  {bid.professional_details?.email && (
                                    <p className="text-[10px] text-[#908078]">{bid.professional_details.email}</p>
                                  )}
                                </>
                              ) : (
                                <>
                                  <h4 className="text-sm font-medium text-[#908078] flex items-center gap-1.5">
                                    <Lock className="w-3 h-3 text-[#8B4434]" /> Anonymous Professional
                                  </h4>
                                  <p className="text-[10px] text-[#908078]">Identity &amp; contact details revealed after unlock</p>
                                </>
                              )}
                              <p className="text-[10px] text-[#c9b8b0] mt-0.5">
                                {new Date(bid.created_at).toLocaleDateString('en-LK', { year: 'numeric', month: 'short', day: 'numeric' })}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* View Professional Profile Button */}
                            {identityRevealed && bid.professional_details?.id ? (
                              <Link
                                href={`/professionals/${bid.professional_details.id}`}
                                className="inline-flex items-center gap-1.5 text-xs text-[#8B4434] font-semibold hover:bg-[#8B4434] hover:text-[#FCFAF7] transition-colors border border-[#8B4434]/30 px-3 py-1.5 bg-white"
                              >
                                View Professional Profile <ArrowRight className="w-3 h-3" />
                              </Link>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] text-[#908078] bg-[#e8ddd6]/50 px-2.5 py-1">
                                <Lock className="w-3 h-3" /> Profile Locked
                              </span>
                            )}

                            <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${bidStatusColors[bid.status] || 'bg-stone-50 text-stone-700'}`}>
                              {bid.status}
                            </span>
                          </div>
                        </div>

                        {/* Professional metrics row — always public */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#e8ddd6] border-t border-[#e8ddd6] text-xs">
                          <div className="bg-white px-4 py-3">
                            <p className="text-[#908078] uppercase tracking-wider text-[9px]">Proposal Amount</p>
                            <p className="font-serif text-base font-bold text-[#8B4434] mt-0.5">{fmt(bid.bid_amount)}</p>
                          </div>
                          <div className="bg-white px-4 py-3">
                            <p className="text-[#908078] uppercase tracking-wider text-[9px]">Timeline</p>
                            <p className="font-semibold text-[#1c1108] text-sm mt-0.5">{bid.estimated_days} Days</p>
                          </div>
                          <div className="bg-white px-4 py-3">
                            <p className="text-[#908078] uppercase tracking-wider text-[9px]">Prof. Rating</p>
                            <p className="font-semibold text-[#1c1108] text-sm mt-0.5">
                              {profRating ? `${profRating.toFixed(1)} ★` : '—'}
                            </p>
                          </div>
                          <div className="bg-white px-4 py-3">
                            <p className="text-[#908078] uppercase tracking-wider text-[9px]">Projects Done</p>
                            <p className="font-semibold text-[#1c1108] text-sm mt-0.5">
                              {profProjects != null ? `${profProjects}+` : '—'}
                            </p>
                          </div>
                        </div>

                        {/* Cover Letter — always visible */}
                        <div className="px-5 sm:px-6 py-4 border-t border-[#e8ddd6] space-y-1">
                          <p className="text-[#908078] text-[9px] uppercase tracking-wider font-semibold">Proposal Letter</p>
                          <p className="text-[#606060] text-xs leading-relaxed whitespace-pre-wrap">{bid.cover_letter}</p>
                        </div>

                        {/* Accept button banner for Project Owner */}
                        {isProjectOwner && !identityRevealed && (
                          <div className="px-5 sm:px-6 py-3.5 border-t border-[#e8ddd6] bg-amber-50 flex flex-wrap items-center justify-between gap-3 text-xs text-amber-900">
                            <div className="flex items-center gap-2">
                              <Lock className="w-4 h-4 text-[#8B4434] shrink-0" />
                              <span>Unlock this project (1 credit for all proposals) to reveal professional identity and accept this bid.</span>
                            </div>
                            {ticketStatus?.credits_remaining && ticketStatus.credits_remaining > 0 ? (
                              <button
                                onClick={handleUnlock}
                                disabled={unlocking}
                                className="bg-[#8B4434] text-white px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider hover:bg-[#6f3829] disabled:opacity-50 transition-colors shrink-0"
                              >
                                {unlocking ? "Unlocking..." : "Use 1 Credit Now"}
                              </button>
                            ) : (
                              <button
                                onClick={handlePurchaseAndUnlock}
                                disabled={purchasing}
                                className="bg-[#8B4434] text-white px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider hover:bg-[#6f3829] disabled:opacity-50 transition-colors shrink-0"
                              >
                                {purchasing ? "Processing..." : "Buy Bundle & Unlock"}
                              </button>
                            )}
                          </div>
                        )}

                        {canAccept && (
                          <div className="px-5 sm:px-6 py-4 border-t border-[#e8ddd6] bg-white flex items-center justify-between flex-wrap gap-3">
                            <p className="text-xs text-emerald-800 font-medium">Identity Unlocked — Ready to award project.</p>
                            <button
                              type="button"
                              disabled={acceptingBidId !== null}
                              onClick={() => handleAcceptBid(bid.id)}
                              className="btn-primary py-2.5 px-6 text-[10px] uppercase tracking-widest cursor-pointer disabled:opacity-50"
                            >
                              {acceptingBidId === bid.id ? "Accepting..." : "Accept Proposal"}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              </>
              )}
            </div>
          </div>

          {/* Right Column: Bid Submission Form Sticky Panel */}
          <aside className="lg:sticky lg:top-8 space-y-6">
            <div className="bg-white border border-[#e8ddd6] p-6 sm:p-8 shadow-sm space-y-6">
              <div className="border-b border-[#e8ddd6] pb-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#8B4434] font-semibold">For Professionals</p>
                <h3 className="font-serif text-2xl text-[#1c1108]">Submit Proposal</h3>
              </div>
              
              {submitted ? (
                <div className="bg-emerald-50 border border-emerald-200 p-6 text-center space-y-3">
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto text-xl font-bold">Done</div>
                  <h4 className="font-serif text-lg text-emerald-900">Proposal Submitted!</h4>
                  <p className="text-emerald-700 text-xs leading-relaxed">
                    Your bid has been recorded. The client will review your proposal and contact you.
                  </p>
                </div>
              ) : !user ? (
                <div className="text-center py-6 space-y-4">
                  <p className="text-[#606060] text-xs">You must be logged in as a professional to submit a proposal.</p>
                  <Link href={`/login?redirect=/bidding/${projectId}`} className="btn-primary text-xs uppercase tracking-wider py-3 px-6 block w-full text-center">
                    Sign In to Submit Bid
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleBidSubmit} className="space-y-6">
                  <div>
                    <label className="block text-[#606060] font-semibold text-xs uppercase tracking-wider mb-2">
                      YOUR BID AMOUNT (LKR) *
                    </label>
                    <input 
                      required 
                      type="number" 
                      value={bidAmount} 
                      onChange={e => setBidAmount(e.target.value)}
                      className="w-full bg-[#FCFAF7] border-b border-[#c9b8b0] px-4 py-3 text-sm text-[#1c1108] placeholder-[#908078] focus:outline-none focus:border-[#8B4434]" 
                      placeholder="e.g. 25000000" 
                    />
                  </div>

                  <div>
                    <label className="block text-[#606060] font-semibold text-xs uppercase tracking-wider mb-2">
                      ESTIMATED COMPLETION (DAYS) *
                    </label>
                    <input 
                      required 
                      type="number" 
                      value={days} 
                      onChange={e => setDays(e.target.value)}
                      className="w-full bg-[#FCFAF7] border-b border-[#c9b8b0] px-4 py-3 text-sm text-[#1c1108] placeholder-[#908078] focus:outline-none focus:border-[#8B4434]" 
                      placeholder="e.g. 180" 
                    />
                  </div>

                  <div>
                    <label className="block text-[#606060] font-semibold text-[#1c1108] text-xs uppercase tracking-wider mb-2">
                      COVER LETTER / PROPOSAL *
                    </label>
                    <textarea 
                      required 
                      value={coverLetter} 
                      onChange={e => setCoverLetter(e.target.value)} 
                      rows={5}
                      className="w-full bg-[#FCFAF7] border border-[#e8ddd6] p-4 text-sm text-[#1c1108] placeholder-[#908078] focus:outline-none focus:border-[#8B4434] leading-relaxed" 
                      placeholder="Explain your approach, timeline, scope included, and past experience..."
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={isSubmitting} 
                    className="w-full btn-primary py-4 text-xs uppercase tracking-wider disabled:opacity-70"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Proposal"}
                  </button>
                </form>
              )}
            </div>
          </aside>

        </div>
      </div>
    </div>
  );
}