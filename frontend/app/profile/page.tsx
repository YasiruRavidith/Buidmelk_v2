"use client";

import { useCallback, useEffect, useMemo, useState, useRef, ChangeEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Camera, Upload, CheckCircle2, User, Trash2, Loader2 } from "lucide-react";
import DashboardShell from "../dashboard/components/DashboardShell";
import { useAuth } from "../../hooks/useAuth";
import { normalizeProfessionType } from "../dashboard/utils";

type LocationOption = {
  province: string;
  districts: string[];
};

const PROFESSIONS = [
  { label: "Contractor", value: "CONTRACTOR" },
  { label: "Engineer", value: "ENGINEER" },
  { label: "Lawyer", value: "LAWYER" },
  { label: "Architect", value: "ARCHITECT" },
  { label: "QS (Quantity Surveyor)", value: "QS" },
  { label: "Hardware Owner", value: "HARDWARE" },
  { label: "Worker", value: "WORKER" },
  { label: "Electrician", value: "ELECTRICIAN" },
  { label: "Plumber", value: "PLUMBER" },
  { label: "Welder", value: "WELDER" },
  { label: "Painter", value: "PAINTER" },
];

const splitLocation = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return { province: "", district: "" };

  const hyphenParts = trimmed.split(" - ");
  if (hyphenParts.length >= 2) {
    return {
      province: hyphenParts[0].trim(),
      district: hyphenParts.slice(1).join(" - ").trim(),
    };
  }

  const commaParts = trimmed.split(",");
  if (commaParts.length >= 2) {
    return {
      province: commaParts[0].trim(),
      district: commaParts.slice(1).join(",").trim(),
    };
  }

  return { province: "", district: trimmed };
};

const normalizeMediaUrl = (baseUrl: string, value?: string) => {
  if (!value) return "";
  if (value.startsWith("http")) {
    if (value.startsWith("http://") && value.includes("railway.app")) {
      return value.replace("http://", "https://");
    }
    return value;
  }
  if (value.startsWith("/")) return `${baseUrl}${value}`;
  return `${baseUrl}/${value}`;
};

export default function ProfilePage() {
  const { user, loading, uploadProfilePhoto, profilePhoto } = useAuth();
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000/api";
  const backendBaseUrl = backendUrl.replace(/\/?api\/?$/, "");
  const pathname = usePathname();

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoMsg, setPhotoMsg] = useState("");
  const [displayedPhoto, setDisplayedPhoto] = useState<string | null>(null);

  const [role, setRole] = useState<"CLIENT" | "PROFESSIONAL" | "ADMIN" | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [professionType, setProfessionType] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [yearsOfExperience, setYearsOfExperience] = useState("");
  const [about, setAbout] = useState("");
  const [skillsSpecialization, setSkillsSpecialization] = useState("");
  const [certifications, setCertifications] = useState("");
  const [education, setEducation] = useState("");
  const [serviceAreas, setServiceAreas] = useState("");
  const [pricingRange, setPricingRange] = useState("");
  const [yearsInBusiness, setYearsInBusiness] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [availability, setAvailability] = useState("");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [portfolioImages, setPortfolioImages] = useState<Array<{ id: number; image_url?: string; image?: string }>>([]);
  const [certificationImages, setCertificationImages] = useState<Array<{ id: number; image_url?: string; image?: string }>>([]);
  const [portfolioUploads, setPortfolioUploads] = useState<File[]>([]);
  const [certificationUploads, setCertificationUploads] = useState<File[]>([]);
  const [deletingAssetId, setDeletingAssetId] = useState<number | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLocationsLoading, setIsLocationsLoading] = useState(true);

  const handleDeleteAsset = async (imageType: "portfolio" | "certification", imageId: number) => {
    if (!user) return;
    if (!confirm(`Are you sure you want to delete this ${imageType} photo?`)) return;

    setDeletingAssetId(imageId);
    try {
      const token = await user.getIdToken();
      const response = await fetch(`${backendUrl}/users/profile/assets/delete/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          token,
          image_type: imageType,
          image_id: imageId,
        }),
      });

      if (response.ok) {
        if (imageType === "portfolio") {
          setPortfolioImages((prev) => prev.filter((img) => img.id !== imageId));
        } else {
          setCertificationImages((prev) => prev.filter((img) => img.id !== imageId));
        }
      } else {
        const data = await response.json();
        alert(data.error || `Failed to delete ${imageType} image.`);
      }
    } catch (err) {
      console.error("Error deleting asset:", err);
      alert("An unexpected error occurred while deleting the image.");
    } finally {
      setDeletingAssetId(null);
    }
  };

  const handleAvatarSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file.");
      return;
    }

    setPhotoUploading(true);
    setPhotoMsg("Saving photo to server database...");

    try {
      if (uploadProfilePhoto) {
        const savedUrl = await uploadProfilePhoto(file);
        if (savedUrl) {
          setDisplayedPhoto(savedUrl);
          setPhotoMsg("Profile picture saved to database successfully!");
          setTimeout(() => setPhotoMsg(""), 4000);
        }
      }
    } catch (err) {
      console.error("Failed to save profile photo to database", err);
      alert("Failed to upload profile photo to Python server database.");
    } finally {
      setPhotoUploading(false);
    }
  };

  const isHardware = role === "PROFESSIONAL" && normalizeProfessionType(professionType) === "HARDWARE";

  const districtOptions = useMemo(() => {
    return locations.find((item) => item.province === province)?.districts || [];
  }, [locations, province]);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await fetch(`${backendUrl}/users/locations/`);
        const result = await response.json();
        if (response.ok) {
          setLocations(result.locations || []);
        }
      } catch (error) {
        console.error("Failed to load locations", error);
      } finally {
        setIsLocationsLoading(false);
      }
    };

    fetchLocations();
  }, [backendUrl]);

  const loadProfile = useCallback(async () => {
    if (loading) return;
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const token = await user.getIdToken();
      const response = await fetch(`${backendUrl}/users/auth/verify/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const result = await response.json();
      if (response.ok && result.user) {
        const backendUser = result.user;
        const photo = backendUser.profile_image_url || backendUser.profile_image;
        if (photo) {
          setDisplayedPhoto(normalizeMediaUrl(backendBaseUrl, photo));
        }
        setRole(backendUser.role || null);
        setPhoneNumber(backendUser.phone_number || "");

        const profile = backendUser.professional_profile;
        if (profile) {
          setProfessionType(profile.profession_type || "");
          setCompanyName(profile.company_name || "");
          setYearsOfExperience(profile.years_of_experience?.toString() || "");
          setAbout(profile.about || "");
          setSkillsSpecialization(profile.skills_specialization || "");
          setCertifications(profile.certifications || "");
          setEducation(profile.education || "");
          setServiceAreas((profile.service_areas || []).join(", "));
          setPricingRange(profile.pricing_range || "");
          setYearsInBusiness(profile.years_in_business?.toString() || "");
          setTeamSize(profile.team_size?.toString() || "");
          setAvailability(profile.availability || "");
          setPortfolioImages(profile.portfolio_images || []);
          setCertificationImages(profile.certification_images || []);

          const parsedLocation = splitLocation(profile.location || "");
          setProvince(parsedLocation.province);
          setDistrict(parsedLocation.district);

        }
      }
    } catch (error) {
      console.error("Failed to load profile", error);
    } finally {
      setIsLoading(false);
    }
  }, [backendUrl, loading, user]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (profilePhoto) {
      setDisplayedPhoto(profilePhoto);
    }
  }, [profilePhoto]);

  const uploadAssets = async (token: string) => {
    const uploadBatch = async (imageType: string, files: File[], single = false) => {
      const formData = new FormData();
      formData.append("token", token);
      formData.append("image_type", imageType);

      if (single) {
        if (files[0]) {
          formData.append("image", files[0]);
        }
      } else {
        files.forEach((file) => formData.append("images", file));
      }

      const response = await fetch(`${backendUrl}/users/profile/assets/`, {
        method: "POST",
        body: formData,
      });

      return response.ok;
    };

    const results: boolean[] = [];

    if (portfolioUploads.length) {
      results.push(await uploadBatch("portfolio", portfolioUploads));
    }
    if (certificationUploads.length) {
      results.push(await uploadBatch("certification", certificationUploads));
    }
    return results.every(Boolean);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!user) {
      alert("Please sign in to continue.");
      return;
    }

    if (role === "PROFESSIONAL") {
      if (!professionType) {
        alert("Please select your profession type.");
        return;
      }

      if (!province || !district) {
        alert("Please select your province and district.");
        return;
      }
    }

    setIsSaving(true);

    try {
      const token = await user.getIdToken();
      const payload: Record<string, unknown> = {
        token,
        phone_number: phoneNumber,
      };

      if (role === "PROFESSIONAL") {
        const trimmedServiceAreas = serviceAreas
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);

        payload.profession_type = professionType;
        payload.company_name = companyName;
        payload.about = about;
        payload.skills_specialization = skillsSpecialization;
        payload.certifications = certifications;
        payload.education = education;
        payload.service_areas = trimmedServiceAreas;
        payload.pricing_range = pricingRange;
        payload.availability = availability;
        payload.location = province && district ? `${province} - ${district}` : "";

        if (yearsOfExperience.trim() !== "") {
          payload.years_of_experience = Number(yearsOfExperience);
        }
        if (yearsInBusiness.trim() !== "") {
          payload.years_in_business = Number(yearsInBusiness);
        }
        if (teamSize.trim() !== "") {
          payload.team_size = Number(teamSize);
        }

      }

      const response = await fetch(`${backendUrl}/users/profile/update/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) {
        alert(result.error || "Failed to update profile.");
        return;
      }

      const assetsUploaded = await uploadAssets(token);

      if (!assetsUploaded) {
        alert("Profile saved, but some images failed to upload.");
      } else {
        alert("Profile updated successfully.");
      }

      setPortfolioUploads([]);
      setCertificationUploads([]);
      await loadProfile();
    } catch (error) {
      console.error("Profile update failed", error);
      alert("Network Error");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6 py-24">
        <div className="text-stone-600 text-sm">Loading profile...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6 py-24">
        <div className="bg-white border border-stone-200 rounded-2xl p-10 text-center space-y-4">
          <h1 className="font-serif text-3xl text-stone-900">Sign in required</h1>
          <p className="text-stone-500">Please log in to manage your profile details.</p>
          <Link href="/login" className="btn-primary inline-flex justify-center">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  const navItems = [
    {
      label: "Overview",
      href: "/dashboard",
      description: "Dashboard summary",
      isActive: pathname === "/dashboard",
    },
    {
      label: "Public Profile",
      href: "/profile",
      description: "Update your public profile",
      isActive: pathname === "/profile",
    },
    ...(isHardware
      ? [
          {
            label: "Manage Shops",
            href: "/dashboard/hardware/shops",
            description: "Add or update shop locations",
            isActive: pathname === "/dashboard/hardware/shops",
          },
        ]
      : []),
    {
      label: "Pending Requests",
      href: "/dashboard/requests",
      description: "New inquiries and tasks",
      isActive: pathname === "/dashboard/requests",
    },
    {
      label: "Profile Settings",
      href: "/settings",
      description: "Account preferences",
      isActive: pathname === "/settings",
    },
  ];

  return (
    <DashboardShell navItems={navItems}>
      <div className="py-6 px-2 sm:px-4">
        <div className="w-full max-w-5xl mx-auto space-y-8">
          <header className="flex flex-col gap-2 border-b border-[#efe6df] pb-6">
            <p className="text-[#8B4434] font-semibold tracking-widest uppercase text-xs">Profile Workspace</p>
            <h1 className="font-serif text-3xl sm:text-4xl text-[#281713]">Profile Details</h1>
            <p className="text-stone-500 text-sm">Keep your contact details, profile photo, and professional profile up to date.</p>
          </header>

          {role === null && (
            <div className="bg-white border border-stone-200 rounded-none p-6 text-stone-600">
              Your role is not set yet. Please complete onboarding first.
              <Link href="/onboarding" className="text-[#8B4434] font-semibold ml-2">
                Complete onboarding
              </Link>
            </div>
          )}

          <form onSubmit={handleSave} className="bg-white border border-[#efe6df] rounded-none p-6 sm:p-10 space-y-10 shadow-sm">
            {/* Profile Picture Upload Section */}
            <section className="p-6 bg-[#fcfaf9] border border-[#efe6df] rounded-none flex flex-col sm:flex-row items-center gap-6">
              <input
                type="file"
                ref={avatarInputRef}
                onChange={handleAvatarSelect}
                accept="image/*"
                className="hidden"
              />
              <div
                onClick={() => avatarInputRef.current?.click()}
                className="relative group cursor-pointer w-24 h-24 rounded-full overflow-hidden border-2 border-[#8B4434]/40 shrink-0 shadow-sm"
              >
                {displayedPhoto || profilePhoto || user?.photoURL ? (
                  <img
                    src={displayedPhoto || profilePhoto || user?.photoURL || ""}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={() => setDisplayedPhoto(null)}
                  />
                ) : (
                  <div className="w-full h-full bg-[#f3ebe4] flex items-center justify-center">
                    <User className="w-10 h-10 text-[#8B4434]" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-[10px] font-semibold uppercase tracking-wider gap-1">
                  <Camera className="w-4 h-4" />
                  <span>Change</span>
                </div>
                {photoUploading && (
                  <div className="absolute inset-0 bg-black/60 text-white flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>

              <div className="space-y-2 text-center sm:text-left flex-1">
                <h3 className="font-serif text-xl font-semibold text-[#281713]">Profile Photo</h3>
                <p className="text-xs text-[#606060] leading-relaxed">
                  Upload a clear professional photo or business logo. JPG, PNG or WebP under 5MB.
                </p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="btn-secondary text-xs px-4 py-2 flex items-center gap-2"
                  >
                    <Upload className="w-3.5 h-3.5" /> Select Image
                  </button>
                  {photoMsg && (
                    <span className="text-xs text-[#8B4434] font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {photoMsg}
                    </span>
                  )}
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-2xl text-stone-900">Contact Details</h2>
                {role && (
                  <span className="px-3 py-1 text-xs uppercase tracking-wider bg-stone-100 text-stone-600 rounded-full">
                    {role === "PROFESSIONAL" ? "Professional" : role === "CLIENT" ? "Client" : "Admin"}
                  </span>
                )}
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-stone-500 font-medium text-sm tracking-wide mb-2">FULL NAME</label>
                  <input
                    value={user.displayName || ""}
                    disabled
                    className="w-full border border-stone-300 text-stone-500 rounded-lg px-4 py-3 bg-stone-50"
                  />
                </div>
                <div>
                  <label className="block text-stone-500 font-medium text-sm tracking-wide mb-2">EMAIL</label>
                  <input
                    value={user.email || ""}
                    disabled
                    className="w-full border border-stone-300 text-stone-500 rounded-lg px-4 py-3 bg-stone-50"
                  />
                </div>
                <div>
                  <label className="block text-stone-500 font-medium text-sm tracking-wide mb-2">PHONE NUMBER</label>
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(event) => setPhoneNumber(event.target.value)}
                    placeholder="e.g., +94 77 123 4567"
                    className="w-full border border-stone-300 text-stone-700 rounded-lg px-4 py-3 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
                  />
                </div>
              </div>
            </section>

            {role === "PROFESSIONAL" && (
              <section className="space-y-6">
                <h2 className="font-serif text-2xl text-stone-900">Professional Profile</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-stone-500 font-medium text-sm tracking-wide mb-2">PROFESSION</label>
                    <select
                      required
                      value={professionType}
                      onChange={(event) => setProfessionType(event.target.value)}
                      className="w-full border border-stone-300 text-stone-700 rounded-lg px-4 py-3 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
                    >
                      <option value="" disabled>Select your profession</option>
                      {PROFESSIONS.map((prof) => (
                        <option key={prof.value} value={prof.value}>{prof.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-stone-500 font-medium text-sm tracking-wide mb-2">COMPANY NAME</label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(event) => setCompanyName(event.target.value)}
                      placeholder="Optional"
                      className="w-full border border-stone-300 text-stone-700 rounded-lg px-4 py-3 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-500 font-medium text-sm tracking-wide mb-2">PROVINCE</label>
                    <select
                      required
                      value={province}
                      onChange={(event) => {
                        setProvince(event.target.value);
                        setDistrict("");
                      }}
                      disabled={isLocationsLoading}
                      className="w-full border border-stone-300 text-stone-700 rounded-lg px-4 py-3 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors disabled:opacity-70"
                    >
                      <option value="" disabled>{isLocationsLoading ? "Loading..." : "Select province"}</option>
                      {locations.map((item) => (
                        <option key={item.province} value={item.province}>{item.province}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-stone-500 font-medium text-sm tracking-wide mb-2">DISTRICT</label>
                    <select
                      required
                      value={district}
                      onChange={(event) => setDistrict(event.target.value)}
                      disabled={!province || isLocationsLoading}
                      className="w-full border border-stone-300 text-stone-700 rounded-lg px-4 py-3 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors disabled:opacity-70"
                    >
                      <option value="" disabled>{!province ? "Select province first" : "Select district"}</option>
                      {districtOptions.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-stone-500 font-medium text-sm tracking-wide mb-2">YEARS OF EXPERIENCE</label>
                    <input
                      type="number"
                      min="0"
                      value={yearsOfExperience}
                      onChange={(event) => setYearsOfExperience(event.target.value)}
                      placeholder="Optional"
                      className="w-full border border-stone-300 text-stone-700 rounded-lg px-4 py-3 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-500 font-medium text-sm tracking-wide mb-2">SKILLS / SPECIALIZATION</label>
                    <input
                      type="text"
                      value={skillsSpecialization}
                      onChange={(event) => setSkillsSpecialization(event.target.value)}
                      placeholder="Optional"
                      className="w-full border border-stone-300 text-stone-700 rounded-lg px-4 py-3 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-500 font-medium text-sm tracking-wide mb-2">SERVICE AREAS</label>
                    <input
                      type="text"
                      value={serviceAreas}
                      onChange={(event) => setServiceAreas(event.target.value)}
                      placeholder="e.g., Colombo, Gampaha"
                      className="w-full border border-stone-300 text-stone-700 rounded-lg px-4 py-3 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-500 font-medium text-sm tracking-wide mb-2">PRICING RANGE</label>
                    <input
                      type="text"
                      value={pricingRange}
                      onChange={(event) => setPricingRange(event.target.value)}
                      placeholder="Optional"
                      className="w-full border border-stone-300 text-stone-700 rounded-lg px-4 py-3 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-500 font-medium text-sm tracking-wide mb-2">AVAILABILITY</label>
                    <input
                      type="text"
                      value={availability}
                      onChange={(event) => setAvailability(event.target.value)}
                      placeholder="Optional"
                      className="w-full border border-stone-300 text-stone-700 rounded-lg px-4 py-3 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-500 font-medium text-sm tracking-wide mb-2">YEARS IN BUSINESS</label>
                    <input
                      type="number"
                      min="0"
                      value={yearsInBusiness}
                      onChange={(event) => setYearsInBusiness(event.target.value)}
                      placeholder="Optional"
                      className="w-full border border-stone-300 text-stone-700 rounded-lg px-4 py-3 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-500 font-medium text-sm tracking-wide mb-2">TEAM SIZE</label>
                    <input
                      type="number"
                      min="0"
                      value={teamSize}
                      onChange={(event) => setTeamSize(event.target.value)}
                      placeholder="Optional"
                      className="w-full border border-stone-300 text-stone-700 rounded-lg px-4 py-3 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-stone-500 font-medium text-sm tracking-wide mb-2">ABOUT</label>
                  <textarea
                    value={about}
                    onChange={(event) => setAbout(event.target.value)}
                    placeholder="Share a short bio or project highlights"
                    rows={5}
                    className="w-full border border-stone-300 text-stone-700 rounded-lg px-4 py-3 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-stone-500 font-medium text-sm tracking-wide mb-2">CERTIFICATIONS / LICENSES</label>
                    <textarea
                      value={certifications}
                      onChange={(event) => setCertifications(event.target.value)}
                      placeholder="Optional"
                      rows={4}
                      className="w-full border border-stone-300 text-stone-700 rounded-lg px-4 py-3 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-500 font-medium text-sm tracking-wide mb-2">EDUCATION</label>
                    <textarea
                      value={education}
                      onChange={(event) => setEducation(event.target.value)}
                      placeholder="Optional"
                      rows={4}
                      className="w-full border border-stone-300 text-stone-700 rounded-lg px-4 py-3 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-serif text-xl text-stone-900">Media</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="block text-stone-500 font-medium text-sm tracking-wide">PORTFOLIO IMAGES</label>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(event) => setPortfolioUploads(Array.from(event.target.files || []))}
                        className="w-full text-sm text-stone-500"
                      />
                      {portfolioImages.length > 0 && (
                        <div className="grid grid-cols-3 gap-3">
                          {portfolioImages.map((image) => (
                            <div key={image.id} className="group relative h-20 rounded-lg border border-stone-200 overflow-hidden bg-stone-50">
                              {image.image_url || image.image ? (
                                <img
                                  src={normalizeMediaUrl(backendBaseUrl, image.image_url || image.image)}
                                  alt="Portfolio"
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center text-xs text-stone-400">No image</div>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDeleteAsset("portfolio", image.id)}
                                disabled={deletingAssetId === image.id}
                                className="absolute top-1 right-1 bg-red-600/90 hover:bg-red-700 text-white p-1 rounded-full opacity-80 group-hover:opacity-100 transition-opacity shadow-xs cursor-pointer"
                                title="Delete portfolio photo"
                              >
                                {deletingAssetId === image.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Trash2 className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="space-y-3">
                      <label className="block text-stone-500 font-medium text-sm tracking-wide">CERTIFICATION IMAGES</label>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(event) => setCertificationUploads(Array.from(event.target.files || []))}
                        className="w-full text-sm text-stone-500"
                      />
                      {certificationImages.length > 0 && (
                        <div className="grid grid-cols-3 gap-3">
                          {certificationImages.map((image) => (
                            <div key={image.id} className="group relative h-20 rounded-lg border border-stone-200 overflow-hidden bg-stone-50">
                              {image.image_url || image.image ? (
                                <img
                                  src={normalizeMediaUrl(backendBaseUrl, image.image_url || image.image)}
                                  alt="Certification"
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center text-xs text-stone-400">No image</div>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDeleteAsset("certification", image.id)}
                                disabled={deletingAssetId === image.id}
                                className="absolute top-1 right-1 bg-red-600/90 hover:bg-red-700 text-white p-1 rounded-full opacity-80 group-hover:opacity-100 transition-opacity shadow-xs cursor-pointer"
                                title="Delete certificate photo"
                              >
                                {deletingAssetId === image.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Trash2 className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {isHardware && (
                  <div className="rounded-2xl border border-stone-200 bg-stone-50 p-6 flex flex-col gap-4">
                    <h3 className="font-serif text-xl text-stone-900">Hardware Shops</h3>
                    <p className="text-stone-600 text-sm">
                      Manage shop details, banners, and gallery images from your hardware dashboard.
                    </p>
                    <Link href="/dashboard/hardware/shops" className="btn-secondary w-fit">
                      Manage Shops
                    </Link>
                  </div>
                )}
              </section>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="btn-primary px-8 py-3 disabled:opacity-70"
              >
                {isSaving ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardShell>
  );
}

