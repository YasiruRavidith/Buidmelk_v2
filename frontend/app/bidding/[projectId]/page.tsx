"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useAuth } from "../../../hooks/useAuth";

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

  const fmt = (num: string | number) => new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Number(num));

  const fetchProject = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/bidding/projects/${projectId}/`);
      if (res.ok) {
        const data = await res.json();
        setProject(data);
      }
    } catch (err) {
      console.error("Failed to fetch project");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const handleAcceptBid = async (bidId: number) => {
    if (!user) return;
    setAcceptingBidId(bidId);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`http://localhost:8000/api/bidding/bids/${bidId}/accept/`, {
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
      const res = await fetch("http://localhost:8000/api/bidding/bids/", {
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

  if (loading) return <div className="p-16 text-center">Loading...</div>;
  if (!project) return <div className="p-16 text-center">Project not found</div>;

  return (
    <div className="min-h-screen bg-stone-50 py-16 px-6">
      <div className="max-w-6xl mx-auto grid md:grid-cols-[1fr_400px] gap-8">
        
        <div className="space-y-8">
          <Link href="/bidding" className="text-orange-600 hover:text-orange-700 font-semibold tracking-wide text-sm uppercase">
            ← Back to Feed
          </Link>
          
          <div className="bg-white border border-stone-200 rounded-2xl p-10 shadow-sm space-y-6">
            <h1 className="font-serif text-4xl text-stone-900">{project.title}</h1>
            <div className="flex flex-wrap gap-6 border-b border-stone-100 pb-6">
              <div className="text-sm">
                <p className="text-stone-400 uppercase tracking-wider mb-1">Posted By</p>
                <p className="font-medium text-stone-800">{project.client_name}</p>
              </div>
              <div className="text-sm">
                 <p className="text-stone-400 uppercase tracking-wider mb-1">Location</p>
                 <p className="font-medium text-stone-800">{project.location}</p>
              </div>
              <div className="text-sm">
                 <p className="text-stone-400 uppercase tracking-wider mb-1">Client Budget</p>
                 <p className="font-medium text-stone-800">{project.budget_range}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-serif text-2xl text-stone-900">Project Description</h3>
              <p className="text-stone-600 leading-relaxed">{project.description}</p>
            </div>
          </div>

          {project.estimation_details && (
            <div className="space-y-8 mt-8">
              <div className="border-t border-stone-200 pt-8">
                <p className="text-orange-600 font-semibold tracking-widest uppercase text-sm mb-2">Linked AI Estimation</p>
                <h2 className="font-serif text-3xl text-stone-900">Estimation Specifications</h2>
                <p className="text-stone-500 text-sm mt-1">This project is backed by a system-generated AI cost calculation.</p>
              </div>

              <div className="bg-white border border-stone-200 rounded-2xl p-8 shadow-sm text-center">
                <p className="text-stone-400 uppercase tracking-wider mb-1 text-sm">AI Estimated Cost</p>
                <h3 className="font-serif text-4xl text-orange-600">
                  {fmt(project.estimation_details.total_estimated_cost)}
                </h3>
                <p className="text-stone-500 text-xs mt-2">
                  For a {project.estimation_details.total_area_sqft} sqft, {project.estimation_details.number_of_floors}-story home ({project.estimation_details.quality_level.toLowerCase()} finish).
                </p>
              </div>

              {project.estimation_details.design_recommendation_json && (
                <div className="bg-white p-8 rounded-2xl border border-stone-200 shadow-sm space-y-6">
                  <h3 className="font-serif text-2xl text-stone-900 border-b border-stone-100 pb-4">AI Design Decision</h3>
                  <div className="space-y-4 text-stone-700">
                    <div>
                      <p className="text-sm uppercase tracking-[0.2em] text-orange-600 font-semibold">{project.estimation_details.design_recommendation_json.design_title}</p>
                      <p className="mt-2 leading-relaxed text-sm">{project.estimation_details.design_recommendation_json.style_summary}</p>
                    </div>
                    {project.estimation_details.design_recommendation_json.recommended_layout?.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-stone-900 mb-2 text-sm">Recommended Layout</h4>
                        <ul className="space-y-2">
                          {project.estimation_details.design_recommendation_json.recommended_layout.map((item: string, index: number) => (
                            <li key={index} className="text-xs text-stone-600">• {item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {project.estimation_details.design_recommendation_json.material_strategy?.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-stone-900 mb-2 text-sm">Material Strategy</h4>
                        <ul className="space-y-2">
                          {project.estimation_details.design_recommendation_json.material_strategy.map((item: string, index: number) => (
                            <li key={index} className="text-xs text-stone-600">• {item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {project.estimation_details.project_details_json && (
                <div className="bg-white p-8 rounded-2xl border border-stone-200 shadow-sm space-y-6">
                  <h3 className="font-serif text-2xl text-stone-900 border-b border-stone-100 pb-4">Project Scope details</h3>
                  <div className="grid md:grid-cols-2 gap-4 text-sm text-stone-700">
                    {Object.entries(project.estimation_details.project_details_json).map(([key, val]) => (
                      <div key={key} className="border border-stone-100 rounded-xl p-4 bg-stone-50/60">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-stone-500 font-semibold">{key.replaceAll('_', ' ')}</p>
                        <p className="mt-1 font-medium">{String(val)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {project.estimation_details.breakdown_json && (
                <div className="bg-white p-8 rounded-2xl border border-stone-200 shadow-sm space-y-6">
                  <h3 className="font-serif text-2xl text-stone-900 border-b border-stone-100 pb-4">AI Cost Breakdown</h3>
                  <ul className="space-y-4">
                    {Object.entries(project.estimation_details.breakdown_json).map(([key, val]) => (
                      <li key={key} className="flex justify-between items-center text-stone-700 pb-2 border-b border-stone-50 last:border-0 text-sm">
                        <span>{key}</span>
                        <span className="font-semibold">{fmt(val as number)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Submitted Proposals Section */}
          <div className="bg-white p-8 rounded-2xl border border-stone-200 shadow-sm space-y-6 mt-8">
            <h3 className="font-serif text-2xl text-stone-900 border-b border-stone-100 pb-4">Submitted Proposals ({project.bids?.length || 0})</h3>
            
            {!project.bids || project.bids.length === 0 ? (
              <p className="text-stone-500 text-sm italic">No proposals submitted yet.</p>
            ) : (
              <div className="space-y-6">
                {project.bids.map((bid: any) => {
                  const isProjectOwner = user && project.client_firebase_uid === user.uid;
                  const isBidder = user && bid.professional_details?.firebase_uid === user.uid;
                  
                  // Show the cover letter only to the project owner (client) or the professional who submitted it
                  const showCoverLetter = isProjectOwner || isBidder;
                  
                  // Show accept button if user is project owner and bid status is PENDING and project status is OPEN
                  const canAccept = isProjectOwner && bid.status === 'PENDING' && project.status === 'OPEN';

                  const statusColors: any = {
                    'PENDING': 'bg-amber-50 text-amber-700 border border-amber-200',
                    'ACCEPTED': 'bg-green-50 text-green-700 border border-green-200',
                    'REJECTED': 'bg-rose-50 text-rose-700 border border-rose-200'
                  };

                  const displayName = bid.professional_details
                    ? `${bid.professional_details.first_name} ${bid.professional_details.last_name}`.trim() || bid.professional_details.username
                    : "Verified Professional";

                  return (
                    <div key={bid.id} className="p-6 border border-stone-100 rounded-xl bg-[#FCFAF7] space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-stone-900 text-base">{displayName}</h4>
                          <p className="text-xs text-stone-400 mt-0.5">Submitted on {new Date(bid.created_at).toLocaleDateString('en-LK')}</p>
                        </div>
                        <span className={`px-2.5 py-0.5 text-xs font-semibold uppercase rounded-full ${statusColors[bid.status] || 'bg-stone-50 text-stone-500'}`}>
                          {bid.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 py-2 border-y border-stone-100 text-sm">
                        <div>
                          <p className="text-stone-400 text-xs uppercase tracking-wider">Proposal Amount</p>
                          <p className="font-semibold text-orange-600 mt-0.5">{fmt(bid.bid_amount)}</p>
                        </div>
                        <div>
                          <p className="text-stone-400 text-xs uppercase tracking-wider">Estimated Time</p>
                          <p className="font-semibold text-stone-800 mt-0.5">{bid.estimated_days} Days</p>
                        </div>
                      </div>

                      {showCoverLetter ? (
                        <div className="space-y-1">
                          <p className="text-stone-400 text-xs uppercase tracking-wider">Proposal Letter</p>
                          <p className="text-stone-600 text-sm leading-relaxed whitespace-pre-wrap">{bid.cover_letter}</p>
                        </div>
                      ) : (
                        <p className="text-stone-400 text-xs italic">Cover letter details are private.</p>
                      )}

                      {canAccept && (
                        <div className="pt-2">
                          <button
                            type="button"
                            disabled={acceptingBidId !== null}
                            onClick={() => handleAcceptBid(bid.id)}
                            className="btn-primary py-2 px-6 text-[9px] tracking-widest uppercase cursor-pointer disabled:opacity-50"
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
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border text-foreground border-stone-200 rounded-2xl p-8 shadow-sm">
             <h3 className="font-serif text-2xl text-stone-900 mb-6">Submit Your Bid</h3>
             
             {submitted ? (
               <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                 <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">✓</div>
                 <h4 className="font-serif text-xl border-none text-green-900 mb-2">Bid Submitted!</h4>
                 <p className="text-green-700/80 text-sm">The client will review your proposal shortly.</p>
               </div>
             ) : !user ? (
               <div className="text-center py-4">
                 <p className="text-stone-500 text-sm mb-4">You must be signed in to submit a bid.</p>
                 <Link href={`/login?redirect=/bidding/${projectId}`} className="btn-primary text-sm">
                   Sign In to Bid
                 </Link>
               </div>
             ) : (
                <form onSubmit={handleBidSubmit} className="space-y-5">
                  <div>
                    <label className="block text-stone-500 font-medium text-xs tracking-wide mb-2">YOUR BID AMOUNT (LKR)</label>
                    <input 
                      required type="number" value={bidAmount} onChange={e => setBidAmount(e.target.value)}
                      className="w-full border border-stone-950 rounded-lg px-4 py-3 bg-stone-950 focus:ring-2 focus:ring-orange-500 focus:border-orange-950 outline-none" placeholder="e.g. 25000000" />
                  </div>
                  <div>
                    <label className="block text-stone-500 font-medium text-xs tracking-wide mb-2">ESTIMATED COMPLETION (DAYS)</label>
                    <input 
                      required type="number" value={days} onChange={e => setDays(e.target.value)}
                      className="w-full border border-stone-300 rounded-lg px-4 py-3 bg-stone-950 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none" placeholder="e.g. 180" />
                  </div>
                  <div>
                    <label className="block text-stone-500 font-medium text-xs tracking-wide mb-2">COVER LETTER / PROPOSAL</label>
                    <textarea 
                      required value={coverLetter} onChange={e => setCoverLetter(e.target.value)} rows={4}
                      className="w-full border border-stone-300 rounded-lg px-4 py-3 bg-stone-950 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none" placeholder="Explain why you are the best fit for this project..."></textarea>
                  </div>
                  <button type="submit" disabled={isSubmitting} className="w-full btn-primary py-4 text-sm disabled:opacity-70">
                    {isSubmitting ? "Submitting..." : "Submit Proposal"}
                  </button>
                </form>
             )}
          </div>
        </div>

      </div>
    </div>
  );
}