"use client";

import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { ShoppingCart, Menu, X, ChevronRight, Trash2, Plus, Minus, User, Ticket, ShieldCheck, MessageSquare } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { API_BASE_URL } from '../../lib/api'

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
  const { user, backendUser, profilePhoto, loading, signOut } = useAuth();
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

  // Unread chat messages count
  const [unreadChatCount, setUnreadChatCount] = useState<number>(0);

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

  const fetchTickets = useCallback(async () => {
    if (!user) {
      setTicketCredits(null);
      return;
    }
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${API_BASE_URL}/bidding/tickets/my/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTicketCredits(data.total_credits_remaining ?? 0);
      }
    } catch {}
  }, [user]);

  // Fetch unread chats count
  const fetchUnreadChats = useCallback(async () => {
    if (!user) {
      setUnreadChatCount(0);
      return;
    }
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${API_BASE_URL}/bidding/chats/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadChatCount(data.total_unread ?? 0);
      }
    } catch {
      // silent
    }
  }, [user]);

  // Fetch cart
  const fetchCart = useCallback(async () => {
    if (!user) {
      setCart(null);
      return;
    }
    setCartLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${API_BASE_URL}/marketplace/cart/?token=${encodeURIComponent(token)}`);
      if (res.ok) setCart(await res.json());
    } catch { /* silent */ } finally { setCartLoading(false); }
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

  // Close panels on route change and refresh balances & unread chats
  useEffect(() => {
    setMobileNavOpen(false);
    setCartOpen(false);
    setUserMenuOpen(false);
    if (user) {
      fetchCart();
      fetchTickets();
      fetchUnreadChats();
    }
  }, [pathname, user, fetchCart, fetchTickets, fetchUnreadChats]);

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

  // Reactive listeners for live updates across login, register, buying tickets, cart updates, chat updates
  useEffect(() => {
    if (user) {
      fetchCart();
      fetchTickets();
      fetchUnreadChats();
    } else {
      setCart(null);
      setTicketCredits(null);
      setUnreadChatCount(0);
    }

    const handleCartUpdate = () => fetchCart();
    const handleTicketsUpdate = () => fetchTickets();
    const handleChatUpdate = () => fetchUnreadChats();
    const handleUserUpdate = () => {
      fetchCart();
      fetchTickets();
      fetchUnreadChats();
    };

    window.addEventListener("cartUpdated", handleCartUpdate);
    window.addEventListener("ticketsUpdated", handleTicketsUpdate);
    window.addEventListener("chatUpdated", handleChatUpdate);
    window.addEventListener("userUpdated", handleUserUpdate);
    window.addEventListener("focus", handleUserUpdate);

    // Periodic check for new chat messages every 10 seconds while logged in
    const chatInterval = setInterval(() => {
      if (user) fetchUnreadChats();
    }, 10000);

    return () => {
      window.removeEventListener("cartUpdated", handleCartUpdate);
      window.removeEventListener("ticketsUpdated", handleTicketsUpdate);
      window.removeEventListener("chatUpdated", handleChatUpdate);
      window.removeEventListener("userUpdated", handleUserUpdate);
      window.removeEventListener("focus", handleUserUpdate);
      clearInterval(chatInterval);
    };
  }, [user, fetchCart, fetchTickets, fetchUnreadChats]);

  const openCart = () => {
    setCartOpen(true);
    fetchCart();
  };

  const updateItem = async (itemId: number, quantity: number) => {
    if (!user) return;
    setBusyItemId(itemId);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${API_BASE_URL}/marketplace/cart/update/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, item_id: itemId, quantity }),
      });
      if (res.ok) {
        setCart(await res.json());
        window.dispatchEvent(new Event("cartUpdated"));
      }
    } finally { setBusyItemId(null); }
  };

  const removeItem = async (itemId: number) => {
    if (!user) return;
    setBusyItemId(itemId);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${API_BASE_URL}/marketplace/cart/remove/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, item_id: itemId }),
      });
      if (res.ok) {
        setCart(await res.json());
        window.dispatchEvent(new Event("cartUpdated"));
      }
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
      <nav className="fixed top-0 left-0 w-full z-50 px-4 sm:px-6 md:px-8 lg:px-12 h-16 sm:h-20 flex justify-between items-center bg-[#f5f3f0]/95 backdrop-blur-3xl border-b border-[#EA580C]/20 transition-all">

        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <Image src="/logo.png" alt="BuildMe.lk" width={120} height={32} className="object-contain w-[100px] sm:w-[115px] md:w-[130px]" priority />
        </Link>

        {/* Desktop nav links: visible on lg (1024px) and above */}
        <div className="absolute left-1/2 -translate-x-1/2 hidden lg:flex items-center gap-4 xl:gap-7 2xl:gap-9">
          {navLinks.map(link => (
            <Link key={link.href} href={link.href}
              className={`text-[11px] xl:text-[12px] uppercase tracking-[0.15em] xl:tracking-[0.2em] font-semibold transition-opacity hover:opacity-70 ${pathname === link.href ? 'text-[#EA580C]' : 'text-[#281713]'}`}>
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Ticket credit pill for Clients / Membership pill for Professionals */}
          {user && ticketCredits !== null && backendUser?.role !== 'PROFESSIONAL' && (
            <Link
              href="/tickets"
              className="hidden sm:flex items-center gap-1.5 border border-[#EA580C]/20 bg-[#EA580C]/5 px-3 py-1.5 text-[10px] font-semibold text-[#EA580C] hover:bg-[#EA580C]/10 transition-colors shrink-0 rounded-full"
              title="Bidding Tickets (Tender Posts)"
            >
              <Ticket className="h-3.5 w-3.5" />
              <span>{ticketCredits} Ticket{ticketCredits !== 1 ? 's' : ''}</span>
            </Link>
          )}

          {user && backendUser?.role === 'PROFESSIONAL' && (
            <Link
              href="/dashboard/professional"
              className="hidden sm:flex items-center gap-1.5 border border-[#EA580C]/20 bg-[#EA580C]/10 px-3 py-1.5 text-[10px] font-semibold text-[#EA580C] hover:bg-[#EA580C]/15 transition-colors shrink-0 rounded-full"
              title="Manage Professional Membership"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Pro Workspace</span>
            </Link>
          )}

          {/* Cart icon */}
          <button
            onClick={openCart}
            aria-label="Open cart"
            className="relative inline-flex items-center justify-center p-2 text-[#281713] hover:text-[#EA580C] transition-colors rounded-xl hover:bg-[#EA580C]/5"
          >
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-[#EA580C] text-white text-[9px] flex items-center justify-center font-bold">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </button>

          {/* Desktop & Tablet: user avatar / auth buttons */}
          {loading ? (
            <div className="h-8 w-8 rounded-full bg-[#EA580C]/10 animate-pulse hidden sm:block" />
          ) : user ? (
            <div className="relative hidden sm:flex items-center gap-2" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="relative flex items-center gap-2 hover:opacity-80 transition-opacity p-0.5 rounded-full focus:outline-none focus:ring-2 focus:ring-[#EA580C]/30"
              >
                {profilePhoto || user.photoURL ? (
                  <img 
                    src={profilePhoto || user.photoURL || ''} 
                    alt={displayName} 
                    className={`rounded-full object-cover border border-[#EA580C]/30 w-8 h-8 sm:w-9 sm:h-9 transition-all ${
                      unreadChatCount > 0 
                        ? 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-[#FCFAF7] shadow-[0_0_12px_rgba(16,185,129,0.7)] animate-pulse' 
                        : ''
                    }`} 
                  />
                ) : (
                  <div 
                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#EA580C]/10 border border-[#EA580C]/20 flex justify-center items-center text-[#EA580C] transition-all ${
                      unreadChatCount > 0 
                        ? 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-[#FCFAF7] shadow-[0_0_12px_rgba(16,185,129,0.7)] animate-pulse' 
                        : ''
                    }`}
                  >
                    <User className="h-4 w-4" />
                  </div>
                )}
                {unreadChatCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 z-10 pointer-events-none">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-[#FCFAF7]"></span>
                  </span>
                )}
              </button>
              {userMenuOpen && (
                <div className="absolute top-12 sm:top-14 right-0 w-56 bg-[#FCFAF7] border border-[#EA580C]/20 shadow-[0_4px_20px_-2px_rgba(234,88,12,0.15)] flex flex-col py-2 z-50 rounded-2xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-[#EA580C]/10 mb-1">
                    <p className="text-[#1C1108] text-xs font-semibold truncate">{displayName}</p>
                    <p className="text-[#908078] text-[11px] truncate">{user.email}</p>
                    {backendUser?.role !== 'PROFESSIONAL' && ticketCredits !== null && (
                      <p className="text-[10px] text-[#908078] mt-1">
                        <span className="font-semibold text-[#EA580C]">{ticketCredits}</span> Bidding Ticket{ticketCredits !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                  <Link href="/dashboard" onClick={() => setUserMenuOpen(false)} className="mx-2 px-3 py-2 text-[#281713] hover:text-[#EA580C] hover:bg-[#EA580C]/5 text-[10px] tracking-[0.1em] uppercase font-semibold rounded-xl transition-colors">Dashboard</Link>
                  <Link 
                    href={backendUser?.role === 'PROFESSIONAL' ? '/dashboard/professional#chats' : '/dashboard/client#chats'} 
                    onClick={() => setUserMenuOpen(false)} 
                    className="mx-2 px-3 py-2 text-[#281713] hover:text-[#EA580C] hover:bg-[#EA580C]/5 text-[10px] tracking-[0.1em] uppercase font-semibold rounded-xl transition-colors flex items-center justify-between"
                  >
                    <span className="flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5" />
                      Messages &amp; Chats
                    </span>
                    {unreadChatCount > 0 && (
                      <span className="bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full animate-pulse">
                        {unreadChatCount} new
                      </span>
                    )}
                  </Link>
                  <Link href="/profile" onClick={() => setUserMenuOpen(false)} className="mx-2 px-3 py-2 text-[#281713] hover:text-[#EA580C] hover:bg-[#EA580C]/5 text-[10px] tracking-[0.1em] uppercase font-semibold rounded-xl transition-colors">My Profile</Link>
                  {backendUser?.role === 'PROFESSIONAL' ? (
                    <Link href="/dashboard/professional" onClick={() => setUserMenuOpen(false)} className="mx-2 px-3 py-2 text-[#281713] hover:text-[#EA580C] hover:bg-[#EA580C]/5 text-[10px] tracking-[0.1em] uppercase font-semibold rounded-xl transition-colors">
                      Membership &amp; Plans
                    </Link>
                  ) : (
                    <Link href="/tickets" onClick={() => setUserMenuOpen(false)} className="mx-2 px-3 py-2 text-[#281713] hover:text-[#EA580C] hover:bg-[#EA580C]/5 text-[10px] tracking-[0.1em] uppercase font-semibold rounded-xl transition-colors flex items-center justify-between">
                      <span>Bidding Tickets</span>
                      {ticketCredits !== null && (
                        <span className="bg-[#EA580C] text-white text-[9px] font-bold px-1.5 py-0.5 min-w-[18px] text-center rounded-full">
                          {ticketCredits}
                        </span>
                      )}
                    </Link>
                  )}
                  <Link href="/workers/my-jobs" onClick={() => setUserMenuOpen(false)} className="mx-2 px-3 py-2 text-[#281713] hover:text-[#EA580C] hover:bg-[#EA580C]/5 text-[10px] tracking-[0.1em] uppercase font-semibold rounded-xl transition-colors">My Worker Jobs</Link>
                  <button onClick={handleSignOut} className="mx-2 px-3 py-2 text-left text-[#281713]/80 hover:text-[#EA580C] hover:bg-[#EA580C]/5 text-[10px] tracking-[0.1em] uppercase font-semibold rounded-xl transition-colors mt-1 border-t border-[#EA580C]/10 pt-2.5">
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2 md:gap-3">
              <Link href="/login" className="text-[11px] md:text-[12px] uppercase tracking-[0.15em] md:tracking-[0.2em] font-semibold text-[#281713] hover:text-[#EA580C] transition-colors px-3 py-2 rounded-xl">Log In</Link>
              <Link href="/login" className="bg-[#EA580C] text-[#FCFAF7] px-4 py-2 sm:px-5 sm:py-2.5 md:px-6 text-[10px] sm:text-[11px] tracking-[0.16em] md:tracking-[0.2em] uppercase font-semibold hover:bg-[#C2410C] transition-colors whitespace-nowrap rounded-xl shadow-xs">Get Started</Link>
            </div>
          )}

          {/* Hamburger: visible on mobile and tablet (< lg) */}
          <button
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open navigation menu"
            className="lg:hidden inline-flex items-center justify-center p-2 text-[#281713] hover:text-[#EA580C] transition-colors rounded-xl hover:bg-[#EA580C]/5"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </nav>

      {/* ── Mobile & Tablet Nav Panel (slides from left) ─────────────── */}
      {/* Backdrop */}
      <div
        onClick={() => setMobileNavOpen(false)}
        className={`fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm transition-opacity duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] lg:hidden
          ${mobileNavOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      />
      {/* Panel */}
      <aside className={`fixed top-0 left-0 h-full w-[85vw] sm:w-[380px] md:w-[420px] max-w-[440px] z-[70] bg-[#FCFAF7] shadow-2xl flex flex-col rounded-r-3xl transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] lg:hidden
        ${mobileNavOpen ? 'translate-x-0' : '-translate-x-full'}`}>

        {/* Panel header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 sm:py-5 border-b border-[#EA580C]/10">
          <Link href="/" onClick={() => setMobileNavOpen(false)}>
            <Image src="/logo.png" alt="BuildMe.lk" width={115} height={30} className="object-contain" />
          </Link>
          <button onClick={() => setMobileNavOpen(false)} aria-label="Close menu" className="p-2 text-[#EA580C] hover:opacity-70 rounded-full hover:bg-[#EA580C]/5">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-1.5">
          {navLinks.map(link => (
            <Link key={link.href} href={link.href}
              onClick={() => setMobileNavOpen(false)}
              className={`flex items-center justify-between px-4 py-3.5 sm:py-4 text-[12px] sm:text-[13px] uppercase tracking-[0.2em] font-semibold transition-colors rounded-xl
                ${pathname === link.href
                  ? 'bg-[#EA580C] text-white'
                  : 'text-[#281713] hover:text-[#EA580C] hover:bg-[#EA580C]/5'}`}>
              {link.label}
              <ChevronRight className="h-4 w-4 opacity-50" />
            </Link>
          ))}
        </nav>

        {/* User section */}
        <div className="border-t border-[#EA580C]/10 p-4 sm:p-6 bg-[#f8f5f2]/60">
          {loading ? (
            <div className="h-12 bg-[#EA580C]/10 animate-pulse" />
          ) : user ? (
            <div className="space-y-1.5">
              <div className="flex items-center gap-3 px-3 py-3 mb-2 bg-white border border-[#EA580C]/10">
                <div className="relative shrink-0">
                  {profilePhoto || user.photoURL ? (
                    <img 
                      src={profilePhoto || user.photoURL || ''} 
                      alt={displayName} 
                      className={`w-10 h-10 rounded-full object-cover border border-[#EA580C]/30 shrink-0 ${
                        unreadChatCount > 0 ? 'ring-2 ring-emerald-500 animate-pulse' : ''
                      }`} 
                    />
                  ) : (
                    <div 
                      className={`w-10 h-10 rounded-full bg-[#EA580C]/10 border border-[#EA580C]/20 flex justify-center items-center text-[#EA580C] shrink-0 ${
                        unreadChatCount > 0 ? 'ring-2 ring-emerald-500 animate-pulse' : ''
                      }`}
                    >
                      <User className="h-5 w-5" />
                    </div>
                  )}
                  {unreadChatCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 z-10 pointer-events-none">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white"></span>
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[#1C1108] text-xs font-semibold truncate">{displayName}</p>
                  <p className="text-[#908078] text-[11px] truncate">{user.email}</p>
                  {backendUser?.role !== 'PROFESSIONAL' && ticketCredits !== null && (
                    <p className="text-[10px] text-[#EA580C] font-medium mt-0.5">
                      {ticketCredits} Bidding Ticket{ticketCredits !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>
              <Link href="/dashboard" onClick={() => setMobileNavOpen(false)} className="flex items-center justify-between px-3 py-2.5 text-[12px] uppercase tracking-[0.18em] font-semibold text-[#281713] hover:text-[#EA580C] hover:bg-[#EA580C]/5 transition-colors">
                Dashboard <ChevronRight className="h-4 w-4 opacity-50" />
              </Link>
              <Link 
                href={backendUser?.role === 'PROFESSIONAL' ? '/dashboard/professional#chats' : '/dashboard/client#chats'} 
                onClick={() => setMobileNavOpen(false)} 
                className="flex items-center justify-between px-3 py-2.5 text-[12px] uppercase tracking-[0.18em] font-semibold text-[#281713] hover:text-[#EA580C] hover:bg-[#EA580C]/5 transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" />
                  Messages &amp; Chats
                </span>
                {unreadChatCount > 0 ? (
                  <span className="bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 min-w-[18px] text-center rounded-full animate-pulse">
                    {unreadChatCount} new
                  </span>
                ) : (
                  <ChevronRight className="h-4 w-4 opacity-50" />
                )}
              </Link>
              <Link href="/profile" onClick={() => setMobileNavOpen(false)} className="flex items-center justify-between px-3 py-2.5 text-[12px] uppercase tracking-[0.18em] font-semibold text-[#281713] hover:text-[#EA580C] hover:bg-[#EA580C]/5 transition-colors">
                My Profile <ChevronRight className="h-4 w-4 opacity-50" />
              </Link>
              {backendUser?.role === 'PROFESSIONAL' ? (
                <Link href="/dashboard/professional" onClick={() => setMobileNavOpen(false)} className="flex items-center justify-between px-3 py-2.5 text-[12px] uppercase tracking-[0.18em] font-semibold text-[#281713] hover:text-[#EA580C] hover:bg-[#EA580C]/5 transition-colors">
                  <span>Membership &amp; Plans</span>
                  <ChevronRight className="h-4 w-4 opacity-50" />
                </Link>
              ) : (
                <Link href="/tickets" onClick={() => setMobileNavOpen(false)} className="flex items-center justify-between px-3 py-2.5 text-[12px] uppercase tracking-[0.18em] font-semibold text-[#281713] hover:text-[#EA580C] hover:bg-[#EA580C]/5 transition-colors">
                  <span>Bidding Tickets</span>
                  {ticketCredits !== null && (
                    <span className="bg-[#EA580C] text-white text-[9px] font-bold px-1.5 py-0.5 min-w-[18px] text-center">
                      {ticketCredits}
                    </span>
                  )}
                </Link>
              )}
              <Link href="/workers/my-jobs" onClick={() => setMobileNavOpen(false)} className="flex items-center justify-between px-3 py-2.5 text-[12px] uppercase tracking-[0.18em] font-semibold text-[#281713] hover:text-[#EA580C] hover:bg-[#EA580C]/5 transition-colors">
                My Worker Jobs <ChevronRight className="h-4 w-4 opacity-50" />
              </Link>
              <button onClick={handleSignOut} className="w-full flex items-center justify-between px-3 py-2.5 text-[12px] uppercase tracking-[0.18em] font-semibold text-[#EA580C]/80 hover:bg-[#EA580C]/5 transition-colors border-t border-[#EA580C]/10 mt-2 pt-3">
                Logout <ChevronRight className="h-4 w-4 opacity-50" />
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <Link href="/login" onClick={() => setMobileNavOpen(false)} className="block w-full bg-[#EA580C] text-[#FCFAF7] px-4 py-3 text-center text-[11px] sm:text-[12px] tracking-[0.2em] uppercase font-semibold hover:bg-[#C2410C] transition-colors rounded-xl shadow-sm">
                Get Started
              </Link>
              <Link href="/login" onClick={() => setMobileNavOpen(false)} className="block w-full text-center text-[11px] sm:text-[12px] uppercase tracking-[0.2em] font-semibold text-[#281713] hover:text-[#EA580C] transition-colors py-2.5 border border-[#EA580C]/20 hover:bg-[#EA580C]/5 rounded-xl">
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
      <aside className={`fixed top-0 right-0 h-full w-[92vw] max-w-[420px] z-[70] bg-[#FCFAF7] shadow-2xl flex flex-col rounded-l-3xl transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
        ${cartOpen ? 'translate-x-0' : 'translate-x-full'}`}>

        {/* Cart header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#EA580C]/10 shrink-0">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#EA580C]/60 font-semibold">Shopping Cart</p>
            <h2 className="font-serif text-xl text-[#281713] mt-0.5">Your Cart</h2>
          </div>
          <button onClick={() => setCartOpen(false)} aria-label="Close cart" className="p-2 text-[#EA580C] hover:opacity-70 rounded-full hover:bg-[#EA580C]/5 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Cart body */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {!user ? (
            <div className="h-full flex flex-col items-center justify-center gap-4 text-center px-6">
              <ShoppingCart className="h-12 w-12 text-[#EA580C]/30" />
              <p className="text-[#606060] text-sm">Please log in to view your cart.</p>
              <Link href="/login" onClick={() => setCartOpen(false)} className="btn-primary text-sm px-6 py-3">
                Log In
              </Link>
            </div>
          ) : cartLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="space-y-3 w-full">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-20 bg-[#EA580C]/5 animate-pulse rounded-2xl" />
                ))}
              </div>
            </div>
          ) : !cart || cart.items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-4 text-center px-6">
              <ShoppingCart className="h-12 w-12 text-[#EA580C]/30" />
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
                <div key={item.id} className="flex gap-3 border border-[#e8ddd6] bg-white p-3.5 rounded-2xl shadow-2xs">
                  <div className="relative h-16 w-16 shrink-0 bg-[#f3ebe4] overflow-hidden rounded-xl">
                    {item.product_image && <Image src={item.product_image} alt={item.product_name} fill unoptimized className="object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[#281713] text-sm font-serif leading-tight line-clamp-2">{item.product_name}</p>
                    <p className="text-[#EA580C] text-xs mt-0.5 font-semibold">Rs. {item.unit_price}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => updateItem(item.id, Math.max(1, item.quantity - 1))}
                        disabled={busyItemId === item.id}
                        className="h-6 w-6 border border-[#e8ddd6] flex items-center justify-center text-[#EA580C] hover:bg-[#EA580C] hover:text-white transition-colors disabled:opacity-50 rounded-lg"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-xs text-[#606060] w-4 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateItem(item.id, item.quantity + 1)}
                        disabled={busyItemId === item.id}
                        className="h-6 w-6 border border-[#e8ddd6] flex items-center justify-center text-[#EA580C] hover:bg-[#EA580C] hover:text-white transition-colors disabled:opacity-50 rounded-lg"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => removeItem(item.id)}
                        disabled={busyItemId === item.id}
                        className="ml-auto text-[#EA580C]/60 hover:text-[#EA580C] transition-colors disabled:opacity-50 p-1 rounded-full"
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
          <div className="border-t border-[#EA580C]/10 p-4 space-y-3 shrink-0 bg-white">
            <div className="flex justify-between items-center">
              <span className="text-[11px] uppercase tracking-[0.2em] text-[#EA580C]/70 font-semibold">Total</span>
              <span className="font-serif text-xl text-[#281713] font-bold">Rs. {cart.total}</span>
            </div>
            <button className="w-full bg-[#EA580C] text-[#FCFAF7] py-3.5 text-[11px] tracking-[0.2em] uppercase font-semibold hover:bg-[#C2410C] transition-colors rounded-xl shadow-sm">
              Checkout
            </button>
            <Link href="/cart" onClick={() => setCartOpen(false)} className="block w-full text-center border border-[#EA580C] py-3 text-[11px] tracking-[0.2em] uppercase font-semibold text-[#EA580C] hover:bg-[#EA580C]/5 transition-colors rounded-xl">
              View Full Cart
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
