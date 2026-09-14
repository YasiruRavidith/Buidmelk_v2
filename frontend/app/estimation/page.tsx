"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../hooks/useAuth";
import { Building2, Hammer, Layers, Clock, Sparkles } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

/* ─── Shared Input/Select Styles ─────────────────────────────── */
const input = "w-full border-b border-[#c9b8b0] bg-transparent px-0 py-3 text-[#281713] placeholder:text-[#EA580C]/30 focus:outline-none focus:border-[#EA580C] transition-colors text-sm";
const selectCls = "w-full border-b border-[#c9b8b0] bg-transparent px-0 py-3 text-[#281713] focus:outline-none focus:border-[#EA580C] transition-colors text-sm appearance-none cursor-pointer";

function SectionHeader({ number, icon, title, subtitle }: { number: string; icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex items-start gap-4 mb-8">
      <div className="shrink-0 flex flex-col items-center">
        <span className="text-[#EA580C]/40 font-serif text-xs tracking-widest">{number}</span>
        <div className="mt-2 w-10 h-10 border border-[#EA580C]/20 rounded-xl flex items-center justify-center text-[#EA580C]">
          {icon}
        </div>
      </div>
      <div>
        <h2 className="font-serif text-2xl text-[#281713] leading-tight">{title}</h2>
        <p className="text-sm text-[#EA580C]/60 mt-1">{subtitle}</p>
      </div>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] uppercase tracking-[0.28em] text-[#EA580C]/60 font-semibold mb-2">{children}</p>
  );
}

export default function SmartEstimation() {
  const { user } = useAuth();
  const [projectTitle, setProjectTitle] = useState("My Dream Home");
  const [sqft, setSqft] = useState("");
  const [landSize, setLandSize] = useState("");
  const [houseSize, setHouseSize] = useState("");
  const [floors, setFloors] = useState("1");
  const [rooms, setRooms] = useState("1");
  const [bathrooms, setBathrooms] = useState("1");
  const [kitchenCount, setKitchenCount] = useState("1");
  const [garage, setGarage] = useState("No");
  const [balcony, setBalcony] = useState("No");
  const [cementBrand, setCementBrand] = useState("Sanstha");
  const [cementType, setCementType] = useState("SLS Certified Cement");
  const [sandType, setSandType] = useState("River Sand");
  const [metalType, setMetalType] = useState("3/4 metal");
  const [roofType, setRoofType] = useState("Roofing Sheets");
  const [interiorLevel, setInteriorLevel] = useState("Standard");
  const [timelineTarget, setTimelineTarget] = useState("6-9 Months");
  const [legalApprovalRequired, setLegalApprovalRequired] = useState("Yes");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [quality, setQuality] = useState("STANDARD");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleEstimate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = user ? await user.getIdToken() : null;
      const response = await fetch(`${API_BASE_URL}/estimations/calculate/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          project_title: projectTitle,
          total_area_sqft: sqft,
          land_size: landSize,
          house_size: houseSize,
          number_of_floors: floors,
          number_of_rooms: rooms,
          bathrooms,
          kitchen_count: kitchenCount,
          garage,
          balcony,
          cement_brand: cementBrand,
          cement_type: cementType,
          sand_type: sandType,
          metal_type: metalType,
          roof_type: roofType,
          interior_level: interiorLevel,
          timeline_target: timelineTarget,
          legal_approval_required: legalApprovalRequired,
          additional_notes: additionalNotes,
          quality_level: quality,
        }),
      });
      const result = await response.json();
      if (response.ok) {
        const payload = {
          ...result.data,
          pdf_url: result.pdf_url || (result.data?.id ? `/api/estimations/${result.data.id}/pdf/` : null),
        };
        sessionStorage.setItem("latestEstimation", JSON.stringify(payload));
        sessionStorage.setItem("latest_estimate", JSON.stringify(payload));
        localStorage.setItem("latestEstimation", JSON.stringify(payload));
        router.push(`/estimation/result${result.data?.id ? `?id=${result.data.id}` : ""}`);
      } else {
        alert(result.error || "Estimation failed");
      }
    } catch (error) {
      console.error(error);
      alert("Network Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FCFAF7]">

      {/* ── Hero Banner ─────────────────────────────────────────── */}
      <div className="bg-[#281713] text-[#FCFAF7] px-4 sm:px-8 lg:px-16 py-14 sm:py-20 relative overflow-hidden">
        {/* Decorative grid lines */}
        <div className="absolute inset-0 opacity-[0.04]" style={{backgroundImage: 'repeating-linear-gradient(0deg, #FCFAF7 0px, #FCFAF7 1px, transparent 1px, transparent 60px), repeating-linear-gradient(90deg, #FCFAF7 0px, #FCFAF7 1px, transparent 1px, transparent 60px)'}} />
        {/* Glow accent */}
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-[#EA580C]/20 blur-[80px]" />

        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="h-4 w-4 text-[#EA580C]" />
            <span className="text-[10px] uppercase tracking-[0.35em] text-[#FCFAF7]/50 font-semibold">AI-Powered Engine</span>
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-[#FCFAF7] leading-[1.05]">
            Smart Construction<br className="hidden sm:block" /> Cost Estimator
          </h1>
          <p className="mt-5 text-[#FCFAF7]/60 text-sm sm:text-base max-w-2xl leading-relaxed">
            Describe your build — our AI engine calculates material quantities, labour costs, and a full breakdown using live Sri Lankan market rates.
          </p>

          {/* Quick stats strip */}
          <div className="mt-10 grid grid-cols-3 gap-4 sm:gap-8 border-t border-[#FCFAF7]/10 pt-8">
            {[
              { label: "Market Data", value: "Live" },
              { label: "Estimate Time", value: "~10s" },
              { label: "Accuracy", value: "±5%" },
            ].map(stat => (
              <div key={stat.label}>
                <p className="font-serif text-2xl sm:text-3xl text-[#FCFAF7]">{stat.value}</p>
                <p className="text-[10px] uppercase tracking-[0.25em] text-[#FCFAF7]/40 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Form ────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">

        {/* Project name banner */}
        <div className="mb-12 pb-8 border-b border-[#e8ddd6]">
          <p className="text-[10px] uppercase tracking-[0.35em] text-[#EA580C]/60 font-semibold mb-3">Your Project</p>
          <input
            required
            type="text"
            value={projectTitle}
            onChange={(e) => setProjectTitle(e.target.value)}
            placeholder="Enter your project name…"
            className="w-full bg-transparent font-serif text-3xl sm:text-4xl lg:text-5xl text-[#281713] placeholder:text-[#EA580C]/20 border-none outline-none focus:outline-none"
          />
        </div>

        <form onSubmit={handleEstimate} className="space-y-16">

          {/* ── Section 1: Project Dimensions ── */}
          <div>
            <SectionHeader
              number="01"
              icon={<Building2 className="h-5 w-5" />}
              title="Project Dimensions"
              subtitle="Tell us about the size and scope of your build"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-8">
              <div>
                <FieldLabel>Land Size</FieldLabel>
                <input type="text" value={landSize} onChange={(e) => setLandSize(e.target.value)} placeholder="e.g. 10 perch" className={input} />
              </div>
              <div>
                <FieldLabel>House Size</FieldLabel>
                <input type="text" value={houseSize} onChange={(e) => setHouseSize(e.target.value)} placeholder="e.g. 1600 sqft" className={input} />
              </div>
              <div>
                <FieldLabel>Total Area (sqft) *</FieldLabel>
                <input required type="number" min="100" value={sqft} onChange={(e) => setSqft(e.target.value)} placeholder="e.g. 1500" className={input} />
              </div>
              <div>
                <FieldLabel>Quality Level</FieldLabel>
                <select value={quality} onChange={(e) => setQuality(e.target.value)} className={selectCls}>
                  <option value="STANDARD">Standard Finish</option>
                  <option value="LUXURY">Premium / Luxury Finish</option>
                </select>
              </div>
            </div>
          </div>

          <div className="border-t border-[#e8ddd6]" />

          {/* ── Section 2: Building Layout ── */}
          <div>
            <SectionHeader
              number="02"
              icon={<Layers className="h-5 w-5" />}
              title="Building Layout"
              subtitle="Floors, rooms, and structural extras"
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-8">
              {[
                { label: "Floors *", value: floors, set: setFloors, min: 1 },
                { label: "Bedrooms *", value: rooms, set: setRooms, min: 1 },
                { label: "Bathrooms", value: bathrooms, set: setBathrooms, min: 0 },
                { label: "Kitchens", value: kitchenCount, set: setKitchenCount, min: 0 },
              ].map(field => (
                <div key={field.label}>
                  <FieldLabel>{field.label}</FieldLabel>
                  <input
                    required={field.label.includes('*')}
                    type="number"
                    min={field.min}
                    value={field.value}
                    onChange={(e) => field.set(e.target.value)}
                    className={input}
                  />
                </div>
              ))}
              <div>
                <FieldLabel>Garage</FieldLabel>
                <select value={garage} onChange={(e) => setGarage(e.target.value)} className={selectCls}>
                  <option value="No">No Garage</option>
                  <option value="Single">Single</option>
                  <option value="Double">Double</option>
                </select>
              </div>
              <div>
                <FieldLabel>Balcony</FieldLabel>
                <select value={balcony} onChange={(e) => setBalcony(e.target.value)} className={selectCls}>
                  <option value="No">No Balcony</option>
                  <option value="Yes">Yes, include</option>
                </select>
              </div>
            </div>
          </div>

          <div className="border-t border-[#e8ddd6]" />

          {/* ── Section 3: Materials & Finishes ── */}
          <div>
            <SectionHeader
              number="03"
              icon={<Hammer className="h-5 w-5" />}
              title="Materials & Finishes"
              subtitle="Specify your material preferences for accurate pricing"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-8">
              <div>
                <FieldLabel>Cement Brand</FieldLabel>
                <select value={cementBrand} onChange={(e) => setCementBrand(e.target.value)} className={selectCls}>
                  <option value="Sanstha">Sanstha</option>
                  <option value="Lanwa">Lanwa</option>
                  <option value="Tokyo">Tokyo</option>
                  <option value="Holcim">Holcim</option>
                  <option value="Maga">Maga</option>
                </select>
              </div>
              <div>
                <FieldLabel>Cement Type</FieldLabel>
                <select value={cementType} onChange={(e) => setCementType(e.target.value)} className={selectCls}>
                  <option value="SLS Certified Cement">SLS Certified Cement</option>
                  <option value="Ordinary Portland Cement">Ordinary Portland Cement</option>
                  <option value="Ready Mix">Ready Mix</option>
                </select>
              </div>
              <div>
                <FieldLabel>Sand Type</FieldLabel>
                <select value={sandType} onChange={(e) => setSandType(e.target.value)} className={selectCls}>
                  <option value="River Sand">River Sand</option>
                  <option value="Manufactured Sand">Manufactured Sand</option>
                </select>
              </div>
              <div>
                <FieldLabel>Metal Grade</FieldLabel>
                <select value={metalType} onChange={(e) => setMetalType(e.target.value)} className={selectCls}>
                  <option value="1/2 metal">½ Metal</option>
                  <option value="3/4 metal">¾ Metal</option>
                </select>
              </div>
              <div>
                <FieldLabel>Roof Type</FieldLabel>
                <select value={roofType} onChange={(e) => setRoofType(e.target.value)} className={selectCls}>
                  <option value="Roofing Sheets">Roofing Sheets</option>
                  <option value="Roof Tiles">Roof Tiles</option>
                  <option value="Steel Roof Structure">Steel Roof Structure</option>
                </select>
              </div>
              <div>
                <FieldLabel>Interior Level</FieldLabel>
                <select value={interiorLevel} onChange={(e) => setInteriorLevel(e.target.value)} className={selectCls}>
                  <option value="Standard">Standard</option>
                  <option value="Premium">Premium</option>
                  <option value="Luxury">Luxury</option>
                </select>
              </div>
            </div>
          </div>

          <div className="border-t border-[#e8ddd6]" />

          {/* ── Section 4: Timeline & Legal ── */}
          <div>
            <SectionHeader
              number="04"
              icon={<Clock className="h-5 w-5" />}
              title="Timeline & Legal"
              subtitle="Completion targets and approval requirements"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-8">
              <div>
                <FieldLabel>Target Timeline</FieldLabel>
                <select value={timelineTarget} onChange={(e) => setTimelineTarget(e.target.value)} className={selectCls}>
                  <option value="3-6 Months">3 – 6 Months</option>
                  <option value="6-9 Months">6 – 9 Months</option>
                  <option value="9-12 Months">9 – 12 Months</option>
                  <option value="12+ Months">12+ Months</option>
                </select>
              </div>
              <div>
                <FieldLabel>Legal Approval Required</FieldLabel>
                <select value={legalApprovalRequired} onChange={(e) => setLegalApprovalRequired(e.target.value)} className={selectCls}>
                  <option value="Yes">Yes — include approval costs</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <FieldLabel>Additional Notes</FieldLabel>
                <textarea
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  rows={3}
                  placeholder="Site conditions, design preferences, special requirements…"
                  className="w-full border-b border-[#c9b8b0] bg-transparent px-0 py-3 text-[#281713] placeholder:text-[#EA580C]/30 focus:outline-none focus:border-[#EA580C] transition-colors text-sm resize-none"
                />
              </div>
            </div>
          </div>

          {/* ── Live Summary Strip ── */}
          <div className="border border-[#e8ddd6] bg-white p-5 sm:p-8 rounded-2xl shadow-sm">
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#EA580C]/60 font-semibold mb-5">Estimate Summary</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 text-sm">
              {[
                { label: "Project", value: projectTitle || "—" },
                { label: "Total Area", value: sqft ? `${sqft} sqft` : "—" },
                { label: "Floors × Rooms", value: `${floors}F × ${rooms}BR` },
                { label: "Quality", value: quality === "LUXURY" ? "Luxury" : "Standard" },
                { label: "Cement", value: `${cementBrand} · ${cementType.split(' ')[0]}` },
                { label: "Roof", value: roofType },
                { label: "Timeline", value: timelineTarget },
                { label: "Interior", value: interiorLevel },
              ].map(item => (
                <div key={item.label} className="border-l-2 border-[#EA580C]/15 pl-3">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-[#EA580C]/50 mb-1">{item.label}</p>
                  <p className="text-[#281713] font-medium text-xs sm:text-sm truncate">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Submit ── */}
          <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto flex-1 bg-[#281713] text-[#FCFAF7] px-10 py-5 rounded-xl text-[11px] tracking-[0.28em] uppercase font-semibold hover:bg-[#EA580C] transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <span className="inline-block h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Calculating…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate AI Estimate
                </>
              )}
            </button>
            <p className="text-[11px] text-[#EA580C]/50 text-center sm:text-left">
              Powered by live Sri Lankan market data · ±5% accuracy
            </p>
          </div>

        </form>
      </div>
    </div>
  );
}