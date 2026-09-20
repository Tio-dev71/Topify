import { Metadata } from 'next';
import Link from 'next/link';
import { Download, Monitor, Apple, ArrowLeft, ExternalLink, ShieldCheck } from 'lucide-react';
import electronPkg from '../../electron-app/package.json';

export const metadata: Metadata = {
  title: 'Tải Desktop App - Topify',
  description: 'Tải ứng dụng Topify Automation cho Windows và macOS để bắt đầu tự động hóa.',
};

export default function DownloadPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 py-4 px-6 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Quay lại Bảng điều khiển</span>
          </Link>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-green-500" />
            <span className="text-sm text-gray-500 font-medium">An toàn & Bảo mật</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-16 flex flex-col items-center">
        <div className="text-center max-w-2xl mb-16">
          <div className="w-20 h-20 bg-blue-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
            <Download className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">Tải Topify Desktop App</h1>
          <p className="text-lg text-gray-600">
            Ứng dụng Desktop giúp bạn tự động hóa đa luồng, không bị giới hạn bởi trình duyệt và đảm bảo an toàn tuyệt đối cho tài khoản.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl">
          {/* Windows Download */}
          <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col">
            <div className="w-14 h-14 bg-[#0078d7]/10 rounded-2xl flex items-center justify-center mb-6">
              <Monitor className="w-7 h-7 text-[#0078d7]" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Windows</h2>
            <p className="text-gray-500 mb-8 flex-1">
              Hỗ trợ Windows 10, 11 (64-bit). Tự động cập nhật phiên bản mới nhất.
            </p>
            <a
              href={`https://topify.vn/downloads/Topify-Automation-${electronPkg.version}-win.exe`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-[#0078d7] hover:bg-[#0063b1] text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm shadow-blue-500/20"
            >
              <Download className="w-5 h-5" />
              Tải cho Windows (EXE)
            </a>
          </div>

          {/* macOS Download */}
          <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col">
            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-6">
              <Apple className="w-7 h-7 text-gray-900" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">macOS</h2>
            <p className="text-gray-500 mb-8 flex-1">
              Hỗ trợ macOS 10.15 trở lên (Intel & Apple Silicon M1/M2/M3).
            </p>
            <a
              href={`https://topify.vn/downloads/Topify-Automation-${electronPkg.version}-mac.dmg`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-gray-900 hover:bg-black text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm shadow-gray-900/20"
            >
              <Download className="w-5 h-5" />
              Tải cho macOS (DMG)
            </a>
          </div>
        </div>

      </main>
    </div>
  );
}
