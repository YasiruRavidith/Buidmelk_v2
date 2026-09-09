"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "../../hooks/useAuth";
import { API_BASE_URL } from "@/lib/api";

type CartItem = {
  id: number;
  product_name: string;
  product_image?: string | null;
  product_type: string;
  quantity: number;
  unit_price: string;
};

type Cart = {
  id: number;
  items: CartItem[];
  total: string;
};

export default function CartPage() {
  const { user } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyItemId, setBusyItemId] = useState<number | null>(null);

  useEffect(() => {
    async function loadCart() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const token = await user.getIdToken();
        const response = await fetch(`${API_BASE_URL}/marketplace/cart/?token=${encodeURIComponent(token)}`);
        if (response.ok) {
          const data = await response.json();
          setCart(data);
        }
      } catch {
        console.error('Failed to load cart');
      } finally {
        setLoading(false);
      }
    }

    loadCart();
  }, [user]);

  const refreshCart = async () => {
    if (!user) return;
    const token = await user.getIdToken();
    const response = await fetch(`${API_BASE_URL}/marketplace/cart/?token=${encodeURIComponent(token)}`);
    if (response.ok) {
      const data = await response.json();
      setCart(data);
    }
  };

  const updateItem = async (itemId: number, quantity: number) => {
    if (!user) return;
    setBusyItemId(itemId);
    try {
      const token = await user.getIdToken();
      const response = await fetch(`${API_BASE_URL}/marketplace/cart/update/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, item_id: itemId, quantity }),
      });

      if (response.ok) {
        const data = await response.json();
        setCart(data);
      }
    } finally {
      setBusyItemId(null);
    }
  };

  const removeItem = async (itemId: number) => {
    if (!user) return;
    setBusyItemId(itemId);
    try {
      const token = await user.getIdToken();
      const response = await fetch(`${API_BASE_URL}/marketplace/cart/remove/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, item_id: itemId }),
      });

      if (response.ok) {
        const data = await response.json();
        setCart(data);
      }
    } finally {
      setBusyItemId(null);
    }
  };

  if (loading) return <div className="p-16 text-center text-[#606060]">Loading cart...</div>;
  if (!user) return <div className="p-16 text-center text-[#606060]">Please log in to view your cart.</div>;

  return (
    <div className="min-h-screen bg-[#FCFAF7] py-8 sm:py-16 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8">
        <div>
          <p className="text-[10px] uppercase tracking-[0.35em] text-[#8B4434]/70 font-semibold mb-3">Shopping Cart</p>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#281713]">Your Cart</h1>
        </div>

        {!cart || cart.items.length === 0 ? (
          <div className="border border-[#e8ddd6] bg-white p-8 sm:p-10 text-center text-[#606060]">
            Your cart is empty.
            <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
              <Link href="/marketplace" className="btn-primary px-5 py-3">Browse Materials</Link>
              <Link href="/shops" className="btn-secondary px-5 py-3 text-center">Browse Shops</Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
            <div className="space-y-3 sm:space-y-4">
              {cart.items.map((item) => (
                <div key={item.id} className="border border-[#e8ddd6] bg-white p-4 sm:p-5 flex gap-3 sm:gap-4">
                  <div className="relative h-20 w-20 sm:h-24 sm:w-24 shrink-0 overflow-hidden bg-[#f3ebe4]">
                    {item.product_image ? <Image src={item.product_image} alt={item.product_name} fill unoptimized className="object-cover" /> : null}
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h2 className="font-serif text-lg sm:text-2xl text-[#281713] leading-tight">{item.product_name}</h2>
                        <p className="text-xs uppercase tracking-wide text-[#8B4434]/60 mt-0.5">{item.product_type.replace(/_/g, ' ')}</p>
                      </div>
                      <p className="text-[#281713] font-semibold text-sm sm:text-base shrink-0">Rs. {item.unit_price}</p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        className="h-8 w-8 border border-[#e8ddd6] flex items-center justify-center text-[#8B4434] text-base hover:bg-[#8B4434] hover:text-white transition-colors"
                        onClick={() => updateItem(item.id, Math.max(1, item.quantity - 1))}
                        disabled={busyItemId === item.id}
                      >
                        −
                      </button>
                      <span className="text-sm text-[#606060] min-w-[2.5rem] text-center">Qty {item.quantity}</span>
                      <button
                        className="h-8 w-8 border border-[#e8ddd6] flex items-center justify-center text-[#8B4434] text-base hover:bg-[#8B4434] hover:text-white transition-colors"
                        onClick={() => updateItem(item.id, item.quantity + 1)}
                        disabled={busyItemId === item.id}
                      >
                        +
                      </button>
                      <button
                        className="ml-2 text-sm text-[#8B4434]/60 hover:text-[#8B4434] transition-colors underline"
                        onClick={() => removeItem(item.id)}
                        disabled={busyItemId === item.id}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <aside className="border border-[#e8ddd6] bg-white p-5 sm:p-6 h-fit space-y-4 lg:sticky lg:top-8">
              <h2 className="font-serif text-2xl text-[#281713]">Order Summary</h2>
              <div className="space-y-2 text-sm text-[#606060]">
                <div className="flex justify-between">
                  <span>Items</span>
                  <span>{cart.items.length}</span>
                </div>
                <div className="flex justify-between border-t border-[#e8ddd6] pt-2 font-semibold text-[#281713]">
                  <span>Total</span>
                  <span>Rs. {cart.total}</span>
                </div>
              </div>
              <button className="btn-primary w-full py-3">Checkout</button>
              <button onClick={refreshCart} className="btn-secondary w-full py-3">Refresh</button>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
