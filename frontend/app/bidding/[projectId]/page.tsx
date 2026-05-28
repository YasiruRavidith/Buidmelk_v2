"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "../../../hooks/useAuth";

export default function ProjectDetail({ params }: { params: { projectId: string } }) {
  const { user } = useAuth();
  const [bidAmount, setBidAmount] = useState("");
  const [days, setDays] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProject() {
      try {
        const res = await fetch(`http://localhost:8000/api/bidding/projects/${params.projectId}/`);
        if (res.ok) {
          const data = await res.json();
          setProject(data);
        }
      } catch (err) {
        console.error("Failed to fetch project");
      } finally {
        setLoading(false);
      }
    }
    fetchProject();
  }, [params.projectId]);

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
          project: params.projectId,
          amount_lkr: bidAmount,
          estimated_days: days,
          proposal_text: coverLetter
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
             ) : (
                <form onSubmit={handleBidSubmit} className="space-y-5">
                  <div>
                    <label className="block text-stone-500 font-medium text-xs tracking-wide mb-2">YOUR BID AMOUNT (LKR)</label>
                    <input 
                      required type="number" value={bidAmount} onChange={e => setBidAmount(e.target.value)}
                      className="w-full border border-stone-300 rounded-lg px-4 py-3 bg-stone-50 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none" placeholder="e.g. 25000000" />
                  </div>
                  <div>
                    <label className="block text-stone-500 font-medium text-xs tracking-wide mb-2">ESTIMATED COMPLETION (DAYS)</label>
                    <input 
                      required type="number" value={days} onChange={e => setDays(e.target.value)}
                      className="w-full border border-stone-300 rounded-lg px-4 py-3 bg-stone-50 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none" placeholder="e.g. 180" />
                  </div>
                  <div>
                    <label className="block text-stone-500 font-medium text-xs tracking-wide mb-2">COVER LETTER / PROPOSAL</label>
                    <textarea 
                      required value={coverLetter} onChange={e => setCoverLetter(e.target.value)} rows={4}
                      className="w-full border border-stone-300 rounded-lg px-4 py-3 bg-stone-50 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none" placeholder="Explain why you are the best fit for this project..."></textarea>
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