'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, ChevronDown } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState as useReactState } from 'react';
import LanguageSwitcher from '@/components/ui/language-switcher';
import { useLanguage } from '@/lib/i18n/LanguageContext';

function NavbarContent() {
  const [session, setSession] = useReactState<any>(null);
  const [isOpen, setIsOpen] = useReactState(false);
  const { t } = useLanguage();
  
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 transition-all duration-300">
      <div className="max-w-[1350px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/Topify-logo.png" alt="Topify Logo" width={200} height={56} className="h-12 w-auto object-contain" priority unoptimized />
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center space-x-1 flex-1 justify-center">
            <div className="relative group">
              <button className="flex items-center gap-1 text-gray-600 hover:text-[#5B3DF5] px-3 py-2 rounded-md text-[14px] font-medium transition-colors">
                {t('nav.products')}
                <ChevronDown className="w-3 h-3 text-gray-400 group-hover:text-[#5B3DF5] transition-transform group-hover:rotate-180" />
              </button>
              {/* Dropdown would go here - simplified for now */}
              <div className="absolute top-full left-0 w-64 bg-white border border-gray-100 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 p-2 transform translate-y-2 group-hover:translate-y-0">
                <Link href="/products/analytics" className="block px-4 py-3 hover:bg-blue-50 rounded-lg group/item">
                  <p className="text-sm font-semibold text-gray-900 group-hover/item:text-[#5B3DF5]">{t('prod.analytics.title')}</p>
                  <p className="text-xs text-gray-500 mt-1">{t('prod.analytics.desc')}</p>
                </Link>
                <Link href="/products/social" className="block px-4 py-3 hover:bg-blue-50 rounded-lg group/item">
                  <p className="text-sm font-semibold text-gray-900 group-hover/item:text-[#5B3DF5]">{t('prod.social.title')}</p>
                  <p className="text-xs text-gray-500 mt-1">{t('prod.social.desc')}</p>
                </Link>
                <Link href="/products/crm" className="block px-4 py-3 hover:bg-blue-50 rounded-lg group/item">
                  <p className="text-sm font-semibold text-gray-900 group-hover/item:text-[#5B3DF5]">{t('prod.crm.title')}</p>
                  <p className="text-xs text-gray-500 mt-1">{t('prod.crm.desc')}</p>
                </Link>
                <Link href="/products/work" className="block px-4 py-3 hover:bg-blue-50 rounded-lg group/item">
                  <p className="text-sm font-semibold text-gray-900 group-hover/item:text-[#5B3DF5]">{t('prod.work.title')}</p>
                  <p className="text-xs text-gray-500 mt-1">{t('prod.work.desc')}</p>
                </Link>
              </div>
            </div>
            <Link href="/features" className="text-gray-600 hover:text-[#5B3DF5] px-3 py-2 rounded-md text-[14px] font-medium transition-colors">{t('nav.features')}</Link>
            <Link href="/platforms" className="text-gray-600 hover:text-[#5B3DF5] px-3 py-2 rounded-md text-[14px] font-medium transition-colors">{t('nav.platforms')}</Link>
            <Link href="/video-downloader" className="text-gray-600 hover:text-[#5B3DF5] px-3 py-2 rounded-md text-[14px] font-medium transition-colors">Download Video</Link>
            <Link href="/pricing" className="text-gray-600 hover:text-[#5B3DF5] px-3 py-2 rounded-md text-[14px] font-medium transition-colors">{t('nav.pricing')}</Link>
            <Link href="/about" className="text-gray-600 hover:text-[#5B3DF5] px-3 py-2 rounded-md text-[14px] font-medium transition-colors">{t('nav.about')}</Link>
          </div>

          {/* Right Actions */}
          <div className="hidden lg:flex items-center gap-4">
            <LanguageSwitcher />

            {session ? (
              <Link href="/dashboard" className="bg-[#5B3DF5] text-white hover:bg-[#4F2FE0] px-5 py-2 rounded-lg text-sm font-semibold transition-all">
                {t('nav.dashboard')}
              </Link>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login" className="text-[#5B3DF5] border border-blue-100 bg-blue-50 hover:bg-blue-100 px-5 py-2 rounded-lg text-sm font-semibold transition-all">
                  {t('nav.login')}
                </Link>
                <Link href="/login" className="bg-[#5B3DF5] text-white hover:bg-[#4F2FE0] px-5 py-2 rounded-lg text-sm font-semibold transition-all">
                  {t('nav.signup')}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none"
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="lg:hidden bg-white border-b border-gray-100 shadow-xl">
          <div className="px-4 pt-2 pb-3 space-y-1">
            <Link href="/products" className="text-gray-600 hover:text-[#5B3DF5] block px-3 py-2 rounded-md text-base font-medium">{t('nav.products')}</Link>
            <Link href="/features" className="text-gray-600 hover:text-[#5B3DF5] block px-3 py-2 rounded-md text-base font-medium">{t('nav.features')}</Link>
            <Link href="/platforms" className="text-gray-600 hover:text-[#5B3DF5] block px-3 py-2 rounded-md text-base font-medium">{t('nav.platforms')}</Link>
            <Link href="/video-downloader" className="text-gray-600 hover:text-[#5B3DF5] block px-3 py-2 rounded-md text-base font-medium">Download Video</Link>
            <Link href="/pricing" className="text-gray-600 hover:text-[#5B3DF5] block px-3 py-2 rounded-md text-base font-medium">{t('nav.pricing')}</Link>
            <Link href="/about" className="text-gray-600 hover:text-[#5B3DF5] block px-3 py-2 rounded-md text-base font-medium">{t('nav.about')}</Link>
          </div>
          <div className="px-4 py-4 border-t border-gray-100">
            {session ? (
              <Link href="/dashboard" className="block text-center w-full bg-[#5B3DF5] text-white px-5 py-2.5 rounded-full text-sm font-semibold shadow-md">
                {t('nav.dashboard')}
              </Link>
            ) : (
              <div className="flex flex-col gap-3">
                <Link href="/login" className="block text-center w-full text-[#5B3DF5] border border-[#5B3DF5] bg-white px-5 py-2 rounded-full text-sm font-semibold">
                  {t('nav.login')}
                </Link>
                <Link href="/login" className="block text-center w-full bg-[#5B3DF5] text-white px-5 py-2 rounded-full text-sm font-semibold shadow-md">
                  {t('nav.signup')}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

export default function Navbar() {
  return <NavbarContent />;
}
