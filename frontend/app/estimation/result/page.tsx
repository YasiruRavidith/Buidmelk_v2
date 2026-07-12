"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../hooks/useAuth";

export default function EstimationResult() {
  const { user } = useAuth();
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

  useEffect(() => {
    const raw = sessionStorage.getItem("latest_estimate");
    if (!raw) {
      router.push("/estimation");
    } else {
      const parsed = JSON.parse(raw);
      setData(parsed);
      
      // Prefill fields for publishing
      setTitle(parsed.project_title || "My Dream Home");
      setBudgetRange(`LKR ${new Intl.NumberFormat('en-LK').format(parsed.total_estimated_cost)}`);
      
      const details = parsed.project_details_json || {};
      const rec = parsed.design_recommendation_json || {};
      const desc = `Project Title: ${parsed.project_title || "My Dream Home"}
Total Area: ${parsed.total_area_sqft} SQFT
Number of Floors: ${parsed.number_of_floors} | Quality Finish: ${parsed.quality_level}

AI Design Summary:
- Style: ${rec.design_title || "Modern Family Residence"}
- Style Details: ${rec.style_summary || ""}

Inputs:
- Land Size: ${details.land_size || "N/A"}
- House Size: ${details.house_size || "N/A"}
- Rooms: ${details.number_of_rooms || "N/A"}
- Bathrooms: ${details.bathrooms || "N/A"}
- Kitchens: ${details.kitchen_count || "N/A"}
- Cement Brand: ${details.cement_brand || "N/A"}
- Roof Type: ${details.roof_type || "N/A"}

Looking for verified professionals to bid on this construction project. We have generated an AI estimate of the costs, which you can see in detail on the bidding page.`;
      setDescription(desc);
    }
  }, [router]);

  const handlePublishProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const token = await user.getIdToken();
      const res = await fetch("http://localhost:8000/api/bidding/projects/", {
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
        // Read raw text first to debug any parsing issues
        const rawText = await res.text();
        let result: any = {};
        try {
          result = JSON.parse(rawText);
        } catch (_) {
          console.error("Response was not valid JSON:", rawText);
        }

        // Extract the project ID — DRF returns the created object directly
        const createdId = result?.id ?? result?.data?.id;

        if (createdId) {
          // Navigate directly to the new project page
          router.push(`/bidding/${createdId}`);
        } else {
          // Fallback: ID couldn't be extracted, go to the bidding feed
          console.warn("Could not extract project ID from response:", result);
          router.push("/bidding");
        }
      } else {
        let errText = "Failed to publish project. Please try again.";
        try {
          const errorData = await res.json();
          errText = errorData.error || errorData.detail || errText;
        } catch (_) {}
        setErrorMsg(errText);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Network error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!data) return <div className="min-h-screen bg-stone-50 flex items-center justify-center">Loading...</div>;

  const fmt = (num: string | number) => new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Number(num));
  const pdfUrl = data?.pdf_url ? `http://localhost:8000${data.pdf_url}` : data?.id ? `http://localhost:8000/api/estimations/${data.id}/pdf/` : null;

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
            For a {data.total_area_sqft} sqft, {data.number_of_floors}-story home ({data.quality_level.toLowerCase()} finish).
          </p>
          {pdfUrl && (
            <div className="mt-6">
              <a
                href={pdfUrl}
                target="_blank"
                rel="noreferrer"
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
              <div className="bg-orange-50/50 border border-orange-200 rounded-2xl p-8">
                <h3 className="font-serif text-2xl text-stone-900 mb-2">Ready to start?</h3>
                <p className="text-stone-600 mb-6 text-sm leading-relaxed">
                  You can publish this project to the Open Bidding system to get exact quotes from verified professionals.
                </p>
                {user ? (
                  <button 
                    type="button"
                    onClick={() => setIsPublishing(true)} 
                    className="w-full btn-primary text-sm cursor-pointer"
                  >
                    Publish Project for Bids
                  </button>
                ) : (
                  <Link 
                    href="/login?redirect=/estimation/result" 
                    className="block text-center w-full btn-primary text-sm cursor-pointer py-4"
                  >
                    Sign In to Publish
                  </Link>
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

                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="w-full btn-primary py-4 text-sm disabled:opacity-70 cursor-pointer"
                >
                  {isSubmitting ? "Publishing..." : "Publish Project"}
                </button>
              </form>
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