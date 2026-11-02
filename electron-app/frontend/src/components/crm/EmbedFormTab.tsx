import { useState } from 'react';
import {
  Code2,
  Copy,
  Check,
  Send,
  Globe,
  Sparkles,
  RefreshCw,
  User,
  Phone,
  Mail,
  Tag
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/axios';
import type { CustomerItem } from '../../pages/Customers';

export default function EmbedFormTab({
  customers = [],
  onLeadCaptured,
}: {
  customers: CustomerItem[];
  onLeadCaptured?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState(false);

  // Live Simulator Form state
  const [simName, setSimName] = useState('');
  const [simPhone, setSimPhone] = useState('');
  const [simEmail, setSimEmail] = useState('');
  const [simNotes, setSimNotes] = useState('');
  const [submittingSim, setSubmittingSim] = useState(false);

  const embedCode = `<form action="https://topify.vn/api/crm/forms/embed" method="POST" id="topify-lead-form">
  <input type="text" name="name" placeholder="Họ và tên của bạn" required />
  <input type="tel" name="phone" placeholder="Số điện thoại liên hệ" required />
  <input type="email" name="email" placeholder="Địa chỉ Email nhận báo giá" />
  <input type="text" name="notes" placeholder="Nhu cầu hoặc lời nhắn" />
  <input type="hidden" name="source" value="LANDING_PAGE" />
  <button type="submit">Đăng ký tư vấn ngay</button>
</form>`;

  const handleCopySnippet = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    toast.success('Đã sao chép mã nhúng HTML vào bộ nhớ tạm!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleQuickTest = async () => {
    setTestingWebhook(true);
    try {
      const res = await api.post('/crm/forms/embed', {
        name: `Khách Landing Page #${Math.floor(Math.random() * 900 + 100)}`,
        phone: `09${Math.floor(Math.random() * 90000000 + 10000000)}`,
        email: `lead.landing${Date.now().toString().slice(-4)}@topify.vn`,
        source: 'LANDING_PAGE',
        tags: 'LandingPage, TuVanKhoaHoc, F102',
        notes: 'Lead gửi tự động qua Form nhúng Landing Page (F102)',
      });
      if (res.data?.success) {
        toast.success('Bắn Lead từ Landing Page thành công! Dữ liệu đã xuất hiện trong CRM.');
        if (onLeadCaptured) onLeadCaptured();
      }
    } catch {
      toast.error('Lỗi khi gửi lead thử nghiệm');
    } finally {
      setTestingWebhook(false);
    }
  };

  const handleSubmitSimulator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simName.trim() || !simPhone.trim()) {
      toast.error('Vui lòng nhập Họ tên và Số điện thoại');
      return;
    }

    setSubmittingSim(true);
    try {
      const res = await api.post('/crm/forms/embed', {
        name: simName.trim(),
        phone: simPhone.trim(),
        email: simEmail.trim() || undefined,
        notes: simNotes.trim() || 'Lead từ Form mô phỏng trực tiếp trên app',
        source: 'LANDING_PAGE',
        tags: 'LandingPage, Simulator, F102',
      });

      if (res.data?.success) {
        toast.success(`Đã tiếp nhận thành công lead "${simName.trim()}" vào CRM!`);
        setSimName('');
        setSimPhone('');
        setSimEmail('');
        setSimNotes('');
        if (onLeadCaptured) onLeadCaptured();
      }
    } catch {
      toast.error('Lỗi khi gửi lead từ form mô phỏng');
    } finally {
      setSubmittingSim(false);
    }
  };

  const landingPageLeads = customers.filter(
    c => c.source === 'LANDING_PAGE' || (c.tags && c.tags.includes('LandingPage'))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 font-mono">
              Tính năng F102
            </span>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <Code2 className="w-5 h-5 text-purple-600" />
              <span>Nhúng Form Thu Lead &amp; Webhook CRM (Form → CRM)</span>
            </h2>
          </div>
          <p className="text-xs text-gray-500 mt-1 max-w-3xl">
            Tạo form thu lead nhúng website, Landing Page, Blog; toàn bộ khách hàng đăng ký sẽ tự động đổ thẳng vào hệ thống CRM theo thời gian thực.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleQuickTest}
            disabled={testingWebhook}
            className="btn-primary h-9 flex items-center gap-1.5 px-4 rounded-xl text-xs font-semibold shadow-xs"
          >
            <Send className={`w-3.5 h-3.5 ${testingWebhook ? 'animate-bounce' : ''}`} />
            <span>{testingWebhook ? 'Đang bắn test...' : 'Bắn test 1 Lead mẫu ngay'}</span>
          </button>
        </div>
      </div>

      {/* 2-column: Embed Code & Live Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Col: Code & Instructions (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <Globe className="w-4 h-4 text-purple-600" />
                <span>1. Mã Nhúng HTML / JavaScript Cho Website</span>
              </h3>
              <button
                onClick={handleCopySnippet}
                className="h-7.5 px-2.5 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition flex items-center gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Đã sao chép!' : 'Sao chép mã nhúng'}</span>
              </button>
            </div>

            <pre className="p-3 bg-gray-900 text-purple-300 rounded-xl font-mono text-xs overflow-x-auto leading-relaxed">
              {embedCode}
            </pre>

            <div className="text-[11px] text-gray-600 space-y-1 pt-1">
              <div className="font-bold text-gray-800">📌 Thông số tích hợp API Webhook:</div>
              <div>• <strong>Endpoint:</strong> <code>https://topify.vn/api/crm/forms/embed</code></div>
              <div>• <strong>Phương thức:</strong> <code>POST</code> (Hỗ trợ cả JSON body hoặc Form URL-encoded).</div>
              <div>• <strong>Các trường hỗ trợ:</strong> <code>name</code> (bắt buộc), <code>phone</code> (bắt buộc), <code>email</code>, <code>notes</code>, <code>source</code>, <code>tags</code>.</div>
            </div>
          </div>
        </div>

        {/* Right Col: Live Form Simulator (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-purple-200/80 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-purple-100">
              <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>2. Trình Mô Phỏng Form Trực Tiếp</span>
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold">
                Live Test
              </span>
            </div>

            <form onSubmit={handleSubmitSimulator} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Họ và tên khách hàng *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Chị Mai Phương - Khách mua sỉ"
                  value={simName}
                  onChange={e => setSimName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-purple-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Số điện thoại *</label>
                  <input
                    type="tel"
                    required
                    placeholder="VD: 0987 654 321"
                    value={simPhone}
                    onChange={e => setSimPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-purple-500 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Địa chỉ Email</label>
                  <input
                    type="email"
                    placeholder="VD: phuong@mail.com"
                    value={simEmail}
                    onChange={e => setSimEmail(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-purple-500 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Nhu cầu tư vấn / Ghi chú</label>
                <textarea
                  rows={2}
                  placeholder="VD: Xin báo giá khóa học marketing và hợp đồng mẫu"
                  value={simNotes}
                  onChange={e => setSimNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-purple-500 text-xs resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submittingSim}
                className="w-full btn-primary py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
              >
                {submittingSim ? (
                  <span>Đang gửi lead...</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Gửi Đăng Ký (Bắn Trực Tiếp Vào CRM)</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Captured Leads Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-xs text-gray-900 flex items-center gap-2">
            <span>Danh Sách Lead Đã Thu Thập Qua Form &amp; Landing Page ({landingPageLeads.length})</span>
          </h3>
          <span className="text-[11px] text-gray-400">Tự động gắn nguồn LANDING_PAGE</span>
        </div>

        {landingPageLeads.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-400">
            Chưa có khách hàng nào đến từ Landing Page. Bấm "Bắn test 1 Lead mẫu ngay" để thử nghiệm.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/75 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase">
                <tr>
                  <th className="py-2.5 px-4">Họ và tên</th>
                  <th className="py-2.5 px-4">Số điện thoại</th>
                  <th className="py-2.5 px-4">Email</th>
                  <th className="py-2.5 px-4">Ghi chú nhu cầu</th>
                  <th className="py-2.5 px-4">Thời gian nhận</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {landingPageLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50/70">
                    <td className="py-2.5 px-4 font-bold text-gray-900">{lead.name || 'Khách chưa đặt tên'}</td>
                    <td className="py-2.5 px-4 font-mono text-gray-700">{lead.phone || '-'}</td>
                    <td className="py-2.5 px-4 text-gray-600">{lead.email || '-'}</td>
                    <td className="py-2.5 px-4 text-gray-600 max-w-xs truncate">{lead.notes || '-'}</td>
                    <td className="py-2.5 px-4 text-gray-400 font-mono text-[11px]">
                      {new Date(lead.createdAt).toLocaleString('vi-VN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
