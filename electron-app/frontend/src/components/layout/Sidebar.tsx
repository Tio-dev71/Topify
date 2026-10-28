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
  Repeat,
  MessageSquare,
  BarChart3,
  Search,
  Film,
  Flame,
  CheckSquare,
  Rocket,
  Wallet,
  Sparkles,
  ShieldCheck,
  Wand2,
  Target,
  Gift,
  PieChart,
  Layers,
  LayoutTemplate,
  Hash,
  CheckCircle2,
  Link2,
  Image as ImageIcon,
  Kanban,
} from 'lucide-react';

interface NavSection {
  title: string;
  items: {
    key: string;
    href: string;
    icon: any;
    badge?: string;
  }[];
}

const navSections: NavSection[] = [
  {
    title: 'TỔNG QUAN',
    items: [
      { key: 'Tổng quan (Dashboard)', href: '/dashboard', icon: LayoutDashboard },
      { key: 'Báo cáo & Phân tích', href: '/analytics', icon: BarChart3 },
    ],
  },
  {
    title: 'NỘI DUNG & SÁNG TẠO',
    items: [
      { key: 'Quản lý bài viết', href: '/posts', icon: Calendar },
      { key: 'Lịch nội dung (Calendar)', href: '/calendar', icon: Calendar },
      { key: 'Chủ đề nội dung (Pillars)', href: '/pillars', icon: Layers, badge: 'F073' },
      { key: 'Mẫu bài viết (Templates)', href: '/templates', icon: LayoutTemplate },
      { key: 'Hashtags & Mẫu CTA', href: '/hashtags', icon: Hash },
      { key: 'Phê duyệt bài viết', href: '/approval', icon: CheckCircle2 },
      { key: 'Tạo liên kết UTM', href: '/utm', icon: Link2 },
      { key: 'Thư viện Media (Tệp tin)', href: '/media/library', icon: ImageIcon },
      { key: 'Media Studio AI', href: '/media/studio', icon: Film },
      { key: 'Studio Nội dung & Spin', href: '/content-studio', icon: Wand2 },
      { key: 'Nội dung Evergreen', href: '/evergreen', icon: Repeat },
      { key: 'Tải video / media', href: '/downloader', icon: Download },
    ],
  },
  {
    title: 'MẠNG XÃ HỘI & TỰ ĐỘNG HÓA',
    items: [
      { key: 'Tự động hóa', href: '/automation', icon: Play },
      { key: 'Tài khoản Facebook', href: '/accounts', icon: Users },
      { key: 'Quản lý Proxy', href: '/proxies', icon: Globe },
      { key: 'Tăng tương tác (Buff)', href: '/buff', icon: Heart },
      { key: 'Phát trực tiếp (Live)', href: '/live', icon: Play },
      { key: 'Thám tử xu hướng (MXH)', href: '/intelligence/social-search', icon: Search },
      { key: 'Theo dõi từ khóa (Keywords)', href: '/intelligence/keywords', icon: Hash },
      { key: 'Cảnh báo bùng nổ', href: '/intelligence/alerts', icon: Flame },
      { key: 'Theo dõi đối thủ (Fanpages)', href: '/competitors', icon: Target },
    ],
  },
  {
    title: 'GIAO TIẾP & BÁN HÀNG (CRM)',
    items: [
      { key: 'Hộp thư hợp nhất', href: '/inbox', icon: MessageSquare },
      { key: 'Hồ sơ khách hàng (F093)', href: '/customers', icon: Users },
      { key: 'Cơ hội bán hàng (F096)', href: '/deals', icon: Target },
      { key: 'Kênh bán hàng (F094/F095)', href: '/pipelines', icon: Kanban },
      { key: 'Quản lý công việc (Tasks)', href: '/tasks', icon: CheckSquare },
      { key: 'Chiến dịch (Campaigns)', href: '/campaigns', icon: Rocket },
      { key: 'Thành viên & Nhóm (F116/F117)', href: '/team', icon: Users },
    ],
  },
  {
    title: 'TÀI CHÍNH & TĂNG TRƯỞNG',
    items: [
      { key: 'Ví & Hoa hồng (Wallet)', href: '/wallet', icon: Wallet },
      { key: 'Tiếp thị liên kết (Referral)', href: '/referral', icon: Gift },
    ],
  },
  {
    title: 'HỆ THỐNG & CÀI ĐẶT',
    items: [
      { key: 'Thành viên & Nhóm (F116/F117)', href: '/team', icon: Users },
      { key: 'Gói cước & Quota (M8)', href: '/settings?tab=quota', icon: PieChart },
      { key: 'Topify AI Hub', href: '/ai', icon: Sparkles },
      { key: 'Bảo mật & Tích hợp', href: '/security', icon: ShieldCheck },
      { key: 'Nhật ký hoạt động', href: '/history', icon: Activity },
      { key: 'Cài đặt hệ thống', href: '/settings', icon: Settings },
    ],
  },
];

const superAdminNavigation = [
  { key: 'Không gian làm việc (Workspaces)', href: '/super-admin', icon: Building2 },
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

  const isActive = (href: string) => {
    if (href === '/dashboard') return location.pathname === '/dashboard';
    if (href.includes('?')) {
      const [path, query] = href.split('?');
      return location.pathname === path && location.search.includes(query);
    }
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
          <Link to="/dashboard" className={`flex items-center gap-2.5 min-w-0 overflow-hidden transition-all ${collapsed ? 'justify-center w-10' : 'w-[170px]'}`}>
            <img 
              src="./topify-app-mark-1024x1024.png" 
              alt="Topify" 
              className="w-8 h-8 rounded-lg shadow-2xs object-cover flex-shrink-0" 
            />
            {!collapsed && (
              <img 
                src="./Topify-logo.png" 
                alt="Topify Logo" 
                className="h-7 w-auto object-contain object-left" 
              />
            )}
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
        <nav className="flex-1 py-4 px-3 overflow-y-auto space-y-5">
          {navSections.map((section, idx) => (
            <div key={section.title} className={idx > 0 ? 'pt-4 border-t border-gray-100' : ''}>
              {!collapsed && (
                <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  {section.title}
                </p>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const active = isActive(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.key}
                      to={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`
                        flex items-center gap-3 px-3 py-2 rounded-xl text-[12.5px] font-medium
                        transition-all duration-200 group
                        ${active
                          ? 'bg-blue-50 text-[var(--color-primary)] font-bold'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        }
                        ${collapsed ? 'justify-center px-2' : ''}
                      `}
                      title={collapsed ? item.key : undefined}
                    >
                      <Icon className={`w-[17px] h-[17px] flex-shrink-0 ${active ? 'text-[var(--color-primary)]' : 'text-gray-400 group-hover:text-gray-600'}`} />
                      {!collapsed && (
                        <div className="flex items-center justify-between flex-1 min-w-0">
                          <span className="truncate">{item.key}</span>
                          {item.badge && (
                            <span className="ml-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-100 text-indigo-700">
                              {item.badge}
                            </span>
                          )}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Super Admin section */}
          {isSuperAdmin && (
            <div className="pt-4 border-t border-gray-100">
              {!collapsed && (
                <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  HỆ THỐNG
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
                        flex items-center gap-3 px-3 py-2 rounded-xl text-[12.5px] font-medium
                        transition-all duration-200
                        ${active
                          ? 'bg-blue-50 text-[var(--color-primary)] font-bold'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        }
                        ${collapsed ? 'justify-center px-2' : ''}
                      `}
                      title={collapsed ? item.key : undefined}
                    >
                      <Icon className={`w-[17px] h-[17px] flex-shrink-0 ${active ? 'text-[var(--color-primary)]' : 'text-gray-400'}`} />
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
          {!collapsed && (
            <div className="mt-2.5 pt-2 border-t border-[var(--color-border)]/50 flex items-center justify-between text-[11px] text-gray-600 px-1">
              <span>Topify Desktop</span>
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-md bg-purple-500/10 text-[#5B3DF5] font-semibold border border-[#5B3DF5]/20">
                v1.3.59
              </span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
