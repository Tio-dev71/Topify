import { useState, useEffect } from 'react';
import {
  Users,
  MessageSquare,
  Globe,
  FileSpreadsheet,
  Share2,
  Plus,
  RefreshCw,
  Search,
  Download,
  Upload,
  ArrowRight,
  TrendingUp,
  X,
  UserCheck,
  Building,
  Target,
  Pencil
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/axios';

export interface LeadItem {
  id: string;
  name: string;
  phone: string;
  email?: string;
  company?: string;
  source: 'INBOX' | 'FORM' | 'IMPORT' | 'REFERRAL';
  sourceDetail: string;
  status: 'NEW' | 'CONTACTING' | 'QUALIFIED' | 'UNQUALIFIED' | 'CONVERTED';
  leadScore: number;
  temperature: 'HOT' | 'WARM' | 'COLD';
  demand: string;
  estimatedValue: number;
  assignedTo?: string;
  assignedAvatar?: string;
  notes?: string;
  createdAt: string;
  convertedCustomerId?: string;
  convertedDealId?: string;
}

export interface LeadStats {
  total: number;
  inboxCount: number;
  formCount: number;
  importCount: number;
  referralCount: number;
  newCount: number;
  contactingCount: number;
  qualifiedCount: number;
  unqualifiedCount: number;
  convertedCount: number;
  conversionRate: number;
  totalEstimatedValue: number;
}

export default function LeadsTab({
  onCustomerConverted,
}: {
  onCustomerConverted?: () => void;
}) {
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [stats, setStats] = useState<LeadStats>({
    total: 0,
    inboxCount: 0,
    formCount: 0,
    importCount: 0,
    referralCount: 0,
    newCount: 0,
    contactingCount: 0,
    qualifiedCount: 0,
    unqualifiedCount: 0,
    convertedCount: 0,
    conversionRate: 0,
    totalEstimatedValue: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [selectedLeadForConvert, setSelectedLeadForConvert] = useState<LeadItem | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedLeadForDetail, setSelectedLeadForDetail] = useState<LeadItem | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedLeadForEdit, setSelectedLeadForEdit] = useState<LeadItem | null>(null);

  // Edit form state
  const [editForm, setEditForm] = useState({
    id: '',
    name: '',
    phone: '',
    email: '',
    company: '',
    source: 'INBOX' as LeadItem['source'],
    sourceDetail: '',
    status: 'NEW' as LeadItem['status'],
    demand: '',
    estimatedValue: 10000000,
    assignedTo: 'Chưa gán',
    notes: '',
  });
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // Create form state
  const [createForm, setCreateForm] = useState({
    name: '',
    phone: '',
    email: '',
    company: '',
    source: 'INBOX' as LeadItem['source'],
    sourceDetail: '',
    demand: '',
    estimatedValue: 10000000,
    assignedTo: 'Chưa gán',
    notes: '',
  });
  const [submittingCreate, setSubmittingCreate] = useState(false);
  const [workspaceMembers, setWorkspaceMembers] = useState<any[]>([]);

  useEffect(() => {
    api.get('/team')
      .then((res) => {
        if (res.data?.members && Array.isArray(res.data.members) && res.data.members.length > 0) {
          setWorkspaceMembers(res.data.members);
          setCreateForm((prev) => ({
            ...prev,
            assignedTo: res.data.members[0].name || res.data.members[0].email,
          }));
        }
      })
      .catch(() => {});
  }, []);

  // Convert form state
  const [convertForm, setConvertForm] = useState({
    createDeal: true,
    dealTitle: '',
    dealValue: 15000000,
  });
  const [converting, setConverting] = useState(false);

  // Import state
  const [importFile, setImportFile] = useState<File | null>(null);
  const [previewLeads, setPreviewLeads] = useState<Partial<LeadItem>[]>([]);
  const [importing, setImporting] = useState(false);

  // Fetch leads
  const fetchLeads = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (sourceFilter !== 'ALL') params.set('source', sourceFilter);
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await api.get(`/crm/leads?${params.toString()}`);
      if (res.data?.leads) {
        setLeads(res.data.leads);
      }
      if (res.data?.stats) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error('Failed to load leads', err);
      toast.error('Không thể tải danh sách khách hàng tiềm năng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [sourceFilter, statusFilter]);

  // Handle Search submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLeads();
  };

  // Quick Status Change
  const handleStatusChange = async (id: string, newStatus: LeadItem['status']) => {
    try {
      const res = await api.patch('/crm/leads', { id, status: newStatus });
      if (res.data?.success) {
        setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status: newStatus } : l)));
        if (res.data.stats) setStats(res.data.stats);
        toast.success(`Đã cập nhật trạng thái sang "${getStatusLabel(newStatus)}"`);
      }
    } catch {
      toast.error('Lỗi cập nhật trạng thái');
    }
  };

  // Create Lead
  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name && !createForm.phone) {
      toast.error('Vui lòng nhập họ tên hoặc số điện thoại');
      return;
    }

    setSubmittingCreate(true);
    try {
      const res = await api.post('/crm/leads', {
        action: 'create',
        ...createForm,
      });

      if (res.data?.success) {
        toast.success('Đã thêm khách hàng tiềm năng thành công!');
        setShowCreateModal(false);
        setCreateForm({
          name: '',
          phone: '',
          email: '',
          company: '',
          source: 'INBOX',
          sourceDetail: '',
          demand: '',
          estimatedValue: 10000000,
          assignedTo: 'Nguyễn Văn A',
          notes: '',
        });
        fetchLeads();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Lỗi thêm khách hàng tiềm năng');
    } finally {
      setSubmittingCreate(false);
    }
  };

  // Open Edit Modal
  const handleOpenEditModal = (lead: LeadItem) => {
    setSelectedLeadForEdit(lead);
    setEditForm({
      id: lead.id,
      name: lead.name || '',
      phone: lead.phone || '',
      email: lead.email || '',
      company: lead.company || '',
      source: lead.source || 'INBOX',
      sourceDetail: lead.sourceDetail || '',
      status: lead.status || 'NEW',
      demand: lead.demand || '',
      estimatedValue: lead.estimatedValue || 0,
      assignedTo: lead.assignedTo || (workspaceMembers[0]?.name || 'Chưa gán'),
      notes: lead.notes || '',
    });
    setShowEditModal(true);
  };

  // Save Edit Lead
  const handleSaveEditLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.name.trim() || !editForm.phone.trim()) {
      toast.error('Vui lòng điền đầy đủ Họ và tên cùng Số điện thoại');
      return;
    }

    setSubmittingEdit(true);
    try {
      const res = await api.patch('/crm/leads', {
        id: editForm.id,
        name: editForm.name.trim(),
        phone: editForm.phone.trim(),
        email: editForm.email.trim(),
        company: editForm.company.trim(),
        source: editForm.source,
        sourceDetail: editForm.sourceDetail.trim(),
        status: editForm.status,
        demand: editForm.demand.trim(),
        estimatedValue: Number(editForm.estimatedValue),
        assignedTo: editForm.assignedTo,
        notes: editForm.notes.trim(),
      });

      if (res.data?.success) {
        toast.success(res.data.message || 'Cập nhật thông tin khách hàng tiềm năng thành công!');
        setShowEditModal(false);
        setSelectedLeadForEdit(null);
        fetchLeads();
      } else {
        toast.error(res.data?.error || 'Không thể cập nhật khách hàng tiềm năng');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Lỗi cập nhật khách hàng tiềm năng');
    } finally {
      setSubmittingEdit(false);
    }
  };

  // Open Convert Modal
  const handleOpenConvertModal = (lead: LeadItem) => {
    setSelectedLeadForConvert(lead);
    setConvertForm({
      createDeal: true,
      dealTitle: `Hợp đồng: ${lead.demand || lead.name}`,
      dealValue: lead.estimatedValue || 15000000,
    });
    setShowConvertModal(true);
  };

  // Execute Convert
  const handleExecuteConvert = async () => {
    if (!selectedLeadForConvert) return;

    setConverting(true);
    try {
      const res = await api.post('/crm/leads', {
        action: 'convert',
        id: selectedLeadForConvert.id,
        dealTitle: convertForm.createDeal ? convertForm.dealTitle : undefined,
        dealValue: convertForm.createDeal ? convertForm.dealValue : undefined,
      });

      if (res.data?.success) {
        toast.success(res.data.message || 'Chuyển đổi thành công!');
        setShowConvertModal(false);
        fetchLeads();
        if (onCustomerConverted) onCustomerConverted();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Lỗi chuyển đổi lead');
    } finally {
      setConverting(false);
    }
  };

  // Delete Lead
  const handleDeleteLead = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa khách hàng tiềm năng "${name}"?`)) return;

    try {
      const res = await api.delete(`/crm/leads?id=${id}`);
      if (res.data?.success) {
        toast.success('Đã xóa khách hàng tiềm năng');
        setLeads((prev) => prev.filter((l) => l.id !== id));
        if (res.data.stats) setStats(res.data.stats);
      }
    } catch {
      toast.error('Lỗi khi xóa');
    }
  };

  // File import preview parser
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);

    // Mock/CSV parser
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter((l) => l.trim() !== '');
      if (lines.length <= 1) {
        // Fallback sample import rows
        setPreviewLeads([
          {
            name: 'Vũ Thị Minh Hạnh',
            phone: '0978665544',
            email: 'minhhanh@vinaretail.com',
            company: 'VinaRetail Group',
            demand: 'Triển khai phần mềm quản lý 10 trang Fanpage và TikTok Shop',
            estimatedValue: 30000000,
          },
          {
            name: 'Nguyễn Thành Long',
            phone: '0919223344',
            email: 'thanhlong@logistics24.vn',
            company: 'Logistics 24 Giờ',
            demand: 'Gửi thông báo đơn hàng tự động qua ZNS và Facebook Messenger',
            estimatedValue: 18000000,
          },
          {
            name: 'Phạm Thu Trang',
            phone: '0983112299',
            email: 'thutrang@thoitrangeva.com',
            company: 'Thời Trang EVA Design',
            demand: 'Chốt đơn tự động qua livestream và gắn nhãn khách hàng tiềm năng',
            estimatedValue: 25000000,
          },
        ]);
        return;
      }

      const parsed: Partial<LeadItem>[] = [];
      for (let i = 1; i < lines.length && i <= 10; i++) {
        const cols = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
        if (cols[0] || cols[1]) {
          parsed.push({
            name: cols[0] || 'Khách tiềm năng',
            phone: cols[1] || '0900000000',
            email: cols[2] || undefined,
            company: cols[3] || undefined,
            demand: cols[4] || 'Nhu cầu tư vấn',
            estimatedValue: Number(cols[5]) || 15000000,
          });
        }
      }
      setPreviewLeads(parsed);
    };
    reader.readAsText(file);
  };

  // Submit bulk import
  const handleExecuteImport = async () => {
    if (previewLeads.length === 0) {
      toast.error('Vui lòng chọn file có dữ liệu hợp lệ');
      return;
    }

    setImporting(true);
    try {
      const res = await api.post('/crm/leads', {
        action: 'bulk_import',
        leads: previewLeads.map((p) => ({
          ...p,
          source: 'IMPORT',
          fileName: importFile?.name || 'leads_import.csv',
        })),
      });

      if (res.data?.success) {
        toast.success(res.data.message || 'Nhập khách hàng tiềm năng thành công!');
        setShowImportModal(false);
        setImportFile(null);
        setPreviewLeads([]);
        fetchLeads();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Lỗi nhập dữ liệu từ file');
    } finally {
      setImporting(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (leads.length === 0) {
      toast.error('Không có dữ liệu để xuất');
      return;
    }

    const headers = ['Họ tên', 'Số điện thoại', 'Email', 'Công ty', 'Nguồn lead', 'Nhu cầu', 'Điểm', 'Trạng thái', 'Giá trị dự kiến', 'Người phụ trách'];
    const rows = leads.map((l) => [
      `"${l.name}"`,
      `"${l.phone}"`,
      `"${l.email || ''}"`,
      `"${l.company || ''}"`,
      `"${l.source}"`,
      `"${l.demand.replace(/"/g, '""')}"`,
      l.leadScore,
      `"${getStatusLabel(l.status)}"`,
      l.estimatedValue,
      `"${l.assignedTo || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `danh_sach_leads_topify_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Đã tải xuống file CSV danh sách Lead!');
  };

  // Download Sample Template CSV
  const handleDownloadSampleTemplate = () => {
    const sampleCsv = `Họ và tên,Số điện thoại,Email,Tên công ty,Nhu cầu quan tâm,Giá trị dự kiến
Nguyễn Văn Khang,0987112233,khang.nguyen@company.com,Công ty TNHH An Phát,Tư vấn gói Topify Enterprise 1 năm,25000000
Lê Thị Thanh Mai,0976554433,thanhmai@retailpro.vn,Chuỗi Thời Trang May Mặc,Quản lý comment và chốt đơn tự động,15000000
Trần Tuấn Kiệt,0909887766,tuankiet@fnbviet.vn,Hệ thống F&B Sài Gòn,Tích hợp Form web và CRM đa kênh,20000000`;

    const encodedUri = encodeURI('data:text/csv;charset=utf-8,\uFEFF' + sampleCsv);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'mau_import_leads_topify.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Đã tải file mẫu CSV!');
  };

  const getSourceBadge = (source: LeadItem['source']) => {
    switch (source) {
      case 'INBOX':
        return {
          icon: MessageSquare,
          label: 'Hộp thư (Inbox)',
          color: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
        };
      case 'FORM':
        return {
          icon: Globe,
          label: 'Web Form (F102)',
          color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
        };
      case 'IMPORT':
        return {
          icon: FileSpreadsheet,
          label: 'Nhập File (Import)',
          color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
        };
      case 'REFERRAL':
        return {
          icon: Share2,
          label: 'Giới thiệu (Referral)',
          color: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800',
        };
      default:
        return {
          icon: Users,
          label: source,
          color: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300',
        };
    }
  };

  const getStatusLabel = (status: LeadItem['status']) => {
    switch (status) {
      case 'NEW':
        return 'Mới tiếp nhận';
      case 'CONTACTING':
        return 'Đang liên hệ';
      case 'QUALIFIED':
        return 'Tiềm năng';
      case 'UNQUALIFIED':
        return 'Không phù hợp';
      case 'CONVERTED':
        return 'Đã chuyển đổi';
      default:
        return status;
    }
  };

  const getStatusBadgeColor = (status: LeadItem['status']) => {
    switch (status) {
      case 'NEW':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300';
      case 'CONTACTING':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300';
      case 'QUALIFIED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300';
      case 'UNQUALIFIED':
        return 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400';
      case 'CONVERTED':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* ────────────────────────────────────────────────────────────────────────
          HEADER: TITLE & ACTIONS
          ──────────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono">
              F092
            </span>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Khách hàng tiềm năng & Phân loại nguồn Lead (Leads - F092)
            </h2>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Quản lý và nuôi dưỡng khách hàng tiềm năng đa nguồn: Hộp thư (Inbox), Web Form (Landing Page), Nhập file (Import) và Giới thiệu (Referral).
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={fetchLeads}
            disabled={loading}
            className="p-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition cursor-pointer"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-gray-500" />
            <span>Xuất CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-amber-200 bg-amber-50 text-xs font-bold text-amber-800 hover:bg-amber-100 transition cursor-pointer shadow-xs dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
          >
            <Upload className="w-3.5 h-3.5 text-amber-600" />
            <span>Nhập File Excel/CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Lead Mới</span>
          </button>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────
          5 KPI CARDS - MULTI-CHANNEL VISIBILITY
          ──────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Card 1: Total Leads */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span className="font-semibold">Tổng số Lead</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{stats.total}</div>
          <div className="text-[11px] text-indigo-600 dark:text-indigo-400 mt-1 flex items-center gap-1">
            <span>Tất cả kênh CRM</span>
          </div>
        </div>

        {/* Card 2: Inbox Leads */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span className="font-semibold">Từ Hộp thư (Inbox)</span>
            <MessageSquare className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400">{stats.inboxCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Messenger, TikTok Shop</div>
        </div>

        {/* Card 3: Form Leads */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span className="font-semibold">Từ Web Form</span>
            <Globe className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.formCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Landing page, Form F102</div>
        </div>

        {/* Card 4: Import Leads */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span className="font-semibold">Từ File Import</span>
            <FileSpreadsheet className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{stats.importCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Excel, CSV hàng loạt</div>
        </div>

        {/* Card 5: Referral Leads */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span className="font-semibold">Từ Giới thiệu</span>
            <Share2 className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400">{stats.referralCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Đối tác & Tiếp thị liên kết</div>
        </div>

        {/* Card 6: Conversion Rate */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span className="font-semibold">Tỷ lệ Chuyển đổi</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.conversionRate}%</div>
          <div className="text-[11px] text-slate-400 mt-1">{stats.convertedCount} lead đã thành Deal</div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────
          SOURCE FILTER TABS & TOOLBAR
          ──────────────────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-xs space-y-3">
        {/* Source Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {[
            { id: 'ALL', label: 'Tất cả nguồn', count: stats.total, icon: Users },
            { id: 'INBOX', label: 'Hộp thư (Inbox)', count: stats.inboxCount, icon: MessageSquare, color: 'text-purple-600' },
            { id: 'FORM', label: 'Web Form (F102)', count: stats.formCount, icon: Globe, color: 'text-emerald-600' },
            { id: 'IMPORT', label: 'Nhập File (Import)', count: stats.importCount, icon: FileSpreadsheet, color: 'text-amber-600' },
            { id: 'REFERRAL', label: 'Giới thiệu (Referral)', count: stats.referralCount, icon: Share2, color: 'text-rose-600' },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = sourceFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSourceFilter(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs dark:bg-indigo-600'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 dark:bg-slate-700/50 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : tab.color || 'text-slate-400'}`} />
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono ${
                    isActive ? 'bg-white/20 text-white' : 'bg-white text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Status Filter Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-gray-100 dark:border-slate-700">
          <form onSubmit={handleSearch} className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên lead, số điện thoại, email, công ty, nhu cầu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-gray-50 dark:bg-slate-700/60 border border-gray-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-gray-900 dark:text-white"
            />
          </form>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Trạng thái:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Lọc theo trạng thái"
              className="text-xs py-2 px-3 rounded-xl bg-gray-50 dark:bg-slate-700/60 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 font-medium cursor-pointer"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="NEW">🔵 Mới tiếp nhận (New)</option>
              <option value="CONTACTING">🟡 Đang liên hệ (Contacting)</option>
              <option value="QUALIFIED">🟢 Tiềm năng (Qualified)</option>
              <option value="UNQUALIFIED">⚪ Không phù hợp</option>
              <option value="CONVERTED">🟣 Đã chuyển đổi (Converted)</option>
            </select>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────
          LEADS DATA TABLE
          ──────────────────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-16 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Đang tải danh sách khách hàng tiềm năng...</p>
          </div>
        ) : leads.length === 0 ? (
          <div className="py-16 text-center space-y-4">
            <UserCheck className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">Không tìm thấy khách hàng tiềm năng nào</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Chưa có khách hàng tiềm năng phù hợp với bộ lọc. Bạn có thể thêm thủ công, nhập file Excel hoặc thu lead từ Form website (F102).
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 cursor-pointer"
              >
                + Thêm Lead Mới
              </button>
              <button
                type="button"
                onClick={() => setShowImportModal(true)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Nhập file Excel/CSV
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 dark:border-slate-700/60 bg-gray-50/75 dark:bg-slate-900/40 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Khách hàng tiềm năng</th>
                  <th className="py-3 px-4">Liên hệ</th>
                  <th className="py-3 px-4">Nguồn Lead (F092)</th>
                  <th className="py-3 px-4">Nhu cầu & Giá trị dự kiến</th>
                  <th className="py-3 px-4 text-center">Điểm (Score)</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4">Phụ trách</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700/60 text-xs">
                {leads.map((lead) => {
                  const sourceBadge = getSourceBadge(lead.source);
                  const SourceIcon = sourceBadge.icon;
                  const isConverted = lead.status === 'CONVERTED';

                  return (
                    <tr
                      key={lead.id}
                      className="hover:bg-indigo-50/30 dark:hover:bg-slate-700/30 transition-colors group"
                    >
                      {/* Name & Company */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                            {lead.name ? lead.name.slice(0, 1).toUpperCase() : 'L'}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                              <span>{lead.name}</span>
                              {isConverted && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300">
                                  Khách hàng chính thức
                                </span>
                              )}
                            </div>
                            {lead.company && (
                              <div className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                                <Building className="w-3 h-3 text-slate-400" />
                                <span>{lead.company}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Phone & Email */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="font-mono font-medium text-slate-900 dark:text-slate-100">
                            {lead.phone}
                          </div>
                          {lead.email && (
                            <div className="text-[11px] text-slate-500 truncate max-w-[150px]">
                              {lead.email}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Source */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <span
                            className={`inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-lg border font-bold ${sourceBadge.color}`}
                          >
                            <SourceIcon className="w-3 h-3" />
                            <span>{sourceBadge.label}</span>
                          </span>
                          <p className="text-[10px] text-slate-500 truncate max-w-[180px]" title={lead.sourceDetail}>
                            {lead.sourceDetail}
                          </p>
                        </div>
                      </td>

                      {/* Demand & Estimated Value */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1 max-w-[220px]">
                          <p className="text-gray-900 dark:text-slate-200 font-medium line-clamp-2" title={lead.demand}>
                            {lead.demand}
                          </p>
                          <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(lead.estimatedValue)}
                          </div>
                        </div>
                      </td>

                      {/* Score */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span
                            className={`text-xs font-black font-mono px-2 py-0.5 rounded-md ${
                              lead.leadScore >= 85
                                ? 'bg-rose-50 text-rose-600 border border-rose-200'
                                : lead.leadScore >= 60
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {lead.leadScore}/100
                          </span>
                          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
                            {lead.temperature}
                          </span>
                        </div>
                      </td>

                      {/* Status Dropdown */}
                      <td className="py-3.5 px-4">
                        <select
                          value={lead.status}
                          onChange={(e) => handleStatusChange(lead.id, e.target.value as any)}
                          aria-label={`Trạng thái của lead ${lead.name}`}
                          className={`text-xs font-semibold py-1 px-2 rounded-lg border focus:outline-none cursor-pointer transition ${getStatusBadgeColor(
                            lead.status
                          )}`}
                        >
                          <option value="NEW">Mới tiếp nhận</option>
                          <option value="CONTACTING">Đang liên hệ</option>
                          <option value="QUALIFIED">Tiềm năng</option>
                          <option value="UNQUALIFIED">Không phù hợp</option>
                          <option value="CONVERTED">Đã chuyển đổi</option>
                        </select>
                      </td>

                      {/* Assignee */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          {lead.assignedAvatar ? (
                            <img
                              src={lead.assignedAvatar}
                              alt={lead.assignedTo || 'Staff'}
                              className="w-6 h-6 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold">
                              {(lead.assignedTo || 'A').slice(0, 1)}
                            </div>
                          )}
                          <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                            {lead.assignedTo || 'Chưa gán'}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isConverted ? (
                            <button
                              type="button"
                              onClick={() => handleOpenConvertModal(lead)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-xs transition cursor-pointer"
                              title="Chuyển đổi thành Khách hàng chính thức & Tạo Cơ hội bán hàng"
                            >
                              <span>Chuyển đổi</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          ) : (
                            <span className="text-[11px] text-emerald-600 font-bold px-2 py-0.5 bg-emerald-50 rounded-md border border-emerald-200">
                              ✓ Đã chốt
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(lead)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-700 transition cursor-pointer"
                            title="Chỉnh sửa thông tin lead"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedLeadForDetail(lead);
                              setShowDetailModal(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
                            title="Xem chi tiết"
                          >
                            <Target className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteLead(lead.id, lead.name)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition cursor-pointer"
                            title="Xóa lead"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ────────────────────────────────────────────────────────────────────────
          MODAL 1: THÊM LEAD MỚI THỦ CÔNG
          ──────────────────────────────────────────────────────────────────────── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-xl max-w-lg w-full overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono">
                  F092
                </span>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Thêm Khách hàng tiềm năng mới
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Họ và tên <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nguyễn Văn Nam"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Số điện thoại <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="0988112233"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="nam.nguyen@company.vn"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Tên công ty / Doanh nghiệp
                  </label>
                  <input
                    type="text"
                    placeholder="Công ty Cổ phần Alpha"
                    value={createForm.company}
                    onChange={(e) => setCreateForm({ ...createForm, company: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Nguồn Lead (F092)
                  </label>
                  <select
                    value={createForm.source}
                    onChange={(e) => setCreateForm({ ...createForm, source: e.target.value as any })}
                    className="w-full text-xs px-3 py-2 rounded-xl bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 font-medium"
                  >
                    <option value="INBOX">💬 Hộp thư (Inbox / Fanpage)</option>
                    <option value="FORM">🌐 Web Form (Landing Page)</option>
                    <option value="IMPORT">📊 Nhập File (Import Excel)</option>
                    <option value="REFERRAL">🤝 Giới thiệu (Referral)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Chi tiết nguồn
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Fanpage VTV24, Form Q4..."
                    value={createForm.sourceDetail}
                    onChange={(e) => setCreateForm({ ...createForm, sourceDetail: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Nhu cầu quan tâm
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Quan tâm gói phần mềm tự động hóa Marketing & CRM"
                  value={createForm.demand}
                  onChange={(e) => setCreateForm({ ...createForm, demand: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Giá trị dự kiến (VNĐ)
                  </label>
                  <input
                    type="number"
                    step="1000000"
                    value={createForm.estimatedValue}
                    onChange={(e) => setCreateForm({ ...createForm, estimatedValue: Number(e.target.value) })}
                    className="w-full text-xs px-3 py-2 rounded-xl bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Người phụ trách
                  </label>
                  <select
                    value={createForm.assignedTo}
                    onChange={(e) => setCreateForm({ ...createForm, assignedTo: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  >
                    {workspaceMembers.length > 0 ? (
                      workspaceMembers.map((m) => (
                        <option key={m.email} value={m.name || m.email}>
                          {m.name || m.email} ({m.role === 'ADMIN' ? 'Admin' : 'Nhân viên'})
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="yến ngô">yến ngô (Admin)</option>
                        <option value="minh@topify.vn">minh@topify.vn (Nhân viên)</option>
                        <option value="abc@company.com">abc@company.com (Nhân viên)</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Ghi chú bổ sung
                </label>
                <textarea
                  rows={2}
                  placeholder="Ghi chú thêm về lịch sử cuộc gọi, thời gian hẹn gọi lại..."
                  value={createForm.notes}
                  onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                  className="w-full text-xs p-3 rounded-xl bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-700 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submittingCreate}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {submittingCreate ? 'Đang lưu...' : 'Thêm Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────
          MODAL 2: NHẬP HÀNG LOẠT TỪ EXCEL / CSV
          ──────────────────────────────────────────────────────────────────────── */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-xl max-w-xl w-full overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Nhập Khách hàng tiềm năng từ File Excel / CSV
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200">
                <div>
                  <p className="font-bold">Hỗ trợ định dạng .CSV hoặc .XLSX</p>
                  <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
                    Hệ thống tự động phát hiện các cột: Họ tên, Số điện thoại, Email, Công ty, Nhu cầu.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadSampleTemplate}
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-amber-300 text-amber-800 dark:text-amber-300 font-bold text-xs hover:bg-amber-100 transition cursor-pointer shrink-0 shadow-2xs"
                >
                  Tải Template Mẫu
                </button>
              </div>

              {/* Upload Input */}
              <div className="border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-2xl p-6 text-center hover:border-indigo-400 transition">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <label className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer block">
                  Chọn file từ máy tính của bạn
                  <input
                    type="file"
                    accept=".csv, .xlsx, .xls, .txt"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                <p className="text-[11px] text-slate-400 mt-1">
                  {importFile ? `Đã chọn: ${importFile.name}` : 'Hoặc kéo thả file CSV vào đây'}
                </p>
              </div>

              {/* Preview data */}
              {previewLeads.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-gray-700 dark:text-gray-300">
                    <span>Xem trước dữ liệu ({previewLeads.length} dòng hợp lệ):</span>
                    <span className="text-emerald-600">✓ Sẵn sàng nhập</span>
                  </div>
                  <div className="max-h-40 overflow-y-auto rounded-xl border border-gray-200 dark:border-slate-700 divide-y divide-gray-100 dark:divide-slate-700/60 text-[11px]">
                    {previewLeads.map((item, idx) => (
                      <div key={idx} className="p-2 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-gray-900 dark:text-white">{item.name}</span>
                          <span className="text-gray-500 font-mono ml-2">({item.phone})</span>
                          {item.company && <span className="text-gray-400 ml-1.5">- {item.company}</span>}
                        </div>
                        <span className="text-emerald-600 font-mono font-medium">
                          {new Intl.NumberFormat('vi-VN').format(item.estimatedValue || 10000000)} đ
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-700 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={handleExecuteImport}
                  disabled={previewLeads.length === 0 || importing}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {importing ? 'Đang nhập...' : `Xác nhận nhập ${previewLeads.length} Lead`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────
          MODAL 3: CHUYỂN ĐỔI LEAD SANG KHÁCH HÀNG & DEAL (1-CLICK CONVERSION)
          ──────────────────────────────────────────────────────────────────────── */}
      {showConvertModal && selectedLeadForConvert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-xl max-w-md w-full overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Chuyển đổi Khách hàng tiềm năng
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowConvertModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs space-y-1">
                <div className="font-bold text-emerald-900 dark:text-emerald-200">
                  Lead: {selectedLeadForConvert.name} ({selectedLeadForConvert.phone})
                </div>
                <div className="text-emerald-700 dark:text-emerald-300 text-[11px]">
                  Nhu cầu: {selectedLeadForConvert.demand}
                </div>
                <div className="text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                  Nguồn: {selectedLeadForConvert.sourceDetail}
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-2 text-xs font-bold text-gray-800 dark:text-gray-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={convertForm.createDeal}
                    onChange={(e) => setConvertForm({ ...convertForm, createDeal: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Tự động khởi tạo Cơ hội bán hàng (Deal - F096)</span>
                </label>

                {convertForm.createDeal && (
                  <div className="space-y-3 pl-6 border-l-2 border-indigo-200 dark:border-indigo-800">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Tiêu đề Cơ hội bán hàng (Deal)
                      </label>
                      <input
                        type="text"
                        value={convertForm.dealTitle}
                        onChange={(e) => setConvertForm({ ...convertForm, dealTitle: e.target.value })}
                        className="w-full text-xs px-3 py-2 rounded-xl bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Giá trị hợp đồng (VNĐ)
                      </label>
                      <input
                        type="number"
                        step="1000000"
                        value={convertForm.dealValue}
                        onChange={(e) => setConvertForm({ ...convertForm, dealValue: Number(e.target.value) })}
                        className="w-full text-xs px-3 py-2 rounded-xl bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowConvertModal(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-700 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleExecuteConvert}
                  disabled={converting}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {converting ? 'Đang chuyển đổi...' : 'Xác nhận Chuyển đổi'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────
          MODAL 4: CHI TIẾT LEAD (DETAIL MODAL)
          ──────────────────────────────────────────────────────────────────────── */}
      {showDetailModal && selectedLeadForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-xl max-w-lg w-full overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Chi tiết Khách hàng tiềm năng
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">{selectedLeadForDetail.name}</h4>
                  <p className="text-gray-500">{selectedLeadForDetail.company || 'Cá nhân'}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-lg border font-bold ${getSourceBadge(selectedLeadForDetail.source).color}`}>
                  {getSourceBadge(selectedLeadForDetail.source).label}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 dark:bg-slate-900/50 rounded-xl">
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase">Số điện thoại</span>
                  <span className="font-mono font-bold text-gray-900 dark:text-white">{selectedLeadForDetail.phone}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase">Email</span>
                  <span className="font-mono text-gray-900 dark:text-white">{selectedLeadForDetail.email || 'Chưa có'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase">Điểm tiềm năng (Score)</span>
                  <span className="font-bold text-rose-600">{selectedLeadForDetail.leadScore}/100 ({selectedLeadForDetail.temperature})</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase">Giá trị ước tính</span>
                  <span className="font-bold text-emerald-600 font-mono">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedLeadForDetail.estimatedValue)}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-gray-400 block text-[10px] uppercase mb-1">Nguồn chi tiết</span>
                <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-slate-700/50 p-2.5 rounded-xl border border-gray-100 dark:border-slate-600">
                  {selectedLeadForDetail.sourceDetail}
                </p>
              </div>

              <div>
                <span className="text-gray-400 block text-[10px] uppercase mb-1">Nhu cầu & Ghi chú</span>
                <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-slate-700/50 p-2.5 rounded-xl border border-gray-100 dark:border-slate-600">
                  {selectedLeadForDetail.demand}
                </p>
                {selectedLeadForDetail.notes && (
                  <p className="text-gray-500 italic mt-1.5 text-[11px]">
                    Lịch sử: {selectedLeadForDetail.notes}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-slate-700 text-xs font-semibold hover:bg-gray-200 cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const lead = selectedLeadForDetail;
                    setShowDetailModal(false);
                    handleOpenEditModal(lead);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer transition shadow-xs"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Sửa thông tin</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────
          MODAL 5: CHỈNH SỬA THÔNG TIN LEAD (EDIT LEAD MODAL - F092)
          ──────────────────────────────────────────────────────────────────────── */}
      {showEditModal && selectedLeadForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-xl max-w-lg w-full overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-700 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono">
                  F092
                </span>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Chỉnh sửa Khách hàng tiềm năng
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedLeadForEdit(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditLead} className="p-5 space-y-4 overflow-y-auto grow">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Họ và tên <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Số điện thoại <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 font-mono text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Tên công ty / Doanh nghiệp
                  </label>
                  <input
                    type="text"
                    value={editForm.company}
                    onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Nguồn Lead (F092)
                  </label>
                  <select
                    value={editForm.source}
                    onChange={(e) => setEditForm({ ...editForm, source: e.target.value as any })}
                    className="w-full text-xs px-3 py-2 rounded-xl bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 font-medium text-gray-900 dark:text-white"
                  >
                    <option value="INBOX">💬 Hộp thư (Inbox / Fanpage)</option>
                    <option value="FORM">🌐 Web Form (Landing Page)</option>
                    <option value="IMPORT">📊 Nhập File (Import Excel)</option>
                    <option value="REFERRAL">🤝 Giới thiệu (Referral)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Trạng thái tiếp nhận
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                    className="w-full text-xs px-3 py-2 rounded-xl bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 font-medium text-gray-900 dark:text-white"
                  >
                    <option value="NEW">Mới tiếp nhận</option>
                    <option value="CONTACTING">Đang liên hệ</option>
                    <option value="QUALIFIED">Tiềm năng</option>
                    <option value="UNQUALIFIED">Không phù hợp</option>
                    <option value="CONVERTED">Đã chuyển đổi</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Chi tiết nguồn
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Landing page báo giá, Form F102..."
                  value={editForm.sourceDetail}
                  onChange={(e) => setEditForm({ ...editForm, sourceDetail: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Nhu cầu quan tâm
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Cần tư vấn dịch vụ Topify Enterprise"
                  value={editForm.demand}
                  onChange={(e) => setEditForm({ ...editForm, demand: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-gray-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Giá trị hợp đồng ước tính (VNĐ)
                  </label>
                  <input
                    type="number"
                    step="1000000"
                    value={editForm.estimatedValue}
                    onChange={(e) => setEditForm({ ...editForm, estimatedValue: Number(e.target.value) })}
                    className="w-full text-xs px-3 py-2 rounded-xl bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 font-mono text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Người phụ trách
                  </label>
                  <select
                    value={editForm.assignedTo}
                    onChange={(e) => setEditForm({ ...editForm, assignedTo: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-gray-900 dark:text-white"
                  >
                    {workspaceMembers.length > 0 ? (
                      workspaceMembers.map((m) => (
                        <option key={m.email} value={m.name || m.email}>
                          {m.name || m.email} ({m.role === 'ADMIN' ? 'Admin' : 'Nhân viên'})
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="yến ngô">yến ngô (Admin)</option>
                        <option value="minh@topify.vn">minh@topify.vn (Nhân viên)</option>
                        <option value="Nguyễn Văn A">Nguyễn Văn A</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Ghi chú bổ sung
                </label>
                <textarea
                  rows={2}
                  placeholder="Ghi chú thêm về cuộc gọi, sở thích, yêu cầu..."
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  className="w-full text-xs p-3 rounded-xl bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-gray-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-slate-700 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedLeadForEdit(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-700 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submittingEdit}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {submittingEdit ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

