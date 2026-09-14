"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "../../hooks/useAuth";
import { 
  Ticket, CheckCircle2, Clock, Package, ArrowRight, ShieldCheck, 
  Plus, Sparkles, Calculator, UserCheck, Flame, Zap
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

interface Bundle {
  id: number;
  ticket_type?: string;
  ticket_type_display?: string;
  status: string;
  unlocks_total: number;
  unlocks_used: number;
  unlocks_remaining: number;
  price_paid: string;
  purchased_at: string;
}

export default function MyTicketsPage() {
  const { user } = useAuth();
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [biddingCredits, setBiddingCredits] = useState(0);
  const [qsCredits, setQsCredits] = useState(0);
  const [totalCredits, setTotalCredits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const bundleRes = await fetch(`${API_BASE_URL}/bidding/tickets/my/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (bundleRes.ok) {
        const data = await bundleRes.json();
        setBundles(data.bundles || []);
        setBiddingCredits(data.bidding_credits_remaining || 0);
        setQsCredits(data.qs_credits_remaining || 0);
        setTotalCredits(data.total_credits_remaining || 0);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handlePurchase = async (ticketType: 'BIDDING' | 'QS' | 'PRO_STARTER' | 'PRO_MASTER', quantity: number = 1) => {
    if (!user) return;
    setPurchasing(true);
    setSelectedPlan(ticketType);
    setPurchaseSuccess(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${API_BASE_URL}/bidding/tickets/purchase/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          ticket_type: ticketType,
          quantity,
          transaction_ref: "MOCK_PAYMENT" 
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setPurchaseSuccess(data.message || "Tickets purchased successfully!");
        fetchData();
        window.dispatchEvent(new Event("ticketsUpdated"));
      } else {
        const err = await res.json();
        alert(err.error || "Failed to complete ticket purchase.");
      }
    } finally {
      setPurchasing(false);
      setSelectedPlan(null);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FCFAF7] flex flex-col items-center justify-center gap-4 text-[#1c1108]">
        <p className="font-serif text-2xl">Login Required</p>
        <p className="text-xs text-[#606060]">Please sign in to manage your tickets and pro plans.</p>
        <Link href="/login?redirect=/tickets" className="bg-[#8B4434] text-[#FCFAF7] px-6 py-2.5 text-xs font-semibold uppercase tracking-widest hover:bg-[#723628] transition-colors">
          Go to Login
        </Link>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    ACTIVE: "bg-emerald-50 text-emerald-800 border-emerald-200",
    EXHAUSTED: "bg-stone-100 text-stone-600 border-stone-300",
    EXPIRED: "bg-rose-50 text-rose-800 border-rose-200",
  };

  return (
    <div className="min-h-screen bg-[#FCFAF7] text-[#1c1108]">
      {/* Hero Header */}
      <div className="bg-[#1c1108] text-[#FCFAF7] py-14 px-4 sm:px-6 lg:px-8 border-b border-[#322318]">
        <div className="max-w-5xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 bg-[#8B4434]/20 border border-[#8B4434]/40 px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-[#FCFAF7] font-semibold">
            <Ticket className="w-3 h-3 text-[#8B4434]" /> Client Tickets &amp; Pro Plans
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl">Tickets &amp; Consultation Plans</h1>
          <p className="text-[#c9b8b0] text-sm max-w-2xl leading-relaxed">
            Publish competitive tenders for contractor bidding with <strong>Bidding Tickets</strong>, or connect directly with certified Quantity Surveyors for BOQ reviews with <strong>QS Tickets</strong>. Save more with our bundled <strong>Pro Plans</strong>.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        {/* Credits Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Bidding Credits */}
          <div className="bg-[#1c1108] text-[#FCFAF7] p-7 space-y-2 border border-[#322318] shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#8B4434] font-semibold">Bidding Tickets</p>
              <Ticket className="w-4 h-4 text-[#8B4434]/60" />
            </div>
            <p className="font-serif text-5xl text-white">{biddingCredits}</p>
            <p className="text-xs text-[#908078]">tender post credit{biddingCredits !== 1 ? 's' : ''} available</p>
          </div>
          
          {/* QS Credits */}
          <div className="bg-white border border-[#e8ddd6] p-7 space-y-2 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#8B4434] font-semibold">QS Tickets</p>
              <Calculator className="w-4 h-4 text-[#8B4434]" />
            </div>
            <p className="font-serif text-5xl text-[#8B4434]">{qsCredits}</p>
            <p className="text-xs text-[#908078]">Quantity Surveyor consultation credit{qsCredits !== 1 ? 's' : ''}</p>
          </div>

          {/* Quick Action */}
          <div className="bg-[#8B4434]/5 border border-[#8B4434]/20 p-7 space-y-3 flex flex-col justify-between shadow-sm">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#8B4434] font-semibold">Need Assistance?</p>
              <p className="text-xs text-[#606060] mt-1">Consult a certified QS to verify project cost estimates or launch a new bidding tender.</p>
            </div>
            <div className="flex flex-col gap-2">
              <Link
                href="/professionals?profession=QS"
                className="inline-flex items-center justify-center gap-1.5 bg-[#1c1108] text-white px-4 py-2 text-[11px] font-semibold uppercase tracking-wider hover:bg-[#322318] transition-colors text-center"
              >
                <UserCheck className="w-3.5 h-3.5" /> Find a Quantity Surveyor
              </Link>
              <Link
                href="/estimation"
                className="inline-flex items-center justify-center gap-1.5 bg-[#8B4434] text-white px-4 py-2 text-[11px] font-semibold uppercase tracking-wider hover:bg-[#723628] transition-colors text-center"
              >
                <Plus className="w-3.5 h-3.5" /> Post New Tender
              </Link>
            </div>
          </div>
        </div>

        {/* ── FEATURED: TICKET PRO PLANS ── */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-[#e8ddd6] pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#8B4434] mb-1">
                <Sparkles className="w-4 h-4 text-[#8B4434]" /> Pro Plans for Tickets
              </div>
              <h2 className="font-serif text-3xl text-[#1c1108]">Best Value Combo Bundles</h2>
              <p className="text-xs text-[#606060] mt-1">
                Combine Bidding tender posts and Quantity Surveyor consultations at discounted rates.
              </p>
            </div>
            <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 self-start sm:self-auto">
              Save up to LKR 2,500
            </span>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {/* Starter Pro Plan */}
            <div className="border-2 border-[#8B4434] bg-white p-7 flex flex-col justify-between gap-6 relative shadow-md">
              <div className="absolute -top-3 right-6 bg-[#8B4434] text-white text-[9px] font-bold uppercase tracking-widest px-3 py-1 shadow-sm">
                Save LKR 500
              </div>
              <div className="space-y-3">
                <span className="text-[10px] uppercase tracking-widest text-[#8B4434] font-bold">Recommended for Homeowners</span>
                <h3 className="font-serif text-3xl text-[#1c1108]">Starter Pro Plan</h3>
                <p className="text-xs text-[#606060] leading-relaxed">
                  The essential package for starting your build: have a Quantity Surveyor audit your estimate, then publish your tender for competitive contractor bids.
                </p>
                <ul className="pt-3 border-t border-[#e8ddd6] space-y-2 text-xs text-[#3a2820]">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span><strong>1 Bidding Ticket</strong> (Publish tender to contractors)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span><strong>1 QS Ticket</strong> (Direct Quantity Surveyor consultation)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Instant credit activation &bull; Never expires</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6 border-t border-[#e8ddd6] space-y-4">
                <div className="flex items-baseline justify-between">
                  <div>
                    <p className="font-serif text-3xl text-[#8B4434]">LKR 3,500</p>
                    <p className="text-[10px] text-[#908078] line-through">Standard Value LKR 4,000</p>
                  </div>
                  <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 border border-emerald-200">
                    Save LKR 500
                  </span>
                </div>
                <button
                  onClick={() => handlePurchase('PRO_STARTER')}
                  disabled={purchasing}
                  className="w-full bg-[#8B4434] text-white py-3.5 text-xs font-bold uppercase tracking-widest hover:bg-[#723628] disabled:opacity-70 transition-colors shadow-sm cursor-pointer"
                >
                  {purchasing && selectedPlan === 'PRO_STARTER' ? "Processing..." : "Buy Starter Pro Plan"}
                </button>
              </div>
            </div>

            {/* Master Builder Pro Plan */}
            <div className="border-2 border-[#1c1108] bg-[#1c1108] text-white p-7 flex flex-col justify-between gap-6 relative shadow-lg">
              <div className="absolute -top-3 right-6 bg-emerald-600 text-white text-[9px] font-bold uppercase tracking-widest px-3 py-1 shadow-sm">
                Save LKR 2,500
              </div>
              <div className="space-y-3">
                <span className="text-[10px] uppercase tracking-widest text-[#8B4434] font-bold">Multi-Stage Construction</span>
                <h3 className="font-serif text-3xl text-white">Master Pro Plan</h3>
                <p className="text-xs text-[#c9b8b0] leading-relaxed">
                  Complete suite for complete home construction or multi-unit developments requiring phased tenders and thorough QS cost engineering.
                </p>
                <ul className="pt-3 border-t border-[#322318] space-y-2 text-xs text-[#FCFAF7]/90">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>3 Bidding Tickets</strong> (Structural, MEP, Finishing tenders)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>2 QS Tickets</strong> (Multiple Quantity Surveyor evaluations)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Priority platform support &bull; Never expires</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6 border-t border-[#322318] space-y-4">
                <div className="flex items-baseline justify-between">
                  <div>
                    <p className="font-serif text-3xl text-white">LKR 7,000</p>
                    <p className="text-[10px] text-[#908078] line-through">Standard Value LKR 9,500</p>
                  </div>
                  <span className="text-xs text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 border border-emerald-800">
                    Save LKR 2,500
                  </span>
                </div>
                <button
                  onClick={() => handlePurchase('PRO_MASTER')}
                  disabled={purchasing}
                  className="w-full bg-[#8B4434] text-white py-3.5 text-xs font-bold uppercase tracking-widest hover:bg-[#a04e3c] disabled:opacity-70 transition-colors shadow-sm cursor-pointer"
                >
                  {purchasing && selectedPlan === 'PRO_MASTER' ? "Processing..." : "Buy Master Pro Plan"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── STANDARD INDIVIDUAL TICKETS ── */}
        <div className="bg-white border border-[#e8ddd6] p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="border-b border-[#e8ddd6] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="font-serif text-2xl text-[#1c1108]">Individual Ticket Types</h2>
              <p className="text-[#606060] text-xs mt-1">
                Purchase single or multiple tickets as needed for your project.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-3 py-1 self-start sm:self-auto">
              <ShieldCheck className="w-3.5 h-3.5" /> Instant Activation
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* 1 Bidding Ticket */}
            <div className="p-6 border border-[#e8ddd6] hover:border-[#8B4434]/50 flex flex-col justify-between gap-5 transition-all bg-[#FCFAF7]/40">
              <div className="space-y-2">
                <span className="text-[10px] uppercase tracking-widest text-[#8B4434] font-bold">Tender Publishing</span>
                <h3 className="font-serif text-xl text-[#1c1108]">1 Bidding Ticket</h3>
                <p className="text-xs text-[#606060] leading-relaxed">
                  Required to publish 1 project tender for competitive contractor proposals.
                </p>
              </div>
              <div className="space-y-4 pt-4 border-t border-[#e8ddd6]">
                <div>
                  <p className="font-serif text-2xl text-[#8B4434]">LKR 1,500</p>
                  <p className="text-[10px] text-[#908078]">1 project post credit</p>
                </div>
                <button
                  onClick={() => handlePurchase('BIDDING', 1)}
                  disabled={purchasing}
                  className="w-full bg-[#1c1108] text-white py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-[#8B4434] disabled:opacity-70 transition-colors cursor-pointer"
                >
                  {purchasing && selectedPlan === 'BIDDING' ? "Processing..." : "Buy 1 Bidding Ticket"}
                </button>
              </div>
            </div>

            {/* 1 QS Ticket */}
            <div className="p-6 border border-[#e8ddd6] hover:border-[#8B4434]/50 flex flex-col justify-between gap-5 transition-all bg-[#FCFAF7]/40">
              <div className="space-y-2">
                <span className="text-[10px] uppercase tracking-widest text-[#8B4434] font-bold">Quantity Surveyor</span>
                <h3 className="font-serif text-xl text-[#1c1108]">1 QS Ticket</h3>
                <p className="text-xs text-[#606060] leading-relaxed">
                  Unlock direct contact &amp; consultation with 1 certified Quantity Surveyor for BOQ &amp; cost planning.
                </p>
              </div>
              <div className="space-y-4 pt-4 border-t border-[#e8ddd6]">
                <div>
                  <p className="font-serif text-2xl text-[#8B4434]">LKR 2,500</p>
                  <p className="text-[10px] text-[#908078]">1 QS consultation credit</p>
                </div>
                <button
                  onClick={() => handlePurchase('QS', 1)}
                  disabled={purchasing}
                  className="w-full bg-[#8B4434] text-white py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-[#723628] disabled:opacity-70 transition-colors cursor-pointer"
                >
                  {purchasing && selectedPlan === 'QS' ? "Processing..." : "Buy 1 QS Ticket"}
                </button>
              </div>
            </div>

            {/* 3 Bidding Tickets */}
            <div className="p-6 border border-[#e8ddd6] hover:border-[#8B4434]/50 flex flex-col justify-between gap-5 transition-all bg-[#FCFAF7]/40">
              <div className="space-y-2">
                <span className="text-[10px] uppercase tracking-widest text-[#8B4434] font-bold">Multi-Tender Pack</span>
                <h3 className="font-serif text-xl text-[#1c1108]">3 Bidding Tickets</h3>
                <p className="text-xs text-[#606060] leading-relaxed">
                  Best for multi-trade tenders (civil works, electrical, plumbing) posted separately.
                </p>
              </div>
              <div className="space-y-4 pt-4 border-t border-[#e8ddd6]">
                <div>
                  <p className="font-serif text-2xl text-[#8B4434]">LKR 4,500</p>
                  <p className="text-[10px] text-[#908078]">LKR 1,500 / ticket</p>
                </div>
                <button
                  onClick={() => handlePurchase('BIDDING', 3)}
                  disabled={purchasing}
                  className="w-full bg-[#1c1108] text-white py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-[#8B4434] disabled:opacity-70 transition-colors cursor-pointer"
                >
                  {purchasing && selectedPlan === 'BIDDING' ? "Processing..." : "Buy 3 Bidding Tickets"}
                </button>
              </div>
            </div>
          </div>

          {purchaseSuccess && (
            <div className="flex items-center gap-2 text-emerald-700 text-sm bg-emerald-50 border border-emerald-200 p-4">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {purchaseSuccess}
            </div>
          )}

          <div className="bg-[#FCFAF7] border border-[#e8ddd6] p-4 text-xs text-[#606060] space-y-1">
            <p className="font-semibold text-[#1c1108]">Platform Policy &amp; Privacy Summary:</p>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] text-[#908078]">
              <li><strong>Bidding Tickets</strong> are consumed only when publishing project tenders for contractor proposals.</li>
              <li><strong>QS Tickets</strong> allow clients to unlock direct consultation and contact details with Quantity Surveyors.</li>
              <li>Contractors and trade professionals are engaged through the tender bidding workflow and secure chat room.</li>
              <li>All purchased ticket credits remain valid permanently with zero expiration.</li>
            </ul>
          </div>
        </div>

        {/* Purchase History */}
        {bundles.length > 0 && (
          <div className="space-y-4">
            <h2 className="font-serif text-2xl text-[#1c1108]">Ticket History &amp; Balances</h2>
            <div className="space-y-3">
              {bundles.map((b) => (
                <div key={b.id} className="bg-white border border-[#e8ddd6] p-5 flex flex-wrap items-center justify-between gap-4 shadow-sm">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Ticket className="w-4 h-4 text-[#8B4434]" />
                      <span className="font-semibold text-sm text-[#1c1108]">
                        {b.ticket_type === 'QS' ? 'Quantity Surveyor (QS) Ticket' : 'Bidding Ticket'} #{b.id}
                      </span>
                      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${statusColors[b.status] || ""}`}>
                        {b.status}
                      </span>
                    </div>
                    <p className="text-xs text-[#908078] flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(b.purchased_at).toLocaleDateString("en-LK", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs font-semibold text-[#1c1108]">
                        {b.unlocks_remaining} of {b.unlocks_total} credit{b.unlocks_total > 1 ? 's' : ''} left
                      </p>
                      <p className="text-[10px] text-[#908078]">Paid LKR {Number(b.price_paid).toLocaleString('en-LK')}</p>
                    </div>
                    {b.status === "ACTIVE" && b.unlocks_remaining > 0 && (
                      <Link
                        href={b.ticket_type === 'QS' ? "/professionals?profession=QS" : "/estimation"}
                        className="bg-[#8B4434] text-white px-4 py-2 text-[10px] uppercase font-bold tracking-widest hover:bg-[#723628] transition-colors"
                      >
                        {b.ticket_type === 'QS' ? 'Connect QS' : 'Use Ticket'}
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

