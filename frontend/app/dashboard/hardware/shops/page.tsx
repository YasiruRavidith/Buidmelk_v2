"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../../../../hooks/useAuth";
import DashboardShell from "../../components/DashboardShell";

type HardwareShopImage = {
  id: number;
  image_url?: string;
  image?: string;
};

type HardwareShop = {
  id: number;
  shop_name: string;
  shop_address?: string;
  shop_phone?: string;
  shop_email?: string;
  business_registration?: string;
  opening_hours?: string;
  services?: string;
  google_maps_link?: string;
  banner_image_url?: string;
  banner_image?: string;
  gallery_images?: HardwareShopImage[];
};

type MaterialOption = {
  id: number;
  name: string;
  unit: string;
  unit_price: string;
  category_name?: string;
};

type HardwareShopItem = {
  id: number;
  material: number;
  material_name: string;
  material_unit: string;
  material_unit_price: string;
  material_category_name?: string;
  image_url?: string;
  stock_quantity: number;
  is_active: boolean;
};

const normalizeMediaUrl = (baseUrl: string, value?: string) => {
  if (!value) return "";
  if (value.startsWith("http")) return value;
  if (value.startsWith("/")) return `${baseUrl}${value}`;
  return `${baseUrl}/${value}`;
};

export default function HardwareShopsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000/api";
  const backendBaseUrl = useMemo(() => backendUrl.replace(/\/?api\/?$/, ""), [backendUrl]);

  const navItems = [
    {
      label: "Overview",
      href: "/dashboard/hardware",
      description: "Dashboard summary",
      isActive: pathname === "/dashboard/hardware",
    },
    {
      label: "Public Profile",
      href: "/profile",
      description: "Update your public profile",
      isActive: pathname === "/profile",
    },
    {
      label: "Manage Shops",
      href: "/dashboard/hardware/shops",
      description: "Add or update shop locations",
      isActive: pathname === "/dashboard/hardware/shops",
    },
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

  const [shops, setShops] = useState<HardwareShop[]>([]);
  const [selectedShopId, setSelectedShopId] = useState<number | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingShop, setIsUpdatingShop] = useState(false);
  const [isUploading, setIsUploading] = useState<Record<number, boolean>>({});
  const [isItemsLoading, setIsItemsLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [editError, setEditError] = useState("");
  const [itemsError, setItemsError] = useState("");

  const [shopName, setShopName] = useState("");
  const [shopAddress, setShopAddress] = useState("");
  const [shopPhone, setShopPhone] = useState("");
  const [shopEmail, setShopEmail] = useState("");
  const [businessRegistration, setBusinessRegistration] = useState("");
  const [openingHours, setOpeningHours] = useState("");
  const [services, setServices] = useState("");
  const [googleMapsLink, setGoogleMapsLink] = useState("");

  const [editShopName, setEditShopName] = useState("");
  const [editShopAddress, setEditShopAddress] = useState("");
  const [editShopPhone, setEditShopPhone] = useState("");
  const [editShopEmail, setEditShopEmail] = useState("");
  const [editBusinessRegistration, setEditBusinessRegistration] = useState("");
  const [editOpeningHours, setEditOpeningHours] = useState("");
  const [editServices, setEditServices] = useState("");
  const [editGoogleMapsLink, setEditGoogleMapsLink] = useState("");

  const [bannerUploads, setBannerUploads] = useState<Record<number, File | null>>({});
  const [galleryUploads, setGalleryUploads] = useState<Record<number, File[]>>({});

  const [materials, setMaterials] = useState<MaterialOption[]>([]);
  const [isMaterialsLoading, setIsMaterialsLoading] = useState(true);
  const [selectedMaterialId, setSelectedMaterialId] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");
  const [shopItems, setShopItems] = useState<Record<number, HardwareShopItem[]>>({});
  const [itemStockEdits, setItemStockEdits] = useState<Record<number, string>>({});

  const activeShop = shops.find((shop) => shop.id === selectedShopId) || null;
  const selectedMaterial = materials.find((item) => item.id === Number(selectedMaterialId));

  const loadShops = async (token: string) => {
    const response = await fetch(`${backendUrl}/users/hardware/shops/list/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });

    const result = await response.json();
    if (response.ok) {
      setShops(result.shops || []);
    } else {
      throw new Error(result.error || "Unable to load shops");
    }
  };

  const loadMaterials = async () => {
    try {
      const response = await fetch(`${backendUrl}/marketplace/materials/`);
      const result = await response.json();
      if (response.ok) {
        setMaterials(result || []);
      }
    } catch (error) {
      console.error("Failed to load materials", error);
    } finally {
      setIsMaterialsLoading(false);
    }
  };

  const loadShopItems = async (token: string, shopId: number) => {
    setIsItemsLoading(true);
    setItemsError("");

    try {
      const response = await fetch(`${backendUrl}/users/hardware/shops/${shopId}/items/list/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const result = await response.json();
      if (response.ok) {
        setShopItems((prev) => ({ ...prev, [shopId]: result.items || [] }));
      } else {
        setItemsError(result.error || "Unable to load items.");
      }
    } catch (error) {
      console.error("Failed to load shop items", error);
      setItemsError("Unable to load items.");
    } finally {
      setIsItemsLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      if (loading) return;

      if (!user) {
        router.replace("/login");
        return;
      }

      try {
        const token = await user.getIdToken();
        const response = await fetch(`${backendUrl}/users/auth/verify/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const result = await response.json();
        const backendUser = result?.user;

        if (!response.ok || !backendUser) {
          router.replace("/login");
          return;
        }

        if (backendUser.role !== "PROFESSIONAL" || backendUser.professional_profile?.profession_type !== "HARDWARE") {
          router.replace("/dashboard");
          return;
        }

        await Promise.all([loadShops(token), loadMaterials()]);
      } catch (error) {
        console.error("Failed to load hardware shops", error);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [backendUrl, loading, router, user]);

  useEffect(() => {
    if (!selectedShopId && shops.length > 0) {
      setSelectedShopId(shops[0].id);
    }
  }, [shops, selectedShopId]);

  useEffect(() => {
    if (!activeShop) {
      return;
    }

    setEditShopName(activeShop.shop_name || "");
    setEditShopAddress(activeShop.shop_address || "");
    setEditShopPhone(activeShop.shop_phone || "");
    setEditShopEmail(activeShop.shop_email || "");
    setEditBusinessRegistration(activeShop.business_registration || "");
    setEditOpeningHours(activeShop.opening_hours || "");
    setEditServices(activeShop.services || "");
    setEditGoogleMapsLink(activeShop.google_maps_link || "");
  }, [activeShop]);

  useEffect(() => {
    const fetchItems = async () => {
      if (!user || !selectedShopId) return;
      try {
        const token = await user.getIdToken();
        await loadShopItems(token, selectedShopId);
      } catch (error) {
        console.error("Failed to refresh items", error);
      }
    };

    fetchItems();
  }, [selectedShopId, user]);

  const handleCreateShop = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError("");

    if (!user) {
      return;
    }

    if (!shopName.trim()) {
      setFormError("Shop name is required.");
      return;
    }

    setIsSaving(true);

    try {
      const token = await user.getIdToken();
      const response = await fetch(`${backendUrl}/users/hardware/shops/create/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          shop_name: shopName,
          shop_address: shopAddress,
          shop_phone: shopPhone,
          shop_email: shopEmail,
          business_registration: businessRegistration,
          opening_hours: openingHours,
          services,
          google_maps_link: googleMapsLink,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        setFormError(result.error || "Unable to add shop.");
        return;
      }

      setShopName("");
      setShopAddress("");
      setShopPhone("");
      setShopEmail("");
      setBusinessRegistration("");
      setOpeningHours("");
      setServices("");
      setGoogleMapsLink("");

      await loadShops(token);
      if (result.shop?.id) {
        setSelectedShopId(result.shop.id);
      }
      setShowCreateForm(false);
    } catch (error) {
      console.error("Failed to create shop", error);
      setFormError("Unable to add shop.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateShop = async () => {
    if (!user || !activeShop) return;
    setEditError("");
    setIsUpdatingShop(true);

    try {
      const token = await user.getIdToken();
      const response = await fetch(`${backendUrl}/users/hardware/shops/${activeShop.id}/update/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          shop_name: editShopName,
          shop_address: editShopAddress,
          shop_phone: editShopPhone,
          shop_email: editShopEmail,
          business_registration: editBusinessRegistration,
          opening_hours: editOpeningHours,
          services: editServices,
          google_maps_link: editGoogleMapsLink,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        setEditError(result.error || "Unable to update shop.");
        return;
      }

      await loadShops(token);
    } catch (error) {
      console.error("Failed to update shop", error);
      setEditError("Unable to update shop.");
    } finally {
      setIsUpdatingShop(false);
    }
  };

  const handleDeleteShop = async (shopId: number) => {
    if (!user) return;

    const confirmed = window.confirm("Delete this shop?");
    if (!confirmed) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch(`${backendUrl}/users/hardware/shops/${shopId}/delete/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (response.ok) {
        await loadShops(token);
        if (selectedShopId === shopId) {
          setSelectedShopId(null);
        }
      }
    } catch (error) {
      console.error("Failed to delete shop", error);
    }
  };

  const handleUploadImages = async (shopId: number) => {
    if (!user) return;

    const bannerFile = bannerUploads[shopId];
    const galleryFiles = galleryUploads[shopId] || [];

    if (!bannerFile && galleryFiles.length === 0) {
      return;
    }

    setIsUploading((prev) => ({ ...prev, [shopId]: true }));

    try {
      const token = await user.getIdToken();

      if (bannerFile) {
        const formData = new FormData();
        formData.append("token", token);
        formData.append("image_type", "banner");
        formData.append("image", bannerFile);

        await fetch(`${backendUrl}/users/hardware/shops/${shopId}/images/`, {
          method: "POST",
          body: formData,
        });
      }

      if (galleryFiles.length) {
        const formData = new FormData();
        formData.append("token", token);
        formData.append("image_type", "gallery");
        galleryFiles.forEach((file) => formData.append("images", file));

        await fetch(`${backendUrl}/users/hardware/shops/${shopId}/images/`, {
          method: "POST",
          body: formData,
        });
      }

      setBannerUploads((prev) => ({ ...prev, [shopId]: null }));
      setGalleryUploads((prev) => ({ ...prev, [shopId]: [] }));
      await loadShops(token);
    } catch (error) {
      console.error("Failed to upload shop images", error);
    } finally {
      setIsUploading((prev) => ({ ...prev, [shopId]: false }));
    }
  };

  const handleAddItem = async () => {
    if (!user || !activeShop) return;
    setItemsError("");

    if (!selectedMaterialId) {
      setItemsError("Select a material to add.");
      return;
    }

    setIsItemsLoading(true);

    try {
      const token = await user.getIdToken();
      const response = await fetch(`${backendUrl}/users/hardware/shops/${activeShop.id}/items/add/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          material_id: Number(selectedMaterialId),
          stock_quantity: stockQuantity ? Number(stockQuantity) : 0,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        setItemsError(result.error || "Unable to add item.");
        return;
      }

      const refreshedToken = await user.getIdToken();
      await loadShopItems(refreshedToken, activeShop.id);
      setSelectedMaterialId("");
      setStockQuantity("");
    } catch (error) {
      console.error("Failed to add item", error);
      setItemsError("Unable to add item.");
    } finally {
      setIsItemsLoading(false);
    }
  };

  const handleUpdateItem = async (itemId: number) => {
    if (!user || !activeShop) return;

    const editedValue = itemStockEdits[itemId];
    if (editedValue === undefined) return;

    const stockValue = Number(editedValue);
    if (Number.isNaN(stockValue)) return;

    setIsItemsLoading(true);

    try {
      const token = await user.getIdToken();
      const response = await fetch(`${backendUrl}/users/hardware/shops/items/${itemId}/update/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, stock_quantity: stockValue }),
      });

      if (response.ok) {
        const refreshedToken = await user.getIdToken();
        await loadShopItems(refreshedToken, activeShop.id);
        setItemStockEdits((prev) => {
          const updated = { ...prev };
          delete updated[itemId];
          return updated;
        });
      }
    } catch (error) {
      console.error("Failed to update item", error);
    } finally {
      setIsItemsLoading(false);
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    if (!user || !activeShop) return;

    const confirmed = window.confirm("Delete this item?");
    if (!confirmed) return;

    setIsItemsLoading(true);

    try {
      const token = await user.getIdToken();
      const response = await fetch(`${backendUrl}/users/hardware/shops/items/${itemId}/delete/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (response.ok) {
        const refreshedToken = await user.getIdToken();
        await loadShopItems(refreshedToken, activeShop.id);
      }
    } catch (error) {
      console.error("Failed to delete item", error);
    } finally {
      setIsItemsLoading(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6 py-24">
        <div className="text-stone-600 text-sm">Loading shops...</div>
      </div>
    );
  }

  return (
    <DashboardShell navItems={navItems}>
      <header className="flex flex-col gap-4">
        <Link href="/dashboard/hardware" className="text-[#8B4434] font-semibold uppercase tracking-widest text-sm">
          ← Back to dashboard
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[#8B4434] font-semibold tracking-widest uppercase text-sm">Hardware Owner</p>
            <h1 className="font-serif text-4xl text-stone-900">Manage Your Shops</h1>
            <p className="text-stone-500 mt-2">Add multiple hardware shops and update their public details.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreateForm((prev) => !prev)}
            className="btn-primary"
          >
            {showCreateForm ? "Close" : "Add New Shop"}
          </button>
        </div>
      </header>

      <section className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="font-serif text-2xl text-stone-900">Active Shops</h2>
        {shops.length === 0 ? (
          <p className="text-stone-500 text-sm">No shops yet. Use the button above to add your first shop.</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {shops.map((shop) => (
              <button
                key={shop.id}
                type="button"
                onClick={() => setSelectedShopId(shop.id)}
                className={`px-4 py-2 rounded-full border text-sm transition ${
                  shop.id === selectedShopId
                    ? "bg-orange-50 border-orange-200 text-orange-700"
                    : "bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100"
                }`}
              >
                {shop.shop_name}
              </button>
            ))}
          </div>
        )}
      </section>

      {showCreateForm && (
        <section className="bg-white border border-stone-200 rounded-2xl p-8 shadow-sm">
          <h2 className="font-serif text-2xl text-stone-900 mb-6">Add New Shop</h2>
          <form onSubmit={handleCreateShop} className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-stone-500 font-medium text-sm tracking-wide mb-2">SHOP NAME</label>
              <input
                value={shopName}
                onChange={(event) => setShopName(event.target.value)}
                className="w-full border border-stone-300 text-stone-700 rounded-lg px-4 py-3 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
                placeholder="Required"
              />
            </div>
            <div>
              <label className="block text-stone-500 font-medium text-sm tracking-wide mb-2">SHOP PHONE</label>
              <input
                value={shopPhone}
                onChange={(event) => setShopPhone(event.target.value)}
                className="w-full border border-stone-300 text-stone-700 rounded-lg px-4 py-3 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="block text-stone-500 font-medium text-sm tracking-wide mb-2">SHOP EMAIL</label>
              <input
                type="email"
                value={shopEmail}
                onChange={(event) => setShopEmail(event.target.value)}
                className="w-full border border-stone-300 text-stone-700 rounded-lg px-4 py-3 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="block text-stone-500 font-medium text-sm tracking-wide mb-2">BUSINESS REGISTRATION</label>
              <input
                value={businessRegistration}
                onChange={(event) => setBusinessRegistration(event.target.value)}
                className="w-full border border-stone-300 text-stone-700 rounded-lg px-4 py-3 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="block text-stone-500 font-medium text-sm tracking-wide mb-2">OPENING HOURS</label>
              <input
                value={openingHours}
                onChange={(event) => setOpeningHours(event.target.value)}
                className="w-full border border-stone-300 text-stone-700 rounded-lg px-4 py-3 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
                placeholder="e.g., Mon - Sat, 8:00 AM - 6:00 PM"
              />
            </div>
            <div>
              <label className="block text-stone-500 font-medium text-sm tracking-wide mb-2">GOOGLE MAPS LINK</label>
              <input
                type="url"
                value={googleMapsLink}
                onChange={(event) => setGoogleMapsLink(event.target.value)}
                className="w-full border border-stone-300 text-stone-700 rounded-lg px-4 py-3 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
                placeholder="Optional"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-stone-500 font-medium text-sm tracking-wide mb-2">SHOP ADDRESS</label>
              <textarea
                value={shopAddress}
                onChange={(event) => setShopAddress(event.target.value)}
                rows={3}
                className="w-full border border-stone-300 text-stone-700 rounded-lg px-4 py-3 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
                placeholder="Optional"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-stone-500 font-medium text-sm tracking-wide mb-2">SERVICES / CATEGORIES</label>
              <textarea
                value={services}
                onChange={(event) => setServices(event.target.value)}
                rows={3}
                className="w-full border border-stone-300 text-stone-700 rounded-lg px-4 py-3 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
                placeholder="Optional"
              />
            </div>
            {formError && (
              <div className="md:col-span-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
                {formError}
              </div>
            )}
            <div className="md:col-span-2 flex justify-end">
              <button type="submit" disabled={isSaving} className="btn-primary px-8 py-3 disabled:opacity-70">
                {isSaving ? "Saving..." : "Add Shop"}
              </button>
            </div>
          </form>
        </section>
      )}

      {activeShop ? (
        <section className="bg-white border border-stone-200 rounded-2xl p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-2xl text-stone-900">Edit {activeShop.shop_name}</h2>
              <p className="text-stone-500 text-sm">Update details for the selected shop.</p>
            </div>
            <button
              type="button"
              onClick={() => handleDeleteShop(activeShop.id)}
              className="text-xs uppercase tracking-wider text-red-600 font-semibold"
            >
              Delete Shop
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-stone-500 font-medium text-sm tracking-wide mb-2">SHOP NAME</label>
              <input
                value={editShopName}
                onChange={(event) => setEditShopName(event.target.value)}
                className="w-full border border-stone-300 text-stone-700 rounded-lg px-4 py-3 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-stone-500 font-medium text-sm tracking-wide mb-2">SHOP PHONE</label>
              <input
                value={editShopPhone}
                onChange={(event) => setEditShopPhone(event.target.value)}
                className="w-full border border-stone-300 text-stone-700 rounded-lg px-4 py-3 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-stone-500 font-medium text-sm tracking-wide mb-2">SHOP EMAIL</label>
              <input
                type="email"
                value={editShopEmail}
                onChange={(event) => setEditShopEmail(event.target.value)}
                className="w-full border border-stone-300 text-stone-700 rounded-lg px-4 py-3 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-stone-500 font-medium text-sm tracking-wide mb-2">BUSINESS REGISTRATION</label>
              <input
                value={editBusinessRegistration}
                onChange={(event) => setEditBusinessRegistration(event.target.value)}
                className="w-full border border-stone-300 text-stone-700 rounded-lg px-4 py-3 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-stone-500 font-medium text-sm tracking-wide mb-2">OPENING HOURS</label>
              <input
                value={editOpeningHours}
                onChange={(event) => setEditOpeningHours(event.target.value)}
                className="w-full border border-stone-300 text-stone-700 rounded-lg px-4 py-3 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-stone-500 font-medium text-sm tracking-wide mb-2">GOOGLE MAPS LINK</label>
              <input
                type="url"
                value={editGoogleMapsLink}
                onChange={(event) => setEditGoogleMapsLink(event.target.value)}
                className="w-full border border-stone-300 text-stone-700 rounded-lg px-4 py-3 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-stone-500 font-medium text-sm tracking-wide mb-2">SHOP ADDRESS</label>
              <textarea
                value={editShopAddress}
                onChange={(event) => setEditShopAddress(event.target.value)}
                rows={3}
                className="w-full border border-stone-300 text-stone-700 rounded-lg px-4 py-3 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-stone-500 font-medium text-sm tracking-wide mb-2">SERVICES / CATEGORIES</label>
              <textarea
                value={editServices}
                onChange={(event) => setEditServices(event.target.value)}
                rows={3}
                className="w-full border border-stone-300 text-stone-700 rounded-lg px-4 py-3 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
              />
            </div>
          </div>

          {editError && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
              {editError}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleUpdateShop}
              disabled={isUpdatingShop}
              className="btn-primary px-8 py-3 disabled:opacity-70"
            >
              {isUpdatingShop ? "Saving..." : "Save Shop Details"}
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="block text-stone-500 font-medium text-sm tracking-wide">BANNER IMAGE</label>
              {activeShop.banner_image_url || activeShop.banner_image ? (
                <div className="h-32 rounded-xl border border-stone-200 overflow-hidden bg-stone-50">
                  <Image
                    src={normalizeMediaUrl(backendBaseUrl, activeShop.banner_image_url || activeShop.banner_image)}
                    alt={`${activeShop.shop_name} banner`}
                    width={640}
                    height={240}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="text-xs text-stone-400">No banner uploaded</div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(event) =>
                  setBannerUploads((prev) => ({
                    ...prev,
                    [activeShop.id]: event.target.files?.[0] || null,
                  }))
                }
                className="w-full text-xs text-stone-500"
              />
            </div>
            <div className="space-y-3">
              <label className="block text-stone-500 font-medium text-sm tracking-wide">GALLERY IMAGES</label>
              {activeShop.gallery_images && activeShop.gallery_images.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {activeShop.gallery_images.map((image) => (
                    <div key={image.id} className="h-20 rounded-lg border border-stone-200 overflow-hidden bg-stone-50">
                      <Image
                        src={normalizeMediaUrl(backendBaseUrl, image.image_url || image.image)}
                        alt="Gallery"
                        width={160}
                        height={160}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-stone-400">No gallery images yet</div>
              )}
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(event) =>
                  setGalleryUploads((prev) => ({
                    ...prev,
                    [activeShop.id]: Array.from(event.target.files || []),
                  }))
                }
                className="w-full text-xs text-stone-500"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleUploadImages(activeShop.id)}
            disabled={isUploading[activeShop.id]}
            className="btn-secondary w-fit disabled:opacity-70"
          >
            {isUploading[activeShop.id] ? "Uploading..." : "Upload Images"}
          </button>

          <div className="border-t border-stone-200 pt-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-serif text-2xl text-stone-900">Shop Items</h3>
                <p className="text-stone-500 text-sm">Prices follow the AI market rates.</p>
              </div>
              <div className="text-xs text-stone-500">
                {isMaterialsLoading ? "Loading materials..." : `${materials.length} materials available`}
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4 items-end">
              <div className="md:col-span-2">
                <label className="block text-stone-500 font-medium text-sm tracking-wide mb-2">MATERIAL</label>
                <select
                  value={selectedMaterialId}
                  onChange={(event) => setSelectedMaterialId(event.target.value)}
                  disabled={isMaterialsLoading}
                  className="w-full border border-stone-300 text-stone-700 rounded-lg px-4 py-3 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors disabled:opacity-70"
                >
                  <option value="" disabled>
                    {isMaterialsLoading ? "Loading..." : "Select a material"}
                  </option>
                  {materials.map((material) => (
                    <option key={material.id} value={material.id}>
                      {material.name} {material.category_name ? `(${material.category_name})` : ""}
                    </option>
                  ))}
                </select>
                {selectedMaterial && (
                  <p className="text-xs text-stone-500 mt-2">
                    AI price: LKR {selectedMaterial.unit_price} / {selectedMaterial.unit}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-stone-500 font-medium text-sm tracking-wide mb-2">STOCK</label>
                <input
                  type="number"
                  min="0"
                  value={stockQuantity}
                  onChange={(event) => setStockQuantity(event.target.value)}
                  className="w-full border border-stone-300 text-stone-700 rounded-lg px-4 py-3 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
                  placeholder="0"
                />
              </div>
            </div>

            {itemsError && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
                {itemsError}
              </div>
            )}

            <button
              type="button"
              onClick={handleAddItem}
              disabled={isItemsLoading || !selectedMaterialId}
              className="btn-primary w-fit disabled:opacity-70"
            >
              {isItemsLoading ? "Saving..." : "Add Item"}
            </button>

            <div className="space-y-4">
              {shopItems[activeShop.id]?.length ? (
                shopItems[activeShop.id].map((item) => (
                  <div key={item.id} className="border border-stone-200 rounded-xl overflow-hidden bg-white">
                    <div className="grid md:grid-cols-[120px_minmax(0,1fr)]">
                      <div className="relative min-h-32 bg-stone-100 border-b md:border-b-0 md:border-r border-stone-200">
                        {item.image_url ? (
                          <Image src={item.image_url} alt={item.material_name} fill unoptimized className="object-cover" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-stone-300 text-xs uppercase tracking-[0.2em]">
                            No image
                          </div>
                        )}
                      </div>

                      <div className="p-4 flex flex-col gap-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <div className="font-semibold text-stone-800">{item.material_name}</div>
                            <div className="text-xs text-stone-500">
                              AI price: LKR {item.material_unit_price} / {item.material_unit}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(item.id)}
                            className="text-xs uppercase tracking-wider text-red-600 font-semibold"
                          >
                            Delete
                          </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          <input
                            type="number"
                            min="0"
                            value={itemStockEdits[item.id] ?? item.stock_quantity.toString()}
                            onChange={(event) =>
                              setItemStockEdits((prev) => ({
                                ...prev,
                                [item.id]: event.target.value,
                              }))
                            }
                            className="w-32 border border-stone-300 text-stone-700 rounded-lg px-3 py-2 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateItem(item.id)}
                            disabled={isItemsLoading}
                            className="btn-secondary px-4 py-2 disabled:opacity-70"
                          >
                            Update Stock
                          </button>
                        </div>

                        <Link
                          href={`/marketplace/${item.material}`}
                          className="inline-flex w-fit rounded-lg border border-stone-300 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-700 transition-colors hover:border-orange-500 hover:text-orange-600"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-stone-500">No items added yet.</div>
              )}
            </div>
          </div>
        </section>
      ) : (
        <section className="bg-white border border-stone-200 rounded-2xl p-8 shadow-sm">
          <p className="text-stone-500">Select a shop to start editing its details and inventory.</p>
        </section>
      )}
    </DashboardShell>
  );
}
