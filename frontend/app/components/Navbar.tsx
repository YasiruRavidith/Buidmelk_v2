"use client";

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState, useRef, useEffect, useMemo } from 'react'
import { ShoppingCart } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

export default function Navbar() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const displayName = useMemo(() => {
    if (!user) return '';
    return user.displayName || user.email || 'User';
  }, [user]);

  const handleSignOut = async () => {
    setMenuOpen(false);
    await signOut();
    router.push('/');
  };

  useEffect(() => {
    if (!menuOpen) return;
    const handleOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [menuOpen]);

  return (
    <nav className="fixed top-0 left-0 w-full z-50 px-6 sm:px-12 h-24 flex justify-between items-center bg-[#f5f3f0]/100 backdrop-blur-3xl border-b border-[#8B4434]/20 ">
      {/* Brand logo */}
      <Link href="/" className="flex items-center gap-3">
        <Image src="/logo.png" alt="BuildMe.lk" width={140} height={36} className="object-contain" priority/>
      </Link>
      
      {/* Navigation Links - Desktop */}
      <div className="absolute left-1/2 transform -translate-x-1/2 hidden md:flex items-center gap-10">
        <Link href="/professionals" className="text-[12px] uppercase tracking-[0.2em] font-semibold text-[#b44d08] hover:opacity-70 transition-opacity">
          Professionals
        </Link>
        <Link href="/bidding" className="text-[12px] uppercase tracking-[0.2em] font-semibold text-[#b44d08] hover:opacity-70 transition-opacity">
          Open Bidding
        </Link>
        <Link href="/marketplace" className="text-[12px] uppercase tracking-[0.2em] font-semibold text-[#b44d08] hover:opacity-70 transition-opacity">
          Materials
        </Link>
        <Link href="/shops" className="text-[12px] uppercase tracking-[0.2em] font-semibold text-[#b44d08] hover:opacity-70 transition-opacity">
          Shops
        </Link>
        <Link href="/estimation" className="text-[12px] uppercase tracking-[0.2em] font-semibold text-[#b44d08] hover:opacity-70 transition-opacity">
          Estimation
        </Link>
      </div>

      {/* Action / Auth Buttons */}
      <div className="flex items-center gap-6">
        {loading ? (
          <div className="h-4 w-16 bg-[#8B4434]/10 animate-pulse"></div>
        ) : user ? (
          <div className="flex items-center gap-3 relative">
            <Link
              href="/cart"
              aria-label="View cart"
              className="inline-flex items-center justify-center text-[#b44d08] hover:opacity-70 transition-opacity mr-6"
            >
              <ShoppingCart className="h-5 w-5" aria-hidden="true" />
            </Link>

            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                {user.photoURL ? (
                  <Image src={user.photoURL} alt={displayName} width={32} height={32} className="rounded-full object-cover border border-[#b44d08]/20 w-10 h-10" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[#b44d08]/10 border border-[#b44d08]/20 flex justify-center items-center text-[#b44d08] text-lg font-serif italic">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
              </button>
            
              {menuOpen && (
                <div className="absolute top-14 right-0 w-48 bg-[#FCFAF7] border border-[#b44d08]/10 shadow-[0_4px_20px_-2px_rgba(139,68,52,0.15)] flex flex-col py-2 z-50">
                  <div className="px-4 py-3 border-b border-[#b44d08]/10 mb-3">
                    <p className="text-[#b44d08] text-xs font-semibold truncate">{displayName}</p>
                    <p className="text-[#b44d08]/70 text-[12px] truncate">{user.email}</p>
                  </div>
                  <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="px-4 py-2 text-[#b44d08] hover:bg-[#b44d08]/5 text-[10px] tracking-[0.1em] uppercase font-semibold transition-colors">
                    Dashboard
                  </Link>
                  <Link href="/profile" onClick={() => setMenuOpen(false)} className="px-4 py-2 text-[#b44d08] hover:bg-[#b44d08]/5 text-[10px] tracking-[0.1em] uppercase font-semibold transition-colors">
                    My Profile
                  </Link>
                  <button onClick={handleSignOut} className="px-4 py-2 text-left text-[#b44d08]/80 hover:bg-[#b44d08]/5 text-[10px] tracking-[0.1em] uppercase font-semibold transition-colors mt-1 border-t border-[#b44d08]/10 pt-3">
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/cart"
              aria-label="View cart"
              className="inline-flex items-center justify-center text-[#b44d08] hover:opacity-70 transition-opacity"
            >
              <ShoppingCart className="h-5 w-5" aria-hidden="true" />
            </Link>

            <Link href="/login" className="text-[12px] uppercase tracking-[0.2em] font-semibold text-[#b44d08] hover:opacity-70 transition-opacity hidden sm:block">
              Log In
            </Link>
            <Link 
              href="/login" 
              className="bg-[#b44d08] text-[#FCFAF7] px-6 py-2.5 text-[12px] tracking-[0.2em] uppercase font-semibold hover:bg-[#6c3426] transition-colors"
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}
