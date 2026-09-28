import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Sidebar } from './Sidebar';
import ErrorBoundary from '../ErrorBoundary';

export default function Layout() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('topify_token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <Sidebar />
      {/* Main content area */}
      <main className="lg:pl-[260px] transition-all duration-300">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20 lg:pt-8">
          <ErrorBoundary
            fallback={(error, reset) => (
              <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm text-center space-y-5 max-w-lg mx-auto my-12">
                <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto border border-rose-100 shadow-xs">
                  <AlertTriangle className="w-7 h-7" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-xl font-bold text-gray-900">Không thể hiển thị nội dung</h3>
                  <p className="text-sm text-gray-500">
                    Module gặp sự cố hiển thị dữ liệu. Các module khác trên thanh điều hướng vẫn hoạt động bình thường.
                  </p>
                </div>
                {error?.message && (
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-left overflow-auto max-h-24 text-xs font-mono text-gray-600">
                    {error.message}
                  </div>
                )}
                <div className="flex gap-3 justify-center pt-2">
                  <button
                    onClick={() => {
                      reset();
                      window.location.reload();
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-semibold hover:bg-black transition-all cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Thử lại
                  </button>
                  <button
                    onClick={() => {
                      reset();
                      navigate('/dashboard');
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-200 transition-all cursor-pointer"
                  >
                    <Home className="w-3.5 h-3.5" />
                    Về Dashboard
                  </button>
                </div>
              </div>
            )}
          >
            <Outlet />
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
}

