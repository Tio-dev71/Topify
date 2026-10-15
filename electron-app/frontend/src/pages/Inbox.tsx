import { useState, useEffect, useMemo, useRef } from 'react';
import {
  MessageSquare,
  Send,
  User,
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Lock,
  ShieldAlert,
  Phone,
  Mail,
  DollarSign,
  Search,
  Zap,
  ArrowRight,
  Check,
  Building2,
  Share2,
  UserCheck,
  PanelRight,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/axios';

// Types
export type ConversationStatus = 'NEW' | 'OPEN' | 'PENDING' | 'RESOLVED' | 'CLOSED';

export interface MessageItem {
  id: string;
  direction: 'INBOUND' | 'OUTBOUND';
  content: string | null;
  senderName: string | null;
  createdAt: string;
  isRead: boolean;
}

export interface NoteItem {
  id: string;
  content: string;
  createdAt: string;
  createdBy: {
    id: string;
    name: string | null;
    email: string | null;
  };
}

export interface ConversationItem {
  id: string;
  contactName: string | null;
  platform: string;
  status: ConversationStatus;
  lastMessageAt: string | null;
  slaDeadline: string | null;
  isSpam: boolean;
  messages: MessageItem[];
  notes?: NoteItem[];
  assignedTo?: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
  _count?: {
    messages: number;
    notes: number;
  };
}

export interface SuggestedReply {
  id: string;
  tone: 'friendly' | 'professional' | 'closing';
  text: string;
  description: string;
}

export interface ConversationSummary {
  needsSummary: string;
  agreements: string;
  pendingIssues: string;
  nextAction: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
  isAiGenerated: boolean;
}

export interface LeadDetectionData {
  isLead: boolean;
  confidence: number;
  detectedPhone?: string | null;
  detectedEmail?: string | null;
  buyingIntent: string;
  suggestedDealName: string;
  suggestedDealValue?: number;
  reason: string;
}

export default function Inbox() {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeConv, setActiveConv] = useState<ConversationItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [seeding, setSeeding] = useState(false);

  // Filters & Search
  const [tabFilter, setTabFilter] = useState<'ALL' | 'NEW' | 'PENDING' | 'RESOLVED' | 'SLA_BREACHED' | 'SPAM'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({ unread: 0, newCount: 0, spam: 0, breached: 0 });

  // Chat Composer state
  const [replyMode, setReplyMode] = useState<'REPLY' | 'NOTE'>('REPLY');
  const [composerText, setComposerText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  // AI states
  const [suggestedReplies, setSuggestedReplies] = useState<SuggestedReply[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [summaryData, setSummaryData] = useState<ConversationSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [leadData, setLeadData] = useState<LeadDetectionData | null>(null);
  const [convertingLead, setConvertingLead] = useState(false);

  // Team list for @mention
  const [teamMembers, setTeamMembers] = useState<Array<{ id: string; name: string }>>([
    { id: '1', name: 'Nguyễn Văn Nam' },
    { id: '2', name: 'Trần Thị Hà' },
    { id: '3', name: 'Lê Hoàng Minh' },
  ]);

  const [showRightPanel, setShowRightPanel] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch list of conversations
  const fetchConversations = async (targetActiveId?: string) => {
    setLoading(true);
    try {
      let isSpamQuery = 'false';
      let statusQuery = '';
      let slaQuery = '';

      if (tabFilter === 'SPAM') {
        isSpamQuery = 'true';
      } else if (tabFilter === 'SLA_BREACHED') {
        slaQuery = 'breached';
      } else if (tabFilter !== 'ALL') {
        statusQuery = tabFilter;
      }

      const params = new URLSearchParams();
      if (isSpamQuery) params.append('isSpam', isSpamQuery);
      if (statusQuery) params.append('status', statusQuery);
      if (slaQuery) params.append('sla', slaQuery);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await api.get(`/inbox?${params.toString()}`);
      if (res.data) {
        const list: ConversationItem[] = res.data.conversations || [];
        setConversations(list);
        setStats({
          unread: res.data.unreadCount || 0,
          newCount: res.data.newCount || 0,
          spam: res.data.spamCount || 0,
          breached: res.data.breachedCount || 0,
        });

        // Set active conversation
        const nextActiveId = targetActiveId || activeId || (list.length > 0 ? list[0].id : null);
        if (nextActiveId) {
          setActiveId(nextActiveId);
        }
      }
    } catch (err) {
      console.error('Failed to fetch conversations', err);
      toast.error('Lỗi khi tải danh sách hộp thư');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [tabFilter]);

  // Fetch full details of active conversation
  const fetchConversationDetails = async (id: string) => {
    setLoadingDetail(true);
    setSuggestedReplies([]);
    setSummaryData(null);
    setLeadData(null);

    try {
      const res = await api.get(`/inbox/${id}`);
      if (res.data?.conversation) {
        setActiveConv(res.data.conversation);

        // Auto trigger Lead Detection & AI Reply Suggestions
        triggerLeadDetect(id);
        triggerAiSuggestedReplies(id);
      }
    } catch (err) {
      console.error('Failed to load conversation details', err);
      toast.error('Không thể tải chi tiết hội thoại');
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    if (activeId) {
      fetchConversationDetails(activeId);
    } else {
      setActiveConv(null);
    }
  }, [activeId]);

  // Auto scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConv?.messages, activeConv?.notes]);

  // Seed Demo Data for Testing
  const handleSeedDemo = async () => {
    setSeeding(true);
    try {
      const res = await api.post('/inbox', { seed: true });
      if (res.data?.success) {
        toast.success(`Đã tạo ${res.data.count} cuộc hội thoại mẫu kiểm thử!`);
        await fetchConversations();
      }
    } catch {
      toast.error('Không thể tạo dữ liệu mẫu');
    } finally {
      setSeeding(false);
    }
  };

  // Change Conversation Status (F085)
  const handleStatusChange = async (newStatus: ConversationStatus) => {
    if (!activeConv) return;
    try {
      const res = await api.put(`/inbox/${activeConv.id}`, { status: newStatus });
      if (res.data?.conversation) {
        setActiveConv((prev) => (prev ? { ...prev, status: newStatus } : null));
        setConversations((prev) =>
          prev.map((c) => (c.id === activeConv.id ? { ...c, status: newStatus } : c))
        );
        toast.success(`Đã chuyển trạng thái sang "${newStatus}"`);
      }
    } catch {
      toast.error('Lỗi khi cập nhật trạng thái');
    }
  };

  // Toggle Spam / Blacklist (F091)
  const handleToggleSpam = async (isSpam: boolean) => {
    if (!activeConv) return;
    try {
      await api.put(`/inbox/${activeConv.id}`, { isSpam });
      toast.success(isSpam ? 'Đã đưa vào danh sách Spam / Blacklist' : 'Đã khôi phục khỏi Spam');
      fetchConversations();
    } catch {
      toast.error('Lỗi thao tác Spam');
    }
  };

  // Send Reply or Internal Note (F086)
  const handleSend = async () => {
    if (!activeConv || !composerText.trim()) return;

    setSendingReply(true);
    try {
      if (replyMode === 'REPLY') {
        // Send message to customer
        const res = await api.post(`/inbox/${activeConv.id}/reply`, {
          content: composerText.trim(),
        });
        if (res.data?.message) {
          setActiveConv((prev) =>
            prev
              ? {
                  ...prev,
                  status: 'OPEN',
                  messages: [...prev.messages, res.data.message],
                }
              : null
          );
          setComposerText('');
          toast.success('Đã gửi tin nhắn phản hồi!');
          // Refresh list to update snippet
          fetchConversations(activeConv.id);
        }
      } else {
        // Send internal note (F086)
        const res = await api.post(`/inbox/${activeConv.id}/note`, {
          content: composerText.trim(),
        });
        if (res.data?.note) {
          setActiveConv((prev) =>
            prev
              ? {
                  ...prev,
                  notes: [res.data.note, ...(prev.notes || [])],
                }
              : null
          );
          setComposerText('');
          toast.success('Đã lưu ghi chú nội bộ 🔒');
        }
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Lỗi gửi tin');
    } finally {
      setSendingReply(false);
    }
  };

  // AI Suggested Replies (F087)
  const triggerAiSuggestedReplies = async (id: string) => {
    setLoadingSuggestions(true);
    try {
      const res = await api.post(`/inbox/${id}/ai-suggest-reply`);
      if (res.data?.replies) {
        setSuggestedReplies(res.data.replies);
      }
    } catch (err) {
      console.warn('AI suggestions not ready:', err);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // AI Conversation Summary (F088)
  const handleGenerateSummary = async () => {
    if (!activeConv) return;
    setLoadingSummary(true);
    try {
      const res = await api.post(`/inbox/${activeConv.id}/ai-summary`);
      if (res.data?.success) {
        setSummaryData(res.data);
        toast.success('Đã tóm tắt hội thoại thành công!');
      }
    } catch {
      toast.error('Không thể tóm tắt hội thoại lúc này');
    } finally {
      setLoadingSummary(false);
    }
  };

  // Lead Detection (F089)
  const triggerLeadDetect = async (id: string) => {
    try {
      const res = await api.get(`/inbox/${id}/lead-detect`);
      if (res.data?.data) {
        setLeadData(res.data.data);
      }
    } catch (err) {
      console.warn('Lead detect check failed:', err);
    }
  };

  // 1-Click Convert Lead to CRM (F089)
  const handleConvertLead = async () => {
    if (!activeConv || !leadData) return;
    setConvertingLead(true);
    try {
      const res = await api.post(`/inbox/${activeConv.id}/convert-lead`, {
        name: activeConv.contactName || 'Khách hàng tiềm năng',
        phone: leadData.detectedPhone || null,
        email: leadData.detectedEmail || null,
        dealTitle: leadData.suggestedDealName || `Đơn hàng từ ${activeConv.contactName}`,
        dealValue: leadData.suggestedDealValue || 500000,
      });

      if (res.data?.success) {
        toast.success('🎉 Đã chuyển đổi thành công sang Khách hàng & Deal CRM!');
        triggerLeadDetect(activeConv.id);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Lỗi khi tạo Lead');
    } finally {
      setConvertingLead(false);
    }
  };

  // Helper: SLA Countdown string & color
  const getSlaDisplay = (deadline: string | null, status: ConversationStatus) => {
    if (!deadline || status === 'RESOLVED' || status === 'CLOSED') {
      return { text: 'Hoàn tất', color: 'text-gray-500 bg-gray-100 border border-gray-200' };
    }

    const diffMs = new Date(deadline).getTime() - Date.now();
    const diffMins = Math.round(diffMs / (60 * 1000));

    if (diffMins < 0) {
      return {
        text: `Quá hạn ${Math.abs(diffMins)}m`,
        color: 'text-rose-600 bg-rose-50 border border-rose-200 font-semibold animate-pulse',
      };
    }
    if (diffMins <= 5) {
      return {
        text: `Còn ${diffMins}m`,
        color: 'text-amber-700 bg-amber-50 border border-amber-200 font-semibold',
      };
    }
    return {
      text: `Còn ${diffMins}m`,
      color: 'text-emerald-700 bg-emerald-50 border border-emerald-200 font-medium',
    };
  };

  // Combine messages and notes chronologically
  const timelineItems = useMemo(() => {
    if (!activeConv) return [];

    const msgs = (activeConv.messages || []).map((m) => ({
      type: 'message' as const,
      id: m.id,
      direction: m.direction,
      content: m.content,
      senderName: m.senderName,
      createdAt: m.createdAt,
    }));

    const notes = (activeConv.notes || []).map((n) => ({
      type: 'note' as const,
      id: n.id,
      direction: 'NOTE' as const,
      content: n.content,
      senderName: n.createdBy?.name || 'Nhân viên',
      createdAt: n.createdAt,
    }));

    return [...msgs, ...notes].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [activeConv]);

  return (
    <div className="flex h-[calc(100vh-6.5rem)] rounded-2xl border border-gray-200/80 bg-white shadow-xs overflow-hidden animate-fade-in w-full">
      {/* ────────────────────────────────────────────────────────────────────────
          CỘT 1: DANH SÁCH HỘI THOẠI & BỘ LỌC SLA / STATUS
          ──────────────────────────────────────────────────────────────────────── */}
      <div className="w-72 sm:w-80 shrink-0 flex flex-col border-r border-gray-100 bg-gray-50/50">
        {/* Header */}
        <div className="p-3.5 border-b border-gray-100 bg-white space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-900 leading-tight">
                  Hộp thư hợp nhất
                </h2>
                <span className="text-[10px] text-gray-500 font-medium">M3. Inbox Omnichannel</span>
              </div>
            </div>
            <button
              onClick={handleSeedDemo}
              disabled={seeding}
              className="text-[11px] font-semibold px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200/60 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
              title="Tạo hội thoại mẫu để test"
            >
              <RefreshCw className={`w-3 h-3 ${seeding ? 'animate-spin' : ''}`} />
              <span>Nạp mẫu test</span>
            </button>
          </div>

          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchConversations()}
              placeholder="Tìm theo tên khách, nội dung..."
              className="w-full pl-8 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800 placeholder-gray-400 transition-all"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-0.5 text-[11px] font-medium">
            <button
              onClick={() => setTabFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition-colors ${
                tabFilter === 'ALL'
                  ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setTabFilter('NEW')}
              className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1 ${
                tabFilter === 'NEW'
                  ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span>Mới</span>
              {stats.newCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-blue-500 text-white text-[9px] flex items-center justify-center font-bold">
                  {stats.newCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setTabFilter('SLA_BREACHED')}
              className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1 ${
                tabFilter === 'SLA_BREACHED'
                  ? 'bg-rose-600 text-white font-semibold shadow-2xs'
                  : 'text-rose-600 hover:bg-rose-50'
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>Quá hạn SLA</span>
              {stats.breached > 0 && (
                <span className="px-1.5 rounded-full bg-rose-500 text-white text-[9px] font-bold">
                  {stats.breached}
                </span>
              )}
            </button>
            <button
              onClick={() => setTabFilter('SPAM')}
              className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1 ${
                tabFilter === 'SPAM'
                  ? 'bg-gray-700 text-white font-semibold shadow-2xs'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <ShieldAlert className="w-3 h-3" />
              <span>Rác ({stats.spam})</span>
            </button>
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
          {loading ? (
            <div className="p-8 text-center text-xs text-gray-400 flex flex-col items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
              <span>Đang tải danh sách hộp thư...</span>
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-400 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
                <MessageSquare className="w-5 h-5" />
              </div>
              <p className="font-medium text-gray-600">Chưa có hội thoại nào trong mục này</p>
              <button
                onClick={handleSeedDemo}
                className="px-3.5 py-1.5 rounded-xl bg-blue-50 text-blue-600 font-semibold hover:bg-blue-100 text-xs border border-blue-100 transition-colors shadow-2xs cursor-pointer"
              >
                + Bấm nạp 5 tin nhắn mẫu
              </button>
            </div>
          ) : (
            conversations.map((c) => {
              const isActive = c.id === activeId;
              const lastMsg = c.messages?.[0]?.content || 'Chưa có tin nhắn';
              const sla = getSlaDisplay(c.slaDeadline, c.status);

              return (
                <div
                  key={c.id}
                  onClick={() => setActiveId(c.id)}
                  className={`p-3.5 transition-colors cursor-pointer relative ${
                    isActive
                      ? 'bg-white border-l-4 border-blue-600 shadow-2xs'
                      : 'hover:bg-white/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs uppercase shadow-xs shrink-0">
                        {c.contactName?.charAt(0) || 'K'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-semibold text-gray-900 truncate">
                            {c.contactName || 'Khách vãng lai'}
                          </h4>
                          <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-600 uppercase font-mono">
                            {c.platform.replace('_POST', '').replace('_VIDEO', '')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* SLA countdown badge */}
                    <div className="shrink-0 flex items-center gap-1">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${sla.color}`}>
                        {sla.text}
                      </span>
                    </div>
                  </div>

                  {/* Snippet */}
                  <p className="text-[11px] text-gray-500 line-clamp-1 pl-10">
                    {lastMsg}
                  </p>

                  {/* Status & note flags */}
                  <div className="flex items-center justify-between pl-10 pt-1.5 text-[10px]">
                    <span
                      className={`font-medium px-2 py-0.5 rounded-full ${
                        c.status === 'NEW'
                          ? 'bg-blue-50 text-blue-700 border border-blue-100'
                          : c.status === 'OPEN'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : c.status === 'PENDING'
                          ? 'bg-amber-50 text-amber-700 border border-amber-100'
                          : 'bg-gray-100 text-gray-600 border border-gray-200'
                      }`}
                    >
                      {c.status}
                    </span>

                    {c.isSpam && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-700 font-bold border border-rose-200">
                        SPAM
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────
          CỘT 2: KHUNG CHAT & GHI CHÚ NỘI BỘ (F086) & GỢI Ý TRẢ LỜI (F087)
          ──────────────────────────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col bg-white border-r border-gray-100">
        {activeConv ? (
          <>
            {/* Chat Header */}
            <div className="p-3.5 border-b border-gray-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                  {activeConv.contactName?.charAt(0) || 'K'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-gray-900">
                      {activeConv.contactName}
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-semibold border border-blue-100">
                      {activeConv.platform}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 font-medium">
                    SLA Phản hồi: {getSlaDisplay(activeConv.slaDeadline, activeConv.status).text}
                  </p>
                </div>
              </div>

              {/* Status Selector (F085), Spam Action (F091) & Side Panel Toggle */}
              <div className="flex items-center gap-1.5 shrink-0">
                <select
                  value={activeConv.status}
                  onChange={(e) => handleStatusChange(e.target.value as ConversationStatus)}
                  className="text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-gray-200 bg-white text-gray-700 cursor-pointer focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="NEW">Mới (NEW)</option>
                  <option value="OPEN">Đang xử lý (OPEN)</option>
                  <option value="PENDING">Chờ khách (PENDING)</option>
                  <option value="RESOLVED">Đã giải quyết (RESOLVED)</option>
                  <option value="CLOSED">Đóng (CLOSED)</option>
                </select>

                <button
                  type="button"
                  onClick={() => handleToggleSpam(!activeConv.isSpam)}
                  className={`text-xs px-2.5 py-1.5 rounded-xl border flex items-center gap-1 transition-colors cursor-pointer ${
                    activeConv.isSpam
                      ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100 font-semibold'
                      : 'border-gray-200 text-gray-500 hover:text-rose-600 hover:border-rose-300'
                  }`}
                  title={activeConv.isSpam ? 'Bỏ đánh dấu Spam' : 'Chuyển vào Spam / Blacklist'}
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{activeConv.isSpam ? 'Bỏ Spam' : 'Spam'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowRightPanel((prev) => !prev)}
                  className={`text-xs px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 transition-colors cursor-pointer ${
                    showRightPanel
                      ? 'bg-blue-50 text-blue-700 border-blue-200 font-medium'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                  title={showRightPanel ? 'Thu gọn panel Hồ sơ & AI' : 'Mở rộng panel Hồ sơ & AI'}
                >
                  <PanelRight className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Hồ sơ & AI</span>
                </button>
              </div>
            </div>

            {/* Messages & Notes Timeline */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/40">
              {timelineItems.map((item) => {
                if (item.type === 'note') {
                  // Internal Note (F086) - Distinct Warm Amber / Yellow Card
                  return (
                    <div
                      key={`note-${item.id}`}
                      className="mx-auto max-w-lg p-3 rounded-2xl bg-amber-50 border border-amber-200 shadow-xs"
                    >
                      <div className="flex items-center justify-between text-[11px] font-semibold text-amber-800 mb-1">
                        <div className="flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-amber-600" />
                          <span>Ghi chú nội bộ 🔒 • {item.senderName}</span>
                        </div>
                        <span className="text-[10px] text-amber-600/80 font-normal">
                          {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-amber-950 leading-relaxed font-sans whitespace-pre-wrap">
                        {item.content}
                      </p>
                    </div>
                  );
                }

                // Regular Chat Message (Inbound / Outbound)
                const isInbound = item.direction === 'INBOUND';
                return (
                  <div
                    key={`msg-${item.id}`}
                    className={`flex flex-col ${isInbound ? 'items-start' : 'items-end'}`}
                  >
                    <div className="flex items-center gap-1 text-[10px] text-gray-400 mb-1 px-1">
                      <span>{isInbound ? item.senderName || 'Khách' : 'Bạn (Topify)'}</span>
                      <span>•</span>
                      <span>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    <div
                      className={`max-w-md px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-xs ${
                        isInbound
                          ? 'bg-white text-gray-800 border border-gray-200/80 rounded-tl-xs'
                          : 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-tr-xs'
                      }`}
                    >
                      {item.content}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* AI Suggested Replies Bar (F087) */}
            {suggestedReplies.length > 0 && replyMode === 'REPLY' && (
              <div className="px-4 py-2 bg-blue-50/60 border-t border-blue-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-1 text-[11px] font-bold text-blue-700 shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                  <span>Gợi ý trả lời:</span>
                </div>

                <div className="flex items-center gap-2">
                  {suggestedReplies.map((reply) => (
                    <button
                      key={reply.id}
                      type="button"
                      onClick={() => setComposerText(reply.text)}
                      className="px-2.5 py-1 text-[11px] rounded-xl bg-white border border-blue-200 text-gray-700 hover:bg-blue-600 hover:text-white transition-all text-left truncate max-w-xs cursor-pointer shadow-2xs"
                      title={reply.text}
                    >
                      <span className="font-semibold text-blue-600 mr-1">[{reply.description}]:</span>
                      <span>{reply.text}</span>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => triggerAiSuggestedReplies(activeConv.id)}
                  disabled={loadingSuggestions}
                  className="p-1 rounded-lg text-gray-400 hover:text-blue-600 transition-colors shrink-0"
                  title="Sinh lại gợi ý khác"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingSuggestions ? 'animate-spin' : ''}`} />
                </button>
              </div>
            )}

            {/* Composer Area with Mode Switching */}
            <div className="p-3 border-t border-gray-100 bg-white">
              {/* Tab Selector: Reply Customer vs Internal Note */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setReplyMode('REPLY')}
                    className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                      replyMode === 'REPLY'
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    💬 Phản hồi khách hàng
                  </button>
                  <button
                    type="button"
                    onClick={() => setReplyMode('NOTE')}
                    className={`px-3 py-1 rounded-lg font-medium transition-colors flex items-center gap-1 ${
                      replyMode === 'NOTE'
                        ? 'bg-amber-500 text-white font-semibold'
                        : 'text-amber-700 hover:bg-amber-50'
                    }`}
                  >
                    <Lock className="w-3 h-3" />
                    <span>Ghi chú nội bộ 🔒 (F086)</span>
                  </button>
                </div>

                {replyMode === 'NOTE' && (
                  <span className="text-[10px] text-amber-700 italic font-medium">
                    Chỉ nhân viên nhìn thấy, không gửi ra ngoài
                  </span>
                )}
              </div>

              {/* Text Input */}
              <div className="relative">
                <textarea
                  value={composerText}
                  onChange={(e) => setComposerText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  rows={2}
                  placeholder={
                    replyMode === 'REPLY'
                      ? 'Nhập tin nhắn phản hồi (Enter để gửi, Shift+Enter xuống dòng)...'
                      : 'Nhập ghi chú bí mật cho ca làm việc (gõ @ để tag đồng nghiệp)...'
                  }
                  className={`w-full p-2.5 text-xs rounded-xl resize-none transition-all ${
                    replyMode === 'REPLY'
                      ? 'bg-gray-50 border border-gray-200 focus:bg-white focus:border-blue-500 text-gray-800'
                      : 'bg-amber-50/50 border border-amber-300 focus:bg-amber-50/80 focus:border-amber-500 text-amber-950'
                  }`}
                />

                <div className="flex items-center justify-between pt-1">
                  {replyMode === 'NOTE' ? (
                    <div className="flex items-center gap-1 text-[11px] text-gray-400">
                      <span>Gợi ý tag:</span>
                      {teamMembers.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setComposerText((prev) => `${prev} @${m.name} `)}
                          className="px-1.5 py-0.5 rounded-md bg-amber-100/70 hover:bg-amber-200 text-amber-800 text-[10px] font-medium"
                        >
                          @{m.name}
                        </button>
                      ))}
                    </div>
                  ) : <div />}

                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={sendingReply || !composerText.trim()}
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold text-white shadow-xs transition-all active:scale-95 cursor-pointer ${
                      replyMode === 'REPLY'
                        ? 'bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400'
                        : 'bg-amber-500 hover:bg-amber-600 disabled:bg-gray-200 disabled:text-gray-400'
                    }`}
                  >
                    {sendingReply ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>{replyMode === 'REPLY' ? 'Gửi tin nhắn' : 'Lưu ghi chú 🔒'}</span>
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center bg-gray-50/30">
            <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-500 flex items-center justify-center mb-4 border border-blue-100">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-gray-800">
              Chọn một cuộc hội thoại từ danh sách
            </h3>
            <p className="text-xs text-gray-500 max-w-sm mt-1 leading-relaxed">
              Quản lý phản hồi khách hàng đa kênh với hỗ trợ SLA, Ghi chú nội bộ và trợ lý AI thông minh.
            </p>
          </div>
        )}
      </div>

      {/* ────────────────────────────────────────────────────────────────────────
          CỘT 3: HỒ SƠ KHÁCH, AI SUMMARY (F088) & LEAD DETECTION (F089)
          ──────────────────────────────────────────────────────────────────────── */}
      {activeConv && showRightPanel && (
        <div className="w-72 sm:w-80 shrink-0 flex flex-col border-l border-gray-100 bg-gray-50/40 overflow-y-auto p-4 space-y-4">
          {/* Customer Profile Card */}
          <div className="p-4 rounded-2xl bg-white border border-gray-200/80 shadow-xs space-y-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                {activeConv.contactName?.charAt(0) || 'K'}
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-900">
                  {activeConv.contactName}
                </h4>
                <p className="text-[11px] text-gray-500">Kênh: {activeConv.platform}</p>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100 grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-gray-400 block">Trạng thái:</span>
                <span className="font-semibold text-gray-800">{activeConv.status}</span>
              </div>
              <div>
                <span className="text-gray-400 block">SLA Hạn chót:</span>
                <span className="font-semibold text-gray-800">
                  {getSlaDisplay(activeConv.slaDeadline, activeConv.status).text}
                </span>
              </div>
            </div>
          </div>

          {/* 🎯 Lead Detection Card (F089) */}
          {leadData && leadData.isLead && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                  <Zap className="w-4 h-4 text-emerald-600" />
                  <span>Phát hiện Lead tiềm năng (F089)</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-600 text-white font-bold">
                  {leadData.confidence}% Tin cậy
                </span>
              </div>

              <div className="space-y-1 text-xs text-gray-700">
                {leadData.detectedPhone && (
                  <div className="flex items-center gap-1.5 font-semibold text-emerald-700">
                    <Phone className="w-3.5 h-3.5" />
                    <span>SĐT: {leadData.detectedPhone}</span>
                  </div>
                )}
                <p className="text-[11px] text-gray-600 italic">"{leadData.buyingIntent}"</p>
              </div>

              <button
                type="button"
                onClick={handleConvertLead}
                disabled={convertingLead}
                className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                {convertingLead ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <UserCheck className="w-3.5 h-3.5" />
                )}
                <span>1-Click Tạo Lead vào CRM</span>
              </button>
            </div>
          )}

          {/* ⚡ AI Conversation Summary (F088) */}
          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/70 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>Tóm tắt AI & Next Action (F088)</span>
              </div>
              <button
                onClick={handleGenerateSummary}
                disabled={loadingSummary}
                className="text-[10px] text-blue-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${loadingSummary ? 'animate-spin' : ''}`} />
                <span>{summaryData ? 'Làm mới' : 'Tóm tắt'}</span>
              </button>
            </div>

            {loadingSummary ? (
              <div className="py-4 text-center text-xs text-blue-600 flex items-center justify-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Đang phân tích hội thoại qua Topify AI...</span>
              </div>
            ) : summaryData ? (
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-blue-900 block">
                    📌 Nhu cầu chính:
                  </span>
                  <p className="text-gray-700 text-[11px] mt-0.5">
                    {summaryData.needsSummary}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-emerald-800 block">
                    🤝 Đã thỏa thuận:
                  </span>
                  <p className="text-gray-700 text-[11px] mt-0.5">
                    {summaryData.agreements}
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-blue-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-indigo-700 block flex items-center gap-1">
                    <ArrowRight className="w-3 h-3" />
                    <span>Hành động tiếp theo (Next Action):</span>
                  </span>
                  <p className="text-gray-800 text-[11px] font-medium mt-0.5">
                    {summaryData.nextAction}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-2">
                <p className="text-[11px] text-gray-500 mb-2">
                  Tự động trích xuất nhu cầu, thỏa thuận & việc cần làm tiếp theo.
                </p>
                <button
                  onClick={handleGenerateSummary}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  Bấm tóm tắt ngay
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
