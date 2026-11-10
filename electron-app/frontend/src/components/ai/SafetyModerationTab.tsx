import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Trash2,
  RefreshCw,
  Copy,
  Check,
  Search,
  Filter,
  FileText,
  Sparkles,
  Zap,
  Info
} from 'lucide-react';
import api from '../../lib/axios';
import { toast } from 'sonner';

interface ModerationRule {
  id: string;
  category: 'ADS_POLICY' | 'MEDICAL_CLAIMS' | 'FINANCE_SCAM' | 'OFFENSIVE' | 'BRAND_INTEGRITY';
  categoryName: string;
  keyword: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  description: string;
  suggestion: string;
  isCustom?: boolean;
}

interface ModerationScanRecord {
  id: string;
  textSnippet: string;
  targetType: 'PROMPT' | 'AI_OUTPUT' | 'AD_COPY' | 'ARTICLE';
  safetyScore: number;
  status: 'SAFE' | 'WARNING' | 'VIOLATION';
  violationsCount: number;
  flaggedKeywords: string[];
  cleanText: string;
  scannedAt: string;
  scannedBy: string;
}

const STORAGE_KEY = 'topify_ai_safety_cache';

export const SafetyModerationTab: React.FC = () => {
  const [rules, setRules] = useState<ModerationRule[]>([]);
  const [scans, setScans] = useState<ModerationScanRecord[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [scanning, setScanning] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Scanner form state
  const [inputText, setInputText] = useState<string>(
    'Sản phẩm kem trị nám cam kết 100% trị dứt điểm sau 5 ngày sử dụng, cam đoan rẻ tiền nhất thị trường!'
  );
  const [targetType, setTargetType] = useState<'PROMPT' | 'AI_OUTPUT' | 'AD_COPY' | 'ARTICLE'>('AD_COPY');
  const [scanResult, setScanResult] = useState<ModerationScanRecord | null>(null);
  const [violations, setViolations] = useState<any[]>([]);
  const [cleanText, setCleanText] = useState<string>('');

  // Add rule modal state
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newKeyword, setNewKeyword] = useState<string>('');
  const [newCategory, setNewCategory] = useState<any>('ADS_POLICY');
  const [newSeverity, setNewSeverity] = useState<'CRITICAL' | 'HIGH' | 'MEDIUM'>('HIGH');
  const [newDescription, setNewDescription] = useState<string>('');
  const [newSuggestion, setNewSuggestion] = useState<string>('');

  // Filter state for rules
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/ai/safety-moderation');
      if (res.data?.success && res.data.data) {
        setRules(res.data.data.rules || []);
        setScans(res.data.data.scans || []);
        setSummary(res.data.data.summary || null);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(res.data.data));
      }
    } catch (err: any) {
      console.warn('Fallback loading safety data from cache:', err);
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setRules(parsed.rules || []);
          setScans(parsed.scans || []);
          setSummary(parsed.summary || null);
        } catch {}
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleScanText = async () => {
    if (!inputText.trim()) {
      toast.error('Vui lòng nhập nội dung cần kiểm duyệt');
      return;
    }

    try {
      setScanning(true);
      const res = await api.post('/ai/safety-moderation', {
        action: 'scan',
        text: inputText,
        targetType,
      });

      if (res.data?.success && res.data.data) {
        const { scanResult: result, violations: viols, cleanText: sanitized } = res.data.data;
        setScanResult(result);
        setViolations(viols || []);
        setCleanText(sanitized || '');

        const updatedScans = [result, ...scans];
        setScans(updatedScans);

        if (result.status === 'SAFE') {
          toast.success(`Nội dung đạt chuẩn an toàn (${result.safetyScore}/100 điểm)!`);
        } else if (result.status === 'WARNING') {
          toast.warning(`Phát hiện ${result.violationsCount} điểm cần lưu ý chính sách (${result.safetyScore}/100)!`);
        } else {
          toast.error(`CẢNH BÁO: Phát hiện ${result.violationsCount} vi phạm chính sách nghiêm trọng!`);
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Lỗi khi kiểm duyệt nội dung');
    } finally {
      setScanning(false);
    }
  };

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyword.trim()) {
      toast.error('Vui lòng nhập từ khóa');
      return;
    }

    try {
      const res = await api.post('/ai/safety-moderation', {
        action: 'add_rule',
        keyword: newKeyword.trim(),
        category: newCategory,
        severity: newSeverity,
        description: newDescription.trim(),
        suggestion: newSuggestion.trim(),
      });

      if (res.data?.success && res.data.data) {
        setRules([res.data.data, ...rules]);
        setShowAddModal(false);
        setNewKeyword('');
        setNewDescription('');
        setNewSuggestion('');
        toast.success(res.data.message || 'Đã thêm quy tắc kiểm duyệt');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Lỗi khi thêm quy tắc');
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    try {
      const res = await api.post('/ai/safety-moderation', {
        action: 'delete_rule',
        ruleId,
      });
      if (res.data?.success) {
        setRules(rules.filter((r) => r.id !== ruleId));
        toast.success('Đã xóa quy tắc kiểm duyệt');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Lỗi khi xóa quy tắc');
    }
  };

  const handleCopyCleanText = () => {
    if (!cleanText) return;
    navigator.clipboard.writeText(cleanText);
    setCopied(true);
    toast.success('Đã sao chép văn bản đã làm sạch!');
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredRules = rules.filter((r) => {
    const matchSearch =
      r.keyword.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      r.description.toLowerCase().includes(searchKeyword.toLowerCase());
    const matchCat = categoryFilter === 'ALL' || r.category === categoryFilter;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-linear-to-r from-slate-900 via-rose-950 to-indigo-950 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/30 text-rose-300 border border-rose-400/30">
                PHÂN HỆ M14 • F161
              </span>
              <span className="text-xs text-rose-200">AI Safety & Moderation</span>
            </div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-rose-400" />
              Kiểm Duyệt An Toàn & Tuân Thủ Chính Sách (AI Safety)
            </h2>
            <p className="text-sm text-rose-100/90 mt-1 max-w-2xl">
              Tự động rà soát vi phạm chính sách quảng cáo (Meta Ads, TikTok Ads, Y Tế / Mỹ Phẩm), lọc từ ngữ nhạy cảm trong prompt & bài viết, đồng thời tự động đề xuất phương án làm sạch an toàn.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-semibold shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Thêm Từ Khóa Cấm
            </button>
            <button
              onClick={fetchData}
              disabled={loading}
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all cursor-pointer"
              title="Làm mới dữ liệu"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-xs font-medium">Quy Tắc Kiểm Duyệt</span>
            <ShieldCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-bold text-gray-900">{rules.length}</div>
          <div className="text-[11px] text-gray-500 mt-1">
            {summary?.customRulesCount || 0} quy tắc tùy chỉnh theo brand
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-xs font-medium">Tỷ Lệ Nội Dung An Toàn</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-emerald-600">{summary?.safePercent ?? 92}%</div>
          <div className="text-[11px] text-gray-500 mt-1">Đạt chuẩn duyệt quảng cáo</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-xs font-medium">Vi Phạm Đã Ngăn Chặn</span>
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-xl font-bold text-rose-600">{summary?.flaggedCount ?? 2}</div>
          <div className="text-[11px] text-gray-500 mt-1">Tránh bị khóa Fanpage & Ads</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-xs font-medium">Tiêu Chuẩn Áp Dụng</span>
            <Info className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xs font-bold text-indigo-700 truncate mt-1">Meta, TikTok & Bộ Y Tế</div>
          <div className="text-[11px] text-gray-500 mt-1">Cập nhật chính sách 2026</div>
        </div>
      </div>

      {/* Main 2-Column Work Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Live Scanner Form & Result (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-rose-600" />
                Trình Kiểm Duyệt & Tự Động Làm Sạch (Live Scanner)
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Loại nội dung:</span>
                <select
                  value={targetType}
                  onChange={(e: any) => setTargetType(e.target.value)}
                  className="px-2.5 py-1 text-xs border border-gray-300 rounded-lg bg-gray-50 focus:outline-hidden"
                >
                  <option value="AD_COPY">Bài Quảng Cáo (Ad Copy)</option>
                  <option value="PROMPT">Prompt gửi AI</option>
                  <option value="AI_OUTPUT">Nội dung AI sinh ra</option>
                  <option value="ARTICLE">Bài viết Fanpage/Blog</option>
                </select>
              </div>
            </div>

            <textarea
              rows={4}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Dán nội dung bài viết, prompt hoặc câu từ cần rà soát chính sách..."
              className="w-full px-3.5 py-3 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-hidden leading-relaxed"
            />

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                Quét theo từ khóa cấm & AI Policy Engine
              </div>
              <button
                onClick={handleScanText}
                disabled={scanning || !inputText.trim()}
                className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:bg-gray-300 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <ShieldCheck className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
                {scanning ? 'Đang Rà Soát Chính Sách...' : '🛡️ Quét Kiểm Duyệt & Tính Điểm'}
              </button>
            </div>
          </div>

          {/* Scanner Result Display */}
          {scanResult && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg ${
                      scanResult.status === 'SAFE'
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                        : scanResult.status === 'WARNING'
                        ? 'bg-amber-100 text-amber-700 border border-amber-300'
                        : 'bg-rose-100 text-rose-700 border border-rose-300'
                    }`}
                  >
                    {scanResult.safetyScore}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Điểm An Toàn: {scanResult.safetyScore}/100
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          scanResult.status === 'SAFE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : scanResult.status === 'WARNING'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {scanResult.status === 'SAFE'
                          ? 'ĐẠT CHUẨN (SAFE)'
                          : scanResult.status === 'WARNING'
                          ? 'CẢNH BÁO (WARNING)'
                          : 'VI PHẠM NGIÊM TRỌNG (VIOLATION)'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {scanResult.violationsCount === 0
                        ? 'Không tìm thấy vi phạm chính sách nào.'
                        : `Phát hiện ${scanResult.violationsCount} điểm xung đột chính sách.`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Detected Violations List */}
              {violations.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-gray-700">Chi tiết vi phạm được phát hiện:</span>
                  {violations.map((v, vIdx) => (
                    <div key={vIdx} className="p-3 rounded-xl bg-rose-50/70 border border-rose-100 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-rose-700">Từ khóa vi phạm: "{v.keyword}"</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-200/80 text-rose-800">
                          {v.severity}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-600">{v.description}</p>
                      <div className="text-[11px] text-emerald-700 font-medium">
                        💡 Gợi ý thay thế: <strong className="underline">{v.suggestion}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Auto-Sanitized Clean Version */}
              {cleanText && (
                <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Văn Bản Đã Tự Động Làm Sạch (Sẵn sàng đăng / chạy Ads):
                    </span>
                    <button
                      onClick={handleCopyCleanText}
                      className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold border border-emerald-300 transition-all cursor-pointer"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Đã sao chép' : 'Sao chép bản sạch'}
                    </button>
                  </div>
                  <p className="text-xs text-gray-800 leading-relaxed bg-white p-3 rounded-lg border border-emerald-100 whitespace-pre-wrap">
                    {cleanText}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Rules & Blacklist Manager (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                Danh Sách Quy Tắc & Từ Khóa Cấm
              </h3>
              <span className="text-xs font-semibold text-gray-500">{filteredRules.length} quy tắc</span>
            </div>

            {/* Search & Category Filter */}
            <div className="space-y-2 mb-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="Tìm từ khóa cấm..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-thin">
                {['ALL', 'ADS_POLICY', 'MEDICAL_CLAIMS', 'FINANCE_SCAM', 'BRAND_INTEGRITY'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold whitespace-nowrap cursor-pointer transition-all ${
                      categoryFilter === cat
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {cat === 'ALL'
                      ? 'Tất cả'
                      : cat === 'ADS_POLICY'
                      ? 'Ads'
                      : cat === 'MEDICAL_CLAIMS'
                      ? 'Y Tế/Mỹ Phẩm'
                      : cat === 'FINANCE_SCAM'
                      ? 'Tài Chính'
                      : 'Brand'}
                  </button>
                ))}
              </div>
            </div>

            {/* Rules List */}
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {filteredRules.map((rule) => (
                <div
                  key={rule.id}
                  className="p-3 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-gray-50 transition-all text-xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-gray-900">"{rule.keyword}"</span>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          rule.severity === 'CRITICAL'
                            ? 'bg-rose-100 text-rose-700'
                            : rule.severity === 'HIGH'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {rule.severity}
                      </span>
                      {rule.isCustom && (
                        <button
                          onClick={() => handleDeleteRule(rule.id)}
                          className="text-gray-400 hover:text-rose-600 p-1 cursor-pointer"
                          title="Xóa quy tắc tùy chỉnh"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-500 mb-1">{rule.description}</p>
                  <div className="text-[10px] text-emerald-700">
                    Gợi ý: <strong>{rule.suggestion}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: Recent Scan Audit History */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
        <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-gray-600" />
          Nhật Ký Quét Kiểm Duyệt Gần Đây (Scan Audit History)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 font-semibold bg-gray-50">
                <th className="py-2.5 px-3">Thời Gian</th>
                <th className="py-2.5 px-3">Người Quét</th>
                <th className="py-2.5 px-3">Phân Loại</th>
                <th className="py-2.5 px-3">Trích Đoạn Nội Dung</th>
                <th className="py-2.5 px-3">Điểm An Toàn</th>
                <th className="py-2.5 px-3">Trạng Thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {scans.map((scan) => (
                <tr key={scan.id} className="hover:bg-gray-50">
                  <td className="py-2.5 px-3 text-gray-500 whitespace-nowrap">
                    {new Date(scan.scannedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}{' '}
                    {new Date(scan.scannedAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-gray-900 whitespace-nowrap">{scan.scannedBy}</td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-gray-100 text-gray-700 font-semibold">
                      {scan.targetType}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 max-w-xs truncate text-gray-700">{scan.textSnippet}</td>
                  <td className="py-2.5 px-3 font-bold text-gray-900">{scan.safetyScore}/100</td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        scan.status === 'SAFE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : scan.status === 'WARNING'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {scan.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add Custom Rule */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="text-sm font-bold text-gray-900">Thêm Từ Khóa Nhạy Cảm / Cấm</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddRule} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Từ Khóa Vi Phạm *</label>
                <input
                  type="text"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  placeholder="VD: cam đoan làm giàu"
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Danh Mục</label>
                <select
                  value={newCategory}
                  onChange={(e: any) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-hidden bg-white"
                >
                  <option value="ADS_POLICY">Chính Sách Quảng Cáo</option>
                  <option value="MEDICAL_CLAIMS">Cam kết Y Tế / Mỹ Phẩm</option>
                  <option value="FINANCE_SCAM">Tài Chính & Kiếm Tiền</option>
                  <option value="BRAND_INTEGRITY">Quy Chuẩn Thương Hiệu</option>
                  <option value="OFFENSIVE">Ngôn Từ Phản Cảm</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Mức Độ Nghiêm Trọng</label>
                <select
                  value={newSeverity}
                  onChange={(e: any) => setNewSeverity(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-hidden bg-white"
                >
                  <option value="CRITICAL">Nghiêm Trọng (Khóa tài khoản / Chặn ngay)</option>
                  <option value="HIGH">Cao (Cảnh báo vi phạm chính sách)</option>
                  <option value="MEDIUM">Trung Bình (Cần nhắc nhở sửa từ ngữ)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Từ Gợi Ý Thay Thế</label>
                <input
                  type="text"
                  value={newSuggestion}
                  onChange={(e) => setNewSuggestion(e.target.value)}
                  placeholder="VD: hỗ trợ phát triển kỹ năng"
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Mô Tả Lý Do</label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Lý do cấm từ khóa này..."
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-xs cursor-pointer"
                >
                  Lưu Quy Tắc
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

