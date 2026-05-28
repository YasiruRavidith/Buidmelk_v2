"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "../../hooks/useAuth";

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
        const response = await fetch(`http://localhost:8000/api/marketplace/cart/?token=${encodeURIComponent(token)}`);
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
    const response = await fetch(`http://localhost:8000/api/marketplace/cart/?token=${encodeURIComponent(token)}`);
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
      const response = await fetch('http://localhost:8000/api/marketplace/cart/update/', {
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
      const response = await fetch('http://localhost:8000/api/marketplace/cart/remove/', {
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

  if (loading) return <div className="p-16 text-center">Loading cart...</div>;
  if (!user) return <div className="p-16 text-center">Please log in to view your cart.</div>;

  return (
    <div className="min-h-screen bg-stone-50 py-16 px-6">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <p className="text-[10px] uppercase tracking-[0.35em] text-[#8B4434]/70 font-semibold mb-3">Shopping Cart</p>
          <h1 className="font-serif text-4xl text-stone-900">Your Cart</h1>
        </div>

        {!cart || cart.items.length === 0 ? (
          <div className="rounded-3xl border border-stone-200 bg-white p-10 text-center text-stone-600">
            Your cart is empty.
            <div className="mt-4 flex justify-center gap-3">
              <Link href="/marketplace" className="btn-primary px-5 py-3">Browse Materials</Link>
              <Link href="/shops" className="btn-outline px-5 py-3">Browse Shops</Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
            <div className="space-y-4">
              {cart.items.map((item) => (
                <div key={item.id} className="rounded-3xl border border-stone-200 bg-white p-5 flex gap-4">
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-stone-100">
                    {item.product_image ? <Image src={item.product_image} alt={item.product_name} fill unoptimized className="object-cover" /> : null}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="font-serif text-2xl text-stone-900">{item.product_name}</h2>
                        <p className="text-xs uppercase tracking-wide text-stone-500">{item.product_type.replace(/_/g, ' ')}</p>
                      </div>
                      <p className="text-stone-700 font-semibold">Rs. {item.unit_price}</p>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                      <button className="rounded-full border border-stone-300 px-3 py-1 text-sm" onClick={() => updateItem(item.id, Math.max(1, item.quantity - 1))} disabled={busyItemId === item.id}>-</button>
                      <span className="text-sm text-stone-700">Qty {item.quantity}</span>
                      <button className="rounded-full border border-stone-300 px-3 py-1 text-sm" onClick={() => updateItem(item.id, item.quantity + 1)} disabled={busyItemId === item.id}>+</button>
                      <button className="text-sm text-orange-600 hover:underline" onClick={() => removeItem(item.id)} disabled={busyItemId === item.id}>Remove</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <aside className="rounded-3xl border border-stone-200 bg-white p-6 h-fit space-y-4 sticky top-8">
              <h2 className="font-serif text-2xl text-stone-900">Summary</h2>
              <div className="flex justify-between text-sm text-stone-600">
                <span>Items</span>
                <span>{cart.items.length}</span>
              </div>
              <div className="flex justify-between text-sm text-stone-600">
                <span>Total</span>
                <span>Rs. {cart.total}</span>
              </div>
              <button className="btn-primary w-full py-3">Checkout</button>
              <button onClick={refreshCart} className="btn-outline w-full py-3">Refresh</button>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
