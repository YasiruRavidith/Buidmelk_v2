"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function EstimationResult() {
  const [data, setData] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const raw = sessionStorage.getItem("latest_estimate");
    if (!raw) {
      router.push("/estimation");
    } else {
      setData(JSON.parse(raw));
    }
  }, [router]);

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
            <div className="bg-orange-50/50 border border-orange-200 rounded-2xl p-8">
              <h3 className="font-serif text-2xl text-stone-900 mb-2">Ready to start?</h3>
              <p className="text-stone-600 mb-6 text-sm leading-relaxed">
                You can publish this project to the Open Bidding system to get exact quotes from verified professionals.
              </p>
              <button className="w-full btn-primary text-sm">
                Publish Project for Bids
              </button>
            </div>
            
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