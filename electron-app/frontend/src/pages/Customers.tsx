import { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Search,
  Plus,
  RefreshCw,
  Flame,
  Zap,
  Snowflake,
  Copy,
  Phone,
  Mail,
  Building2,
  Trash2,
  AlertTriangle,
  GitMerge,
  CheckCircle2,
  X,
  ArrowRight,
  ShieldAlert,
  SlidersHorizontal,
  Info,
  Code2,
  Globe,
  Send,
  Eye,
  Edit3,
  Calendar,
  Tag,
  FileText,
  ShoppingBag,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/axios';

export interface CustomerItem {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  avatar: string | null;
  tags: string | null;
  source: string | null;
  notes: string | null;
  createdAt: string;
  leadScore: number;
  temperature: 'HOT' | 'WARM' | 'COLD';
  breakdown?: {
    profileScore: number;
    engagementScore: number;
    aiIntentScore: number;
    decayScore: number;
    reasons: string[];
  };
  dealsCount: number;
  totalDealValue: number;
  isDuplicateCandidate?: boolean;
}

export interface DuplicateGroupItem {
  groupId: string;
  matchType: 'PHONE' | 'EMAIL' | 'FUZZY_NAME';
  matchKey: string;
  confidence: number;
  customerIds: string[];
  customers: Array<{
    id: string;
    name: string | null;
    phone: string | null;
    email: string | null;
    source: string | null;
    createdAt: string;
    dealsCount: number;
  }>;
}

export default function Customers() {
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [tempFilter, setTempFilter] = useState<'ALL' | 'HOT' | 'WARM' | 'COLD' | 'DUPLICATES'>('ALL');
  const [sortBy, setSortBy] = useState('leadScore');
  const [stats, setStats] = useState({
    total: 0,
    hotCount: 0,
    warmCount: 0,
    coldCount: 0,
    duplicateGroupsCount: 0,
    duplicateCustomersCount: 0,
  });

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [showEmbedModal, setShowEmbedModal] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroupItem[]>([]);
  const [loadingDuplicates, setLoadingDuplicates] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<DuplicateGroupItem | null>(null);

  // Test Webhook Lead Ingestion (F102)
  const handleTestLeadWebhook = async () => {
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
        toast.success('Bắn Lead từ Landing Page thành công! Lead đã xuất hiện trong danh sách CRM.');
        fetchCustomers();
      }
    } catch {
      toast.error('Lỗi khi gửi lead thử nghiệm');
    } finally {
      setTestingWebhook(false);
    }
  };

  // Merge execution state
  const [selectedMasterId, setSelectedMasterId] = useState<string>('');
  const [merging, setMerging] = useState(false);

  // Create Customer Form
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    source: 'TIKTOK',
    tags: '',
    notes: '',
  });
  const [creating, setCreating] = useState(false);

  // Customer Detail & Edit states
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerItem | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    id: '',
    name: '',
    phone: '',
    email: '',
    source: 'TIKTOK',
    tags: '',
    notes: '',
  });
  const [savingEdit, setSavingEdit] = useState(false);

  // View customer detail
  const handleViewDetail = (c: CustomerItem) => {
    setSelectedCustomer(c);
    setShowDetailModal(true);
  };

  // Open edit modal
  const handleOpenEdit = (c: CustomerItem) => {
    setEditFormData({
      id: c.id,
      name: c.name || '',
      phone: c.phone || '',
      email: c.email || '',
      source: c.source || 'MANUAL',
      tags: c.tags || '',
      notes: c.notes || '',
    });
    setSelectedCustomer(c);
    setShowEditModal(true);
  };

  // Save edit customer
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData.id) return;
    if (!editFormData.name.trim()) {
      toast.error('Vui lòng nhập họ và tên khách hàng');
      return;
    }

    setSavingEdit(true);
    try {
      const res = await api.patch('/crm/customers', editFormData);
      if (res.data) {
        toast.success('Cập nhật thông tin khách hàng thành công!');
        setShowEditModal(false);
        setSelectedCustomer((prev) =>
          prev && prev.id === editFormData.id
            ? {
                ...prev,
                name: editFormData.name,
                phone: editFormData.phone,
                email: editFormData.email,
                source: editFormData.source,
                tags: editFormData.tags,
                notes: editFormData.notes,
              }
            : prev
        );
        fetchCustomers();
      }
    } catch (err: any) {
      console.error('Failed to update customer', err);
      toast.error(err.response?.data?.error || 'Lỗi khi cập nhật thông tin khách hàng');
    } finally {
      setSavingEdit(false);
    }
  };

  // Fetch customer list
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (tempFilter !== 'ALL' && tempFilter !== 'DUPLICATES') {
        params.append('temperature', tempFilter);
      }
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }
      if (sortBy) {
        params.append('sortBy', sortBy);
      }

      const res = await api.get(`/crm/customers?${params.toString()}`);
      if (res.data) {
        let list: CustomerItem[] = res.data.customers || [];
        if (tempFilter === 'DUPLICATES') {
          list = list.filter((c) => c.isDuplicateCandidate);
        }
        setCustomers(list);
        if (res.data.stats) {
          setStats(res.data.stats);
        }
      }
    } catch (err) {
      console.error('Failed to load customers', err);
      toast.error('Lỗi khi tải danh sách khách hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [tempFilter, sortBy]);

  // Seed demo data for testing F100 & F101
  const handleSeedDemo = async () => {
    setSeeding(true);
    try {
      const res = await api.post('/crm/customers', { seed: true });
      if (res.data?.success) {
        toast.success(res.data.message || 'Đã nạp thành công 5 khách hàng mẫu!');
        fetchCustomers();
      }
    } catch {
      toast.error('Không thể tạo dữ liệu mẫu');
    } finally {
      setSeeding(false);
    }
  };

  // Open Duplicate Merge Scanner (F101)
  const handleOpenMergeScanner = async () => {
    setShowMergeModal(true);
    setLoadingDuplicates(true);
    try {
      const res = await api.get('/crm/customers/duplicates');
      if (res.data?.duplicateGroups) {
        setDuplicateGroups(res.data.duplicateGroups);
        if (res.data.duplicateGroups.length > 0) {
          setSelectedGroup(res.data.duplicateGroups[0]);
          setSelectedMasterId(res.data.duplicateGroups[0].customers[0]?.id || '');
        }
      }
    } catch (err) {
      console.error('Failed to scan duplicates', err);
      toast.error('Không thể quét trùng lặp lúc này');
    } finally {
      setLoadingDuplicates(false);
    }
  };

  // Execute Merge
  const handleExecuteMerge = async () => {
    if (!selectedGroup || !selectedMasterId) return;

    const duplicateIds = selectedGroup.customers
      .map((c) => c.id)
      .filter((id) => id !== selectedMasterId);

    if (duplicateIds.length === 0) {
      toast.error('Cần ít nhất một hồ sơ phụ để hợp nhất');
      return;
    }

    setMerging(true);
    try {
      const res = await api.post('/crm/customers/merge', {
        masterId: selectedMasterId,
        duplicateIds,
      });

      if (res.data?.success) {
        toast.success(res.data.message || 'Hợp nhất hồ sơ thành công!');
        // Remove merged group from modal list
        const updatedGroups = duplicateGroups.filter((g) => g.groupId !== selectedGroup.groupId);
        setDuplicateGroups(updatedGroups);
        if (updatedGroups.length > 0) {
          setSelectedGroup(updatedGroups[0]);
          setSelectedMasterId(updatedGroups[0].customers[0]?.id || '');
        } else {
          setSelectedGroup(null);
          setShowMergeModal(false);
        }
        fetchCustomers();
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Lỗi khi hợp nhất hồ sơ');
    } finally {
      setMerging(false);
    }
  };

  // Create new customer with duplicate warning check (TC-F101-01)
  const handleCreateCustomer = async (bypassWarning = false) => {
    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập tên khách hàng');
      return;
    }

    setCreating(true);
    try {
      await api.post('/crm/customers', {
        ...formData,
        bypassDuplicateWarning: bypassWarning,
      });
      toast.success('Đã thêm khách hàng mới thành công!');
      setShowCreateModal(false);
      setFormData({ name: '', phone: '', email: '', source: 'TIKTOK', tags: '', notes: '' });
      fetchCustomers();
    } catch (err: any) {
      if (err?.response?.status === 409 && err?.response?.data?.isDuplicateWarning) {
        const confirmBypass = window.confirm(
          `CẢNH BÁO TRÙNG LẶP (F101):\n${err.response.data.error}\n\nBạn có muốn vẫn tiếp tục tạo mới hồ sơ này không?`
        );
        if (confirmBypass) {
          handleCreateCustomer(true);
          return;
        }
      } else {
        toast.error(err?.response?.data?.error || 'Không thể tạo khách hàng');
      }
    } finally {
      setCreating(false);
    }
  };

  // Delete Customer
  const handleDeleteCustomer = async (id: string, name: string | null) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa khách hàng "${name || 'này'}"?`)) return;
    try {
      await api.delete(`/crm/customers?id=${id}`);
      toast.success('Đã xóa khách hàng');
      fetchCustomers();
    } catch {
      toast.error('Lỗi khi xóa khách hàng');
    }
  };

  // Helper badge color for temperature
  const getTempBadge = (temp: 'HOT' | 'WARM' | 'COLD', score: number) => {
    if (temp === 'HOT') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-900 shadow-xs animate-pulse">
          <Flame className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
          <span>HOT ({score}đ)</span>
        </span>
      );
    }
    if (temp === 'WARM') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:border-amber-900">
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          <span>WARM ({score}đ)</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300">
        <Snowflake className="w-3.5 h-3.5 text-blue-400" />
        <span>COLD ({score}đ)</span>
      </span>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* ────────────────────────────────────────────────────────────────────────
          HEADER
          ──────────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Hồ sơ Khách hàng & Doanh nghiệp (Contact & Company - F093)
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý hồ sơ liên hệ & doanh nghiệp (F093), nguồn lead & người phụ trách (F097), chăm sóc & nhắc việc (F098), trường tùy biến (F099), Lead Scoring (F100) & Quét trùng (F101).
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
          <button
            onClick={handleSeedDemo}
            disabled={seeding}
            className="h-9 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors shadow-2xs"
            title="Nạp 5 khách hàng mẫu để kiểm thử Lead Scoring & Quét trùng"
          >
            <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${seeding ? 'animate-spin text-indigo-500' : ''}`} />
            <span>Nạp mẫu test F100/F101</span>
          </button>

          <button
            onClick={handleOpenMergeScanner}
            className={`h-9 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all shadow-2xs ${
              stats.duplicateGroupsCount > 0
                ? 'bg-amber-500 hover:bg-amber-600 text-white animate-bounce-subtle'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50'
            }`}
          >
            <GitMerge className="w-3.5 h-3.5 shrink-0" />
            <span>Quét trùng ({stats.duplicateGroupsCount})</span>
          </button>

          <button
            onClick={() => setShowEmbedModal(true)}
            className="h-9 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 dark:bg-purple-950/40 dark:border-purple-800 dark:text-purple-300 transition-colors shadow-2xs"
            title="Nhúng Form website / landing page đổ trực tiếp CRM (F102)"
          >
            <Code2 className="w-3.5 h-3.5 shrink-0 text-purple-600" />
            <span>Nhúng Form Landing Page (F102)</span>
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="h-9 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs hover:shadow-indigo-500/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Thêm khách hàng</span>
          </button>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────
          STATS CARDS
          ──────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div
          onClick={() => setTempFilter('ALL')}
          className={`p-5 rounded-2xl bg-white border transition-all cursor-pointer shadow-xs ${
            tempFilter === 'ALL'
              ? 'border-blue-500 ring-2 ring-blue-500/20'
              : 'border-gray-100 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-500">Tổng khách hàng</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
        </div>

        <div
          onClick={() => setTempFilter('HOT')}
          className={`p-5 rounded-2xl bg-white border transition-all cursor-pointer shadow-xs ${
            tempFilter === 'HOT'
              ? 'border-rose-500 ring-2 ring-rose-500/20'
              : 'border-gray-100 hover:border-rose-200'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-rose-600">HOT Leads 🔥 (≥70đ)</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Flame className="w-4 h-4 fill-rose-500" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-600">{stats.hotCount}</div>
        </div>

        <div
          onClick={() => setTempFilter('WARM')}
          className={`p-5 rounded-2xl bg-white border transition-all cursor-pointer shadow-xs ${
            tempFilter === 'WARM'
              ? 'border-amber-500 ring-2 ring-amber-500/20'
              : 'border-gray-100 hover:border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-amber-600">WARM Leads ⚡ (40-69đ)</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-600">{stats.warmCount}</div>
        </div>

        <div
          onClick={() => setTempFilter('DUPLICATES')}
          className={`p-5 rounded-2xl bg-white border transition-all cursor-pointer shadow-xs ${
            tempFilter === 'DUPLICATES'
              ? 'border-purple-500 ring-2 ring-purple-500/20'
              : 'border-gray-100 hover:border-purple-200'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-purple-700">Nghi trùng lặp ⚠️ (F101)</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <GitMerge className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-purple-700">
            {stats.duplicateGroupsCount} nhóm
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────
          FILTER & SEARCH BAR
          ──────────────────────────────────────────────────────────────────────── */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 shadow-xs flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs font-medium min-w-0 py-0.5">
          <button
            onClick={() => setTempFilter('ALL')}
            className={`h-8 px-3.5 py-1.5 rounded-xl transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 ${
              tempFilter === 'ALL'
                ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                : 'text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700'
            }`}
          >
            <span>Tất cả ({stats.total})</span>
          </button>
          <button
            onClick={() => setTempFilter('HOT')}
            className={`h-8 px-3.5 py-1.5 rounded-xl transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 ${
              tempFilter === 'HOT'
                ? 'bg-rose-600 text-white font-semibold shadow-2xs'
                : 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30'
            }`}
          >
            <Flame className="w-3.5 h-3.5 shrink-0 fill-current" />
            <span>HOT Leads ({stats.hotCount})</span>
          </button>
          <button
            onClick={() => setTempFilter('WARM')}
            className={`h-8 px-3.5 py-1.5 rounded-xl transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 ${
              tempFilter === 'WARM'
                ? 'bg-amber-600 text-white font-semibold shadow-2xs'
                : 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30'
            }`}
          >
            <Zap className="w-3.5 h-3.5 shrink-0" />
            <span>WARM Leads ({stats.warmCount})</span>
          </button>
          <button
            onClick={() => setTempFilter('COLD')}
            className={`h-8 px-3.5 py-1.5 rounded-xl transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 ${
              tempFilter === 'COLD'
                ? 'bg-slate-700 text-white font-semibold shadow-2xs'
                : 'text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700'
            }`}
          >
            <Snowflake className="w-3.5 h-3.5 shrink-0" />
            <span>COLD Leads ({stats.coldCount})</span>
          </button>
          <button
            onClick={() => setTempFilter('DUPLICATES')}
            className={`h-8 px-3.5 py-1.5 rounded-xl transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 ${
              tempFilter === 'DUPLICATES'
                ? 'bg-purple-600 text-white font-semibold shadow-2xs'
                : 'text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30'
            }`}
          >
            <GitMerge className="w-3.5 h-3.5 shrink-0" />
            <span>Nghi trùng lặp ({stats.duplicateGroupsCount})</span>
          </button>
        </div>

        {/* Search & Sort */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
          <div className="relative flex-1 sm:w-64 min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchCustomers()}
              placeholder="Tìm theo tên, SĐT, email..."
              className="w-full pl-8 pr-3 py-2 text-xs bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800 dark:text-gray-100 placeholder-gray-400 transition-all h-9"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-700 dark:text-gray-200 cursor-pointer focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shrink-0 h-9"
          >
            <option value="leadScore">Sắp xếp: Điểm tiềm năng cao nhất</option>
            <option value="createdAt">Sắp xếp: Mới nhất</option>
            <option value="name">Sắp xếp: Tên A-Z</option>
          </select>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────
          CUSTOMER TABLE
          ──────────────────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-xs text-gray-400 flex flex-col items-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
            <span>Đang tải danh sách khách hàng...</span>
          </div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center text-xs text-gray-400 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center mx-auto">
              <Users className="w-7 h-7" />
            </div>
            <p className="font-semibold text-gray-800 text-sm">Chưa tìm thấy khách hàng nào phù hợp với bộ lọc</p>
            <button
              onClick={handleSeedDemo}
              className="px-4 py-2 rounded-xl bg-blue-50 text-blue-600 font-semibold hover:bg-blue-100 text-xs border border-blue-100 transition-colors shadow-2xs cursor-pointer"
            >
              + Bấm nạp 5 khách hàng mẫu để kiểm thử
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 border-b border-gray-100 text-gray-500 uppercase text-[10px] font-semibold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Khách hàng / Kênh</th>
                  <th className="py-3 px-4">Thông tin liên hệ</th>
                  <th
                    className="py-3 px-4"
                    title="Tiêu chí F100: Hồ sơ đầy đủ (30đ: Họ tên +10, SĐT +10, Email +10) + Tương tác thực tế (30đ: hỏi mua/hỏi giá) + Lịch sử mua hàng (40đ: có đơn thành công). HOT ≥ 70đ, WARM 40-69đ, COLD < 40đ."
                  >
                    <div className="flex items-center gap-1 cursor-help">
                      <span>Lead Score (F100)</span>
                      <Info className="w-3 h-3 text-gray-400" />
                    </div>
                  </th>
                  <th className="py-3 px-4">Giao dịch (Deals)</th>
                  <th className="py-3 px-4">Ngày tạo</th>
                  <th className="py-3 px-4 text-right min-w-[120px]">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {customers.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => handleViewDetail(c)}
                    className="hover:bg-blue-50/40 cursor-pointer transition-colors group"
                    title="Nhấp để xem chi tiết hồ sơ khách hàng"
                  >
                    {/* Customer Name & Source */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs uppercase shadow-2xs shrink-0">
                          {c.name?.charAt(0) || 'K'}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                              {c.name || 'Chưa đặt tên'}
                            </span>
                            {c.isDuplicateCandidate && (
                              <span
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenMergeScanner();
                                }}
                                className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-bold cursor-pointer hover:bg-amber-100 transition-colors"
                                title="Hồ sơ nghi trùng lặp. Click để đối chiếu & hợp nhất"
                              >
                                ⚠️ Nghi trùng
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-gray-100 text-gray-600 uppercase font-mono">
                              {c.source || 'MANUAL'}
                            </span>
                            {c.tags && (
                              <span className="text-[10px] text-gray-400 truncate max-w-[120px]">
                                • {c.tags}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="py-3 px-4 space-y-0.5">
                      {c.phone ? (
                        <div className="flex items-center gap-1 text-gray-700 font-mono text-[11px]">
                          <Phone className="w-3 h-3 text-gray-400" />
                          <span>{c.phone}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic text-[11px]">Chưa có SĐT</span>
                      )}
                      {c.email && (
                        <div className="flex items-center gap-1 text-gray-500 text-[11px]">
                          <Mail className="w-3 h-3 text-gray-400" />
                          <span className="truncate max-w-[150px]">{c.email}</span>
                        </div>
                      )}
                    </td>

                    {/* Lead Score (F100) */}
                    <td className="py-3 px-4">
                      <div
                        className="space-y-1.5 min-w-[140px] cursor-help"
                        title={
                          c.breakdown?.reasons && c.breakdown.reasons.length > 0
                            ? `Chi tiết điểm F100 (${c.leadScore}/100đ - ${c.temperature}):\n• ${c.breakdown.reasons.join('\n• ')}`
                            : `Điểm tiềm năng F100: ${c.leadScore}/100`
                        }
                      >
                        <div className="flex items-center justify-between">
                          {getTempBadge(c.temperature, c.leadScore)}
                          <span className="text-[10px] font-bold text-gray-700">
                            {c.leadScore}/100
                          </span>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              c.temperature === 'HOT'
                                ? 'bg-rose-500'
                                : c.temperature === 'WARM'
                                ? 'bg-amber-500'
                                : 'bg-blue-400'
                            }`}
                            style={{ width: `${c.leadScore}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Deals */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-gray-800">
                        {c.dealsCount > 0 ? `${c.dealsCount} đơn hàng` : '0 đơn'}
                      </div>
                      {c.totalDealValue > 0 && (
                        <div className="text-[11px] text-emerald-600 font-medium font-mono">
                          {c.totalDealValue.toLocaleString('vi-VN')} ₫
                        </div>
                      )}
                    </td>

                    {/* Created Date */}
                    <td className="py-3 px-4 text-gray-500 text-[11px]">
                      {new Date(c.createdAt).toLocaleDateString('vi-VN')}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetail(c);
                          }}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                          title="Xem chi tiết hồ sơ"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEdit(c);
                          }}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                          title="Chỉnh sửa thông tin"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCustomer(c.id, c.name);
                          }}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Xóa khách hàng"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ────────────────────────────────────────────────────────────────────────
          MODAL: QUÉT & HỢP NHẤT HỒ SƠ CÓ KIỂM SOÁT (F101 MERGE MODAL)
          ──────────────────────────────────────────────────────────────────────── */}
      {showMergeModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                  <GitMerge className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    Đối chiếu & Hợp nhất hồ sơ trùng lặp (F101)
                  </h3>
                  <p className="text-xs text-gray-500">
                    Phát hiện và gộp an toàn các hồ sơ khách hàng trùng SĐT, Email hoặc Tên.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowMergeModal(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30">
              {loadingDuplicates ? (
                <div className="p-12 text-center text-xs text-gray-400 flex flex-col items-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-amber-500" />
                  <span>Đang rà quét các hồ sơ trùng lặp trong Workspace...</span>
                </div>
              ) : duplicateGroups.length === 0 ? (
                <div className="p-12 text-center text-xs text-gray-400 space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                  <p className="font-semibold text-gray-800 text-sm">
                    Tuyệt vời! Không phát hiện hồ sơ nào bị trùng lặp.
                  </p>
                  <p className="text-[11px] text-gray-500">Cơ sở dữ liệu khách hàng của bạn hoàn toàn sạch sẽ.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Select Duplicate Group Tab */}
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                    {duplicateGroups.map((group, idx) => (
                      <button
                        key={group.groupId}
                        onClick={() => {
                          setSelectedGroup(group);
                          setSelectedMasterId(group.customers[0]?.id || '');
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
                          selectedGroup?.groupId === group.groupId
                            ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span>Nhóm #{idx + 1}: Trùng {group.matchType} ({group.matchKey})</span>
                      </button>
                    ))}
                  </div>

                  {/* Side-by-Side Comparison Columns */}
                  {selectedGroup && (
                    <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 shadow-xs space-y-3">
                      <div className="flex items-center justify-between text-xs font-semibold text-amber-900">
                        <span>Chọn 1 hồ sơ làm "Hồ sơ chính" (Master Record):</span>
                        <span className="text-[11px] font-normal text-amber-700">
                          Toàn bộ đơn hàng và tin nhắn sẽ được chuyển vào hồ sơ được chọn
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {selectedGroup.customers.map((c) => {
                          const isMaster = c.id === selectedMasterId;
                          return (
                            <div
                              key={c.id}
                              onClick={() => setSelectedMasterId(c.id)}
                              className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                                isMaster
                                  ? 'bg-white border-amber-500 ring-2 ring-amber-500/30 shadow-md'
                                  : 'bg-white/80 border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    isMaster
                                      ? 'bg-amber-500 text-white'
                                      : 'bg-gray-100 text-gray-600'
                                  }`}
                                >
                                  {isMaster ? '⭐ HỒ SƠ CHÍNH (MASTER)' : 'Hồ sơ phụ (Sẽ gộp)'}
                                </span>
                                <input
                                  type="radio"
                                  name="masterSelector"
                                  checked={isMaster}
                                  onChange={() => setSelectedMasterId(c.id)}
                                  className="text-amber-600 focus:ring-amber-500"
                                />
                              </div>

                              <div className="space-y-1.5 text-xs">
                                <div>
                                  <span className="text-gray-400 text-[10px] block">Tên khách hàng:</span>
                                  <span className="font-bold text-gray-900">
                                    {c.name || '(Chưa có tên)'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-400 text-[10px] block">Số điện thoại:</span>
                                  <span className="font-mono text-gray-700">
                                    {c.phone || '(Trống)'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-400 text-[10px] block">Email:</span>
                                  <span className="text-gray-700">{c.email || '(Trống)'}</span>
                                </div>
                                <div className="pt-1 flex items-center justify-between text-[10px] text-gray-500">
                                  <span>Kênh: {c.source || 'MANUAL'}</span>
                                  <span className="font-semibold text-emerald-600">{c.dealsCount} đơn hàng</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Merge Result Preview Note */}
                      <div className="p-3 rounded-xl bg-white border border-amber-200 text-xs text-gray-600 space-y-1 shadow-2xs">
                        <div className="font-semibold text-gray-800 flex items-center gap-1">
                          <Info className="w-3.5 h-3.5 text-amber-500" />
                          <span>Hành động sau khi bấm Hợp nhất:</span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-gray-500">
                          • Tất cả Deals và các cuộc hội thoại chat của hồ sơ phụ sẽ được chuyển nhượng tự động sang hồ sơ chính.
                          <br />• Thẻ tags và ghi chú được gộp lại, thêm vết audit log: *"Hợp nhất hồ sơ có kiểm soát"*.
                          <br />• Hồ sơ phụ sẽ được dọn dẹp an toàn khỏi hệ thống để tránh trùng lặp.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            {selectedGroup && duplicateGroups.length > 0 && (
              <div className="p-3.5 border-t border-gray-100 bg-white flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowMergeModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Đóng lại
                </button>

                <button
                  type="button"
                  onClick={handleExecuteMerge}
                  disabled={merging || !selectedMasterId}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition-colors cursor-pointer"
                >
                  {merging ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <GitMerge className="w-3.5 h-3.5" />
                  )}
                  <span>Xác nhận Hợp nhất hồ sơ này</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────
          MODAL: THÊM MỚI KHÁCH HÀNG
          ──────────────────────────────────────────────────────────────────────── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
              <h3 className="text-sm font-bold text-gray-900">
                Thêm khách hàng mới
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCreateCustomer(false);
              }}
              className="p-5 space-y-3.5 text-xs bg-white"
            >
              <div>
                <label className="block text-gray-700 font-semibold mb-1">
                  Họ và tên khách hàng *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ví dụ: Nguyễn Văn Tuấn"
                  className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">
                  Số điện thoại
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Ví dụ: 0988776655"
                  className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono transition-all"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">
                  Địa chỉ Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Ví dụ: tuan@gmail.com"
                  className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">
                    Nguồn khách hàng
                  </label>
                  <select
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="TIKTOK">TikTok</option>
                    <option value="FACEBOOK">Facebook</option>
                    <option value="ZALO">Zalo</option>
                    <option value="INSTAGRAM">Instagram</option>
                    <option value="MANUAL">Nhập tay</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-1">
                    Thẻ (Tags)
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="VIP, Mua sỉ..."
                    className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">
                  Ghi chú
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  placeholder="Ghi chú sở thích, nhu cầu khách hàng..."
                  className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none transition-all"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3.5 py-2 rounded-xl text-gray-600 hover:bg-gray-100 font-medium cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  {creating && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Lưu khách hàng</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────
          EMBED FORM & WEBHOOK MODAL (F102)
          ──────────────────────────────────────────────────────────────────────── */}
      {showEmbedModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-gray-100 dark:border-slate-800 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400 flex items-center justify-center border border-purple-200 dark:border-purple-800">
                  <Code2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">
                    Nhúng Form Thu Lead & Webhook CRM [F102]
                  </h3>
                  <p className="text-xs text-gray-500">
                    Thu thập Lead từ LadiPage, Website, Landing Page đổ thẳng vào hệ thống CRM theo thời gian thực
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowEmbedModal(false)}
                className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Webhook Endpoint */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider">
                1. Webhook Endpoint URL (Dành cho LadiPage / Webhook / Zapier)
              </label>
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-2.5 rounded-xl">
                <Globe className="w-4 h-4 text-purple-600 shrink-0" />
                <code className="text-xs font-mono text-purple-700 dark:text-purple-300 flex-1 truncate select-all">
                  https://topify.vn/api/crm/forms/embed
                </code>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText('https://topify.vn/api/crm/forms/embed');
                    toast.success('Đã sao chép Webhook URL');
                  }}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-200 hover:bg-gray-100 flex items-center gap-1 shadow-2xs"
                >
                  <Copy className="w-3 h-3" /> Sao chép
                </button>
              </div>
              <p className="text-[11px] text-gray-400">
                Phương thức: <b>POST</b> (Header: <code>Content-Type: application/json</code>). Hỗ trợ các trường: <code>name</code>, <code>phone</code>, <code>email</code>, <code>notes</code>, <code>source</code>.
              </p>
            </div>

            {/* HTML Embed Snippet */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider">
                2. Mã nhúng Form HTML (Nhúng trực tiếp vào Web/Landing Page)
              </label>
              <div className="relative">
                <pre className="p-3.5 bg-slate-900 text-slate-100 text-[11px] font-mono rounded-2xl overflow-x-auto leading-relaxed border border-slate-800 max-h-48">
{`<form action="https://topify.vn/api/crm/forms/embed" method="POST" id="topify-lead-form">
  <input type="text" name="name" placeholder="Họ và tên" required />
  <input type="tel" name="phone" placeholder="Số điện thoại" required />
  <input type="email" name="email" placeholder="Email nhận ưu đãi" />
  <input type="hidden" name="source" value="LANDING_PAGE" />
  <button type="submit">Đăng ký ngay</button>
</form>`}
                </pre>
                <button
                  type="button"
                  onClick={() => {
                    const snippet = `<form action="https://topify.vn/api/crm/forms/embed" method="POST" id="topify-lead-form">\n  <input type="text" name="name" placeholder="Họ và tên" required />\n  <input type="tel" name="phone" placeholder="Số điện thoại" required />\n  <input type="email" name="email" placeholder="Email nhận ưu đãi" />\n  <input type="hidden" name="source" value="LANDING_PAGE" />\n  <button type="submit">Đăng ký ngay</button>\n</form>`;
                    navigator.clipboard.writeText(snippet);
                    setCopiedSnippet(true);
                    toast.success('Đã sao chép mã nhúng HTML!');
                    setTimeout(() => setCopiedSnippet(false), 2000);
                  }}
                  className="absolute top-2.5 right-2.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 flex items-center gap-1 shadow"
                >
                  {copiedSnippet ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copiedSnippet ? 'Đã chép' : 'Sao chép'}
                </button>
              </div>
            </div>

            {/* Live Test Action */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 border border-purple-100 dark:border-purple-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-purple-900 dark:text-purple-300">
                  Kiểm thử trực tiếp Form → CRM (Test Flow)
                </p>
                <p className="text-[11px] text-purple-700 dark:text-purple-400 mt-0.5">
                  Bấm nút bên cạnh để bắn 1 Lead thử nghiệm từ Landing Page vào CRM ngay lập tức
                </p>
              </div>
              <button
                type="button"
                disabled={testingWebhook}
                onClick={handleTestLeadWebhook}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center gap-1.5 shadow-md shadow-purple-200 dark:shadow-none transition-all active:scale-95 cursor-pointer shrink-0"
              >
                <Send className={`w-3.5 h-3.5 ${testingWebhook ? 'animate-spin' : ''}`} />
                <span>{testingWebhook ? 'Đang gửi...' : 'Bắn 1 Lead Thử Nghiệm'}</span>
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowEmbedModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────
          MODAL: XEM CHI TIẾT HỒ SƠ KHÁCH HÀNG (CUSTOMER DETAIL MODAL)
          ──────────────────────────────────────────────────────────────────────── */}
      {showDetailModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-lg uppercase shadow-xs shrink-0">
                  {selectedCustomer.name?.charAt(0) || 'K'}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-gray-900">
                      {selectedCustomer.name || 'Khách hàng chưa đặt tên'}
                    </h3>
                    {getTempBadge(selectedCustomer.temperature, selectedCustomer.leadScore)}
                    {selectedCustomer.isDuplicateCandidate && (
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-bold">
                        ⚠️ Nghi trùng lặp
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                    <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-mono text-[10px] uppercase font-semibold">
                      {selectedCustomer.source || 'MANUAL'}
                    </span>
                    <span>• ID: <code className="text-[11px] font-mono text-gray-600">{selectedCustomer.id.slice(0, 8)}...</code></span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                title="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50/40">
              {/* 1. Contact Information Card */}
              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs space-y-3">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-blue-600" />
                  <span>Thông tin liên hệ & Hồ sơ</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Phone */}
                  <div className="p-3 rounded-xl bg-gray-50/80 border border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[10px] text-gray-400 font-medium">Số điện thoại</div>
                        <div className="font-mono font-semibold text-gray-800">
                          {selectedCustomer.phone || 'Chưa cập nhật'}
                        </div>
                      </div>
                    </div>
                    {selectedCustomer.phone && (
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(selectedCustomer.phone!);
                          toast.success('Đã sao chép số điện thoại');
                        }}
                        className="p-1 text-gray-400 hover:text-blue-600 transition cursor-pointer"
                        title="Sao chép SĐT"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Email */}
                  <div className="p-3 rounded-xl bg-gray-50/80 border border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] text-gray-400 font-medium">Địa chỉ Email</div>
                        <div className="font-medium text-gray-800 truncate" title={selectedCustomer.email || ''}>
                          {selectedCustomer.email || 'Chưa cập nhật'}
                        </div>
                      </div>
                    </div>
                    {selectedCustomer.email && (
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(selectedCustomer.email!);
                          toast.success('Đã sao chép email');
                        }}
                        className="p-1 text-gray-400 hover:text-indigo-600 transition shrink-0 cursor-pointer"
                        title="Sao chép Email"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Source */}
                  <div className="p-3 rounded-xl bg-gray-50/80 border border-gray-100 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-400 font-medium">Kênh tiếp cận (Source)</div>
                      <div className="font-semibold text-gray-800 uppercase font-mono">
                        {selectedCustomer.source || 'MANUAL'}
                      </div>
                    </div>
                  </div>

                  {/* Created At */}
                  <div className="p-3 rounded-xl bg-gray-50/80 border border-gray-100 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-400 font-medium">Ngày tạo hồ sơ</div>
                      <div className="font-semibold text-gray-800">
                        {new Date(selectedCustomer.createdAt).toLocaleDateString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                {selectedCustomer.tags && (
                  <div className="pt-2 border-t border-gray-50 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] text-gray-400 flex items-center gap-1 mr-1">
                      <Tag className="w-3 h-3" /> Thẻ:
                    </span>
                    {selectedCustomer.tags.split(',').map((t, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium border border-blue-100"
                      >
                        {t.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. Lead Score Breakdown Card (Tiêu chí F100) */}
              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-rose-500" />
                    <span>Đánh giá tiềm năng Lead Score (F100)</span>
                  </h4>
                  <span className="text-xs font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-lg">
                    {selectedCustomer.leadScore}/100 điểm
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      selectedCustomer.temperature === 'HOT'
                        ? 'bg-rose-500'
                        : selectedCustomer.temperature === 'WARM'
                        ? 'bg-amber-500'
                        : 'bg-blue-400'
                    }`}
                    style={{ width: `${selectedCustomer.leadScore}%` }}
                  />
                </div>

                {/* Criteria Pillars */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="text-[10px] text-gray-500 font-semibold">1. Hồ sơ đầy đủ (Tối đa 30đ)</div>
                    <div className="text-xs font-bold text-gray-800 mt-0.5">
                      {selectedCustomer.breakdown?.profileScore ?? (
                        (selectedCustomer.name ? 10 : 0) +
                        (selectedCustomer.phone ? 10 : 0) +
                        (selectedCustomer.email ? 10 : 0)
                      )} / 30đ
                    </div>
                    <div className="text-[9px] text-gray-400 mt-1 space-y-0.5">
                      <div>• Tên: {selectedCustomer.name ? '✓ +10đ' : '✗ 0đ'}</div>
                      <div>• SĐT: {selectedCustomer.phone ? '✓ +10đ' : '✗ 0đ'}</div>
                      <div>• Email: {selectedCustomer.email ? '✓ +10đ' : '✗ 0đ'}</div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="text-[10px] text-gray-500 font-semibold">2. Tương tác thực tế (Tối đa 30đ)</div>
                    <div className="text-xs font-bold text-gray-800 mt-0.5">
                      {selectedCustomer.breakdown?.engagementScore ?? 0} / 30đ
                    </div>
                    <div className="text-[9px] text-gray-400 mt-1">
                      {selectedCustomer.breakdown?.engagementScore && selectedCustomer.breakdown.engagementScore > 0
                        ? '✓ Có tương tác hỏi mua / hỏi giá'
                        : 'Chưa có tương tác inbox/hỏi giá'}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="text-[10px] text-gray-500 font-semibold">3. Lịch sử mua hàng (Tối đa 40đ)</div>
                    <div className="text-xs font-bold text-gray-800 mt-0.5">
                      {selectedCustomer.dealsCount > 0 ? 40 : 0} / 40đ
                    </div>
                    <div className="text-[9px] text-gray-400 mt-1">
                      {selectedCustomer.dealsCount > 0
                        ? `✓ Đã có ${selectedCustomer.dealsCount} đơn hàng`
                        : 'Chưa có đơn hàng nào'}
                    </div>
                  </div>
                </div>

                {/* Score reasons list */}
                {selectedCustomer.breakdown?.reasons && selectedCustomer.breakdown.reasons.length > 0 && (
                  <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-100 text-xs space-y-1">
                    <div className="font-semibold text-amber-900 flex items-center gap-1.5 text-[11px]">
                      <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Căn cứ tính điểm F100:</span>
                    </div>
                    <ul className="space-y-1 text-[11px] text-amber-800 pl-4 list-disc">
                      {selectedCustomer.breakdown.reasons.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* 3. Deals / Transactions Card */}
              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                    <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Lịch sử giao dịch (Deals / Đơn hàng)</span>
                  </h4>
                  <span className="text-xs font-semibold text-emerald-600">
                    {selectedCustomer.dealsCount > 0 ? `${selectedCustomer.dealsCount} đơn hàng` : '0 đơn hàng'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-gray-400">Tổng doanh thu từ khách</div>
                    <div className="text-base font-bold text-emerald-600 font-mono">
                      {selectedCustomer.totalDealValue > 0
                        ? `${selectedCustomer.totalDealValue.toLocaleString('vi-VN')} ₫`
                        : '0 ₫'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-gray-400">Trạng thái</div>
                    <div className="text-xs font-semibold text-gray-700">
                      {selectedCustomer.dealsCount > 0 ? 'Khách đã từng mua hàng' : 'Chưa phát sinh giao dịch'}
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Notes Card */}
              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs space-y-2">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-gray-500" />
                  <span>Ghi chú tư vấn & Nhu cầu</span>
                </h4>
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-700 whitespace-pre-line leading-relaxed">
                  {selectedCustomer.notes || (
                    <span className="italic text-gray-400">Chưa có ghi chú nào cho khách hàng này.</span>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-white shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowDetailModal(false);
                  handleDeleteCustomer(selectedCustomer.id, selectedCustomer.name);
                }}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa khách hàng</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition cursor-pointer"
                >
                  Đóng
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowDetailModal(false);
                    handleOpenEdit(selectedCustomer);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Chỉnh sửa thông tin</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────
          MODAL: CHỈNH SỬA THÔNG TIN KHÁCH HÀNG (CUSTOMER EDIT MODAL)
          ──────────────────────────────────────────────────────────────────────── */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    Chỉnh sửa thông tin khách hàng
                  </h3>
                  <p className="text-xs text-gray-500">
                    Cập nhật hồ sơ, liên hệ và ghi chú nhu cầu
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveEdit} className="p-5 space-y-3.5 text-xs bg-white overflow-y-auto">
              <div>
                <label className="block text-gray-700 font-semibold mb-1">
                  Họ và tên khách hàng *
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  placeholder="Ví dụ: Nguyễn Minh Anh"
                  className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">
                  Số điện thoại
                </label>
                <input
                  type="text"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  placeholder="Ví dụ: 0988112233"
                  className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono transition-all"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">
                  Địa chỉ Email
                </label>
                <input
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  placeholder="Ví dụ: minhanh@gmail.com"
                  className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">
                    Nguồn khách hàng
                  </label>
                  <select
                    value={editFormData.source}
                    onChange={(e) => setEditFormData({ ...editFormData, source: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="TIKTOK">TikTok</option>
                    <option value="FACEBOOK">Facebook</option>
                    <option value="ZALO">Zalo</option>
                    <option value="INSTAGRAM">Instagram</option>
                    <option value="LANDING_PAGE">Landing Page</option>
                    <option value="MANUAL">Nhập tay</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-1">
                    Thẻ (Tags)
                  </label>
                  <input
                    type="text"
                    value={editFormData.tags}
                    onChange={(e) => setEditFormData({ ...editFormData, tags: e.target.value })}
                    placeholder="Ví dụ: VIP, Khách sỉ"
                    className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">
                  Ghi chú tư vấn & Nhu cầu
                </label>
                <textarea
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  rows={3}
                  placeholder="Ghi chú sở thích, nhu cầu, tình trạng tư vấn..."
                  className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none transition-all"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-3.5 py-2 rounded-xl text-gray-600 hover:bg-gray-100 font-medium cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
                >
                  {savingEdit && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Lưu cập nhật</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

