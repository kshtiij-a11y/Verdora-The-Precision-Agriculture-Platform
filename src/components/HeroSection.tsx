'use client';

import { ArrowRight, ChevronDown, ChevronRight, Leaf, Menu, X } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

export function HeroSection() {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement | null>(null);

  // Close on ESC & click outside (mobile overlay)
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false);
    }
    function onClickOutside(e: MouseEvent) {
      if (!menuRef.current) return;
      if (menuRef.current.contains(e.target as Node)) return;
      setMenuOpen(false);
    }

    if (menuOpen) {
      document.addEventListener('keydown', onKey);
      document.addEventListener('click', onClickOutside);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('click', onClickOutside);
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  return (
    <>
      <section 
        className="w-full text-sm"
      >
        <nav className="flex items-center justify-between p-4 md:px-16 lg:px-24 xl:px-32 md:py-6 w-full text-white">
          <Link href="/" aria-label="Verdora | The Precision Agriculture Platform home" className="flex items-center gap-2">
            <Leaf className="w-8 h-8 text-primary" />
            <span className="font-bold text-lg">Verdora | The Precision Agriculture Platform</span>
          </Link>

          <div
            id="menu"
            ref={menuRef}
            className={[
              'max-md:absolute max-md:top-0 max-md:left-0 max-md:transition-all max-md:duration-300 max-md:overflow-hidden max-md:h-full max-md:bg-white/50 max-md:backdrop-blur z-50',
              'flex items-center gap-8 font-medium',
              'max-md:flex-col max-md:justify-center max-md:text-foreground',
              menuOpen ? 'max-md:w-full' : 'max-md:w-0',
            ].join(' ')}
            aria-hidden={!menuOpen}
          >
            <a href="#features" className="hover:text-primary transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-primary transition-colors">How It Works</a>

            <button
              onClick={() => setMenuOpen(false)}
              className="md:hidden bg-gray-800 hover:bg-black text-white p-2 rounded-md aspect-square font-medium transition"
              aria-label="Close menu"
            >
              <X />
            </button>
          </div>
          
          <div className="hidden md:flex items-center gap-2">
            <Link href="/farmer" className="bg-secondary text-secondary-foreground hover:bg-secondary/80 px-6 py-3 rounded-full font-medium transition">
                Farmer Portal
            </Link>
             <Link href="/dashboard" className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-full font-medium transition">
                Admin Portal
            </Link>
          </div>
          

          <button
            id="open-menu"
            onClick={() => setMenuOpen(true)}
            className="md:hidden bg-gray-800 hover:bg-black text-white p-2 rounded-md aspect-square font-medium transition"
            aria-label="Open menu"
          >
            <Menu />
          </button>
        </nav>

        <h1 className="text-4xl md:text-7xl font-medium max-w-[850px] text-center mx-auto pt-32 md:pt-32 text-white">
          Verdora: The Precision Agriculture Platform
        </h1>

        <p className="text-sm md:text-base mx-auto max-w-2xl text-center mt-6 max-md:px-2 text-white/80">
          Bridge the information gap with real-time, actionable insights on weather, market prices, and crop health, delivered directly to any mobile phone.
        </p>

        <div className="mx-auto w-full flex items-center justify-center gap-3 mt-4">
          <Link href="/dashboard" className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-full font-medium transition">
            Admin Portal
          </Link>
          <Link href="/farmer" className="flex items-center gap-2 border border-white/50 text-white hover:bg-white/10 rounded-full px-6 py-3 font-medium transition-colors">
            <span>Farmer Portal</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
