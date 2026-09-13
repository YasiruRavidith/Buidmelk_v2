"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "../../hooks/useAuth";
import { Ticket, CheckCircle2, Clock, Package, ArrowRight, ShieldCheck, Plus, Sparkles } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

interface Bundle {
  id: number;
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
  const [totalCredits, setTotalCredits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);

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
        setTotalCredits(data.total_credits_remaining || 0);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handlePurchase = async (quantity: number = 1) => {
    if (!user) return;
    setPurchasing(true);
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
          quantity,
          transaction_ref: "MOCK_PAYMENT" 
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setPurchaseSuccess(`Successfully purchased ${quantity} Bidding Ticket${quantity > 1 ? 's' : ''}!`);
        fetchData();
        window.dispatchEvent(new Event("ticketsUpdated"));
      } else {
        const err = await res.json();
        alert(err.error || "Failed to purchase bidding ticket.");
      }
    } finally {
      setPurchasing(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FCFAF7] flex flex-col items-center justify-center gap-4 text-[#1c1108]">
        <p className="font-serif text-2xl">Login Required</p>
        <p className="text-xs text-[#606060]">Please sign in to manage your project bidding tickets.</p>
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
            <Ticket className="w-3 h-3 text-[#8B4434]" /> Tender Marketplace
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl">Bidding Tickets</h1>
          <p className="text-[#c9b8b0] text-sm max-w-2xl leading-relaxed">
            When you want to publish a project tender for competitive contractor bidding, 1 Bidding Ticket is required. 
            Contacting professionals and reviewing proposals is <strong>100% free</strong> for homeowners.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        {/* Credits Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-[#1c1108] text-[#FCFAF7] p-7 space-y-2 border border-[#322318] shadow-sm">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#8B4434] font-semibold">Available Bidding Tickets</p>
            <p className="font-serif text-5xl text-white">{totalCredits}</p>
            <p className="text-xs text-[#908078]">project tender post credits remaining</p>
          </div>
          
          <div className="bg-white border border-[#e8ddd6] p-7 space-y-2 shadow-sm">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#606060] font-semibold">Standard Ticket Price</p>
            <p className="font-serif text-4xl text-[#8B4434]">LKR 1,500</p>
            <p className="text-xs text-[#908078]">per project post &bull; valid anytime</p>
          </div>

          <div className="bg-[#8B4434]/5 border border-[#8B4434]/20 p-7 space-y-3 flex flex-col justify-between shadow-sm">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#8B4434] font-semibold">Ready to Post?</p>
              <p className="text-xs text-[#606060] mt-1">Generate a quick structural BOQ estimation and publish your tender directly.</p>
            </div>
            <Link
              href="/estimation"
              className="inline-flex items-center justify-center gap-1.5 bg-[#8B4434] text-white px-4 py-2.5 text-xs font-semibold uppercase tracking-wider hover:bg-[#723628] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Start New Tender
            </Link>
          </div>
        </div>

        {/* Purchase Options */}
        <div className="bg-white border border-[#e8ddd6] p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="border-b border-[#e8ddd6] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="font-serif text-2xl text-[#1c1108]">Purchase Bidding Tickets</h2>
              <p className="text-[#606060] text-xs mt-1">
                Select your package below. Instant activation via mock payment gateway.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-3 py-1 self-start sm:self-auto">
              <ShieldCheck className="w-3.5 h-3.5" /> Direct Contractor Bids
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-5">
            {/* 1 Ticket */}
            <div className={`p-6 border-2 flex flex-col justify-between gap-6 transition-all ${selectedQuantity === 1 ? 'border-[#8B4434] bg-[#8B4434]/5 shadow-md' : 'border-[#e8ddd6] hover:border-[#8B4434]/40'}`}>
              <div className="space-y-2">
                <span className="text-[10px] uppercase tracking-widest text-[#8B4434] font-bold">Standard Single</span>
                <h3 className="font-serif text-2xl text-[#1c1108]">1 Tender Post</h3>
                <p className="text-xs text-[#606060] leading-relaxed">
                  Ideal for a single home construction, renovation, or electrical installation.
                </p>
              </div>
              <div className="space-y-4 pt-4 border-t border-[#e8ddd6]">
                <div>
                  <p className="font-serif text-3xl text-[#8B4434]">LKR 1,500</p>
                  <p className="text-[10px] text-[#908078]">LKR 1,500 / ticket</p>
                </div>
                <button
                  onClick={() => { setSelectedQuantity(1); handlePurchase(1); }}
                  disabled={purchasing}
                  className="w-full bg-[#8B4434] text-white py-3 text-xs font-bold uppercase tracking-widest hover:bg-[#723628] disabled:opacity-70 transition-colors"
                >
                  {purchasing && selectedQuantity === 1 ? "Processing..." : "Buy 1 Ticket"}
                </button>
              </div>
            </div>

            {/* 3 Tickets */}
            <div className={`p-6 border-2 flex flex-col justify-between gap-6 relative transition-all ${selectedQuantity === 3 ? 'border-[#8B4434] bg-[#8B4434]/5 shadow-md' : 'border-[#e8ddd6] hover:border-[#8B4434]/40'}`}>
              <div className="space-y-2">
                <span className="text-[10px] uppercase tracking-widest text-[#8B4434] font-bold">Multi Project</span>
                <h3 className="font-serif text-2xl text-[#1c1108]">3 Tender Posts</h3>
                <p className="text-xs text-[#606060] leading-relaxed">
                  Best for phased construction or hiring multiple trades (masonry, plumbing, painting).
                </p>
              </div>
              <div className="space-y-4 pt-4 border-t border-[#e8ddd6]">
                <div>
                  <p className="font-serif text-3xl text-[#8B4434]">LKR 4,500</p>
                  <p className="text-[10px] text-[#908078]">LKR 1,500 / ticket</p>
                </div>
                <button
                  onClick={() => { setSelectedQuantity(3); handlePurchase(3); }}
                  disabled={purchasing}
                  className="w-full bg-[#8B4434] text-white py-3 text-xs font-bold uppercase tracking-widest hover:bg-[#723628] disabled:opacity-70 transition-colors"
                >
                  {purchasing && selectedQuantity === 3 ? "Processing..." : "Buy 3 Tickets"}
                </button>
              </div>
            </div>

            {/* 5 Tickets - Bundle Savings */}
            <div className={`p-6 border-2 flex flex-col justify-between gap-6 relative transition-all ${selectedQuantity === 5 ? 'border-[#8B4434] bg-[#8B4434]/5 shadow-md' : 'border-[#8B4434]/50 bg-white hover:border-[#8B4434]'}`}>
              <div className="absolute -top-3 right-4 bg-[#8B4434] text-white text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 shadow-sm">
                Save LKR 500
              </div>
              <div className="space-y-2">
                <span className="text-[10px] uppercase tracking-widest text-[#8B4434] font-bold">Developer Bundle</span>
                <h3 className="font-serif text-2xl text-[#1c1108]">5 Tender Posts</h3>
                <p className="text-xs text-[#606060] leading-relaxed">
                  Comprehensive bundle for developers and multi-unit home builders.
                </p>
              </div>
              <div className="space-y-4 pt-4 border-t border-[#e8ddd6]">
                <div>
                  <p className="font-serif text-3xl text-[#8B4434]">LKR 7,000</p>
                  <p className="text-[10px] text-emerald-700 font-semibold">Special Discount (Save LKR 500)</p>
                </div>
                <button
                  onClick={() => { setSelectedQuantity(5); handlePurchase(5); }}
                  disabled={purchasing}
                  className="w-full bg-[#1c1108] text-white py-3 text-xs font-bold uppercase tracking-widest hover:bg-[#322318] disabled:opacity-70 transition-colors"
                >
                  {purchasing && selectedQuantity === 5 ? "Processing..." : "Buy 5 Tickets"}
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
            <p className="font-semibold text-[#1c1108]">Platform Policy Reminder:</p>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] text-[#908078]">
              <li>Bidding tickets are exclusively consumed when submitting/publishing project tenders.</li>
              <li>Homeowners do NOT need tickets to browse professionals, view contact details, or review contractor proposals.</li>
              <li>Unused ticket credits do not expire.</li>
            </ul>
          </div>
        </div>

        {/* Purchase History */}
        {bundles.length > 0 && (
          <div className="space-y-4">
            <h2 className="font-serif text-2xl text-[#1c1108]">Ticket History</h2>
            <div className="space-y-3">
              {bundles.map((b) => (
                <div key={b.id} className="bg-white border border-[#e8ddd6] p-5 flex flex-wrap items-center justify-between gap-4 shadow-sm">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Ticket className="w-4 h-4 text-[#8B4434]" />
                      <span className="font-semibold text-sm text-[#1c1108]">Bidding Ticket #{b.id}</span>
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
                        href="/estimation"
                        className="bg-[#8B4434] text-white px-4 py-2 text-[10px] uppercase font-bold tracking-widest hover:bg-[#723628] transition-colors"
                      >
                        Use Ticket
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
