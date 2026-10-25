'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from '@/lib/supabase/useSession';
import { createClient } from '@/lib/supabase/client';
import {
  LayoutDashboard,
  Download,
  MonitorSmartphone,
  ChevronLeft,
  Menu,
  Globe,
  X,
  LogOut,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useState } from 'react';

import { ThemeToggle } from '@/components/theme-toggle';
import { useLanguage } from '@/lib/i18n/LanguageContext';

const navigation: any[] = [
  { key: 'sidebar.dashboard', href: '/dashboard', icon: LayoutDashboard },
];

const superAdminNavigation = [
  { key: 'sidebar.super_admin', href: '/super-admin', icon: ShieldCheck },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useLanguage();

  const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN';

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const supabase = createClient();
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <>
      {/* Mobile header */}
      <div className="fixed top-0 left-0 right-0 h-16 z-30 lg:hidden bg-white/80 dark:bg-[var(--color-background)]/80 backdrop-blur-md border-b border-[var(--color-border)] px-4 flex items-center gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 -ml-2 rounded-xl hover:bg-[var(--color-muted)] transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5 text-[var(--color-foreground)]" />
        </button>
        <Link href="/" className="flex items-center">
          <Image 
            src="/Topify-logo.png" 
            alt="Topify Logo" 
            width={120} 
            height={32} 
            className="h-7 w-auto object-contain" 
            priority
            unoptimized
          />
        </Link>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-40 h-screen bg-[var(--color-sidebar)] border-r border-[var(--color-sidebar-border)]
          flex flex-col transition-all duration-300 ease-in-out
          ${collapsed ? 'w-[72px]' : 'w-[260px]'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Header */}
        <div className={`flex items-center h-16 px-4 border-b border-[var(--color-sidebar-border)] ${collapsed ? 'justify-center' : 'justify-between'}`}>
          <Link href="/" className={`flex items-center min-w-0 overflow-hidden transition-all ${collapsed ? 'justify-center w-10' : 'w-[160px]'}`}>
            <Image 
              src="/Topify-logo.png" 
              alt="Topify Logo" 
              width={200} 
              height={56} 
              className={`h-10 w-auto object-contain object-left ${collapsed ? 'max-w-none' : ''}`} 
              priority
              unoptimized
            />
          </Link>
          
          {/* Desktop collapse */}
          <button
            onClick={() => {
              setCollapsed(!collapsed);
              setMobileOpen(false);
            }}
            className={`hidden lg:flex items-center justify-center w-7 h-7 rounded-lg hover:bg-[var(--color-muted)] transition-colors ${collapsed ? 'rotate-180' : ''}`}
            aria-label="Toggle sidebar"
          >
            <ChevronLeft className="w-4 h-4 text-[var(--color-muted-foreground)]" />
          </button>

          {/* Mobile close */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden flex items-center justify-center w-7 h-7 rounded-lg hover:bg-[var(--color-muted)] transition-colors"
            aria-label="Close menu"
          >
            <X className="w-4 h-4 text-[var(--color-muted-foreground)]" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto flex flex-col justify-between">
          <div className="space-y-3">
            <div className="space-y-1">
              {navigation.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium
                      transition-all duration-200 group
                      ${active
                        ? 'bg-[var(--color-sidebar-active-bg)] text-[var(--color-sidebar-active)] font-semibold'
                        : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]'
                      }
                      ${collapsed ? 'justify-center px-2' : ''}
                    `}
                    title={collapsed ? (t(item.key) as string) : undefined}
                  >
                    <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${active ? 'text-[var(--color-sidebar-active)]' : ''}`} />
                    {!collapsed && <span>{t(item.key)}</span>}
                  </Link>
                );
              })}
            </div>

            {/* Super Admin section */}
            {isSuperAdmin && (
              <div className="pt-3 border-t border-[var(--color-sidebar-border)]">
                {!collapsed && (
                  <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
                    {t('sidebar.system')}
                  </p>
                )}
                <div className="space-y-1">
                  {superAdminNavigation.map((item) => {
                    const active = isActive(item.href);
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={`
                          flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium
                          transition-all duration-200
                          ${active
                            ? 'bg-[var(--color-sidebar-active-bg)] text-[var(--color-sidebar-active)] font-semibold'
                            : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]'
                          }
                          ${collapsed ? 'justify-center px-2' : ''}
                        `}
                        title={collapsed ? (t(item.key) as string) : undefined}
                      >
                        <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${active ? 'text-[var(--color-sidebar-active)]' : ''}`} />
                        {!collapsed && <span>{t(item.key)}</span>}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Download Desktop App Banner / CTA */}
          <div className="pt-4">
            {!collapsed ? (
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-blue-500/10 border border-indigo-500/20 text-center">
                <div className="w-9 h-9 rounded-xl bg-[#5B3DF5] text-white mx-auto flex items-center justify-center mb-2 shadow-sm">
                  <MonitorSmartphone className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-semibold text-[var(--color-foreground)]">Topify Desktop App</h4>
                <p className="text-[11px] text-[var(--color-muted-foreground)] mt-1 leading-relaxed">
                  Quản lý nội dung, tự động hóa mạng xã hội & CRM chuyên sâu trên ứng dụng máy tính.
                </p>
                <Link
                  href="/download"
                  className="mt-3 inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-xl bg-[#5B3DF5] hover:bg-[#4d32d4] text-white text-[12px] font-medium shadow-sm transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tải Desktop App</span>
                </Link>
              </div>
            ) : (
              <Link
                href="/download"
                className="flex items-center justify-center w-10 h-10 mx-auto rounded-xl bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20 transition-colors"
                title="Tải Desktop App"
              >
                <Download className="w-5 h-5" />
              </Link>
            )}
          </div>
        </nav>

        {/* Back to Home */}
        <div className={`p-3 border-t border-[var(--color-sidebar-border)] ${collapsed ? 'px-2' : ''}`}>
          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className={`
              flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium
              text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]
              transition-all duration-200
              ${collapsed ? 'justify-center px-2' : ''}
            `}
            title={collapsed ? (t('sidebar.back_home') as string) : undefined}
          >
            <Globe className={`w-[18px] h-[18px] flex-shrink-0`} />
            {!collapsed && <span>{t('sidebar.back_home')}</span>}
          </Link>
        </div>

        {/* User section */}
        <div className={`p-3 border-t border-[var(--color-sidebar-border)] ${collapsed ? 'px-2' : ''}`}>
          <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
            {/* Avatar */}
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#5B3DF5] to-[#3B82F6] flex items-center justify-center flex-shrink-0 shadow-sm">
              <span className="text-white text-sm font-semibold">
                {session?.user?.email?.[0]?.toUpperCase() || '?'}
              </span>
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold truncate text-[var(--color-foreground)]">
                  {session?.user?.name || session?.user?.email?.split('@')[0]}
                </p>
                <p className="text-[11px] text-[var(--color-muted-foreground)] truncate">
                  {session?.user?.role === 'SUPER_ADMIN' ? 'Super Admin' : session?.user?.role === 'ADMIN' ? 'Admin' : 'Staff'}
                </p>
              </div>
            )}
            {!collapsed && (
              <div className="flex items-center gap-1 ml-auto">
                <ThemeToggle />
                <button
                  onClick={handleSignOut}
                  className="p-1.5 rounded-lg hover:bg-[var(--color-muted)] transition-colors"
                  title={t('sidebar.sign_out') as string}
                >
                  <LogOut className="w-4 h-4 text-[var(--color-muted-foreground)]" />
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
