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
        <Link href="/login?redirect=/tickets" className="bg-[#EA580C] text-[#FCFAF7] px-6 py-2.5 text-xs font-semibold uppercase tracking-widest hover:bg-[#C2410C] transition-colors">
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
          <div className="inline-flex items-center gap-2 bg-[#EA580C]/20 border border-[#EA580C]/40 px-3.5 py-1 text-[10px] uppercase tracking-[0.25em] text-[#FCFAF7] font-semibold rounded-full">
            <Ticket className="w-3 h-3 text-[#EA580C]" /> Client Tickets &amp; Pro Plans
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
          <div className="bg-[#1c1108] text-[#FCFAF7] p-7 space-y-2 border border-[#322318] shadow-sm relative overflow-hidden rounded-2xl">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#EA580C] font-semibold">Bidding Tickets</p>
              <Ticket className="w-4 h-4 text-[#EA580C]/60" />
            </div>
            <p className="font-serif text-5xl text-white">{biddingCredits}</p>
            <p className="text-xs text-[#908078]">tender post credit{biddingCredits !== 1 ? 's' : ''} available</p>
          </div>
          
          {/* QS Credits */}
          <div className="bg-white border border-[#e8ddd6] p-7 space-y-2 shadow-sm relative overflow-hidden rounded-2xl">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#EA580C] font-semibold">QS Tickets</p>
              <Calculator className="w-4 h-4 text-[#EA580C]" />
            </div>
            <p className="font-serif text-5xl text-[#EA580C]">{qsCredits}</p>
            <p className="text-xs text-[#908078]">Quantity Surveyor consultation credit{qsCredits !== 1 ? 's' : ''}</p>
          </div>

          {/* Quick Action */}
          <div className="bg-[#EA580C]/5 border border-[#EA580C]/20 p-7 space-y-3 flex flex-col justify-between shadow-sm rounded-2xl">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#EA580C] font-semibold">Need Assistance?</p>
              <p className="text-xs text-[#606060] mt-1">Consult a certified QS to verify project cost estimates or launch a new bidding tender.</p>
            </div>
            <div className="flex flex-col gap-2">
              <Link
                href="/professionals?profession=QS"
                className="inline-flex items-center justify-center gap-1.5 bg-[#1c1108] text-white px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider hover:bg-[#322318] transition-colors text-center rounded-xl"
              >
                <UserCheck className="w-3.5 h-3.5" /> Find a Quantity Surveyor
              </Link>
              <Link
                href="/estimation"
                className="inline-flex items-center justify-center gap-1.5 bg-[#EA580C] text-white px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider hover:bg-[#C2410C] transition-colors text-center rounded-xl shadow-sm"
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
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#EA580C] mb-1">
                <Sparkles className="w-4 h-4 text-[#EA580C]" /> Pro Plans for Tickets
              </div>
              <h2 className="font-serif text-3xl text-[#1c1108]">Best Value Combo Bundles</h2>
              <p className="text-xs text-[#606060] mt-1">
                Combine Bidding tender posts and Quantity Surveyor consultations at discounted rates.
              </p>
            </div>
            <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 self-start sm:self-auto rounded-full">
              Save up to LKR 2,500
            </span>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {/* Starter Pro Plan */}
            <div className="border-2 border-[#EA580C] bg-white p-7 flex flex-col justify-between gap-6 relative shadow-md rounded-2xl">
              <div className="absolute -top-3 right-6 bg-[#EA580C] text-white text-[9px] font-bold uppercase tracking-widest px-3 py-1 shadow-sm rounded-full">
                Save LKR 500
              </div>
              <div className="space-y-3">
                <span className="text-[10px] uppercase tracking-widest text-[#EA580C] font-bold">Recommended for Homeowners</span>
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
                    <p className="font-serif text-3xl text-[#EA580C]">LKR 3,500</p>
                    <p className="text-[10px] text-[#908078] line-through">Standard Value LKR 4,000</p>
                  </div>
                  <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 border border-emerald-200 rounded-full">
                    Save LKR 500
                  </span>
                </div>
                <button
                  onClick={() => handlePurchase('PRO_STARTER')}
                  disabled={purchasing}
                  className="w-full bg-[#EA580C] text-white py-3.5 text-xs font-bold uppercase tracking-widest hover:bg-[#C2410C] disabled:opacity-70 transition-colors shadow-sm cursor-pointer rounded-xl"
                >
                  {purchasing && selectedPlan === 'PRO_STARTER' ? "Processing..." : "Buy Starter Pro Plan"}
                </button>
              </div>
            </div>

            {/* Master Builder Pro Plan */}
            <div className="border-2 border-[#1c1108] bg-[#1c1108] text-white p-7 flex flex-col justify-between gap-6 relative shadow-lg rounded-2xl">
              <div className="absolute -top-3 right-6 bg-emerald-600 text-white text-[9px] font-bold uppercase tracking-widest px-3 py-1 shadow-sm rounded-full">
                Save LKR 2,500
              </div>
              <div className="space-y-3">
                <span className="text-[10px] uppercase tracking-widest text-[#EA580C] font-bold">Multi-Stage Construction</span>
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
                  <span className="text-xs text-emerald-400 font-bold bg-emerald-950/60 px-2.5 py-0.5 border border-emerald-800 rounded-full">
                    Save LKR 2,500
                  </span>
                </div>
                <button
                  onClick={() => handlePurchase('PRO_MASTER')}
                  disabled={purchasing}
                  className="w-full bg-[#EA580C] text-white py-3.5 text-xs font-bold uppercase tracking-widest hover:bg-[#C2410C] disabled:opacity-70 transition-colors shadow-sm cursor-pointer rounded-xl"
                >
                  {purchasing && selectedPlan === 'PRO_MASTER' ? "Processing..." : "Buy Master Pro Plan"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── STANDARD INDIVIDUAL TICKETS ── */}
        <div className="bg-white border border-[#e8ddd6] p-6 sm:p-8 space-y-6 shadow-sm rounded-2xl">
          <div className="border-b border-[#e8ddd6] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="font-serif text-2xl text-[#1c1108]">Individual Ticket Types</h2>
              <p className="text-[#606060] text-xs mt-1">
                Purchase single or multiple tickets as needed for your project.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-3 py-1 self-start sm:self-auto rounded-full">
              <ShieldCheck className="w-3.5 h-3.5" /> Instant Activation
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* 1 Bidding Ticket */}
            <div className="p-6 border border-[#e8ddd6] hover:border-[#EA580C]/50 flex flex-col justify-between gap-5 transition-all bg-[#FCFAF7]/40 rounded-2xl shadow-2xs">
              <div className="space-y-2">
                <span className="text-[10px] uppercase tracking-widest text-[#EA580C] font-bold">Tender Publishing</span>
                <h3 className="font-serif text-xl text-[#1c1108]">1 Bidding Ticket</h3>
                <p className="text-xs text-[#606060] leading-relaxed">
                  Required to publish 1 project tender for competitive contractor proposals.
                </p>
              </div>
              <div className="space-y-4 pt-4 border-t border-[#e8ddd6]">
                <div>
                  <p className="font-serif text-2xl text-[#EA580C]">LKR 1,500</p>
                  <p className="text-[10px] text-[#908078]">1 project post credit</p>
                </div>
                <button
                  onClick={() => handlePurchase('BIDDING', 1)}
                  disabled={purchasing}
                  className="w-full bg-[#1c1108] text-white py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-[#EA580C] disabled:opacity-70 transition-colors cursor-pointer rounded-xl"
                >
                  {purchasing && selectedPlan === 'BIDDING' ? "Processing..." : "Buy 1 Bidding Ticket"}
                </button>
              </div>
            </div>

            {/* 1 QS Ticket */}
            <div className="p-6 border border-[#e8ddd6] hover:border-[#EA580C]/50 flex flex-col justify-between gap-5 transition-all bg-[#FCFAF7]/40 rounded-2xl shadow-2xs">
              <div className="space-y-2">
                <span className="text-[10px] uppercase tracking-widest text-[#EA580C] font-bold">Quantity Surveyor</span>
                <h3 className="font-serif text-xl text-[#1c1108]">1 QS Ticket</h3>
                <p className="text-xs text-[#606060] leading-relaxed">
                  Unlock direct contact &amp; consultation with 1 certified Quantity Surveyor for BOQ &amp; cost planning.
                </p>
              </div>
              <div className="space-y-4 pt-4 border-t border-[#e8ddd6]">
                <div>
                  <p className="font-serif text-2xl text-[#EA580C]">LKR 2,500</p>
                  <p className="text-[10px] text-[#908078]">1 QS consultation credit</p>
                </div>
                <button
                  onClick={() => handlePurchase('QS', 1)}
                  disabled={purchasing}
                  className="w-full bg-[#EA580C] text-white py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-[#C2410C] disabled:opacity-70 transition-colors cursor-pointer rounded-xl"
                >
                  {purchasing && selectedPlan === 'QS' ? "Processing..." : "Buy 1 QS Ticket"}
                </button>
              </div>
            </div>

            {/* 3 Bidding Tickets */}
            <div className="p-6 border border-[#e8ddd6] hover:border-[#EA580C]/50 flex flex-col justify-between gap-5 transition-all bg-[#FCFAF7]/40 rounded-2xl shadow-2xs">
              <div className="space-y-2">
                <span className="text-[10px] uppercase tracking-widest text-[#EA580C] font-bold">Multi-Tender Pack</span>
                <h3 className="font-serif text-xl text-[#1c1108]">3 Bidding Tickets</h3>
                <p className="text-xs text-[#606060] leading-relaxed">
                  Best for multi-trade tenders (civil works, electrical, plumbing) posted separately.
                </p>
              </div>
              <div className="space-y-4 pt-4 border-t border-[#e8ddd6]">
                <div>
                  <p className="font-serif text-2xl text-[#EA580C]">LKR 4,500</p>
                  <p className="text-[10px] text-[#908078]">LKR 1,500 / ticket</p>
                </div>
                <button
                  onClick={() => handlePurchase('BIDDING', 3)}
                  disabled={purchasing}
                  className="w-full bg-[#1c1108] text-white py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-[#EA580C] disabled:opacity-70 transition-colors cursor-pointer rounded-xl"
                >
                  {purchasing && selectedPlan === 'BIDDING' ? "Processing..." : "Buy 3 Bidding Tickets"}
                </button>
              </div>
            </div>
          </div>

          {purchaseSuccess && (
            <div className="flex items-center gap-2 text-emerald-700 text-sm bg-emerald-50 border border-emerald-200 p-4 rounded-xl">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {purchaseSuccess}
            </div>
          )}

          <div className="bg-[#FCFAF7] border border-[#e8ddd6] p-4 text-xs text-[#606060] space-y-1 rounded-2xl">
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
                <div key={b.id} className="bg-white border border-[#e8ddd6] p-5 flex flex-wrap items-center justify-between gap-4 shadow-sm rounded-2xl">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Ticket className="w-4 h-4 text-[#EA580C]" />
                      <span className="font-semibold text-sm text-[#1c1108]">
                        {b.ticket_type === 'QS' ? 'Quantity Surveyor (QS) Ticket' : 'Bidding Ticket'} #{b.id}
                      </span>
                      <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border rounded-full ${statusColors[b.status] || ""}`}>
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
                        className="bg-[#EA580C] text-white px-4 py-2 text-[10px] uppercase font-bold tracking-widest hover:bg-[#C2410C] transition-colors rounded-xl shadow-xs"
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

