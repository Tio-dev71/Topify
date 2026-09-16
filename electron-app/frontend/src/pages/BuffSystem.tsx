import { useState, useEffect } from 'react';
import { Play, Plus, Link as LinkIcon, ThumbsUp, MessageCircle, Share2, StopCircle } from 'lucide-react';
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
      comments: commentsStr ? commentsStr.split('\n').filter(c => c.trim()) : undefined
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
      fetchOrders();
    } catch (e) {
      console.error(e);
      toast.error('Tạo đơn Buff thất bại');
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/buff-orders/${id}`, { status });
      fetchOrders();
      if (status === 'PENDING') {
        toast.success(`Đã dừng đơn`);
        // Optionally notify electron to stop tasks here
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

    const liveAccounts = accounts.filter(a => a.status === 'LIVE' || a.status === 'ACTIVE');
    const remaining = order.targetCount - order.currentCount;
    if (remaining <= 0) {
      toast.success('Đơn đã hoàn thành!');
      return;
    }
    
    if (liveAccounts.length === 0) {
      toast.error('Không có tài khoản LIVE nào để chạy buff.');
      return;
    }

    const accountsToUse = liveAccounts.slice(0, remaining);
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
          toast.success(`Đơn Buff ${order.url} đã hoàn thành!`);
        } else {
          toast.success(`Xong đợt buff. Thành công: ${successCount}. Trạng thái chuyển về PENDING.`);
        }
      } else {
        toast.error('Chức năng chưa hỗ trợ trên trình duyệt, vui lòng dùng app Desktop.');
        await api.patch(`/buff-orders/${order.id}`, { status: 'PENDING' });
        fetchOrders();
      }
    } catch (e) {
      console.error(e);
      toast.error('Lỗi khi chạy đơn Buff');
      await api.patch(`/buff-orders/${order.id}`, { status: 'FAILED' });
      fetchOrders();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xoá đơn này?')) return;
    try {
      await api.delete(`/buff-orders/${id}`);
      fetchOrders();
      toast.success('Đã xoá đơn Buff');
    } catch (e) {
      toast.error('Lỗi khi xoá đơn');
    }
  };

  const formatActionType = (type: string) => {
    switch (type) {
      case 'LIKE': return <span className="flex items-center gap-1 text-blue-600"><ThumbsUp className="w-4 h-4" /> Tăng Like</span>;
      case 'COMMENT': return <span className="flex items-center gap-1 text-green-600"><MessageCircle className="w-4 h-4" /> Tăng Comment</span>;
      case 'SHARE': return <span className="flex items-center gap-1 text-purple-600"><Share2 className="w-4 h-4" /> Tăng Share</span>;
      default: return type;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            Hệ Thống Buff Tương Tác
          </h1>
          <p className="text-sm text-gray-500 mt-1">Quản lý các đơn hàng tăng Like, Comment, Share tự động.</p>
        </div>
        
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Tạo Đơn Mới
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-900">
            <thead className="bg-gray-50/50 text-gray-500 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-medium">Link / URL</th>
                <th className="px-6 py-4 font-medium">Loại Dịch Vụ</th>
                <th className="px-6 py-4 font-medium">Tiến Độ</th>
                <th className="px-6 py-4 font-medium">Trạng Thái</th>
                <th className="px-6 py-4 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    Chưa có đơn Buff nào. Bấm "Tạo Đơn Mới" để bắt đầu.
                  </td>
                </tr>
              ) : (
                orders.map(order => {
                  const percent = Math.min(100, Math.round((order.currentCount / order.targetCount) * 100));
                  return (
                    <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
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
                        <div className="flex items-center justify-end gap-3">
                          {order.status === 'PENDING' && (
                            <button 
                              onClick={() => handleStartOrder(order)}
                              className="text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors flex items-center gap-1"
                            >
                              <Play className="w-4 h-4" /> Start
                            </button>
                          )}
                          {order.status === 'RUNNING' && (
                            <button 
                              onClick={() => handleUpdateStatus(order.id, 'PENDING')}
                              className="text-sm font-medium text-amber-600 hover:text-amber-700 transition-colors flex items-center gap-1"
                            >
                              <StopCircle className="w-4 h-4" /> Pause
                            </button>
                          )}
                          <button 
                            onClick={() => handleDelete(order.id)}
                            className="text-sm font-medium text-gray-400 hover:text-red-500 transition-colors"
                          >
                            Xóa
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

      {/* Modal */}
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Số lượng Buff</label>
                <input
                  type="number"
                  value={targetCount}
                  onChange={e => setTargetCount(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {actionType === 'COMMENT' && (
                <div className="space-y-4 pt-2">
                  <label className="flex items-center gap-3 cursor-pointer p-4 border border-purple-100 rounded-xl bg-purple-50 hover:border-purple-200 transition-colors">
                    <input 
                      type="checkbox" 
                      checked={useAiComment} 
                      onChange={e => setUseAiComment(e.target.checked)} 
                      className="w-5 h-5 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-purple-700">Bình luận thông minh bằng AI (Gemini)</span>
                      <span className="text-xs text-gray-500 mt-0.5">Hệ thống sẽ tự đọc bài viết và sinh bình luận ngẫu nhiên phù hợp</span>
                    </div>
                  </label>

                  {!useAiComment && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Hoặc nhập danh sách Comment (Mỗi câu 1 dòng)</label>
                      <textarea
                        value={commentsStr}
                        onChange={e => setCommentsStr(e.target.value)}
                        placeholder="Quá tuyệt vời!&#10;Đỉnh cao&#10;Cho mình xin thông tin nhé"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 h-24 resize-none"
                      />
                    </div>
                  )}
                </div>
              )}
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
    </div>
  );
}
