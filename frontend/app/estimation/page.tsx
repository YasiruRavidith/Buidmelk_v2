"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../hooks/useAuth";

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
      const response = await fetch("http://localhost:8000/api/estimations/calculate/", {
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
        // Pass data via localStorage/sessionStorage for the results page, or url params
        sessionStorage.setItem("latest_estimate", JSON.stringify(result.data));
        router.push("/estimation/result");
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
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6 py-24">
      <div className="w-full max-w-7xl bg-white border border-stone-200 rounded-none p-10 shadow-sm">
        <div className="text-center mb-10">
          <p className="text-orange-600 font-semibold tracking-widest uppercase text-sm mb-3">AI Engine</p>
          <h1 className="font-serif text-4xl text-stone-900">Smart Construction Estimator</h1>
          <p className="text-stone-500 mt-3">Calculate material and labor costs based on live Sri Lankan market rates.</p>
        </div>

        <form onSubmit={handleEstimate} className="space-y-8">
          <section className="space-y-4">
            <h2 className="text-sm uppercase tracking-[0.2em] text-stone-500 font-semibold">Project Details</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-stone-500 font-medium text-sm tracking-wide mb-2">PROJECT TITLE</label>
                <input
                  required
                  type="text"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  className="w-full border border-stone-300 rounded-lg px-4 py-3 bg-stone-50 text-stone-900 placeholder:text-stone-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-stone-500 font-medium text-sm tracking-wide mb-2">LAND SIZE</label>
                <input
                  type="text"
                  value={landSize}
                  onChange={(e) => setLandSize(e.target.value)}
                  placeholder="e.g. 10 perch"
                  className="w-full border border-stone-300 rounded-lg px-4 py-3 bg-stone-50 text-stone-900 placeholder:text-stone-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-stone-500 font-medium text-sm tracking-wide mb-2">HOUSE SIZE</label>
                <input
                  type="text"
                  value={houseSize}
                  onChange={(e) => setHouseSize(e.target.value)}
                  placeholder="e.g. 1600 sqft"
                  className="w-full border border-stone-300 rounded-lg px-4 py-3 bg-stone-50 text-stone-900 placeholder:text-stone-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-stone-500 font-medium text-sm tracking-wide mb-2">TOTAL AREA (SQFT)</label>
                <input
                  required
                  type="number"
                  min="100"
                  value={sqft}
                  onChange={(e) => setSqft(e.target.value)}
                  placeholder="e.g. 1500"
                  className="w-full border border-stone-300 rounded-lg px-4 py-3 bg-stone-50 text-stone-900 placeholder:text-stone-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-stone-500 font-medium text-sm tracking-wide mb-2">QUALITY LEVEL</label>
                <select
                  value={quality}
                  onChange={(e) => setQuality(e.target.value)}
                  className="w-full border border-stone-300 rounded-lg px-4 py-3 bg-stone-50 text-stone-900 placeholder:text-stone-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                >
                  <option value="STANDARD">Standard Finish</option>
                  <option value="LUXURY">Premium / Luxury Finish</option>
                </select>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-sm uppercase tracking-[0.2em] text-stone-500 font-semibold">Building Details</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-stone-500 font-medium text-sm tracking-wide mb-2">NUMBER OF FLOORS</label>
                <input
                  required
                  type="number"
                  min="1"
                  value={floors}
                  onChange={(e) => setFloors(e.target.value)}
                  className="w-full border border-stone-300 rounded-lg px-4 py-3 bg-stone-50 text-stone-900 placeholder:text-stone-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-stone-500 font-medium text-sm tracking-wide mb-2">ROOMS</label>
                <input
                  required
                  type="number"
                  min="1"
                  value={rooms}
                  onChange={(e) => setRooms(e.target.value)}
                  className="w-full border border-stone-300 rounded-lg px-4 py-3 bg-stone-50 text-stone-900 placeholder:text-stone-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-stone-500 font-medium text-sm tracking-wide mb-2">BATHROOMS</label>
                <input
                  type="number"
                  min="0"
                  value={bathrooms}
                  onChange={(e) => setBathrooms(e.target.value)}
                  className="w-full border border-stone-300 rounded-lg px-4 py-3 bg-stone-50 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-stone-900"
                />
              </div>

              <div>
                <label className="block text-stone-500 font-medium text-sm tracking-wide mb-2">KITCHENS</label>
                <input
                  type="number"
                  min="0"
                  value={kitchenCount}
                  onChange={(e) => setKitchenCount(e.target.value)}
                  className="w-full border border-stone-300 rounded-lg px-4 py-3 bg-stone-50 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-stone-900"
                />
              </div>

              <div>
                <label className="block text-stone-500 font-medium text-sm tracking-wide mb-2">GARAGE</label>
                <select value={garage} onChange={(e) => setGarage(e.target.value)} className="w-full border border-stone-300 rounded-lg px-4 py-3 bg-stone-50 text-stone-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none">
                  <option value="No">No</option>
                  <option value="Single">Single</option>
                  <option value="Double">Double</option>
                </select>
              </div>

              <div>
                <label className="block text-stone-500 font-medium text-sm tracking-wide mb-2">BALCONY</label>
                <select value={balcony} onChange={(e) => setBalcony(e.target.value)} className="w-full border border-stone-300 rounded-lg px-4 py-3 bg-stone-50 text-stone-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none">
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-sm uppercase tracking-[0.2em] text-stone-500 font-semibold">Material & Finish Preferences</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-stone-500 font-medium text-sm tracking-wide mb-2">CEMENT BRAND</label>
                <select value={cementBrand} onChange={(e) => setCementBrand(e.target.value)} className="w-full border border-stone-300 rounded-lg px-4 py-3 bg-stone-50 text-stone-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none">
                  <option value="Sanstha">Sanstha</option>
                  <option value="Lanwa">Lanwa</option>
                  <option value="Tokyo">Tokyo</option>
                  <option value="Holcim">Holcim</option>
                  <option value="Maga">Maga</option>
                </select>
              </div>

              <div>
                <label className="block text-stone-500 font-medium text-sm tracking-wide mb-2">CEMENT TYPE</label>
                <select value={cementType} onChange={(e) => setCementType(e.target.value)} className="w-full border border-stone-300 rounded-lg px-4 py-3 bg-stone-50 text-stone-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none">
                  <option value="SLS Certified Cement">SLS Certified Cement</option>
                  <option value="Ordinary Portland Cement">Ordinary Portland Cement</option>
                  <option value="Ready Mix">Ready Mix</option>
                </select>
              </div>

              <div>
                <label className="block text-stone-500 font-medium text-sm tracking-wide mb-2">SAND TYPE</label>
                <select value={sandType} onChange={(e) => setSandType(e.target.value)} className="w-full border border-stone-300 rounded-lg px-4 py-3 bg-stone-50 text-stone-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none">
                  <option value="River Sand">River Sand</option>
                  <option value="Manufactured Sand">Manufactured Sand</option>
                </select>
              </div>

              <div>
                <label className="block text-stone-500 font-medium text-sm tracking-wide mb-2">METAL</label>
                <select value={metalType} onChange={(e) => setMetalType(e.target.value)} className="w-full border border-stone-300 rounded-lg px-4 py-3 bg-stone-50 text-stone-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none">
                  <option value="1/2 metal">1/2 metal</option>
                  <option value="3/4 metal">3/4 metal</option>
                </select>
              </div>

              <div>
                <label className="block text-stone-500 font-medium text-sm tracking-wide mb-2">ROOF TYPE</label>
                <select value={roofType} onChange={(e) => setRoofType(e.target.value)} className="w-full border border-stone-300 rounded-lg px-4 py-3 bg-stone-50 text-stone-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none">
                  <option value="Roofing Sheets">Roofing Sheets</option>
                  <option value="Roof Tiles">Roof Tiles</option>
                  <option value="Steel Roof Structure">Steel Roof Structure</option>
                </select>
              </div>

              <div>
                <label className="block text-stone-500 font-medium text-sm tracking-wide mb-2">INTERIOR LEVEL</label>
                <select value={interiorLevel} onChange={(e) => setInteriorLevel(e.target.value)} className="w-full border border-stone-300 rounded-lg px-4 py-3 bg-stone-50 text-stone-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none">
                  <option value="Standard">Standard</option>
                  <option value="Premium">Premium</option>
                  <option value="Luxury">Luxury</option>
                </select>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-sm uppercase tracking-[0.2em] text-stone-500 font-semibold">Timeline & Legal</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-stone-500 font-medium text-sm tracking-wide mb-2">TARGET TIMELINE</label>
                <select value={timelineTarget} onChange={(e) => setTimelineTarget(e.target.value)} className="w-full border border-stone-300 rounded-lg px-4 py-3 bg-stone-50 text-stone-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none">
                  <option value="3-6 Months">3-6 Months</option>
                  <option value="6-9 Months">6-9 Months</option>
                  <option value="9-12 Months">9-12 Months</option>
                  <option value="12+ Months">12+ Months</option>
                </select>
              </div>

              <div>
                <label className="block text-stone-500 font-medium text-sm tracking-wide mb-2">LEGAL APPROVAL REQUIRED</label>
                <select value={legalApprovalRequired} onChange={(e) => setLegalApprovalRequired(e.target.value)} className="w-full border border-stone-300 rounded-lg px-4 py-3 bg-stone-50 text-stone-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none">
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-stone-500 font-medium text-sm tracking-wide mb-2">ADDITIONAL NOTES</label>
                <textarea
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  rows={4}
                  placeholder="Share site conditions, design preferences, or special requirements"
                  className="w-full border border-stone-300 rounded-lg px-4 py-3 bg-stone-50 text-stone-900 placeholder:text-stone-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                />
              </div>
            </div>
          </section>

          <button type="submit" disabled={loading} className="w-full btn-primary py-4 text-lg mt-4 disabled:opacity-70">
            {loading ? "Calculating..." : "Generate Instantly"}
          </button>
        </form>
      </div>
    </div>
  );
}