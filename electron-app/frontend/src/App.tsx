import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import FacebookAccounts from './pages/FacebookAccounts';
import Proxies from './pages/Proxies';
import Automation from './pages/Automation';
import PlaceholderPage from './pages/PlaceholderPage';
import History from './pages/History';
import Downloader from './pages/Downloader';
import Live from './pages/Live';
import Settings from './pages/Settings';
import Team from './pages/Team';
import Posts from './pages/Posts';
import CreatePost from './pages/CreatePost';
import BuffSystem from './pages/BuffSystem';
import Workspaces from './pages/Workspaces';
import Layout from './components/layout/Layout';
import {
  Calendar
} from 'lucide-react';

function App() {
  return (
    <HashRouter>
      <Toaster position="top-right" richColors />
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes wrapped in Layout */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/accounts" element={<FacebookAccounts />} />

          <Route path="/live" element={<Live />} />
          <Route path="/posts" element={<Posts />} />
          <Route path="/posts/:id" element={
            <PlaceholderPage title="Chi tiết bài viết" description="Trang chi tiết bài viết đang được phát triển." icon={<Calendar className="w-8 h-8 text-gray-400" />} />
          } />
          <Route path="/create" element={<CreatePost />} />
          <Route path="/downloader" element={<Downloader />} />
          <Route path="/proxies" element={<Proxies />} />
          <Route path="/automation" element={<Automation />} />
          <Route path="/buff" element={<BuffSystem />} />
          <Route path="/history" element={<History />} />
          <Route path="/team" element={<Team />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/super-admin" element={<Workspaces />} />

          {/* Catch-all: redirect unknown paths to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;
