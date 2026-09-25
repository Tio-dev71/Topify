'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from '@/lib/supabase/useSession';
import { createClient } from '@/lib/supabase/client';
import {
  LayoutDashboard,
  PlusCircle,
  Calendar,
  Users,
  Settings,
  LogOut,
  Play,
  ChevronLeft,
  Menu,
  Building2,
  Download,
  Globe,
  Activity,
  X,
  Pencil,
  FileText,
  Image as ImageIcon,
  LayoutTemplate,
  CheckCircle,
  Hash,
  Layers,
  MessageSquare,
  Inbox,
  Contact,
  Target,
  Kanban,
  ListTodo,
  Megaphone,
  Zap,
  Shield,
  Wallet,
  Gift,
  Mic2,
  Link2,
  Brain,
} from 'lucide-react';
import { useState } from 'react';

import { ThemeToggle } from '@/components/theme-toggle';
import { useLanguage } from '@/lib/i18n/LanguageContext';

const navigation: any[] = [
  { key: 'sidebar.dashboard', href: '/dashboard', icon: LayoutDashboard },
];

const contentNavigation = [
  { key: 'sidebar.calendar', href: '/dashboard/content/calendar', icon: Calendar },
  { key: 'sidebar.media_library', href: '/dashboard/content/media', icon: ImageIcon },
  { key: 'sidebar.templates', href: '/dashboard/content/templates', icon: LayoutTemplate },
  { key: 'sidebar.approval', href: '/dashboard/content/approval', icon: CheckCircle },
  { key: 'sidebar.utm_builder', href: '/dashboard/content/utm', icon: Link2 },
];

const inboxNavigation = [
  { key: 'sidebar.inbox', href: '/dashboard/inbox', icon: Inbox },
  { key: 'sidebar.quick_replies', href: '/dashboard/inbox/quick-replies', icon: MessageSquare },
];

const crmNavigation = [
  { key: 'sidebar.customers', href: '/dashboard/crm/customers', icon: Contact },
  { key: 'sidebar.deals', href: '/dashboard/crm/deals', icon: Target },
  { key: 'sidebar.pipelines', href: '/dashboard/crm/pipelines', icon: Kanban },
];

const automationNavigation = [
  { key: 'sidebar.competitors', href: '/dashboard/social/competitors', icon: Building2 },
  { key: 'sidebar.keywords', href: '/dashboard/social/keywords', icon: Hash },
  { key: 'sidebar.alerts', href: '/dashboard/social/alerts', icon: Activity },
];

const operationsNavigation = [
  { key: 'sidebar.tasks', href: '/dashboard/tasks', icon: ListTodo },
  { key: 'sidebar.campaigns', href: '/dashboard/campaigns', icon: Megaphone },
  { key: 'sidebar.audit_log', href: '/dashboard/audit-log', icon: Shield },
];

const walletNavigation = [
  { key: 'sidebar.wallet', href: '/dashboard/wallet', icon: Wallet },
  { key: 'sidebar.referral', href: '/dashboard/referral', icon: Gift },
];

const adminNavigation: any[] = [];

const superAdminNavigation = [
  { key: 'sidebar.workspaces', href: '/super-admin', icon: Building2 },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useLanguage();

  const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN';
  
  let allNavItems = [...navigation];
  if (isSuperAdmin) allNavItems = [...allNavItems, ...superAdminNavigation];

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
        <nav className="flex-1 py-4 px-3 overflow-y-auto">
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

          {/* Content Studio section */}
          <div className="mt-5 pt-5 border-t border-[var(--color-sidebar-border)]">
            {!collapsed && (
              <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
                Content Studio
              </p>
            )}
            <div className="space-y-1">
              {contentNavigation.map((item) => {
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

          {/* Automation & Social section */}
          <div className="mt-5 pt-5 border-t border-[var(--color-sidebar-border)]">
            {!collapsed && (
              <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
                Automation & Social
              </p>
            )}
            <div className="space-y-1">
              {automationNavigation.map((item) => {
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

          {/* Inbox section */}
          <div className="mt-5 pt-5 border-t border-[var(--color-sidebar-border)]">
            {!collapsed && (
              <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
                Inbox
              </p>
            )}
            <div className="space-y-1">
              {inboxNavigation.map((item) => {
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

          {/* CRM section */}
          <div className="mt-5 pt-5 border-t border-[var(--color-sidebar-border)]">
            {!collapsed && (
              <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
                CRM
              </p>
            )}
            <div className="space-y-1">
              {crmNavigation.map((item) => {
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

          {/* Operations section */}
          <div className="mt-5 pt-5 border-t border-[var(--color-sidebar-border)]">
            {!collapsed && (
              <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
                Operations
              </p>
            )}
            <div className="space-y-1">
              {operationsNavigation.map((item) => {
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

          {/* Wallet & Referral section */}
          <div className="mt-5 pt-5 border-t border-[var(--color-sidebar-border)]">
            {!collapsed && (
              <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
                Wallet
              </p>
            )}
            <div className="space-y-1">
              {walletNavigation.map((item) => {
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

          {/* Super Admin section */}
          {isSuperAdmin && (
            <div className="mt-5 pt-5 border-t border-[var(--color-sidebar-border)]">
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
