"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../hooks/useAuth";
import { API_BASE_URL, BACKEND_ROOT_URL } from "@/lib/api";
import { Lock, ShieldCheck, ArrowRight, Ticket, AlertCircle, CheckCircle2 } from "lucide-react";

export default function EstimationResult() {
  const { user, backendUser } = useAuth();
  const [data, setData] = useState<any>(null);
  const router = useRouter();

  // Publishing form states
  const [isPublishing, setIsPublishing] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [budgetRange, setBudgetRange] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Bidding ticket monetization states
  const [ticketBalance, setTicketBalance] = useState<number | null>(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [purchasingTicket, setPurchasingTicket] = useState(false);
  const [ticketPurchasedSuccess, setTicketPurchasedSuccess] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      let parsed: any = null;

      const raw =
        sessionStorage.getItem("latestEstimation") ||
        sessionStorage.getItem("latest_estimate") ||
        localStorage.getItem("latestEstimation") ||
        localStorage.getItem("latest_estimate");

      if (raw) {
        try {
          parsed = JSON.parse(raw);
        } catch (_) {}
      }

      // If not in storage, check ?id= query param from URL
      if (!parsed && typeof window !== "undefined") {
        const idParam = new URLSearchParams(window.location.search).get("id");
        if (idParam) {
          try {
            const res = await fetch(`${API_BASE_URL}/estimations/${idParam}/`);
            if (res.ok) {
              parsed = await res.json();
            }
          } catch (_) {}
        }
      }

      if (!parsed) {
        router.push("/estimation");
        return;
      }

      setData(parsed);

      const details = parsed.project_details_json || parsed.inputs || {};
      const totalCost = Number(parsed.total_estimated_cost) || 0;
      const minCost = parsed.grand_total_min || (totalCost ? Math.round(totalCost * 0.95) : 0);
      const maxCost = parsed.grand_total_max || (totalCost ? Math.round(totalCost * 1.1) : 0);

      setTitle(parsed.project_title || "My Construction Project");
      setLocation(details.location || details.province_district || "Western - Colombo");
      setBudgetRange(totalCost ? `LKR ${minCost.toLocaleString()} - LKR ${maxCost.toLocaleString()}` : "Negotiable");

      const desc = `I'm planning a construction project with the following requirements:
- Project Title: ${parsed.project_title || "My Construction Project"}
- Land Size: ${details.land_size || "N/A"}
- House Size: ${details.house_size || "N/A"}
- Total Area: ${parsed.total_area_sqft || details.total_area_sqft || details.sqft || "N/A"} sqft
- Floors: ${parsed.number_of_floors || details.number_of_floors || "1"}
- Rooms: ${parsed.number_of_rooms || details.number_of_rooms || "N/A"}
- Bathrooms: ${details.bathrooms || "N/A"}
- Kitchens: ${details.kitchen_count || "N/A"}
- Quality Standard: ${parsed.quality_level || details.quality || "STANDARD"}
- Cement Brand: ${details.cement_brand || "N/A"}
- Cement Type: ${details.cement_type || "N/A"}
- Sand Type: ${details.sand_type || "N/A"}
- Metal Type: ${details.metal_type || "N/A"}
- Roof Type: ${details.roof_type || "N/A"}
- Interior Level: ${details.interior_level || "N/A"}
- Timeline Target: ${details.timeline_target || "N/A"}

Looking for verified professionals to bid on this construction project. We have generated an estimate of the costs, which you can see in detail on the bidding page.`;
      setDescription(desc);
    };

    loadData();
  }, [router]);

  // Fetch client bidding tickets balance
  useEffect(() => {
    if (!user) return;
    async function loadTickets() {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        const res = await fetch(`${API_BASE_URL}/bidding/tickets/my/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const tData = await res.json();
          setTicketBalance(tData.total_credits_remaining ?? 0);
        }
      } catch (e) {
        console.error("Failed to load tickets", e);
      }
    }
    loadTickets();
  }, [user]);

  const doPublish = async (token: string) => {
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch(`${API_BASE_URL}/bidding/projects/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          title: title,
          description: description,
          location: location,
          budget_range: budgetRange,
          estimation: data.id
        })
      });

      if (res.ok) {
        const rawText = await res.text();
        let result: any = {};
        try {
          result = JSON.parse(rawText);
        } catch (_) {}

        const createdId = result?.id ?? result?.data?.id;
        if (createdId) {
          router.push(`/bidding/${createdId}`);
        } else {
          router.push("/bidding");
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        if (res.status === 402 || errorData.needs_ticket) {
          setShowTicketModal(true);
        } else {
          setErrorMsg(errorData.error || errorData.detail || "Failed to publish project. Please try again.");
        }
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Network error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublishProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setErrorMsg("You must be logged in to publish a project for bidding.");
      const redirectTarget = `/estimation/result${data?.id ? `?id=${data.id}` : ""}`;
      router.push(`/login?redirect=${encodeURIComponent(redirectTarget)}`);
      return;
    }

    // If client has 0 tickets, prompt purchase immediately
    if (ticketBalance === 0) {
      setShowTicketModal(true);
      return;
    }

    try {
      const token = await user.getIdToken();
      await doPublish(token);
    } catch (err) {
      console.error(err);
      setErrorMsg("Authentication error. Please re-login.");
    }
  };

  const handleBuyTicketAndPublish = async () => {
    if (!user) return;
    setPurchasingTicket(true);
    try {
      const token = await user.getIdToken();
      // 1. Purchase 1 bidding ticket (LKR 1,500)
      const buyRes = await fetch(`${API_BASE_URL}/bidding/tickets/purchase/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ quantity: 1, transaction_ref: "MOCK_PAYMENT" })
      });

      if (!buyRes.ok) {
        const err = await buyRes.json().catch(() => ({}));
        alert(err.error || "Failed to purchase bidding ticket.");
        return;
      }

      setTicketPurchasedSuccess(true);
      setShowTicketModal(false);
      window.dispatchEvent(new Event("ticketsUpdated"));

      // 2. Immediately publish tender
      await doPublish(token);
    } catch (err) {
      console.error(err);
      alert("Error processing ticket purchase.");
    } finally {
      setPurchasingTicket(false);
    }
  };

  if (!data) return <div className="min-h-screen bg-stone-50 flex items-center justify-center">Loading...</div>;

  const fmt = (num: string | number) => new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Number(num));
  const pdfUrl = data?.pdf_url ? (data.pdf_url.startsWith('http') ? data.pdf_url : `${BACKEND_ROOT_URL}${data.pdf_url}`) : data?.id ? `${API_BASE_URL}/estimations/${data.id}/pdf/` : null;

  return (
    <div className="min-h-screen bg-stone-50 py-16 px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div className="flex items-center gap-4">
          <Link href="/estimation" className="text-orange-600 hover:text-orange-700 font-semibold tracking-wide text-sm uppercase">
            ← Back to Calculator
          </Link>
        </div>

        <header className="bg-white p-8 rounded-2xl border border-stone-200 shadow-sm text-center">
          <p className="text-stone-500 font-medium tracking-widest uppercase text-sm mb-2">Total Estimated Cost</p>
          <h1 className="font-serif text-5xl md:text-6xl text-orange-600">
            {fmt(data.total_estimated_cost)}
          </h1>
          <p className="text-stone-500 mt-4">
            For a {data.total_area_sqft || 'standard'} sqft, {data.number_of_floors || 1}-story home ({(data.quality_level || 'STANDARD').toLowerCase()} finish).
          </p>
          {pdfUrl && (
            <div className="mt-6">
              <a
                href={pdfUrl}
                target="_blank"
                rel="noreferrer"
                download={`estimation-${data.id || 'report'}.pdf`}
                className="inline-flex items-center justify-center bg-orange-600 text-white px-6 py-3 text-sm font-semibold tracking-wide uppercase hover:bg-orange-700 transition-colors"
              >
                Download PDF Report
              </a>
            </div>
          )}
        </header>

        {data.design_recommendation_json && (
          <section className="bg-white p-8 rounded-2xl border border-stone-200 shadow-sm">
            <h3 className="font-serif text-2xl text-stone-900 border-b border-stone-100 pb-4 mb-6">AI Design Decision</h3>
            <div className="space-y-4 text-stone-700">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-orange-600 font-semibold">{data.design_recommendation_json.design_title}</p>
                <p className="mt-2 leading-relaxed">{data.design_recommendation_json.style_summary}</p>
              </div>
              <div>
                <h4 className="font-semibold text-stone-900 mb-2">Recommended Layout</h4>
                <ul className="space-y-2">
                  {(data.design_recommendation_json.recommended_layout || []).map((item: string, index: number) => (
                    <li key={index} className="text-sm">• {item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-stone-900 mb-2">Material Strategy</h4>
                <ul className="space-y-2">
                  {(data.design_recommendation_json.material_strategy || []).map((item: string, index: number) => (
                    <li key={index} className="text-sm">• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        )}

        {data.project_details_json && (
          <section className="bg-white p-8 rounded-2xl border border-stone-200 shadow-sm">
            <h3 className="font-serif text-2xl text-stone-900 border-b border-stone-100 pb-4 mb-6">Project Details</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-stone-700">
              {Object.entries(data.project_details_json).map(([key, val]) => (
                <div key={key} className="border border-stone-100 rounded-xl p-4 bg-stone-50/60">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-stone-500 font-semibold">{key.replaceAll('_', ' ')}</p>
                  <p className="mt-1 font-medium">{String(val)}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-2xl border border-stone-200 shadow-sm">
            <h3 className="font-serif text-2xl text-stone-900 border-b border-stone-100 pb-4 mb-6">Cost Breakdown</h3>
            <ul className="space-y-4">
              {data.breakdown_json && Object.entries(data.breakdown_json).map(([key, val]) => (
                <li key={key} className="flex justify-between items-center text-stone-700 pb-2 border-b border-stone-50 last:border-0">
                  <span>{key}</span>
                  <span className="font-semibold">{fmt(val as number)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-6">
            {!isPublishing ? (
              <div className="bg-gradient-to-br from-[#fbf8f5] to-[#f4ede7] border border-[#e8ddd6] rounded-2xl p-6 sm:p-8 shadow-sm">
                <div className="flex items-center gap-2 text-[#8B4434] text-xs uppercase tracking-[0.25em] font-semibold mb-2">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Open Tender Bidding</span>
                </div>
                <h3 className="font-serif text-2xl sm:text-3xl text-stone-900 mb-2">
                  Ready to receive bids from professionals?
                </h3>
                <p className="text-stone-600 mb-6 text-xs sm:text-sm leading-relaxed">
                  Publish this estimation to our Open Bidding system to receive competitive, SLS-standard quotes from verified contractors, architects, and engineers across Sri Lanka.
                </p>

                {user ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-white border border-[#e8ddd6] rounded-xl text-xs text-stone-600">
                      <div className="flex items-center gap-2 truncate">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="truncate font-medium text-stone-900">
                          Posting as {user.displayName || user.email}
                        </span>
                      </div>
                      {backendUser?.role && (
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-[#8B4434] bg-[#8B4434]/10 px-2 py-0.5 rounded">
                          {backendUser.role}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsPublishing(true)}
                      className="w-full bg-[#8B4434] text-white py-3.5 px-6 rounded-none text-xs uppercase tracking-[0.22em] font-semibold hover:bg-[#6c3426] transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Publish Project for Bids</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="bg-white border border-amber-200/80 rounded-xl p-5 space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                        <Lock className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider font-bold text-stone-900">
                          Sign In Required to Post
                        </p>
                        <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                          Only registered, logged-in clients can post construction tenders to ensure verified client identities and prevent spam for our contractors.
                        </p>
                      </div>
                    </div>

                    <Link
                      href={`/login?redirect=${encodeURIComponent(`/estimation/result${data?.id ? `?id=${data.id}` : ""}`)}`}
                      className="block text-center w-full bg-[#8B4434] text-white py-3.5 px-6 text-xs uppercase tracking-[0.22em] font-semibold hover:bg-[#6c3426] transition-colors shadow-sm cursor-pointer"
                    >
                      Sign In / Register to Publish
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handlePublishProject} className="bg-white border border-stone-200 rounded-2xl p-8 shadow-sm space-y-5">
                <div className="flex justify-between items-center border-b border-stone-100 pb-4">
                  <h3 className="font-serif text-2xl text-stone-900">Publish Project</h3>
                  <button 
                    type="button" 
                    onClick={() => setIsPublishing(false)} 
                    className="text-stone-400 hover:text-stone-600 text-sm cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
                
                {errorMsg && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-xs">
                    {errorMsg}
                  </div>
                )}
                
                <div>
                  <label className="block text-stone-500 font-medium text-xs tracking-wide mb-2 uppercase">Project Title</label>
                  <input 
                    required 
                    type="text" 
                    value={title} 
                    onChange={e => setTitle(e.target.value)}
                    className="w-full border border-stone-300 rounded-lg px-4 py-3 bg-stone-50 text-stone-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none" 
                  />
                </div>

                <div>
                  <label className="block text-stone-500 font-medium text-xs tracking-wide mb-2 uppercase">Location in Sri Lanka</label>
                  <input 
                    required 
                    type="text" 
                    value={location} 
                    onChange={e => setLocation(e.target.value)}
                    placeholder="e.g. Colombo, Kandy, Galle"
                    className="w-full border border-stone-300 rounded-lg px-4 py-3 bg-stone-50 text-stone-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none" 
                  />
                </div>

                <div>
                  <label className="block text-stone-500 font-medium text-xs tracking-wide mb-2 uppercase">Budget / Range</label>
                  <input 
                    required 
                    type="text" 
                    value={budgetRange} 
                    onChange={e => setBudgetRange(e.target.value)}
                    className="w-full border border-stone-300 rounded-lg px-4 py-3 bg-stone-50 text-stone-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none" 
                  />
                </div>

                <div>
                  <label className="block text-stone-500 font-medium text-xs tracking-wide mb-2 uppercase">Description</label>
                  <textarea 
                    required 
                    value={description} 
                    onChange={e => setDescription(e.target.value)} 
                    rows={8}
                    className="w-full border border-stone-300 rounded-lg px-4 py-3 bg-stone-50 text-stone-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-sm leading-relaxed" 
                  />
                </div>

                {/* Ticket status pill */}
                {user && ticketBalance !== null && (
                  <div className={`p-3 border flex items-center justify-between text-xs ${ticketBalance > 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
                    <div className="flex items-center gap-2">
                      <Ticket className="w-4 h-4" />
                      <span>
                        {ticketBalance > 0 
                          ? `You have ${ticketBalance} Bidding Ticket credit${ticketBalance > 1 ? 's' : ''}. 1 will be used.` 
                          : "1 Bidding Ticket (LKR 1,500) required to publish tender."}
                      </span>
                    </div>
                    {ticketBalance === 0 && (
                      <span className="font-semibold uppercase tracking-wider text-[10px]">Ticket Required</span>
                    )}
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="w-full btn-primary py-4 text-sm disabled:opacity-70 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Ticket className="w-4 h-4" />
                  {isSubmitting ? "Publishing..." : ticketBalance === 0 ? "Buy Ticket & Publish (LKR 1,500)" : "Publish Project Tender"}
                </button>
              </form>
            )}

            {/* Ticket purchase prompt modal */}
            {showTicketModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                <div className="bg-white max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-stone-200">
                  <div className="flex items-center gap-3 border-b border-stone-200 pb-4">
                    <div className="w-10 h-10 bg-[#8B4434]/10 flex items-center justify-center text-[#8B4434]">
                      <Ticket className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-serif text-xl text-stone-900">Bidding Ticket Required</h3>
                      <p className="text-xs text-stone-500">Tender Publishing Fee: LKR 1,500</p>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                    To publish your project tender on the public marketplace, 1 Bidding Ticket (LKR 1,500) is required. 
                    Verified contractors will submit competitive proposals which you can review freely.
                  </p>

                  <div className="p-4 bg-stone-50 border border-stone-200 space-y-1 text-xs">
                    <div className="flex justify-between font-semibold text-stone-900">
                      <span>Bidding Ticket (1 Tender)</span>
                      <span>LKR 1,500</span>
                    </div>
                    <p className="text-[10px] text-stone-500">Includes unlimited contractor proposals &amp; direct messaging.</p>
                  </div>

                  <div className="flex flex-col gap-3">
                    <button
                      onClick={handleBuyTicketAndPublish}
                      disabled={purchasingTicket}
                      className="w-full bg-[#8B4434] text-white py-3.5 text-xs font-bold uppercase tracking-widest hover:bg-[#723628] disabled:opacity-70 transition-colors"
                    >
                      {purchasingTicket ? "Purchasing & Publishing..." : "Buy Ticket & Publish Now (LKR 1,500)"}
                    </button>
                    <button
                      onClick={() => setShowTicketModal(false)}
                      className="w-full text-xs text-stone-500 hover:text-stone-800 py-1"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            <div className="bg-white border border-stone-200 rounded-2xl p-8">
              <h3 className="font-serif text-xl text-stone-900 mb-2">Buy Materials</h3>
              <p className="text-stone-500 mb-4 text-sm leading-relaxed">
                Access wholesale prices directly from hardware stores.
              </p>
              <button className="w-full btn-secondary text-sm border-stone-300">
                Go to Material Hub
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}