"use client";

import { useState, useEffect, useRef, use } from "react";
import Link from "next/link";
import { useAuth } from "../../../hooks/useAuth";
import { API_BASE_URL } from "@/lib/api";
import { 
  Lock, Ticket, ShieldCheck, ArrowRight, AlertCircle, 
  MessageSquare, Send, X, Check, CheckCheck, RefreshCw,
  Shield, ShieldAlert 
} from "lucide-react";

function renderCensoredMessage(text: string, isMe: boolean) {
  // Regex to match emails, mobile/landline numbers, spaced/hyphenated numbers, 9-12 digit sequences, or masked bullets
  const pattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})|((?:\+?94[\s.-]?)?0?7[0-8][\s.-]?\d{3}[\s.-]?\d{4})|((?:\+?94[\s.-]?)?0?(?:11|2[1-7]|3[1-8]|4[1-7]|5[1-7]|6[3-7]|81|91)[\s.-]?\d{3}[\s.-]?\d{4})|(\b(?:\+?\d{1,3}[\s.-]?)?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}\b)|(\b\d{9,12}\b)|(•{4,})/gi;

  const parts = [];
  let lastIndex = 0;
  let match;
  let hasContact = false;

  while ((match = pattern.exec(text)) !== null) {
    hasContact = true;
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    // Never expose the matched raw contact info in the DOM to prevent inspection leak
    const maskedText = "••••••••••••";
    parts.push(
      <span
        key={match.index}
        className={`inline-block select-none px-2 py-0.5 rounded font-mono text-[11px] mx-0.5 border border-dashed font-bold tracking-widest ${
          isMe
            ? "bg-white/20 text-white/90 border-white/40"
            : "bg-stone-200 text-stone-700 border-stone-400"
        }`}
        title="Contact details hidden for privacy & safety"
      >
        {maskedText}
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

  // Private Chat Room state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatData, setChatData] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatSending, setChatSending] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

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
  const [bidError, setBidError] = useState<string | null>(null);
  const [bidNeedsMembership, setBidNeedsMembership] = useState(false);

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

  // Check URL query param to automatically open chat (e.g. from contractor dashboard)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const search = new URLSearchParams(window.location.search);
      if (search.get("chat") === "open") {
        setChatOpen(true);
      }
    }
  }, []);

  const fetchChat = async (silent = false) => {
    if (!user) return;
    if (!silent) setChatLoading(true);
    setChatError(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${API_BASE_URL}/bidding/projects/${projectId}/chat/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setChatData(data);
        setChatMessages(data.messages || []);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("chatUpdated"));
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        if (!silent) setChatError(errData.error || "Failed to load chat.");
      }
    } catch (err) {
      console.error("Chat fetch error:", err);
      if (!silent) setChatError("Could not connect to chat server.");
    } finally {
      if (!silent) setChatLoading(false);
    }
  };

  // Poll chat messages every 3 seconds while chat modal is open
  useEffect(() => {
    if (!chatOpen || !user) return;
    fetchChat(false);
    const interval = setInterval(() => {
      fetchChat(true);
    }, 3000);
    return () => clearInterval(interval);
  }, [chatOpen, user, projectId]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (chatOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, chatOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text || !user || chatSending) return;

    setChatSending(true);
    setChatError(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${API_BASE_URL}/bidding/projects/${projectId}/chat/`, {
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
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("chatUpdated"));
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        setChatError(errData.error || "Failed to send message.");
      }
    } catch (err) {
      console.error("Failed to send message", err);
      setChatError("Network error while sending message.");
    } finally {
      setChatSending(false);
    }
  };

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
        alert("Bid accepted successfully! Private chat room is now open with the contractor.");
        await fetchProject();
        setChatOpen(true);
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
        setBidError(null);
        setBidNeedsMembership(false);
        fetchProject();
      } else {
        const errData = await res.json().catch(() => ({}));
        if (res.status === 402 || errData.needs_registration || errData.needs_service_fee) {
          setBidNeedsMembership(true);
        }
        setBidError(errData.error || "Failed to submit proposal. Please check your membership status.");
      }
    } catch (err) {
      console.error(err);
      setBidError("Error submitting bid. Please check connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FCFAF7] flex flex-col items-center justify-center py-24 text-[#606060]">
        <div className="inline-block animate-spin w-8 h-8 border-2 border-[#EA580C] border-t-transparent mb-3" />
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

  const acceptedBid = project?.accepted_bid || project?.bids?.find((b: any) => b.status === 'ACCEPTED');
  const isProjectOwner = Boolean(user && project?.client_firebase_uid === user.uid);
  const isAcceptedContractor = Boolean(user && acceptedBid?.professional_details?.firebase_uid === user.uid);
  const canAccessChat = Boolean(acceptedBid && (isProjectOwner || isAcceptedContractor));

  const counterpartName = isProjectOwner
    ? (chatData?.professional?.name || (acceptedBid?.professional_details?.first_name 
        ? `${acceptedBid?.professional_details?.first_name || ''} ${acceptedBid?.professional_details?.last_name || ''}`.trim() 
        : acceptedBid?.professional_details?.username || "Contractor"))
    : (chatData?.client?.name || project?.client_name || "Project Homeowner");

  const counterpartRole = isProjectOwner ? "Accepted Contractor" : "Project Homeowner";
  const counterpartImage = isProjectOwner 
    ? (chatData?.professional?.profile_image || acceptedBid?.professional_details?.profile_image) 
    : (chatData?.client?.profile_image);

  const formatChatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return "";
    }
  };

  const statusStyles: Record<string, string> = {
    OPEN: "bg-emerald-50 text-emerald-800 border-emerald-200",
    CLOSED: "bg-stone-100 text-stone-700 border-stone-300",
    AWARDED: "bg-amber-50 text-amber-800 border-amber-200",
  };

  return (
    <div className="min-h-screen bg-[#FCFAF7] text-[#1c1108]">
      
      {/* Dark Header Banner */}
      <div className="bg-[#1c1108] text-[#FCFAF7] relative overflow-hidden py-10 sm:py-14 px-4 sm:px-6 lg:px-8 border-b border-[#322318]">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#EA580C_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10 space-y-4">
          <Link
            href="/bidding"
            className="inline-flex items-center gap-1 text-xs uppercase tracking-widest text-[#EA580C] hover:text-white font-semibold transition-colors"
          >
            Back to Feed
          </Link>

          <div className="flex flex-wrap items-center gap-3">
            <span className={`px-3.5 py-1 text-xs font-bold uppercase tracking-wider border rounded-full ${statusStyles[project.status?.toUpperCase()] || 'bg-stone-50 text-stone-700 border-stone-200'}`}>
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
              <span className="font-semibold text-[#EA580C] text-sm">{project.budget_range}</span>
            </div>
            <div>
              <span className="text-[#908078] uppercase tracking-wider block text-[10px]">Proposals</span>
              <span className="font-semibold text-white text-sm">{project.bids?.length || project.bids_count || 0} Submitted</span>
            </div>
          </div>

          {/* Active Chat Quick Action Banner if Bid is Accepted and User has access */}
          {canAccessChat && (
            <div className="pt-4 border-t border-[#322318] flex flex-wrap items-center justify-between gap-3 bg-emerald-950/40 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 border-y border-emerald-800/40">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-semibold text-emerald-200">
                  Bid Accepted &amp; Awarded — Private 1-on-1 Chat Room Active
                </span>
              </div>
              <button
                type="button"
                onClick={() => setChatOpen(true)}
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-xl transition-all shadow-sm cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                Open Private Chat
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">
          
          {/* Left Main Details Column */}
          <div className="space-y-8">
            
            {/* Project Description */}
            <div className="bg-white border border-[#e8ddd6] p-6 sm:p-8 rounded-2xl shadow-sm space-y-4">
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
                  <p className="text-[#EA580C] text-xs font-semibold tracking-widest uppercase">Smart Construction Data</p>
                  <h2 className="font-serif text-2xl sm:text-3xl text-[#1c1108]">Linked AI Cost Estimation</h2>
                  <p className="text-xs text-[#606060] mt-1">This project tender includes automated AI system structural calculations.</p>
                </div>

                {/* AI Cost Summary Banner (Always visible summary) */}
                <div className="bg-[#1c1108] text-[#FCFAF7] border border-[#322318] p-6 sm:p-8 rounded-2xl text-center space-y-2">
                  <p className="text-xs uppercase tracking-widest text-[#EA580C] font-semibold">AI Calculated Benchmark Cost</p>
                  <h3 className="font-serif text-3xl sm:text-4xl text-[#EA580C]">
                    {fmt(project.estimation_details.total_estimated_cost)}
                  </h3>
                  <p className="text-[#c9b8b0] text-xs">
                    Target parameters: {project.estimation_details.total_area_sqft} sqft, {project.estimation_details.number_of_floors}-story structure ({project.estimation_details.quality_level?.toLowerCase()} quality grade).
                  </p>
                </div>

                {/* Accordion 1: AI Design & Material Strategy */}
                {project.estimation_details.design_recommendation_json && (
                  <div className="bg-white border border-[#e8ddd6] rounded-2xl shadow-sm overflow-hidden">
                    <button
                      onClick={() => setShowAiStrategy(!showAiStrategy)}
                      className="w-full p-6 sm:px-8 text-left flex items-center justify-between hover:bg-[#FCFAF7] transition-colors"
                    >
                      <h3 className="font-serif text-xl text-[#1c1108]">
                        AI Design &amp; Material Strategy
                      </h3>
                      <span className="text-xs font-semibold uppercase tracking-wider text-[#EA580C] bg-[#EA580C]/10 px-3 py-1 rounded-full">
                        {showAiStrategy ? "- Collapse" : "+ Expand"}
                      </span>
                    </button>

                    {showAiStrategy && (
                      <div className="p-6 sm:p-8 border-t border-[#e8ddd6] space-y-6">
                        <div className="space-y-4 text-sm text-[#606060]">
                          <div>
                            <p className="text-xs uppercase tracking-[0.2em] text-[#EA580C] font-semibold">
                              {project.estimation_details.design_recommendation_json.design_title}
                            </p>
                            <p className="mt-1.5 leading-relaxed text-sm">{project.estimation_details.design_recommendation_json.style_summary}</p>
                          </div>
                          {project.estimation_details.design_recommendation_json.recommended_layout?.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-[#1c1108] mb-2 text-xs uppercase tracking-wider">Recommended Layout Strategy</h4>
                              <ul className="grid sm:grid-cols-2 gap-2">
                                {project.estimation_details.design_recommendation_json.recommended_layout.map((item: string, index: number) => (
                                  <li key={index} className="text-xs bg-[#FCFAF7] p-2.5 border border-[#e8ddd6] rounded-xl text-[#1c1108]">
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
                                  <li key={index} className="text-xs bg-[#FCFAF7] p-2.5 border border-[#e8ddd6] rounded-xl text-[#1c1108]">
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
                  <div className="bg-white border border-[#e8ddd6] rounded-2xl shadow-sm overflow-hidden">
                    <button
                      onClick={() => setShowTechSpecs(!showTechSpecs)}
                      className="w-full p-6 sm:px-8 text-left flex items-center justify-between hover:bg-[#FCFAF7] transition-colors"
                    >
                      <h3 className="font-serif text-xl text-[#1c1108]">
                        Detailed Technical Specifications
                      </h3>
                      <span className="text-xs font-semibold uppercase tracking-wider text-[#EA580C] bg-[#EA580C]/10 px-3 py-1 rounded-full">
                        {showTechSpecs ? "- Collapse" : "+ Expand"}
                      </span>
                    </button>

                    {showTechSpecs && (
                      <div className="p-6 sm:p-8 border-t border-[#e8ddd6]">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-[#1c1108]">
                          {Object.entries(project.estimation_details.project_details_json).map(([key, val]) => (
                            <div key={key} className="border border-[#e8ddd6] p-3.5 bg-[#FCFAF7] rounded-xl">
                              <p className="text-[10px] uppercase tracking-[0.15em] text-[#EA580C] font-semibold">{key.replaceAll('_', ' ')}</p>
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
                  <div className="bg-white border border-[#e8ddd6] rounded-2xl shadow-sm overflow-hidden">
                    <button
                      onClick={() => setShowCostBreakdown(!showCostBreakdown)}
                      className="w-full p-6 sm:px-8 text-left flex items-center justify-between hover:bg-[#FCFAF7] transition-colors"
                    >
                      <h3 className="font-serif text-xl text-[#1c1108]">
                        AI Cost Breakdown
                      </h3>
                      <span className="text-xs font-semibold uppercase tracking-wider text-[#EA580C] bg-[#EA580C]/10 px-3 py-1 rounded-full">
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
            <div className="bg-white p-6 sm:p-8 border border-[#e8ddd6] rounded-2xl shadow-sm space-y-6">
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

              {/* Not logged in */}
              {!user && (
                <div className="text-center py-8 space-y-3">
                  <Lock className="w-8 h-8 text-[#EA580C] mx-auto" />
                  <p className="text-[#606060] text-sm">Login to view submitted contractor proposals.</p>
                  <Link href={`/login?redirect=/bidding/${projectId}`} className="inline-block bg-[#EA580C] text-[#FCFAF7] px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#C2410C] transition-colors">
                    Login to View Bids
                  </Link>
                </div>
              )}

              {/* Show bids feed */}
              {user && (
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

                    // Identity is revealed for project owner and bidders
                    const identityRevealed = Boolean(isProjectOwner || isBidder || user);
                    const canAccept = isProjectOwner && bid.status === 'PENDING' && project.status === 'OPEN';

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
                      <div key={bid.id} className={`border ${bid.status === 'ACCEPTED' ? 'border-emerald-500 ring-1 ring-emerald-500' : 'border-[#e8ddd6]'} bg-[#FCFAF7] rounded-2xl overflow-hidden`}>
                        {bid.status === 'ACCEPTED' && (
                          <div className="bg-emerald-700 text-white px-5 py-2 text-xs font-bold uppercase tracking-widest flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <ShieldCheck className="w-4 h-4" /> Awarded &amp; Accepted Proposal
                            </span>
                            {canAccessChat && (
                              <span className="text-[10px] bg-emerald-900/80 px-2.5 py-0.5 font-sans normal-case tracking-normal">
                                Private 1-on-1 Chat Active
                              </span>
                            )}
                          </div>
                        )}

                        {/* Card Header */}
                        <div className="p-5 sm:p-6 flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            {/* Avatar — anonymous if locked */}
                            <div className={`w-10 h-10 flex items-center justify-center font-serif text-sm font-semibold shrink-0 rounded-xl ${identityRevealed ? 'bg-[#1c1108] text-[#FCFAF7]' : 'bg-[#e8ddd6] text-[#908078]'}`}>
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
                                    <Lock className="w-3 h-3 text-[#EA580C]" /> Anonymous Professional
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
                            {/* Chat Button for Accepted Bid */}
                            {canAccessChat && bid.status === 'ACCEPTED' && (
                              <button
                                type="button"
                                onClick={() => setChatOpen(true)}
                                className="inline-flex items-center gap-1.5 text-xs text-white bg-emerald-700 hover:bg-emerald-800 font-semibold transition-colors px-3 py-1.5 rounded-xl shadow-sm cursor-pointer"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                Chat
                              </button>
                            )}

                            {/* View Professional Profile Button */}
                            {identityRevealed && bid.professional_details?.id ? (
                              <Link
                                href={`/professionals/${bid.professional_details.id}`}
                                className="inline-flex items-center gap-1.5 text-xs text-[#EA580C] font-semibold hover:bg-[#EA580C] hover:text-[#FCFAF7] transition-colors border border-[#EA580C]/30 px-3 py-1.5 rounded-xl bg-white"
                              >
                                View Professional Profile <ArrowRight className="w-3 h-3" />
                              </Link>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] text-[#908078] bg-[#e8ddd6]/50 px-2.5 py-1 rounded-full">
                                <Lock className="w-3 h-3" /> Profile Locked
                              </span>
                            )}

                            <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border rounded-full ${bidStatusColors[bid.status] || 'bg-stone-50 text-stone-700'}`}>
                              {bid.status}
                            </span>
                          </div>
                        </div>

                        {/* Professional metrics row — always public */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#e8ddd6] border-t border-[#e8ddd6] text-xs">
                          <div className="bg-white px-4 py-3">
                            <p className="text-[#908078] uppercase tracking-wider text-[9px]">Proposal Amount</p>
                            <p className="font-serif text-base font-bold text-[#EA580C] mt-0.5">{fmt(bid.bid_amount)}</p>
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
                              <Lock className="w-4 h-4 text-[#EA580C] shrink-0" />
                              <span>Unlock this project (1 credit for all proposals) to reveal professional identity and accept this bid.</span>
                            </div>
                            {ticketStatus?.credits_remaining && ticketStatus.credits_remaining > 0 ? (
                              <button
                                onClick={handleUnlock}
                                disabled={unlocking}
                                className="bg-[#EA580C] text-white px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-[#C2410C] disabled:opacity-50 transition-colors shrink-0"
                              >
                                {unlocking ? "Unlocking..." : "Use 1 Credit Now"}
                              </button>
                            ) : (
                              <button
                                onClick={handlePurchaseAndUnlock}
                                disabled={purchasing}
                                className="bg-[#EA580C] text-white px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-[#C2410C] disabled:opacity-50 transition-colors shrink-0"
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

                        {/* Accepted Proposal Chat Footer */}
                        {bid.status === 'ACCEPTED' && (
                          <div className="px-5 sm:px-6 py-4 border-t border-emerald-200 bg-emerald-50/50 flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-xs text-emerald-950">
                              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span>
                                {canAccessChat
                                  ? "This bid has been accepted! You can now communicate directly via the private chat room."
                                  : "This proposal was accepted and awarded by the homeowner."}
                              </span>
                            </div>

                            {canAccessChat ? (
                              <button
                                type="button"
                                onClick={() => setChatOpen(true)}
                                className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
                              >
                                <MessageSquare className="w-4 h-4" />
                                Open Private Chat Room
                              </button>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs text-stone-500 bg-stone-100 px-3 py-1.5 border border-stone-200 rounded-full">
                                <Lock className="w-3.5 h-3.5 text-stone-400" />
                                Chat room is restricted to project parties
                              </span>
                            )}
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
            <div className="bg-white border border-[#e8ddd6] p-6 sm:p-8 rounded-2xl shadow-sm space-y-6">
              <div className="border-b border-[#e8ddd6] pb-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#EA580C] font-semibold">For Professionals</p>
                <h3 className="font-serif text-2xl text-[#1c1108]">Submit Proposal</h3>
              </div>
              
              {submitted ? (
                <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl text-center space-y-3">
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
                      className="w-full bg-[#FCFAF7] border border-[#c9b8b0] px-4 py-3 text-sm text-[#1c1108] placeholder-[#908078] focus:outline-none focus:border-[#EA580C] rounded-xl" 
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
                      className="w-full bg-[#FCFAF7] border border-[#c9b8b0] px-4 py-3 text-sm text-[#1c1108] placeholder-[#908078] focus:outline-none focus:border-[#EA580C] rounded-xl" 
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
                      className="w-full bg-[#FCFAF7] border border-[#e8ddd6] p-4 text-sm text-[#1c1108] placeholder-[#908078] focus:outline-none focus:border-[#EA580C] leading-relaxed rounded-xl" 
                      placeholder="Explain your approach, timeline, scope included, and past experience..."
                    />
                  </div>

                  {bidError && (
                    <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs space-y-2 text-rose-800">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{bidError}</span>
                      </div>
                      {bidNeedsMembership && (
                        <div className="pt-2 border-t border-rose-200/60">
                          <Link 
                            href="/dashboard/professional"
                            className="inline-block bg-[#EA580C] text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#C2410C] transition-colors"
                          >
                            Manage Professional Plan &rarr;
                          </Link>
                        </div>
                      )}
                    </div>
                  )}

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

      {/* ========================================================================= */}
      {/* PRIVATE CHAT ROOM MODAL                                                   */}
      {/* ========================================================================= */}
      {chatOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-6 animate-fadeIn">
          <div className="bg-[#FCFAF7] border border-[#322318] shadow-2xl w-full max-w-2xl h-[88vh] max-h-[750px] flex flex-col overflow-hidden relative rounded-3xl">
            
            {/* Chat Header */}
            <div className="bg-[#1c1108] text-[#FCFAF7] px-5 py-4 border-b border-[#322318] flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative shrink-0">
                  {counterpartImage ? (
                    <img 
                      src={counterpartImage} 
                      alt={counterpartName} 
                      className="w-10 h-10 object-cover border border-[#EA580C] rounded-xl" 
                    />
                  ) : (
                    <div className="w-10 h-10 bg-[#EA580C] text-white flex items-center justify-center font-serif text-sm font-bold rounded-xl">
                      {counterpartName.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-[#1c1108] rounded-full" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-serif text-base sm:text-lg text-[#FCFAF7] truncate">
                      {counterpartName}
                    </h3>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 bg-[#EA580C]/30 text-[#e8ddd6] border border-[#EA580C]/50 rounded-full">
                      {counterpartRole}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#c9b8b0] truncate max-w-md">
                    Re: {project?.title}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => fetchChat(false)}
                  title="Refresh messages"
                  className="w-8 h-8 flex items-center justify-center text-[#c9b8b0] hover:text-white transition-colors border border-stone-700 hover:border-stone-500 rounded-lg cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${chatLoading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={() => setChatOpen(false)}
                  title="Close chat"
                  className="w-8 h-8 flex items-center justify-center text-[#c9b8b0] hover:text-white transition-colors border border-stone-700 hover:border-stone-500 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Privacy & Project Info Bar */}
            <div className="bg-[#f2ece6] px-5 py-2.5 border-b border-[#e8ddd6] flex items-center justify-between text-xs text-[#606060] shrink-0 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Lock className="w-3.5 h-3.5 text-[#EA580C] shrink-0" />
                <span className="text-[11px] truncate">
                  Confidential 1-on-1 Room • Restricted strictly to Client &amp; Contractor
                </span>
              </div>
              {acceptedBid && (
                <div className="text-[11px] font-semibold text-[#EA580C] shrink-0">
                  Awarded: {fmt(acceptedBid.bid_amount)}
                </div>
              )}
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#FCFAF7]">
              {chatLoading && chatMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-stone-500 space-y-2">
                  <div className="inline-block animate-spin w-6 h-6 border-2 border-[#EA580C] border-t-transparent" />
                  <p className="text-xs">Loading secure message history...</p>
                </div>
              ) : chatMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                  <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center text-[#EA580C]">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <h4 className="font-serif text-lg text-[#1c1108]">Start the Conversation</h4>
                  <p className="text-xs text-[#606060] max-w-sm leading-relaxed">
                    Say hello! Coordinate site visits, schedule blueprints review, materials procurement, or project milestones in this private room.
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
                          <span className="text-[9px] uppercase px-2 py-0.5 bg-stone-200 text-stone-700 font-bold rounded-full">
                            {msg.sender_role}
                          </span>
                        )}
                        <span className="text-[9px] text-[#c9b8b0]">
                          {formatChatTime(msg.created_at)}
                        </span>
                      </div>

                      <div
                        className={`max-w-[82%] sm:max-w-[75%] px-4 py-3 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                          isMe
                            ? "bg-[#EA580C] text-white rounded-2xl rounded-tr-none shadow-sm"
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

            {/* Chat Input Bar */}
            <form
              onSubmit={handleSendMessage}
              className="p-3 sm:p-4 bg-white border-t border-[#e8ddd6] flex items-center gap-2 shrink-0"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type your message here... (Enter to send)"
                disabled={chatSending}
                className="flex-1 bg-[#FCFAF7] border border-[#c9b8b0] px-4 py-2.5 text-xs sm:text-sm text-[#1c1108] placeholder-[#908078] focus:outline-none focus:border-[#EA580C] rounded-xl transition-colors"
              />
              <button
                type="submit"
                disabled={chatSending || !chatInput.trim()}
                className="bg-[#EA580C] hover:bg-[#C2410C] disabled:opacity-50 text-white px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors shrink-0 shadow-sm cursor-pointer"
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
                <Shield className="w-3 h-3 text-[#EA580C] shrink-0" />
                <span>Phone numbers and emails sent in chat are automatically blurred for platform security.</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
