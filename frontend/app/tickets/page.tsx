"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "../../hooks/useAuth";
import { Ticket, CheckCircle2, Clock, Package, ArrowRight, ShieldCheck } from "lucide-react";

interface Bundle {
  id: number;
  status: string;
  unlocks_total: number;
  unlocks_used: number;
  unlocks_remaining: number;
  price_paid: string;
  purchased_at: string;
}

interface UnlockedProject {
  project_id: number;
  project_title: string;
  project_status: string;
  unlocked_at: string;
}

export default function MyTicketsPage() {
  const { user } = useAuth();
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [unlocked, setUnlocked] = useState<UnlockedProject[]>([]);
  const [totalCredits, setTotalCredits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const [bundleRes, unlockedRes] = await Promise.all([
        fetch("http://localhost:8000/api/bidding/tickets/my/", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("http://localhost:8000/api/bidding/tickets/unlocked/", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      if (bundleRes.ok) {
        const data = await bundleRes.json();
        setBundles(data.bundles);
        setTotalCredits(data.total_credits_remaining);
      }
      if (unlockedRes.ok) {
        setUnlocked(await unlockedRes.json());
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handlePurchase = async () => {
    if (!user) return;
    setPurchasing(true);
    setPurchaseSuccess(false);
    try {
      const token = await user.getIdToken();
      const res = await fetch("http://localhost:8000/api/bidding/tickets/purchase/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ transaction_ref: "MOCK_PAYMENT" }),
      });
      if (res.ok) {
        setPurchaseSuccess(true);
        fetchData();
      }
    } finally {
      setPurchasing(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FCFAF7] flex flex-col items-center justify-center gap-4">
        <p className="font-serif text-2xl text-[#1c1108]">Login Required</p>
        <Link href="/login?redirect=/tickets" className="text-xs text-[#8B4434] uppercase tracking-wider underline">
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
      {/* Header */}
      <div className="bg-[#1c1108] text-[#FCFAF7] py-14 px-4 sm:px-6 lg:px-8 border-b border-[#322318]">
        <div className="max-w-5xl mx-auto space-y-3">
          <p className="text-[10px] uppercase tracking-[0.25em] text-[#8B4434] font-semibold">Access System</p>
          <h1 className="font-serif text-4xl sm:text-5xl">My Tickets</h1>
          <p className="text-[#c9b8b0] text-sm max-w-xl">
            Each ticket bundle gives you 3 project unlocks. Use them to view bids and contact professionals.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        {/* Credits Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#1c1108] text-[#FCFAF7] p-6 space-y-1">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#8B4434] font-semibold">Available Credits</p>
            <p className="font-serif text-5xl text-white">{totalCredits}</p>
            <p className="text-xs text-[#908078]">project unlocks remaining</p>
          </div>
          <div className="bg-white border border-[#e8ddd6] p-6 space-y-1">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#606060] font-semibold">Total Bundles</p>
            <p className="font-serif text-5xl text-[#1c1108]">{bundles.length}</p>
            <p className="text-xs text-[#908078]">purchased</p>
          </div>
          <div className="bg-white border border-[#e8ddd6] p-6 space-y-1">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#606060] font-semibold">Projects Unlocked</p>
            <p className="font-serif text-5xl text-[#1c1108]">{unlocked.length}</p>
            <p className="text-xs text-[#908078]">total</p>
          </div>
        </div>

        {/* Purchase Section */}
        <div className="bg-white border border-[#e8ddd6] p-6 sm:p-8 space-y-6">
          <div className="border-b border-[#e8ddd6] pb-4">
            <h2 className="font-serif text-2xl text-[#1c1108]">Purchase a Ticket Bundle</h2>
            <p className="text-[#606060] text-xs mt-1">
              One bundle = 3 project unlocks. Valid until all credits are used.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-5 border-2 border-[#8B4434]/30 bg-[#8B4434]/5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-[#8B4434]" />
                <span className="font-serif text-xl text-[#1c1108]">Standard Bundle</span>
              </div>
              <p className="text-xs text-[#606060]">3 project unlocks &bull; View bids &bull; Contact professionals</p>
              <div className="flex items-center gap-1.5 text-[10px] text-[#606060] pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Keeps all transactions on the platform</span>
              </div>
            </div>
            <div className="shrink-0 text-right space-y-3">
              <p className="font-serif text-3xl text-[#8B4434]">LKR 500</p>
              <button
                onClick={handlePurchase}
                disabled={purchasing}
                className="bg-[#8B4434] text-[#FCFAF7] px-8 py-3 text-xs font-bold uppercase tracking-widest hover:bg-[#6f3829] disabled:opacity-70 transition-colors w-full"
              >
                {purchasing ? "Processing..." : "Buy Now"}
              </button>
            </div>
          </div>

          {purchaseSuccess && (
            <div className="flex items-center gap-2 text-emerald-700 text-sm bg-emerald-50 border border-emerald-200 p-4">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              Bundle purchased! 3 new credits added to your account.
            </div>
          )}

          <p className="text-[10px] text-[#908078]">
            Note: Payment gateway integration coming soon. Current purchases are instantly approved (demo mode).
          </p>
        </div>

        {/* My Bundles */}
        {bundles.length > 0 && (
          <div className="space-y-4">
            <h2 className="font-serif text-2xl text-[#1c1108]">Purchase History</h2>
            <div className="space-y-3">
              {bundles.map((b) => (
                <div key={b.id} className="bg-white border border-[#e8ddd6] p-5 flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Ticket className="w-4 h-4 text-[#8B4434]" />
                      <span className="font-semibold text-sm text-[#1c1108]">Bundle #{b.id}</span>
                      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${statusColors[b.status] || ""}`}>
                        {b.status}
                      </span>
                    </div>
                    <p className="text-xs text-[#908078] flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(b.purchased_at).toLocaleDateString("en-LK", {
                        year: "numeric", month: "short", day: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="text-right space-y-0.5">
                    <p className="text-xs text-[#606060]">
                      <strong className="text-[#1c1108]">{b.unlocks_remaining}</strong> / {b.unlocks_total} unlocks remaining
                    </p>
                    <p className="text-xs text-[#908078]">Paid: LKR {b.price_paid}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Unlocked Projects */}
        {unlocked.length > 0 && (
          <div className="space-y-4">
            <h2 className="font-serif text-2xl text-[#1c1108]">Unlocked Projects</h2>
            <div className="space-y-3">
              {unlocked.map((u) => (
                <div key={u.project_id} className="bg-white border border-[#e8ddd6] p-5 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span className="font-semibold text-sm text-[#1c1108]">{u.project_title}</span>
                    </div>
                    <p className="text-xs text-[#908078] pl-6">
                      Unlocked {new Date(u.unlocked_at).toLocaleDateString("en-LK", {
                        year: "numeric", month: "short", day: "numeric",
                      })}
                    </p>
                  </div>
                  <Link
                    href={`/bidding/${u.project_id}`}
                    className="flex items-center gap-1 text-xs text-[#8B4434] font-semibold hover:underline"
                  >
                    View <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-6 h-6 border-2 border-[#8B4434] border-t-transparent" />
          </div>
        )}
      </div>
    </div>
  );
}
