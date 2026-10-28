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
          <Route path="/inbox" element={<Inbox />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/deals" element={<Deals />} />
          <Route path="/crm/deals" element={<Deals />} />
          <Route path="/pipelines" element={<Pipelines />} />
          <Route path="/crm/pipelines" element={<Pipelines />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/intelligence/social-search" element={<SocialSearch />} />
          <Route path="/intelligence/alerts" element={<ViralAlerts />} />
          <Route path="/intelligence/competitors" element={<Competitors />} />
          <Route path="/competitors" element={<Competitors />} />
          <Route path="/intelligence/keywords" element={<Keywords />} />
          <Route path="/keywords" element={<Keywords />} />
          <Route path="/media/studio" element={<MediaStudio />} />
          <Route path="/media/library" element={<MediaLibrary />} />
          <Route path="/accounts" element={<FacebookAccounts />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/campaigns" element={<Campaigns />} />

          <Route path="/live" element={<Live />} />
          <Route path="/posts" element={<Posts />} />
          <Route path="/posts/:id" element={<PostDetail />} />
          <Route path="/calendar" element={<CalendarView />} />
          <Route path="/content/calendar" element={<CalendarView />} />
          <Route path="/pillars" element={<ContentPillars />} />
          <Route path="/content/pillars" element={<ContentPillars />} />
          <Route path="/templates" element={<ContentTemplates />} />
          <Route path="/content/templates" element={<ContentTemplates />} />
          <Route path="/hashtags" element={<Hashtags />} />
          <Route path="/content/hashtags" element={<Hashtags />} />
          <Route path="/approval" element={<Approval />} />
          <Route path="/content/approval" element={<Approval />} />
          <Route path="/utm" element={<UTMBuilder />} />
          <Route path="/content/utm" element={<UTMBuilder />} />
          <Route path="/create" element={<CreatePost />} />
          <Route path="/evergreen" element={<Evergreen />} />
          <Route path="/content-studio" element={<ContentStudio />} />
          <Route path="/downloader" element={<Downloader />} />
          <Route path="/proxies" element={<Proxies />} />
          <Route path="/automation" element={<Automation />} />
          <Route path="/buff" element={<BuffSystem />} />
          <Route path="/wallet" element={<WalletEarnings />} />
          <Route path="/referral" element={<WalletEarnings defaultTab="referral" />} />
          <Route path="/ai" element={<TopifyAI />} />
          <Route path="/security" element={<SecurityIntegrations />} />
          <Route path="/history" element={<History />} />
          <Route path="/team" element={<Team />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/super-admin" element={<Workspaces />} />

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
