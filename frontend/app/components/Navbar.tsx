"use client";

import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { ShoppingCart, Menu, X, ChevronRight, Trash2, Plus, Minus, User } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

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

export default function Navbar() {
  const { user, profilePhoto, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  // Cart state
  const [cart, setCart] = useState<Cart | null>(null);
  const [cartLoading, setCartLoading] = useState(false);
  const [busyItemId, setBusyItemId] = useState<number | null>(null);

  // Ticket credit count
  const [ticketCredits, setTicketCredits] = useState<number | null>(null);

  const displayName = useMemo(() => {
    if (!user) return '';
    return user.displayName || user.email || 'User';
  }, [user]);

  const navLinks = [
    { href: '/professionals', label: 'Professionals' },
    { href: '/bidding', label: 'Open Bidding' },
    { href: '/workers', label: 'Workers' },
    { href: '/marketplace', label: 'Materials' },
    { href: '/shops', label: 'Shops' },
    { href: '/estimation', label: 'Estimation' },
  ];

  // Fetch ticket credits when user logs in
  useEffect(() => {
    if (!user) { setTicketCredits(null); return; }
    const fetch_ = async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch('http://localhost:8000/api/bidding/tickets/my/', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setTicketCredits(data.total_credits_remaining ?? 0);
        }
      } catch {}
    };
    fetch_();
  }, [user]);

  // Lock body scroll when any panel is open
  useEffect(() => {
    if (mobileNavOpen || cartOpen) {
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.documentElement.style.overflow = '';
    }
    return () => { document.documentElement.style.overflow = ''; };
  }, [mobileNavOpen, cartOpen]);

  // Close panels on route change
  useEffect(() => {
    setMobileNavOpen(false);
    setCartOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  // Close user menu on outside click
  useEffect(() => {
    if (!userMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    const escape = (e: KeyboardEvent) => { if (e.key === 'Escape') setUserMenuOpen(false); };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', escape);
    };
  }, [userMenuOpen]);

  // Fetch cart
  const fetchCart = useCallback(async () => {
    if (!user) return;
    setCartLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`http://localhost:8000/api/marketplace/cart/?token=${encodeURIComponent(token)}`);
      if (res.ok) setCart(await res.json());
    } catch { /* silent */ } finally { setCartLoading(false); }
  }, [user]);

  // Initial cart fetch & window event listener
  useEffect(() => {
    if (user) fetchCart();
    const handleCartUpdate = () => fetchCart();
    window.addEventListener("cartUpdated", handleCartUpdate);
    return () => window.removeEventListener("cartUpdated", handleCartUpdate);
  }, [user, fetchCart]);

  const openCart = () => {
    setCartOpen(true);
    fetchCart();
  };

  const updateItem = async (itemId: number, quantity: number) => {
    if (!user) return;
    setBusyItemId(itemId);
    try {
      const token = await user.getIdToken();
      const res = await fetch('http://localhost:8000/api/marketplace/cart/update/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, item_id: itemId, quantity }),
      });
      if (res.ok) setCart(await res.json());
    } finally { setBusyItemId(null); }
  };

  const removeItem = async (itemId: number) => {
    if (!user) return;
    setBusyItemId(itemId);
    try {
      const token = await user.getIdToken();
      const res = await fetch('http://localhost:8000/api/marketplace/cart/remove/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, item_id: itemId }),
      });
      if (res.ok) setCart(await res.json());
    } finally { setBusyItemId(null); }
  };

  const handleSignOut = async () => {
    setMobileNavOpen(false);
    setUserMenuOpen(false);
    await signOut();
    router.push('/');
  };

  const cartCount = cart?.items?.reduce((sum, i) => sum + i.quantity, 0) ?? 0;

  return (
    <>
      {/* ── Main Navbar ─────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 w-full z-50 px-4 sm:px-6 md:px-12 h-16 sm:h-20 md:h-24 flex justify-between items-center bg-[#f5f3f0]/95 backdrop-blur-3xl border-b border-[#8B4434]/20">

        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <Image src="/logo.png" alt="BuildMe.lk" width={120} height={32} className="object-contain w-[100px] sm:w-[120px] md:w-[140px]" priority />
        </Link>

        {/* Desktop nav links */}
        <div className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center gap-8 lg:gap-10">
          {navLinks.map(link => (
            <Link key={link.href} href={link.href}
              className={`text-[12px] uppercase tracking-[0.2em] font-semibold transition-opacity hover:opacity-70 ${pathname === link.href ? 'text-[#8B4434]' : 'text-[#b44d08]'}`}>
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Cart icon */}
          <button
            onClick={openCart}
            aria-label="Open cart"
            className="relative inline-flex items-center justify-center p-2 text-[#b44d08] hover:opacity-70 transition-opacity"
          >
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-[#8B4434] text-white text-[9px] flex items-center justify-center font-bold">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </button>

          {/* Desktop: user avatar / auth buttons */}
          {loading ? (
            <div className="h-4 w-16 bg-[#8B4434]/10 animate-pulse hidden md:block" />
          ) : user ? (
            <div className="relative hidden md:flex items-center gap-3" ref={userMenuRef}>
              {/* Ticket credit pill — always visible when logged in */}
              {ticketCredits !== null && (
                <Link
                  href="/tickets"
                  className="flex items-center gap-1.5 border border-[#b44d08]/20 bg-[#b44d08]/5 px-2.5 py-1.5 text-[10px] font-semibold text-[#b44d08] hover:bg-[#b44d08]/10 transition-colors"
                  title="My ticket credits"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/></svg>
                  <span>{ticketCredits} credit{ticketCredits !== 1 ? 's' : ''}</span>
                </Link>
              )}
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                {profilePhoto || user.photoURL ? (
                  <img src={profilePhoto || user.photoURL || ''} alt={displayName} className="rounded-full object-cover border border-[#b44d08]/20 w-10 h-10" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#b44d08]/10 border border-[#b44d08]/20 flex justify-center items-center text-[#b44d08]">
                    <User className="h-5 w-5" />
                  </div>
                )}
              </button>
              {userMenuOpen && (
                <div className="absolute top-14 right-0 w-52 bg-[#FCFAF7] border border-[#b44d08]/10 shadow-[0_4px_20px_-2px_rgba(139,68,52,0.15)] flex flex-col py-2 z-50">
                  <div className="px-4 py-3 border-b border-[#b44d08]/10 mb-2">
                    <p className="text-[#b44d08] text-xs font-semibold truncate">{displayName}</p>
                    <p className="text-[#b44d08]/70 text-[11px] truncate">{user.email}</p>
                    {ticketCredits !== null && (
                      <p className="text-[10px] text-[#b44d08]/60 mt-1">
                        <span className="font-semibold text-[#b44d08]">{ticketCredits}</span> ticket credit{ticketCredits !== 1 ? 's' : ''} remaining
                      </p>
                    )}
                  </div>
                  <Link href="/dashboard" onClick={() => setUserMenuOpen(false)} className="px-4 py-2 text-[#b44d08] hover:bg-[#b44d08]/5 text-[10px] tracking-[0.1em] uppercase font-semibold transition-colors">Dashboard</Link>
                  <Link href="/profile" onClick={() => setUserMenuOpen(false)} className="px-4 py-2 text-[#b44d08] hover:bg-[#b44d08]/5 text-[10px] tracking-[0.1em] uppercase font-semibold transition-colors">My Profile</Link>
                  <Link href="/tickets" onClick={() => setUserMenuOpen(false)} className="px-4 py-2 text-[#b44d08] hover:bg-[#b44d08]/5 text-[10px] tracking-[0.1em] uppercase font-semibold transition-colors flex items-center justify-between">
                    <span>My Tickets</span>
                    {ticketCredits !== null && (
                      <span className="bg-[#b44d08] text-white text-[9px] font-bold px-1.5 py-0.5 min-w-[18px] text-center">
                        {ticketCredits}
                      </span>
                    )}
                  </Link>
                  <Link href="/workers/my-jobs" onClick={() => setUserMenuOpen(false)} className="px-4 py-2 text-[#b44d08] hover:bg-[#b44d08]/5 text-[10px] tracking-[0.1em] uppercase font-semibold transition-colors">My Worker Jobs</Link>
                  <button onClick={handleSignOut} className="px-4 py-2 text-left text-[#b44d08]/80 hover:bg-[#b44d08]/5 text-[10px] tracking-[0.1em] uppercase font-semibold transition-colors mt-1 border-t border-[#b44d08]/10 pt-3">
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-3">
              <Link href="/login" className="text-[12px] uppercase tracking-[0.2em] font-semibold text-[#b44d08] hover:opacity-70 transition-opacity">Log In</Link>
              <Link href="/login" className="bg-[#b44d08] text-[#FCFAF7] px-5 py-2.5 text-[11px] tracking-[0.2em] uppercase font-semibold hover:bg-[#6c3426] transition-colors">Get Started</Link>
            </div>
          )}

          {/* Hamburger (mobile only) */}
          <button
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open navigation menu"
            className="md:hidden inline-flex items-center justify-center p-2 text-[#b44d08] hover:opacity-70 transition-opacity"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </nav>

      {/* ── Mobile Nav Panel (slides from left) ─────────────────────── */}
      {/* Backdrop */}
      <div
        onClick={() => setMobileNavOpen(false)}
        className={`fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm transition-opacity duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] md:hidden
          ${mobileNavOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      />
      {/* Panel */}
      <aside className={`fixed top-0 left-0 h-full w-[80vw] max-w-[320px] z-[70] bg-[#FCFAF7] shadow-2xl flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] md:hidden
        ${mobileNavOpen ? 'translate-x-0' : '-translate-x-full'}`}>

        {/* Panel header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#8B4434]/10">
          <Link href="/" onClick={() => setMobileNavOpen(false)}>
            <Image src="/logo.png" alt="BuildMe.lk" width={100} height={28} className="object-contain" />
          </Link>
          <button onClick={() => setMobileNavOpen(false)} aria-label="Close menu" className="p-2 text-[#8B4434] hover:opacity-70">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
          {navLinks.map(link => (
            <Link key={link.href} href={link.href}
              onClick={() => setMobileNavOpen(false)}
              className={`flex items-center justify-between px-4 py-3.5 text-[12px] uppercase tracking-[0.22em] font-semibold transition-colors rounded-none
                ${pathname === link.href
                  ? 'bg-[#8B4434] text-white'
                  : 'text-[#b44d08] hover:bg-[#8B4434]/5'}`}>
              {link.label}
              <ChevronRight className="h-4 w-4 opacity-50" />
            </Link>
          ))}
        </nav>

        {/* User section */}
        <div className="border-t border-[#8B4434]/10 p-4">
          {loading ? (
            <div className="h-10 bg-[#8B4434]/10 animate-pulse" />
          ) : user ? (
            <div className="space-y-1">
              <div className="flex items-center gap-3 px-4 py-3 mb-2">
                {profilePhoto || user.photoURL ? (
                  <img src={profilePhoto || user.photoURL || ''} alt={displayName} className="w-9 h-9 rounded-full object-cover border border-[#b44d08]/20" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-[#b44d08]/10 border border-[#b44d08]/20 flex justify-center items-center text-[#b44d08]">
                    <User className="h-4 w-4" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-[#b44d08] text-xs font-semibold truncate">{displayName}</p>
                  <p className="text-[#b44d08]/60 text-[11px] truncate">{user.email}</p>
                </div>
              </div>
              <Link href="/dashboard" onClick={() => setMobileNavOpen(false)} className="flex items-center justify-between px-4 py-3 text-[12px] uppercase tracking-[0.2em] font-semibold text-[#b44d08] hover:bg-[#8B4434]/5 transition-colors">
                Dashboard <ChevronRight className="h-4 w-4 opacity-50" />
              </Link>
              <Link href="/profile" onClick={() => setMobileNavOpen(false)} className="flex items-center justify-between px-4 py-3 text-[12px] uppercase tracking-[0.2em] font-semibold text-[#b44d08] hover:bg-[#8B4434]/5 transition-colors">
                My Profile <ChevronRight className="h-4 w-4 opacity-50" />
              </Link>
              <button onClick={handleSignOut} className="w-full flex items-center justify-between px-4 py-3 text-[12px] uppercase tracking-[0.2em] font-semibold text-[#8B4434]/70 hover:bg-[#8B4434]/5 transition-colors border-t border-[#8B4434]/10 mt-2 pt-4">
                Logout <ChevronRight className="h-4 w-4 opacity-50" />
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <Link href="/login" onClick={() => setMobileNavOpen(false)} className="block w-full bg-[#b44d08] text-[#FCFAF7] px-4 py-3.5 text-center text-[11px] tracking-[0.2em] uppercase font-semibold hover:bg-[#6c3426] transition-colors">
                Get Started
              </Link>
              <Link href="/login" onClick={() => setMobileNavOpen(false)} className="block w-full text-center text-[11px] uppercase tracking-[0.2em] font-semibold text-[#b44d08] hover:opacity-70 transition-opacity py-2">
                Log In
              </Link>
            </div>
          )}
        </div>
      </aside>

      {/* ── Cart Panel (slides from right) ──────────────────────────── */}
      {/* Backdrop */}
      <div
        onClick={() => setCartOpen(false)}
        className={`fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm transition-opacity duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
          ${cartOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      />
      {/* Panel */}
      <aside className={`fixed top-0 right-0 h-full w-[92vw] max-w-[420px] z-[70] bg-[#FCFAF7] shadow-2xl flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
        ${cartOpen ? 'translate-x-0' : 'translate-x-full'}`}>

        {/* Cart header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#8B4434]/10 shrink-0">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#8B4434]/60 font-semibold">Shopping Cart</p>
            <h2 className="font-serif text-xl text-[#281713] mt-0.5">Your Cart</h2>
          </div>
          <button onClick={() => setCartOpen(false)} aria-label="Close cart" className="p-2 text-[#8B4434] hover:opacity-70">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Cart body */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {!user ? (
            <div className="h-full flex flex-col items-center justify-center gap-4 text-center px-6">
              <ShoppingCart className="h-12 w-12 text-[#8B4434]/30" />
              <p className="text-[#606060] text-sm">Please log in to view your cart.</p>
              <Link href="/login" onClick={() => setCartOpen(false)} className="btn-primary text-sm px-6 py-3">
                Log In
              </Link>
            </div>
          ) : cartLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="space-y-3 w-full">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-20 bg-[#8B4434]/5 animate-pulse" />
                ))}
              </div>
            </div>
          ) : !cart || cart.items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-4 text-center px-6">
              <ShoppingCart className="h-12 w-12 text-[#8B4434]/30" />
              <p className="text-[#606060] text-sm">Your cart is empty.</p>
              <div className="flex flex-col gap-2 w-full">
                <Link href="/marketplace" onClick={() => setCartOpen(false)} className="btn-primary text-sm py-3">
                  Browse Materials
                </Link>
                <Link href="/shops" onClick={() => setCartOpen(false)} className="btn-secondary text-sm py-3 text-center">
                  Browse Shops
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.items.map(item => (
                <div key={item.id} className="flex gap-3 border border-[#e8ddd6] bg-white p-3">
                  <div className="relative h-16 w-16 shrink-0 bg-[#f3ebe4] overflow-hidden">
                    {item.product_image && <Image src={item.product_image} alt={item.product_name} fill unoptimized className="object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[#281713] text-sm font-serif leading-tight line-clamp-2">{item.product_name}</p>
                    <p className="text-[#8B4434] text-xs mt-0.5">Rs. {item.unit_price}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => updateItem(item.id, Math.max(1, item.quantity - 1))}
                        disabled={busyItemId === item.id}
                        className="h-6 w-6 border border-[#e8ddd6] flex items-center justify-center text-[#8B4434] hover:bg-[#8B4434] hover:text-white transition-colors disabled:opacity-50"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-xs text-[#606060] w-4 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateItem(item.id, item.quantity + 1)}
                        disabled={busyItemId === item.id}
                        className="h-6 w-6 border border-[#e8ddd6] flex items-center justify-center text-[#8B4434] hover:bg-[#8B4434] hover:text-white transition-colors disabled:opacity-50"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => removeItem(item.id)}
                        disabled={busyItemId === item.id}
                        className="ml-auto text-[#8B4434]/60 hover:text-[#8B4434] transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart footer */}
        {cart && cart.items.length > 0 && (
          <div className="border-t border-[#8B4434]/10 p-4 space-y-3 shrink-0 bg-white">
            <div className="flex justify-between items-center">
              <span className="text-[11px] uppercase tracking-[0.2em] text-[#8B4434]/70 font-semibold">Total</span>
              <span className="font-serif text-xl text-[#281713]">Rs. {cart.total}</span>
            </div>
            <button className="w-full bg-[#8B4434] text-[#FCFAF7] py-3.5 text-[11px] tracking-[0.2em] uppercase font-semibold hover:bg-[#6c3426] transition-colors">
              Checkout
            </button>
            <Link href="/cart" onClick={() => setCartOpen(false)} className="block w-full text-center border border-[#8B4434] py-3 text-[11px] tracking-[0.2em] uppercase font-semibold text-[#8B4434] hover:bg-[#8B4434]/5 transition-colors">
              View Full Cart
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
