"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import DashboardShell from "../components/DashboardShell";
import { useAuth } from "../../../hooks/useAuth";
import { normalizeProfessionType } from "../utils";
import { 
  BadgeCheck, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  CreditCard,
  Crown,
  ChevronRight,
  X,
  MessageSquare
} from "lucide-react";

interface MembershipData {
  registration_fee_paid: boolean;
  registration_fee_paid_at: string | null;
  service_fee_plan: string;
  service_fee_status: string;
  service_fee_expires_at: string | null;
  is_service_active: boolean;
  is_verified: boolean;
  badge_expires_at: string | null;
  is_badge_active: boolean;
  catalog?: any[];
}

type ChatConversation = {
  project_id: number;
  project_title: string;
  project_status: string;
  location: string;
  accepted_bid: {
    id: number;
    bid_amount: string;
    estimated_days: number;
  };
  counterpart: {
    id: number;
    name: string;
    role: string;
    company_name: string;
    profile_image?: string | null;
  };
  last_message?: {
    id: number;
    message: string;
    sender_name: string;
    is_me: boolean;
    is_read: boolean;
    created_at: string;
  } | null;
  unread_count: number;
  last_activity_time: string;
};

export default function ProfessionalDashboard() {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000/api";

  const [professionType, setProfessionType] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [bids, setBids] = useState<any[]>([]);
  const [bidsLoading, setBidsLoading] = useState(true);

  // Chat conversations state
  const [chats, setChats] = useState<ChatConversation[]>([]);
  const [chatsLoading, setChatsLoading] = useState(true);

  // Membership & Plans state
  const [membership, setMembership] = useState<MembershipData | null>(null);
  const [showPlansModal, setShowPlansModal] = useState(false);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [planSuccessMsg, setPlanSuccessMsg] = useState<string | null>(null);

  const fetchMembership = async (token: string) => {
    try {
      const res = await fetch(`${backendUrl}/users/professional/membership/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMembership(data);
      }
    } catch (err) {
      console.error("Failed to load membership", err);
    }
  };

  const loadData = async () => {
    if (loading) return;

    if (!user) {
      setIsLoading(false);
      setBidsLoading(false);
      setChatsLoading(false);
      return;
    }

    try {
      const token = await user.getIdToken();
      
      // 1. Fetch user role
      const profileRes = await fetch(`${backendUrl}/users/auth/verify/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const profileResult = await profileRes.json();
      if (profileRes.ok && profileResult?.user) {
        setProfessionType(normalizeProfessionType(profileResult.user.professional_profile?.profession_type) || null);
      }

      // 2. Fetch membership details
      await fetchMembership(token);

      // 3. Fetch professional bids
      const bidsRes = await fetch(`${backendUrl}/bidding/bids/`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      if (bidsRes.ok) {
        const bidsData = await bidsRes.json();
        setBids(bidsData);
      }

      // 4. Fetch client conversations
      const chatsRes = await fetch(`${backendUrl}/bidding/chats/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (chatsRes.ok) {
        const chatsData = await chatsRes.json();
        setChats(chatsData.conversations || []);
      }
    } catch (error) {
      console.error("Failed to load dashboard data", error);
    } finally {
      setIsLoading(false);
      setBidsLoading(false);
      setChatsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [backendUrl, loading, user]);

  const handlePayRegistration = async () => {
    if (!user) return;
    setProcessingPlan("REGISTRATION");
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${backendUrl}/users/professional/pay-registration/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ transaction_ref: "MOCK_PAYMENT" })
      });
      if (res.ok) {
        setPlanSuccessMsg("Registration fee of LKR 1,000 paid successfully!");
        await fetchMembership(token);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to process payment");
      }
    } finally {
      setProcessingPlan(null);
    }
  };

  const handleSubscribe = async (planKey: string) => {
    if (!user) return;
    setProcessingPlan(planKey);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${backendUrl}/users/professional/subscribe/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          plan: planKey,
          transaction_ref: "MOCK_PAYMENT"
        })
      });
      if (res.ok) {
        setPlanSuccessMsg(`Successfully subscribed to ${planKey}!`);
        await fetchMembership(token);
        setTimeout(() => setShowPlansModal(false), 1200);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to subscribe");
      }
    } finally {
      setProcessingPlan(null);
    }
  };

  const handleBuyBadge = async () => {
    if (!user) return;
    setProcessingPlan("BADGE");
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${backendUrl}/users/professional/buy-badge/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ transaction_ref: "MOCK_PAYMENT" })
      });
      if (res.ok) {
        setPlanSuccessMsg("Verified Badge purchased for LKR 1,000 (1 Year)!");
        await fetchMembership(token);
        setTimeout(() => setShowPlansModal(false), 1200);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to buy badge");
      }
    } finally {
      setProcessingPlan(null);
    }
  };

  const isHardware = professionType === "HARDWARE";
  const navItems = [
    {
      label: "Overview",
      href: "/dashboard/professional",
      description: "Dashboard summary",
      isActive: pathname === "/dashboard/professional",
    },
    {
      label: "Client Chats",
      href: "/dashboard/professional#chats",
      description: "Direct client messaging",
      isActive: pathname.includes("#chats"),
    },
    {
      label: "Public Profile",
      href: "/profile",
      description: "Update your public profile",
      isActive: pathname === "/profile",
    },
    ...(isHardware
      ? [
          {
            label: "Manage Shops",
            href: "/dashboard/hardware/shops",
            description: "Add or update shop locations",
            isActive: pathname === "/dashboard/hardware/shops",
          },
        ]
      : []),
    {
      label: "Pending Requests",
      href: "/dashboard/requests",
      description: "New inquiries and tasks",
      isActive: pathname === "/dashboard/requests",
    },
    {
      label: "Profile Settings",
      href: "/settings",
      description: "Account preferences",
      isActive: pathname === "/settings",
    },
  ];

  const activeBidsCount = bids.filter((bid: any) => bid.status === 'PENDING').length;
  const jobsWonCount = bids.filter((bid: any) => bid.status === 'ACCEPTED').length;

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6 py-24">
        <div className="text-stone-600 text-sm">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <DashboardShell navItems={navItems}>
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between pb-8 border-b border-stone-200 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <p className="text-[#8B4434] font-semibold tracking-widest uppercase text-xs">Professional Dashboard</p>
            {membership?.is_badge_active && (
              <span className="inline-flex items-center gap-1 bg-[#8B4434] text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 shadow-sm">
                <BadgeCheck className="w-3 h-3" /> Verified Partner
              </span>
            )}
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-stone-900">Welcome, {user?.displayName || 'Partner'}</h1>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowPlansModal(true)}
            className="btn-primary bg-[#8B4434] hover:bg-[#723628] text-white text-xs uppercase tracking-wider py-3 px-5 flex items-center gap-2 shadow-sm"
          >
            <Crown className="w-4 h-4 text-amber-300" />
            <span>Membership &amp; Plans</span>
          </button>
          <Link href="/profile" className="btn-secondary border-stone-300 text-xs uppercase tracking-wider py-3 px-5">
            Public Profile
          </Link>
        </div>
      </header>

      {/* Registration Fee Pending Alert Banner */}
      {membership && !membership.registration_fee_paid && (
        <div className="mt-6 p-5 bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-700" />
              <h4 className="font-semibold text-sm">One-Time Registration Fee Required</h4>
            </div>
            <p className="text-xs text-amber-800">
              Pay the one-time registration fee of <strong>LKR 1,000</strong> to activate your contractor capabilities and submit project bids.
            </p>
          </div>
          <button
            onClick={handlePayRegistration}
            disabled={processingPlan === "REGISTRATION"}
            className="bg-[#8B4434] text-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-[#723628] transition-colors whitespace-nowrap self-start sm:self-auto"
          >
            {processingPlan === "REGISTRATION" ? "Activating..." : "Pay LKR 1,000 Now"}
          </button>
        </div>
      )}

      {/* Membership & Subscription Overview Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-8">
        {/* Service Fee Status Card */}
        <div className="bg-white border border-[#efe6df] p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#8B4434]">Service Fee Status</span>
              <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${membership?.is_service_active ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-stone-100 text-stone-600'}`}>
                {membership?.is_service_active ? 'ACTIVE' : 'INACTIVE'}
              </span>
            </div>
            <h3 className="font-serif text-xl text-stone-900">
              {membership?.service_fee_plan === 'MONTHLY' ? 'Monthly Plan (LKR 500/mo)' :
               membership?.service_fee_plan === 'YEARLY' ? 'Yearly Plan (LKR 5,000/yr)' :
               membership?.service_fee_plan === 'PRO_MONTHLY' ? 'Pro Monthly (LKR 550/mo)' :
               membership?.service_fee_plan === 'PRO_YEARLY' ? 'Pro Yearly (LKR 5,000/yr)' :
               'No Active Plan'}
            </h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              {membership?.is_service_active && membership.service_fee_expires_at ? (
                <>Active until {new Date(membership.service_fee_expires_at).toLocaleDateString('en-LK', { year: 'numeric', month: 'short', day: 'numeric' })}</>
              ) : (
                <>Subscribe to submit bids on open tenders and maintain priority directory ranking.</>
              )}
            </p>
          </div>
          <button
            onClick={() => setShowPlansModal(true)}
            className="w-full bg-[#FCFAF7] border border-[#e8ddd6] text-[#1c1108] hover:border-[#8B4434] py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5"
          >
            <span>{membership?.is_service_active ? 'Manage Plan' : 'Subscribe (from LKR 500/mo)'}</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#8B4434]" />
          </button>
        </div>

        {/* Verified Badge Card */}
        <div className="bg-white border border-[#efe6df] p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#8B4434]">Trust Verification</span>
              <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${membership?.is_badge_active ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-stone-100 text-stone-600'}`}>
                {membership?.is_badge_active ? 'VERIFIED' : 'UNVERIFIED'}
              </span>
            </div>
            <h3 className="font-serif text-xl text-stone-900 flex items-center gap-1.5">
              <span>Verified Badge</span>
              {membership?.is_badge_active && <BadgeCheck className="w-5 h-5 text-[#8B4434]" />}
            </h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              {membership?.is_badge_active && membership.badge_expires_at ? (
                <>Verified partner trust badge active until {new Date(membership.badge_expires_at).toLocaleDateString('en-LK', { year: 'numeric', month: 'short', day: 'numeric' })}</>
              ) : (
                <>Get the official Verified partner badge for LKR 1,000/yr or get it FREE with the annual Pro Plan.</>
              )}
            </p>
          </div>
          <button
            onClick={() => setShowPlansModal(true)}
            className="w-full bg-[#FCFAF7] border border-[#e8ddd6] text-[#1c1108] hover:border-[#8B4434] py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5"
          >
            <span>{membership?.is_badge_active ? 'Badge Details' : 'Get Verified (LKR 1,000/yr)'}</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#8B4434]" />
          </button>
        </div>

        {/* Pro Plan Feature Card */}
        <div className="bg-[#1c1108] text-[#FCFAF7] border border-[#322318] p-6 shadow-sm flex flex-col justify-between space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-[#8B4434] text-white text-[9px] font-bold uppercase tracking-widest px-3 py-1">
            Best Value
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-amber-400">
              <Crown className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Pro Membership</span>
            </div>
            <h3 className="font-serif text-xl text-white">All-In-One Pro Plan</h3>
            <p className="text-xs text-[#c9b8b0] leading-relaxed">
              Includes full 1-year service fee + Verified Badge 100% FREE (LKR 5,000/year — Save LKR 2,000!).
            </p>
          </div>
          <button
            onClick={() => setShowPlansModal(true)}
            className="w-full bg-[#8B4434] text-white hover:bg-[#723628] py-2.5 text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>View Pro Deals</span>
          </button>
        </div>
      </section>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6 mt-8">
        <div className="card-luxury flex flex-col justify-center items-center text-center py-8">
          <span className="text-4xl font-serif text-stone-900">
            {bidsLoading ? "..." : activeBidsCount}
          </span>
          <span className="text-sm text-stone-500 mt-2 uppercase tracking-wider">Active Bids</span>
        </div>
        <div className="card-luxury flex flex-col justify-center items-center text-center py-8">
          <span className="text-4xl font-serif text-stone-900">
            {bidsLoading ? "..." : jobsWonCount}
          </span>
          <span className="text-sm text-stone-500 mt-2 uppercase tracking-wider">Jobs Won</span>
        </div>
        <div className="card-luxury flex flex-col justify-center items-center text-center py-8">
          <span className="text-4xl font-serif text-stone-900">
            {membership?.registration_fee_paid ? "Active" : "Pending"}
          </span>
          <span className="text-sm text-stone-500 mt-2 uppercase tracking-wider">Account Status</span>
        </div>
        <Link 
          href="/bidding" 
          className="card-luxury flex flex-col justify-center items-center text-center py-8 bg-[#8B4434] text-[#FCFAF7] border-transparent hover:bg-[#6c3426] transition-colors cursor-pointer"
        >
          <span className="text-xl font-serif mb-2 text-[#FCFAF7]">Find Work</span>
          <span className="text-sm text-[#FCFAF7]/70 uppercase tracking-wider">Open public bids →</span>
        </Link>
      </div>

      {/* Client Messages & Project Chats Section */}
      <section id="chats" className="bg-white border border-[#efe6df] rounded-none p-6 shadow-sm mt-8 scroll-mt-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#efe6df] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xs uppercase tracking-widest text-[#8B4434]/60 font-semibold">Direct Communication</p>
              {chats.reduce((acc, c) => acc + (c.unread_count || 0), 0) > 0 && (
                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-300 text-[10px] font-bold px-2 py-0.5 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  {chats.reduce((acc, c) => acc + (c.unread_count || 0), 0)} New Message{chats.reduce((acc, c) => acc + (c.unread_count || 0), 0) !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <h2 className="font-serif text-2xl text-[#281713]">Client Messages &amp; Chats</h2>
          </div>
          <p className="text-sm text-stone-500 max-w-sm text-right">
            Private 1-on-1 rooms for projects where your proposal was accepted by the client.
          </p>
        </div>

        {chatsLoading ? (
          <div className="py-8 text-center text-xs text-stone-500">
            <div className="inline-block animate-spin w-6 h-6 border-2 border-[#8B4434] border-t-transparent mb-2" />
            <p>Loading client conversations...</p>
          </div>
        ) : chats.length === 0 ? (
          <div className="rounded-none border border-dashed border-[#efe6df] p-8 text-center space-y-3 bg-[#FCFAF7]">
            <MessageSquare className="w-8 h-8 text-[#8B4434]/40 mx-auto" />
            <p className="text-sm font-serif text-[#281713]">No active client chats yet</p>
            <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
              When a client accepts your bid on an open tender, your private project chat room will appear here automatically.
            </p>
            <Link
              href="/bidding"
              className="inline-flex items-center gap-2 bg-[#8B4434] text-white text-xs px-5 py-2.5 mt-2 uppercase tracking-wider font-semibold hover:bg-[#723628] transition-colors"
            >
              Find Projects to Bid On &rarr;
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {chats.map((chat) => {
              const counterpartInitials = chat.counterpart?.name
                ? chat.counterpart.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
                : "CL";
              const lastMsgTime = chat.last_message?.created_at
                ? new Date(chat.last_message.created_at).toLocaleDateString("en-LK", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : new Date(chat.last_activity_time).toLocaleDateString("en-LK", { month: "short", day: "numeric" });

              return (
                <div
                  key={chat.project_id}
                  className={`flex flex-col md:flex-row md:items-center justify-between gap-4 border p-5 transition-all bg-[#FCFAF7] ${
                    chat.unread_count > 0 ? "border-emerald-500 ring-1 ring-emerald-500 bg-emerald-50/20" : "border-[#efe6df] hover:border-[#8B4434]/40"
                  }`}
                >
                  <div className="flex items-start gap-4 min-w-0">
                    {/* Client Avatar with Unread Badge */}
                    <div className="relative shrink-0 mt-0.5">
                      {chat.counterpart?.profile_image ? (
                        <img
                          src={chat.counterpart.profile_image}
                          alt={chat.counterpart.name}
                          className="w-12 h-12 object-cover border border-[#8B4434]/20"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-[#1c1108] text-[#FCFAF7] font-serif text-sm font-semibold flex items-center justify-center">
                          {counterpartInitials}
                        </div>
                      )}
                      {chat.unread_count > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border border-white"></span>
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-base text-[#281713]">
                          {chat.counterpart?.name}
                        </span>
                        <span className="px-2 py-0.5 text-[9px] uppercase tracking-wider font-bold bg-amber-100 text-amber-900 border border-amber-200">
                          Project Client
                        </span>
                        {chat.location && (
                          <span className="text-[11px] text-stone-500">
                            &bull; {chat.location}
                          </span>
                        )}
                      </div>

                      <p className="text-xs font-semibold text-[#8B4434] truncate">
                        {chat.project_title}
                        {chat.accepted_bid?.bid_amount && (
                          <span className="text-stone-500 font-normal ml-2">
                            (Awarded: LKR {Number(chat.accepted_bid.bid_amount).toLocaleString()} &bull; {chat.accepted_bid.estimated_days} Days)
                          </span>
                        )}
                      </p>

                      {/* Last Message Snippet */}
                      <p className="text-xs text-stone-600 line-clamp-1">
                        {chat.last_message ? (
                          <>
                            <span className="font-semibold text-stone-800">
                              {chat.last_message.is_me ? "You: " : `${chat.counterpart.name.split(" ")[0]}: `}
                            </span>
                            "{chat.last_message.message}"
                          </>
                        ) : (
                          <span className="italic text-stone-400">No messages yet. Click to chat with client.</span>
                        )}
                      </p>

                      <p className="text-[10px] text-stone-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-stone-400" />
                        {lastMsgTime}
                      </p>
                    </div>
                  </div>

                  {/* Actions Right */}
                  <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                    {chat.unread_count > 0 && (
                      <span className="bg-emerald-600 text-white text-xs font-bold px-2.5 py-1 uppercase tracking-wider rounded-none animate-pulse">
                        {chat.unread_count} Unread
                      </span>
                    )}
                    <Link
                      href={`/bidding/${chat.project_id}?chat=open`}
                      className="inline-flex items-center gap-2 bg-[#8B4434] hover:bg-[#6f3829] text-white px-5 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Open Chat
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Bidding History Section */}
      <section className="bg-white border border-[#efe6df] rounded-none p-6 shadow-sm mt-8">
        <div className="flex items-start justify-between gap-4 border-b border-[#efe6df] pb-4 mb-5">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#8B4434]/60">Bidding History</p>
            <h2 className="font-serif text-2xl text-[#281713]">My Applied Proposals</h2>
          </div>
          <p className="text-sm text-stone-500 max-w-sm text-right">
            Track and monitor the status of proposals you have submitted to homeowners.
          </p>
        </div>

        {bidsLoading ? (
          <p className="text-sm text-stone-500">Loading applied bids...</p>
        ) : bids.length === 0 ? (
          <div className="rounded-none border border-dashed border-[#efe6df] p-8 text-center text-sm text-stone-500">
            You haven't submitted any bids yet. Go to the Bidding Feed to find active tenders.
          </div>
        ) : (
          <div className="space-y-4">
            {bids.map((bid) => {
              const statusColors: any = {
                'PENDING': 'bg-amber-50 text-amber-700 border border-amber-200',
                'ACCEPTED': 'bg-green-50 text-green-700 border border-green-200',
                'REJECTED': 'bg-rose-50 text-rose-700 border border-rose-200'
              };
              
              return (
                <div key={bid.id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border border-[#efe6df] bg-[#FCFAF7] px-5 py-4">
                  <div className="space-y-1">
                    <p className="font-semibold text-[#281713] text-lg">{bid.project_title || `Project #${bid.project}`}</p>
                    <p className="text-sm text-stone-500">
                      Bid Amount: <span className="font-semibold text-orange-600">LKR {Number(bid.bid_amount).toLocaleString('en-LK')}</span> &bull; Estimated: <span className="font-semibold text-stone-800">{bid.estimated_days} Days</span>
                    </p>
                    <p className="text-xs text-stone-400">
                      Submitted on {new Date(bid.created_at).toLocaleDateString('en-LK')}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-0.5 text-xs font-semibold uppercase ${statusColors[bid.status] || 'bg-stone-50 text-stone-500'}`}>
                      {bid.status}
                    </span>
                    {bid.status === 'ACCEPTED' && (
                      <Link
                        href={`/bidding/${bid.project}?chat=open`}
                        className="inline-flex items-center gap-1.5 justify-center bg-emerald-700 px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-white hover:bg-emerald-800 transition-colors shadow-sm"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Chat with Client
                      </Link>
                    )}
                    <Link
                      href={`/bidding/${bid.project}`}
                      className="inline-flex items-center justify-center bg-[#8B4434] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white hover:bg-[#6f3829] transition-colors"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Membership & Plans Modal */}
      {showPlansModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
          <div className="bg-white max-w-4xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-stone-200 my-8">
            <div className="flex items-center justify-between border-b border-stone-200 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#8B4434]">Professional Plans</span>
                <h3 className="font-serif text-2xl sm:text-3xl text-stone-900">Service Fees &amp; Verified Badge</h3>
              </div>
              <button 
                onClick={() => { setShowPlansModal(false); setPlanSuccessMsg(null); }}
                className="w-8 h-8 flex items-center justify-center text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {planSuccessMsg && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{planSuccessMsg}</span>
              </div>
            )}

            {/* Registration Fee status if not paid */}
            {membership && !membership.registration_fee_paid && (
              <div className="p-4 bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <p className="font-bold text-amber-900">Professional Registration Fee Pending</p>
                  <p className="text-amber-800 text-[11px]">One-time fee of LKR 1,000 required before bidding.</p>
                </div>
                <button
                  onClick={handlePayRegistration}
                  disabled={processingPlan === "REGISTRATION"}
                  className="bg-[#8B4434] text-white px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-[#723628] disabled:opacity-70"
                >
                  {processingPlan === "REGISTRATION" ? "Paying..." : "Pay LKR 1,000"}
                </button>
              </div>
            )}

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Monthly Service Plan */}
              <div className="border border-stone-200 p-5 flex flex-col justify-between space-y-4 hover:border-[#8B4434] transition-all bg-[#FCFAF7]">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#8B4434]">Monthly Plan</span>
                  <h4 className="font-serif text-lg text-stone-900">Service Fee</h4>
                  <p className="font-serif text-2xl text-[#8B4434]">LKR 500 <span className="text-xs font-sans text-stone-500">/mo</span></p>
                  <p className="text-xs text-stone-500">
                    Bidding access on all client tenders and active professional directory listing.
                  </p>
                </div>
                <button
                  onClick={() => handleSubscribe("MONTHLY")}
                  disabled={Boolean(processingPlan)}
                  className="w-full bg-[#8B4434] text-white py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-[#723628] disabled:opacity-70 transition-colors"
                >
                  {processingPlan === "MONTHLY" ? "Processing..." : "Select Monthly"}
                </button>
              </div>

              {/* Yearly Service Plan (Discounted) */}
              <div className="border border-stone-200 p-5 flex flex-col justify-between space-y-4 hover:border-[#8B4434] transition-all bg-[#FCFAF7] relative">
                <div className="absolute -top-2.5 right-3 bg-emerald-700 text-white text-[9px] font-bold uppercase tracking-widest px-2 py-0.5">
                  2 Months Free
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#8B4434]">Yearly Plan</span>
                  <h4 className="font-serif text-lg text-stone-900">Service Fee</h4>
                  <p className="font-serif text-2xl text-[#8B4434]">LKR 5,000 <span className="text-xs font-sans text-stone-500">/yr</span></p>
                  <p className="text-xs text-stone-500">
                    Full annual bidding access. Save LKR 1,000 compared to paying monthly!
                  </p>
                </div>
                <button
                  onClick={() => handleSubscribe("YEARLY")}
                  disabled={Boolean(processingPlan)}
                  className="w-full bg-[#8B4434] text-white py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-[#723628] disabled:opacity-70 transition-colors"
                >
                  {processingPlan === "YEARLY" ? "Processing..." : "Select Yearly"}
                </button>
              </div>

              {/* Verified Badge Standalone */}
              <div className="border border-stone-200 p-5 flex flex-col justify-between space-y-4 hover:border-[#8B4434] transition-all bg-[#FCFAF7]">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#8B4434]">Trust Seal</span>
                  <h4 className="font-serif text-lg text-stone-900">Verified Badge</h4>
                  <p className="font-serif text-2xl text-[#8B4434]">LKR 1,000 <span className="text-xs font-sans text-stone-500">/yr</span></p>
                  <p className="text-xs text-stone-500">
                    Official verified partner badge displayed on your profile, proposals, and directory search.
                  </p>
                </div>
                <button
                  onClick={handleBuyBadge}
                  disabled={Boolean(processingPlan)}
                  className="w-full bg-[#1c1108] text-white py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-[#322318] disabled:opacity-70 transition-colors"
                >
                  {processingPlan === "BADGE" ? "Processing..." : "Get Badge"}
                </button>
              </div>

              {/* Pro Plan Bundle (Best Value) */}
              <div className="border-2 border-[#8B4434] p-5 flex flex-col justify-between space-y-4 bg-[#8B4434]/5 relative shadow-md">
                <div className="absolute -top-3 right-3 bg-[#8B4434] text-white text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5">
                  Save LKR 2,000
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-1 text-amber-600">
                    <Crown className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Pro Bundle</span>
                  </div>
                  <h4 className="font-serif text-lg text-[#1c1108]">Pro Annual Plan</h4>
                  <p className="font-serif text-2xl text-[#8B4434]">LKR 5,000 <span className="text-xs font-sans text-stone-500">/yr</span></p>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Includes <strong>Annual Service Fee</strong> + <strong>Verified Badge</strong> completely FREE!
                  </p>
                </div>
                <button
                  onClick={() => handleSubscribe("PRO_YEARLY")}
                  disabled={Boolean(processingPlan)}
                  className="w-full bg-[#8B4434] text-white py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-[#723628] disabled:opacity-70 transition-colors shadow-sm"
                >
                  {processingPlan === "PRO_YEARLY" ? "Activating Pro..." : "Get Pro Plan"}
                </button>
              </div>
            </div>

            <div className="border-t border-stone-200 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-stone-500">
              <p>Demo Mode: Payments are instantly verified and recorded to your account.</p>
              <button 
                onClick={() => setShowPlansModal(false)}
                className="text-[#8B4434] font-semibold hover:underline"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}