import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
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
  Heart,
  X,
} from 'lucide-react';

const navigation = [
  { key: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { key: 'Trực tiếp', href: '/live', icon: Play },
  { key: 'Bài viết', href: '/posts', icon: Calendar },
  { key: 'Tải xuống', href: '/downloader', icon: Download },
  { key: 'Tài khoản FB', href: '/accounts', icon: Users },
  { key: 'Proxies', href: '/proxies', icon: Globe },
  { key: 'Tự động hóa', href: '/automation', icon: Play },
  { key: 'Buff tương tác', href: '/buff', icon: Heart },
  { key: 'Lịch sử', href: '/history', icon: Activity },
  { key: 'Cài đặt', href: '/settings', icon: Settings },
];

const adminNavigation = [
  { key: 'Nhân sự', href: '/team', icon: Users },
];

const superAdminNavigation = [
  { key: 'Workspaces', href: '/super-admin', icon: Building2 },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Parse user from local storage
  const userData = localStorage.getItem('topify_user');
  let user = null;
  try {
    user = userData ? JSON.parse(userData) : null;
  } catch (e) {
    user = null;
  }

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isAdmin = user?.role === 'ADMIN' || isSuperAdmin;
  
  let allNavItems = [...navigation];
  if (isAdmin) allNavItems = [...allNavItems, ...adminNavigation];
  if (isSuperAdmin) allNavItems = [...allNavItems, ...superAdminNavigation];

  const isActive = (href: string) => {
    if (href === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(href);
  };

  const handleSignOut = () => {
    localStorage.removeItem('topify_token');
    localStorage.removeItem('topify_user');
    navigate('/login');
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2.5 rounded-xl bg-white border border-[var(--color-border)] shadow-sm"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5 text-[var(--color-foreground)]" />
      </button>

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
          fixed top-0 left-0 z-40 h-screen bg-white border-r border-[var(--color-border)]
          flex flex-col transition-all duration-300 ease-in-out
          ${collapsed ? 'w-[72px]' : 'w-[260px]'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Header */}
        <div className={`flex items-center h-16 px-4 border-b border-[var(--color-border)] ${collapsed ? 'justify-center' : 'justify-between'}`}>
          <Link to="/dashboard" className={`flex items-center min-w-0 overflow-hidden transition-all ${collapsed ? 'justify-center w-10' : 'w-[160px]'}`}>
            <img 
              src="./Topify-logo.png" 
              alt="Topify Logo" 
              className={`h-10 w-auto object-contain object-left ${collapsed ? 'max-w-none' : ''}`} 
            />
          </Link>
          
          {/* Desktop collapse */}
          <button
            onClick={() => {
              setCollapsed(!collapsed);
              setMobileOpen(false);
            }}
            className={`hidden lg:flex items-center justify-center w-7 h-7 rounded-lg hover:bg-gray-100 transition-colors ${collapsed ? 'rotate-180' : ''}`}
            aria-label="Toggle sidebar"
          >
            <ChevronLeft className="w-4 h-4 text-gray-500" />
          </button>

          {/* Mobile close */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden flex items-center justify-center w-7 h-7 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-4 h-4 text-gray-500" />
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
                  to={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium
                    transition-all duration-200 group
                    ${active
                      ? 'bg-blue-50 text-[var(--color-primary)] font-semibold'
                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                    }
                    ${collapsed ? 'justify-center px-2' : ''}
                  `}
                  title={collapsed ? item.key : undefined}
                >
                  <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${active ? 'text-[var(--color-primary)]' : ''}`} />
                  {!collapsed && <span>{item.key}</span>}
                </Link>
              );
            })}
          </div>

          {/* Admin section */}
          {isAdmin && (
            <div className="mt-5 pt-5 border-t border-[var(--color-border)]">
              {!collapsed && (
                <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  Quản trị
                </p>
              )}
              <div className="space-y-1">
                {adminNavigation.map((item) => {
                  const active = isActive(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`
                        flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium
                        transition-all duration-200
                        ${active
                          ? 'bg-blue-50 text-[var(--color-primary)] font-semibold'
                          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                        }
                        ${collapsed ? 'justify-center px-2' : ''}
                      `}
                      title={collapsed ? item.key : undefined}
                    >
                      <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${active ? 'text-[var(--color-primary)]' : ''}`} />
                      {!collapsed && <span>{item.key}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Super Admin section */}
          {isSuperAdmin && (
            <div className="mt-5 pt-5 border-t border-[var(--color-border)]">
              {!collapsed && (
                <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  Hệ thống
                </p>
              )}
              <div className="space-y-1">
                {superAdminNavigation.map((item) => {
                  const active = isActive(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`
                        flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium
                        transition-all duration-200
                        ${active
                          ? 'bg-blue-50 text-[var(--color-primary)] font-semibold'
                          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                        }
                        ${collapsed ? 'justify-center px-2' : ''}
                      `}
                      title={collapsed ? item.key : undefined}
                    >
                      <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${active ? 'text-[var(--color-primary)]' : ''}`} />
                      {!collapsed && <span>{item.key}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </nav>

        {/* User section */}
        <div className={`p-3 border-t border-[var(--color-border)] ${collapsed ? 'px-2' : ''}`}>
          <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
            {/* Avatar */}
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#5B3DF5] to-[#3B82F6] flex items-center justify-center flex-shrink-0 shadow-sm">
              <span className="text-white text-sm font-semibold">
                {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
              </span>
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold truncate text-[var(--color-foreground)]">
                  {user?.name || 'Admin'}
                </p>
                <p className="text-[11px] text-gray-500 truncate">
                  {user?.role === 'SUPER_ADMIN' ? 'Super Admin' : user?.role === 'ADMIN' ? 'Admin' : 'Staff'}
                </p>
              </div>
            )}
            {!collapsed && (
              <div className="flex items-center gap-1 ml-auto">
                <button
                  onClick={handleSignOut}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Đăng xuất"
                >
                  <LogOut className="w-4 h-4 text-red-500" />
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
