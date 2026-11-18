import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import FacebookAccounts from './pages/FacebookAccounts';
import Proxies from './pages/Proxies';
import Automation from './pages/Automation';
import History from './pages/History';
import Downloader from './pages/Downloader';
import Live from './pages/Live';
import Settings from './pages/Settings';
import Team from './pages/Team';
import Posts from './pages/Posts';
import PostDetail from './pages/PostDetail';
import CreatePost from './pages/CreatePost';
import Evergreen from './pages/Evergreen';
import ContentStudio from './pages/ContentStudio';
import Inbox from './pages/Inbox';
import Customers from './pages/Customers';
import Analytics from './pages/Analytics';
import SocialSearch from './pages/SocialSearch';
import BuffSystem from './pages/BuffSystem';
import Workspaces from './pages/Workspaces';
import MediaStudio from './pages/MediaStudio';
import ViralAlerts from './pages/ViralAlerts';
import Tasks from './pages/Tasks';
import Campaigns from './pages/Campaigns';
import WalletEarnings from './pages/WalletEarnings';
import TopifyAI from './pages/TopifyAI';
import SecurityIntegrations from './pages/SecurityIntegrations';
import Competitors from './pages/Competitors';
import ContentPillars from './pages/ContentPillars';
import ContentTemplates from './pages/ContentTemplates';
import Hashtags from './pages/Hashtags';
import Approval from './pages/Approval';
import UTMBuilder from './pages/UTMBuilder';
import CalendarView from './pages/CalendarView';
import MediaLibrary from './pages/MediaLibrary';
import Deals from './pages/Deals';
import Pipelines from './pages/Pipelines';
import Keywords from './pages/Keywords';
import Layout from './components/layout/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import { ScrollToTop } from './components/layout/ScrollToTop';
import { RbacGuard } from './components/common/PermissionDeniedCard';

function App() {
  return (
    <HashRouter>
      <ScrollToTop />
      <Toaster position="top-right" richColors />
      <ErrorBoundary>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Protected Routes wrapped in Layout */}
          <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/inbox" element={<RbacGuard permission="crm.manage" moduleName="Hộp Thư Hợp Nhất"><Inbox /></RbacGuard>} />
          <Route path="/crm/leads" element={<RbacGuard permission="crm.manage" moduleName="Khách Hàng Tiềm Năng (Leads)"><Customers defaultTab="f092" /></RbacGuard>} />
          <Route path="/leads" element={<RbacGuard permission="crm.manage" moduleName="Khách Hàng Tiềm Năng (Leads)"><Customers defaultTab="f092" /></RbacGuard>} />
          <Route path="/customers" element={<RbacGuard permission="crm.manage" moduleName="Hồ Sơ Khách Hàng"><Customers /></RbacGuard>} />
          <Route path="/crm/customers" element={<RbacGuard permission="crm.manage" moduleName="Hồ Sơ Khách Hàng"><Customers defaultTab="f093" /></RbacGuard>} />
          <Route path="/crm/activities" element={<RbacGuard permission="crm.manage" moduleName="Hoạt Động & Follow-up"><Customers defaultTab="f098" /></RbacGuard>} />
          <Route path="/crm/custom-fields" element={<RbacGuard permission="crm.manage" moduleName="Trường Tùy Biến CRM"><Customers defaultTab="f099" /></RbacGuard>} />
          <Route path="/crm/lead-scoring" element={<RbacGuard permission="crm.manage" moduleName="Chấm Điểm Lead"><Customers defaultTab="f100" /></RbacGuard>} />
          <Route path="/crm/duplicate-merge" element={<RbacGuard permission="crm.manage" moduleName="Quét Trùng & Hợp Nhất"><Customers defaultTab="f101" /></RbacGuard>} />
          <Route path="/crm/embed-form" element={<RbacGuard permission="crm.manage" moduleName="Nhúng Form Thu Lead"><Customers defaultTab="f102" /></RbacGuard>} />
          <Route path="/deals" element={<RbacGuard permission="crm.manage" moduleName="Cơ Hội Bán Hàng (Deals)"><Deals /></RbacGuard>} />
          <Route path="/crm/deals" element={<RbacGuard permission="crm.manage" moduleName="Cơ Hội Bán Hàng (Deals)"><Deals /></RbacGuard>} />
          <Route path="/pipelines" element={<RbacGuard permission="crm.manage" moduleName="Kênh Bán Hàng (Pipelines)"><Pipelines /></RbacGuard>} />
          <Route path="/crm/pipelines" element={<RbacGuard permission="crm.manage" moduleName="Kênh Bán Hàng (Pipelines)"><Pipelines /></RbacGuard>} />
          <Route path="/analytics" element={<RbacGuard permission="analytics.view" moduleName="Báo Cáo & Phân Tích"><Analytics /></RbacGuard>} />
          <Route path="/intelligence/social-search" element={<RbacGuard permission="intelligence.manage" moduleName="Thám Tử Xu Hướng MXH"><SocialSearch /></RbacGuard>} />
          <Route path="/social-search" element={<RbacGuard permission="intelligence.manage" moduleName="Thám Tử Xu Hướng MXH"><SocialSearch /></RbacGuard>} />
          <Route path="/intelligence/trending" element={<RbacGuard permission="intelligence.manage" moduleName="Xu Hướng Bùng Nổ"><ViralAlerts defaultTab="trending" /></RbacGuard>} />
          <Route path="/trending" element={<RbacGuard permission="intelligence.manage" moduleName="Xu Hướng Bùng Nổ"><ViralAlerts defaultTab="trending" /></RbacGuard>} />
          <Route path="/intelligence/alerts" element={<RbacGuard permission="intelligence.manage" moduleName="Cảnh Báo Vượt Ngưỡng"><ViralAlerts defaultTab="alerts" /></RbacGuard>} />
          <Route path="/alerts" element={<RbacGuard permission="intelligence.manage" moduleName="Cảnh Báo Vượt Ngưỡng"><ViralAlerts defaultTab="alerts" /></RbacGuard>} />
          <Route path="/intelligence/competitors" element={<RbacGuard permission="intelligence.manage" moduleName="Theo Dõi Đối Thủ"><Competitors /></RbacGuard>} />
          <Route path="/competitors" element={<RbacGuard permission="intelligence.manage" moduleName="Theo Dõi Đối Thủ"><Competitors /></RbacGuard>} />
          <Route path="/intelligence/keywords" element={<RbacGuard permission="intelligence.manage" moduleName="Theo Dõi Từ Khóa"><Keywords /></RbacGuard>} />
          <Route path="/keywords" element={<RbacGuard permission="intelligence.manage" moduleName="Theo Dõi Từ Khóa"><Keywords /></RbacGuard>} />
          <Route path="/media/studio" element={<RbacGuard permission="automation.manage" moduleName="Media Studio AI"><MediaStudio /></RbacGuard>} />
          <Route path="/media/library" element={<RbacGuard permission="media.manage" moduleName="Thư Viện Media"><MediaLibrary /></RbacGuard>} />
          <Route path="/accounts" element={<RbacGuard permission="automation.manage" moduleName="Tài Khoản Facebook"><FacebookAccounts /></RbacGuard>} />
          <Route path="/tasks" element={<RbacGuard permission="campaigns.manage" moduleName="Quản Lý Công Việc"><Tasks /></RbacGuard>} />
          <Route path="/campaigns" element={<RbacGuard permission="campaigns.manage" moduleName="Chiến Dịch"><Campaigns /></RbacGuard>} />

          <Route path="/live" element={<RbacGuard permission="automation.manage" moduleName="Phát Trực Tiếp"><Live /></RbacGuard>} />
          <Route path="/posts" element={<RbacGuard permission="posts.manage" moduleName="Quản Lý Bài Viết"><Posts /></RbacGuard>} />
          <Route path="/posts/:id" element={<RbacGuard permission="posts.manage" moduleName="Chi Tiết Bài Viết"><PostDetail /></RbacGuard>} />
          <Route path="/calendar" element={<RbacGuard permission="posts.manage" moduleName="Lịch Nội Dung"><CalendarView /></RbacGuard>} />
          <Route path="/content/calendar" element={<RbacGuard permission="posts.manage" moduleName="Lịch Nội Dung"><CalendarView /></RbacGuard>} />
          <Route path="/pillars" element={<RbacGuard permission="posts.manage" moduleName="Chủ Đề Nội Dung"><ContentPillars /></RbacGuard>} />
          <Route path="/content/pillars" element={<RbacGuard permission="posts.manage" moduleName="Chủ Đề Nội Dung"><ContentPillars /></RbacGuard>} />
          <Route path="/templates" element={<RbacGuard permission="posts.manage" moduleName="Mẫu Bài Viết"><ContentTemplates /></RbacGuard>} />
          <Route path="/content/templates" element={<RbacGuard permission="posts.manage" moduleName="Mẫu Bài Viết"><ContentTemplates /></RbacGuard>} />
          <Route path="/hashtags" element={<RbacGuard permission="posts.manage" moduleName="Hashtags & Mẫu CTA"><Hashtags /></RbacGuard>} />
          <Route path="/content/hashtags" element={<RbacGuard permission="posts.manage" moduleName="Hashtags & Mẫu CTA"><Hashtags /></RbacGuard>} />
          <Route path="/approval" element={<RbacGuard permission="posts.manage" moduleName="Phê Duyệt Bài Viết"><Approval /></RbacGuard>} />
          <Route path="/content/approval" element={<RbacGuard permission="posts.manage" moduleName="Phê Duyệt Bài Viết"><Approval /></RbacGuard>} />
          <Route path="/utm" element={<RbacGuard permission="posts.manage" moduleName="Tạo Liên Kết UTM"><UTMBuilder /></RbacGuard>} />
          <Route path="/content/utm" element={<RbacGuard permission="posts.manage" moduleName="Tạo Liên Kết UTM"><UTMBuilder /></RbacGuard>} />
          <Route path="/create" element={<RbacGuard permission="posts.manage" moduleName="Tạo Bài Viết"><CreatePost /></RbacGuard>} />
          <Route path="/evergreen" element={<RbacGuard permission="posts.manage" moduleName="Nội Dung Evergreen"><Evergreen /></RbacGuard>} />
          <Route path="/content-studio" element={<RbacGuard permission="posts.manage" moduleName="Studio Nội Dung & Spin"><ContentStudio /></RbacGuard>} />
          <Route path="/downloader" element={<RbacGuard permission="media.manage" moduleName="Tải Video & Media"><Downloader /></RbacGuard>} />
          <Route path="/proxies" element={<RbacGuard permission="automation.manage" moduleName="Quản Lý Proxy"><Proxies /></RbacGuard>} />
          <Route path="/automation" element={<RbacGuard permission="automation.manage" moduleName="Tự Động Hóa"><Automation /></RbacGuard>} />
          <Route path="/automation/facebook-posts" element={<RbacGuard permission="automation.manage" moduleName="Tự Động Hóa"><Automation /></RbacGuard>} />
          <Route path="/facebook-automation" element={<RbacGuard permission="automation.manage" moduleName="Tự Động Hóa"><Automation /></RbacGuard>} />
          <Route path="/buff" element={<RbacGuard permission="automation.manage" moduleName="Tăng Tương Tác"><BuffSystem /></RbacGuard>} />
          <Route path="/wallet" element={<RbacGuard permission="wallet.view" moduleName="Ví Điện Tử & Thu Nhập"><WalletEarnings /></RbacGuard>} />
          <Route path="/referral" element={<RbacGuard permission="wallet.view" moduleName="Tiếp Thị Liên Kết"><WalletEarnings defaultTab="referral" /></RbacGuard>} />
          <Route path="/ai" element={<RbacGuard permission="automation.manage" moduleName="Topify AI Hub"><TopifyAI /></RbacGuard>} />
          <Route path="/security" element={<RbacGuard permission="developer.manage" moduleName="Bảo Mật & Tích Hợp"><SecurityIntegrations /></RbacGuard>} />
          <Route path="/history" element={<RbacGuard permission="workspace.manage" moduleName="Nhật Ký Hoạt Động"><History /></RbacGuard>} />
          <Route path="/team" element={<RbacGuard permission="workspace.manage" moduleName="Thành Viên & Nhóm"><Team /></RbacGuard>} />
          <Route path="/settings" element={<RbacGuard permission="workspace.manage" moduleName="Cài Đặt Hệ Thống"><Settings /></RbacGuard>} />
          <Route path="/super-admin" element={<Workspaces />} />
          <Route path="/workspaces" element={<Workspaces />} />

          {/* Catch-all: redirect unknown paths to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
      </ErrorBoundary>
    </HashRouter>
  );
}

export default App;
