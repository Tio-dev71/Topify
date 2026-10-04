import { useState, useEffect } from 'react';
import { 
  Play, 
  Plus, 
  Link as LinkIcon, 
  ThumbsUp, 
  MessageCircle, 
  Share2, 
  StopCircle, 
  Eye, 
  Edit2, 
  Trash2, 
  Calendar, 
  Bot, 
  ExternalLink, 
  X, 
  RefreshCw
} from 'lucide-react';
import api from '../lib/axios';
import { toast } from 'sonner';

interface BuffOrder {
  id: string;
  url: string;
  actionType: string;
  targetCount: number;
  currentCount: number;
  status: string;
  config: any;
  createdAt: string;
}

export default function BuffSystem() {
  const [orders, setOrders] = useState<BuffOrder[]>([]);
  const [showModal, setShowModal] = useState(false);
  
  const [url, setUrl] = useState('');
  const [actionType, setActionType] = useState('LIKE');
  const [targetCount, setTargetCount] = useState(50);
  const [commentsStr, setCommentsStr] = useState('');
  const [useAiComment, setUseAiComment] = useState(false);
  const [globalSettings, setGlobalSettings] = useState<any>({});
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(new Set());

  // View & Edit States
  const [viewingOrder, setViewingOrder] = useState<BuffOrder | null>(null);
  const [editingOrder, setEditingOrder] = useState<BuffOrder | null>(null);
  const [editFormData, setEditFormData] = useState({
    url: '',
    actionType: 'LIKE',
    targetCount: 50,
    status: 'PENDING',
    commentsStr: '',
    useAiComment: false,
  });
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchOrders();
    fetchAccounts();
    fetchSettings();
    const interval = setInterval(fetchOrders, 5000); // Poll for progress
    return () => clearInterval(interval);
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      if (res.data?.settings) setGlobalSettings(res.data.settings);
    } catch (e) {
      console.error('Error fetching settings', e);
    }
  };

  const fetchAccounts = async () => {
    try {
      const res = await api.get('/facebook-accounts');
      if (Array.isArray(res.data)) setAccounts(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await api.get('/buff-orders');
      if (Array.isArray(res.data)) {
        setOrders(res.data);
      } else if (res.data && Array.isArray(res.data.orders)) {
        setOrders(res.data.orders);
      } else if (res.data && Array.isArray(res.data.data)) {
        setOrders(res.data.data);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error('Error fetching buff orders', error);
    }
  };

  const handleCreateOrder = async () => {
    if (!url.trim()) {
      toast.error('Vui lòng nhập Link bài viết / Target URL.');
      return;
    }
    if (targetCount <= 0) {
      toast.error('Số lượng mục tiêu phải lớn hơn 0.');
      return;
    }
    if (actionType === 'COMMENT' && !useAiComment && !commentsStr.trim()) {
      toast.error('Vui lòng nhập nội dung bình luận.');
      return;
    }

    const config = {
      useAiComment,
      comments: commentsStr ? commentsStr.split('\n').filter(c => c.trim()) : undefined,
      selectedAccountIds: selectedAccounts.size > 0 ? Array.from(selectedAccounts) : undefined
    };

    try {
      await api.post('/buff-orders', {
        url: url.trim(),
        actionType,
        targetCount,
        config
      });
      toast.success('Tạo đơn Buff thành công!');
      
      setShowModal(false);
      setUrl('');
      setCommentsStr('');
      setUseAiComment(false);
      setTargetCount(50);
      setSelectedAccounts(new Set());
      fetchOrders();
    } catch (e) {
      console.error(e);
      toast.error('Tạo đơn Buff thất bại');
    }
  };

  const handleOpenEdit = (order: BuffOrder) => {
    setEditingOrder(order);
    setEditFormData({
      url: order.url || '',
      actionType: order.actionType || 'LIKE',
      targetCount: order.targetCount || 50,
      status: order.status || 'PENDING',
      commentsStr: order.config?.comments ? order.config.comments.join('\n') : '',
      useAiComment: Boolean(order.config?.useAiComment),
    });
  };

  const handleUpdateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;
    if (!editFormData.url.trim()) {
      toast.error('Vui lòng nhập Link bài viết / Target URL.');
      return;
    }
    if (editFormData.targetCount <= 0) {
      toast.error('Số lượng mục tiêu phải lớn hơn 0.');
      return;
    }

    setUpdating(true);
    try {
      const config = {
        ...editingOrder.config,
        useAiComment: editFormData.useAiComment,
        comments: editFormData.commentsStr ? editFormData.commentsStr.split('\n').filter(c => c.trim()) : undefined,
      };

      await api.patch(`/buff-orders/${editingOrder.id}`, {
        url: editFormData.url.trim(),
        actionType: editFormData.actionType,
        targetCount: Number(editFormData.targetCount),
        status: editFormData.status,
        config
      });

      toast.success('Cập nhật đơn Buff thành công!');
      setEditingOrder(null);
      fetchOrders();
    } catch (e: any) {
      console.error(e);
      toast.error(e.response?.data?.error || 'Lỗi khi cập nhật đơn Buff');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/buff-orders/${id}`, { status });
      fetchOrders();
      if (status === 'PENDING') {
        toast.success(`Đã dừng đơn`);
        // @ts-ignore
        if (window.electron && window.electron.stopAutomationTask) {
          // @ts-ignore
          window.electron.stopAutomationTask({ taskId: id, profileIds: [] });
        }
      }
    } catch (e) {
      toast.error('Lỗi khi cập nhật trạng thái');
    }
  };

  const handleStartOrder = async (order: BuffOrder) => {
    if (order.status === 'RUNNING') {
      toast.error('Đơn đang chạy rồi!');
      return;
    }

    const remaining = order.targetCount - order.currentCount;
    if (remaining <= 0) {
      toast.success('Đơn đã hoàn thành!');
      return;
    }

    let candidateAccounts = accounts;
    if (order.config?.selectedAccountIds && Array.isArray(order.config.selectedAccountIds) && order.config.selectedAccountIds.length > 0) {
      const selectedSet = new Set(order.config.selectedAccountIds);
      const matched = accounts.filter(a => selectedSet.has(a.id) || selectedSet.has(a.profileId));
      if (matched.length > 0) candidateAccounts = matched;
    } else {
      const liveAccounts = accounts.filter(a => a.status === 'LIVE' || a.status === 'ACTIVE');
      candidateAccounts = liveAccounts.length > 0 ? liveAccounts : accounts.filter(a => a.status !== 'DEAD');
    }
    
    if (candidateAccounts.length === 0) {
      toast.error('Không có tài khoản khả dụng nào để chạy buff.');
      return;
    }

    const accountsToUse = candidateAccounts.slice(0, remaining);
    const realProfileIds = accountsToUse.map(a => a.profileId || a.id);

    try {
      await api.patch(`/buff-orders/${order.id}`, { status: 'RUNNING' });
      fetchOrders();
      toast.success(`Đã bắt đầu đơn Buff với ${accountsToUse.length} tài khoản`);

      // @ts-ignore
      if (window.electron && window.electron.startAutomationTask) {
        // @ts-ignore
        const result = await window.electron.startAutomationTask({
          taskId: order.id,
          actionType: 'fb_buff_post',
          profileIds: realProfileIds,
          accounts: accountsToUse,
          config: {
            targetUrl: order.url,
            buffActionType: order.actionType,
            actionCount: 1, // Only interact once per account for buffing
            useAiComment: order.config?.useAiComment,
            comments: order.config?.comments,
            aiSettings: globalSettings
          }
        });
        
        let successCount = 0;
        if (result.success && result.results) {
           successCount = result.results.filter((r: any) => r.success).length;
        }

        const newCount = order.currentCount + successCount;
        const newStatus = newCount >= order.targetCount ? 'COMPLETED' : 'PENDING';

        await api.patch(`/buff-orders/${order.id}`, { 
          currentCount: newCount,
          status: newStatus
        });
        fetchOrders();
        
        if (newStatus === 'COMPLETED') {
          toast.success(`Đơn Buff #${order.id.slice(-6)} đã hoàn tất!`);
        } else {
          toast.info(`Đã hoàn thành ${successCount} lượt buff`);
        }
      } else {
        toast.error('Chức năng cần chạy trên ứng dụng Topify Desktop');
      }
    } catch (e) {
      console.error(e);
      toast.error('Lỗi khi kích hoạt đơn Buff');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xoá đơn này?')) return;
    try {
      await api.delete(`/buff-orders/${id}`);
      toast.success('Đã xoá đơn Buff');
      fetchOrders();
    } catch (e) {
      toast.error('Lỗi khi xoá đơn');
    }
  };

  const formatActionType = (type: string) => {
    switch (type) {
      case 'LIKE':
        return (
          <span className="flex items-center gap-1.5 text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md text-xs font-semibold">
            <ThumbsUp className="w-3.5 h-3.5" /> Like / Cảm xúc
          </span>
        );
      case 'COMMENT':
        return (
          <span className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md text-xs font-semibold">
            <MessageCircle className="w-3.5 h-3.5" /> Bình luận
          </span>
        );
      case 'SHARE':
        return (
          <span className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md text-xs font-semibold">
            <Share2 className="w-3.5 h-3.5" /> Chia sẻ
          </span>
        );
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ThumbsUp className="w-6 h-6 text-purple-600" />
            Hệ Thống Buff Tương Tác
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Điều phối dàn nick seeding Like, Comment, Share tự động cho bài viết Facebook
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={fetchOrders}
            className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
            title="Làm mới"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors shadow-sm font-medium"
          >
            <Plus className="w-4 h-4" /> Tạo Đơn Buff
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-900">
            <thead className="bg-gray-50/50 text-gray-500 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-medium">Mục Tiêu (URL)</th>
                <th className="px-6 py-4 font-medium">Hành Động</th>
                <th className="px-6 py-4 font-medium">Tiến Độ</th>
                <th className="px-6 py-4 font-medium">Trạng Thái</th>
                <th className="px-6 py-4 font-medium text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    Chưa có đơn buff nào. Bấm &quot;Tạo Đơn Buff&quot; để bắt đầu.
                  </td>
                </tr>
              ) : (
                orders.map(order => {
                  const percent = order.targetCount > 0 
                    ? Math.min(100, Math.round((order.currentCount / order.targetCount) * 100))
                    : 0;

                  return (
                    <tr key={order.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 max-w-xs">
                          <LinkIcon className="w-4 h-4 text-gray-400 shrink-0" />
                          <a href={order.url} target="_blank" rel="noreferrer" className="truncate text-blue-600 hover:underline">
                            {order.url}
                          </a>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium">
                        {formatActionType(order.actionType)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden w-24">
                            <div 
                              className={`h-full rounded-full ${percent >= 100 ? 'bg-emerald-500' : 'bg-purple-500'}`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-gray-600 w-12">
                            {order.currentCount}/{order.targetCount}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          order.status === 'RUNNING' ? 'bg-blue-50 text-blue-600' :
                          order.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' :
                          order.status === 'FAILED' ? 'bg-red-50 text-red-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {order.status || 'PENDING'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {order.status === 'PENDING' && (
                            <button 
                              onClick={() => handleStartOrder(order)}
                              className="px-2.5 py-1 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors flex items-center gap-1 border border-purple-200"
                              title="Bắt đầu chạy"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" /> Chạy
                            </button>
                          )}
                          {order.status === 'RUNNING' && (
                            <button 
                              onClick={() => handleUpdateStatus(order.id, 'PENDING')}
                              className="px-2.5 py-1 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors flex items-center gap-1 border border-amber-200"
                              title="Tạm dừng"
                            >
                              <StopCircle className="w-3.5 h-3.5" /> Dừng
                            </button>
                          )}
                          <button 
                            onClick={() => setViewingOrder(order)}
                            className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Xem chi tiết đơn Buff"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleOpenEdit(order)}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Chỉnh sửa đơn Buff"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(order.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Tạo Đơn Buff Mới</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">✕</button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Link bài viết / Video</label>
                <input
                  type="text"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="https://www.facebook.com/..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Loại Dịch Vụ</label>
                <select
                  value={actionType}
                  onChange={e => setActionType(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                >
                  <option value="LIKE">Tăng Like (Cảm xúc)</option>
                  <option value="COMMENT">Tăng Comment (Bình luận)</option>
                  <option value="SHARE">Tăng Share (Chia sẻ)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Số lượng cần tăng</label>
                <input
                  type="number"
                  value={targetCount}
                  onChange={e => setTargetCount(parseInt(e.target.value) || 0)}
                  min={1}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {actionType === 'COMMENT' && (
                <div className="space-y-3 p-4 bg-purple-50/50 border border-purple-100 rounded-xl">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-purple-900 flex items-center gap-1.5">
                      <Bot className="w-4 h-4 text-purple-600" />
                      Dùng AI Viết Bình Luận Tự Động
                    </label>
                    <input
                      type="checkbox"
                      checked={useAiComment}
                      onChange={e => setUseAiComment(e.target.checked)}
                      className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                    />
                  </div>
                  
                  {!useAiComment ? (
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Danh sách bình luận mẫu (Mỗi dòng 1 comment)
                      </label>
                      <textarea
                        value={commentsStr}
                        onChange={e => setCommentsStr(e.target.value)}
                        placeholder="Sản phẩm rất tuyệt vời!&#10;Inbox tư vấn giúp mình nhé!&#10;Shop uy tín quá!"
                        rows={4}
                        className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  ) : (
                    <p className="text-xs text-purple-600">
                      Topify AI sẽ tự động phân tích bài viết và tạo nội dung bình luận khen ngợi tự nhiên theo ngữ cảnh.
                    </p>
                  )}
                </div>
              )}

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-gray-700">Chỉ định Nick chạy (Tùy chọn)</label>
                  <span className="text-xs text-gray-500">Đã chọn: {selectedAccounts.size}</span>
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-2 max-h-36 overflow-y-auto space-y-1">
                  {accounts.length === 0 ? (
                    <div className="p-3 text-xs text-gray-500 text-center">Chưa có tài khoản Facebook nào.</div>
                  ) : (
                    accounts.map(acc => (
                      <label key={acc.id} className="flex items-center gap-3 p-2 hover:bg-white rounded-lg cursor-pointer transition-colors border border-transparent hover:border-gray-200">
                        <input
                          type="checkbox"
                          checked={selectedAccounts.has(acc.id)}
                          onChange={() => {
                            const next = new Set(selectedAccounts);
                            if (next.has(acc.id)) next.delete(acc.id);
                            else next.add(acc.id);
                            setSelectedAccounts(next);
                          }}
                          className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                        />
                        <span className="text-xs font-medium text-gray-700 truncate">{acc.name || acc.uid || acc.id}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ml-auto ${acc.status === 'LIVE' || acc.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                          {acc.status || 'LIVE'}
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleCreateOrder}
                className="px-5 py-2.5 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-colors shadow-sm"
              >
                Tạo Đơn Ngay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Detail Modal */}
      {viewingOrder && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
                  <ThumbsUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Chi Tiết Đơn Buff</h3>
                  <p className="text-xs text-gray-500">Mã đơn: #{viewingOrder.id.slice(-8)}</p>
                </div>
              </div>
              <button onClick={() => setViewingOrder(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <span className="text-xs text-gray-500 block mb-1">Loại dịch vụ</span>
                  <div className="pt-0.5">{formatActionType(viewingOrder.actionType)}</div>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <span className="text-xs text-gray-500 block mb-1">Trạng thái</span>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full inline-block ${
                    viewingOrder.status === 'RUNNING' ? 'bg-blue-50 text-blue-600' :
                    viewingOrder.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' :
                    viewingOrder.status === 'FAILED' ? 'bg-red-50 text-red-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {viewingOrder.status || 'PENDING'}
                  </span>
                </div>
              </div>

              {/* Progress */}
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Tiến độ thực hiện</span>
                  <span className="text-xs font-bold text-purple-600">
                    {viewingOrder.targetCount > 0 ? Math.round((viewingOrder.currentCount / viewingOrder.targetCount) * 100) : 0}%
                  </span>
                </div>
                <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-purple-600 transition-all duration-300"
                    style={{ width: `${viewingOrder.targetCount > 0 ? Math.min(100, Math.round((viewingOrder.currentCount / viewingOrder.targetCount) * 100)) : 0}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                  <span>Đã buff: <strong className="text-gray-900">{viewingOrder.currentCount}</strong></span>
                  <span>Mục tiêu: <strong className="text-gray-900">{viewingOrder.targetCount}</strong></span>
                </div>
              </div>

              {/* URL */}
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
                <span className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-purple-600" />
                  Đường dẫn bài viết / Video
                </span>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-gray-800 break-all select-all">
                    {viewingOrder.url}
                  </span>
                  <a
                    href={viewingOrder.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 rounded text-purple-600 hover:bg-purple-100 transition-colors shrink-0"
                    title="Mở liên kết"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Comments list if COMMENT */}
              {viewingOrder.actionType === 'COMMENT' && (
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-600 flex items-center gap-1.5">
                      <MessageCircle className="w-3.5 h-3.5 text-amber-600" />
                      Nội dung bình luận
                    </span>
                    <span className="text-xs font-semibold text-purple-600">
                      {viewingOrder.config?.useAiComment ? 'Bình luận AI tự động' : 'Bình luận mẫu'}
                    </span>
                  </div>
                  {viewingOrder.config?.comments && viewingOrder.config.comments.length > 0 && (
                    <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
                      {viewingOrder.config.comments.map((c: string, idx: number) => (
                        <div key={idx} className="p-2 bg-white rounded-lg border border-gray-200 text-xs text-gray-700">
                          {c}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Created date */}
              {viewingOrder.createdAt && (
                <div className="flex items-center gap-1.5 text-xs text-gray-400 px-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Ngày khởi tạo: {new Date(viewingOrder.createdAt).toLocaleString('vi-VN')}</span>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
              <button
                type="button"
                onClick={() => {
                  const o = viewingOrder;
                  setViewingOrder(null);
                  handleOpenEdit(o);
                }}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-1.5"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Chỉnh sửa đơn
              </button>
              <button
                type="button"
                onClick={() => setViewingOrder(null)}
                className="px-5 py-2 text-sm font-medium text-white bg-purple-600 rounded-xl hover:bg-purple-700 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingOrder && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Chỉnh Sửa Đơn Buff</h3>
                  <p className="text-xs text-gray-500">Mã đơn: #{editingOrder.id.slice(-8)}</p>
                </div>
              </div>
              <button onClick={() => setEditingOrder(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateOrder}>
              <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Link bài viết / Video *</label>
                  <input
                    type="text"
                    value={editFormData.url}
                    onChange={(e) => setEditFormData({ ...editFormData, url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Số lượng mục tiêu *</label>
                    <input
                      type="number"
                      value={editFormData.targetCount}
                      onChange={(e) => setEditFormData({ ...editFormData, targetCount: parseInt(e.target.value) || 0 })}
                      min={1}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Trạng thái</label>
                    <select
                      value={editFormData.status}
                      onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                    >
                      <option value="PENDING">Chờ chạy (PENDING)</option>
                      <option value="RUNNING">Đang chạy (RUNNING)</option>
                      <option value="COMPLETED">Hoàn tất (COMPLETED)</option>
                      <option value="FAILED">Thất bại (FAILED)</option>
                    </select>
                  </div>
                </div>

                {editingOrder.actionType === 'COMMENT' && (
                  <div className="space-y-3 p-3.5 bg-purple-50/50 border border-purple-100 rounded-xl">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-purple-900 flex items-center gap-1.5">
                        <Bot className="w-3.5 h-3.5 text-purple-600" />
                        Dùng AI Viết Bình Luận Tự Động
                      </label>
                      <input
                        type="checkbox"
                        checked={editFormData.useAiComment}
                        onChange={(e) => setEditFormData({ ...editFormData, useAiComment: e.target.checked })}
                        className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                      />
                    </div>

                    {!editFormData.useAiComment && (
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Danh sách bình luận mẫu (Mỗi dòng 1 comment)
                        </label>
                        <textarea
                          value={editFormData.commentsStr}
                          onChange={(e) => setEditFormData({ ...editFormData, commentsStr: e.target.value })}
                          rows={3}
                          className="w-full p-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
                <button
                  type="button"
                  onClick={() => setEditingOrder(null)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl text-[14px] font-medium transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-5 py-2 text-white bg-purple-600 hover:bg-purple-700 rounded-xl text-[14px] font-medium transition-colors flex items-center gap-2"
                >
                  {updating && <RefreshCw className="w-4 h-4 animate-spin" />}
                  {updating ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
