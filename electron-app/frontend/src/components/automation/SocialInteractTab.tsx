import { useState, useEffect } from 'react';
import { 
  Play, 
  Plus, 
  Link as LinkIcon, 
  Users, 
  MessageCircle, 
  FileText,
  Eye,
  Edit2,
  Trash2,
  Calendar,
  Bot,
  ExternalLink,
  X,
  Square
} from 'lucide-react';
import api from '../../lib/axios';
import { toast } from 'sonner';

interface AutomationTask {
  id: string;
  name: string;
  type: string;
  config: any;
  profileIds: string[];
  status: string;
  createdAt: string;
}

interface FbAccount {
  id: string;
  name: string;
  uid: string | null;
  password?: string | null;
  twoFactorCode?: string | null;
  cookie?: string | null;
  proxy?: string | null;
  status: string;
  profileId?: string;
}

export function SocialInteractTab() {
  const [tasks, setTasks] = useState<AutomationTask[]>([]);
  const [accounts, setAccounts] = useState<FbAccount[]>([]);
  const [runningTasks, setRunningTasks] = useState<Set<string>>(new Set());
  const [showModal, setShowModal] = useState(false);
  const [editTaskId, setEditTaskId] = useState<string | null>(null);
  const [viewingTask, setViewingTask] = useState<AutomationTask | null>(null);
  const [globalSettings, setGlobalSettings] = useState<any>({});

  // Form State
  const [taskName, setTaskName] = useState('');
  const [taskType, setTaskType] = useState('fb_auto_interact');
  const [targetUrl, setTargetUrl] = useState('');
  const [actionCount, setActionCount] = useState(5);
  const [commentsStr, setCommentsStr] = useState('');
  const [useAiComment, setUseAiComment] = useState(false);
  const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchTasks();
    fetchAccounts();
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      if (res.data?.settings) setGlobalSettings(res.data.settings);
    } catch (e) {
      console.error('Error fetching settings', e);
    }
  };

  const syncRunningTasks = async (taskList: AutomationTask[]) => {
    let activeIds = new Set<string>();
    // @ts-ignore
    if (window.electron && window.electron.getRunningAutomationTasks) {
      try {
        // @ts-ignore
        const res = await window.electron.getRunningAutomationTasks();
        if (res?.success && Array.isArray(res.runningTaskIds)) {
          activeIds = new Set(res.runningTaskIds);
        }
      } catch (e) {}
    }

    // Auto heal stale tasks marked RUNNING in DB that are not in activeIds
    for (const t of taskList) {
      if (t.status === 'RUNNING' && !activeIds.has(t.id)) {
        api.patch('/automation-tasks', { id: t.id, status: 'IDLE' }).catch(() => {});
        t.status = 'IDLE';
      }
    }

    setRunningTasks(activeIds);
    setTasks([...taskList]);
  };

  const fetchTasks = async () => {
    try {
      const res = await api.get('/automation-tasks');
      const data = res.data || [];
      await syncRunningTasks(data);
    } catch (error) {
      console.error('Error fetching tasks', error);
      toast.error('Không thể tải danh sách tác vụ');
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

  const toggleAccount = (id: string) => {
    const newSet = new Set(selectedAccounts);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedAccounts(newSet);
  };

  const handleCreateTask = async () => {
    if (!taskName.trim()) {
      toast.error('Vui lòng nhập tên tác vụ.');
      return;
    }
    if (selectedAccounts.size === 0) {
      toast.error('Vui lòng chọn ít nhất một tài khoản.');
      return;
    }

    const config = {
      targetUrl: targetUrl.trim() || undefined,
      actionCount: Number(actionCount) || 5,
      useAiComment,
      comments: commentsStr ? commentsStr.split('\n').filter(c => c.trim()) : undefined
    };

    try {
      if (editTaskId) {
        await api.patch('/automation-tasks', {
          id: editTaskId,
          name: taskName,
          type: taskType,
          config,
          profileIds: Array.from(selectedAccounts)
        });
        toast.success('Cập nhật tác vụ thành công');
      } else {
        await api.post('/automation-tasks', {
          name: taskName,
          type: taskType,
          config,
          profileIds: Array.from(selectedAccounts)
        });
        toast.success('Tạo tác vụ thành công');
      }

      setShowModal(false);
      setEditTaskId(null);
      setTaskName('');
      setTargetUrl('');
      setCommentsStr('');
      setUseAiComment(false);
      setSelectedAccounts(new Set());
      fetchTasks();
    } catch (e) {
      console.error(e);
      toast.error('Tạo tác vụ thất bại');
    }
  };

  const handleStopTask = async (task: any) => {
    try {
      setRunningTasks(prev => {
        const next = new Set(prev);
        next.delete(task.id);
        return next;
      });
      await api.patch('/automation-tasks', {
        id: task.id,
        status: 'IDLE'
      }).catch(() => {});

      // Find the actual profileId
      const realProfileIds = (task.profileIds || []).map((dbId: string) => {
        const acc = accounts.find(a => a.id === dbId || a.profileId === dbId);
        return acc ? acc.profileId || dbId : dbId;
      });

      // @ts-ignore
      if (window.electron && window.electron.stopAutomationTask) {
        // @ts-ignore
        await window.electron.stopAutomationTask({
          taskId: task.id,
          profileIds: realProfileIds
        });
      }

      toast.success('Đã dừng tác vụ');
      fetchTasks();
    } catch (e) {
      console.error(e);
      toast.error('Lỗi khi dừng tác vụ');
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xoá tác vụ này?')) return;
    try {
      await api.delete(`/automation-tasks/${id}`);
      fetchTasks();
      toast.success('Đã xoá tác vụ');
    } catch (e) {
      console.error(e);
    }
  };

  const handleEditClick = (task: AutomationTask) => {
    setEditTaskId(task.id);
    setTaskName(task.name);
    setTaskType(task.type);
    setTargetUrl(task.config?.targetUrl || '');
    setActionCount(task.config?.actionCount || 5);
    setUseAiComment(task.config?.useAiComment || false);
    setCommentsStr(task.config?.comments ? task.config.comments.join('\n') : '');
    setSelectedAccounts(new Set(task.profileIds));
    setShowModal(true);
  };

  const handleStartTask = async (task: AutomationTask) => {
    if (runningTasks.has(task.id)) {
      toast.error('Task này đang chạy rồi!');
      return;
    }

    if (!task.profileIds || task.profileIds.length === 0) {
      toast.error('Tác vụ chưa chọn tài khoản Facebook nào. Vui lòng bấm Edit để chọn tài khoản.');
      return;
    }

    const selectedAccountsList = task.profileIds
      .map(dbId => accounts.find(a => a.id === dbId || a.profileId === dbId))
      .filter(Boolean);

    const realProfileIds = task.profileIds.map(dbId => {
      const acc = accounts.find(a => a.id === dbId || a.profileId === dbId);
      return acc ? acc.profileId || dbId : dbId;
    });

    setRunningTasks(prev => new Set(prev).add(task.id));
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'RUNNING' } : t));

    try {
      await api.patch('/automation-tasks', {
        id: task.id,
        status: 'RUNNING'
      }).catch(() => {});

      // @ts-ignore
      if (window.electron && window.electron.startAutomationTask) {
        // @ts-ignore
        const result = await window.electron.startAutomationTask({
          taskId: task.id,
          actionType: task.type,
          profileIds: realProfileIds,
          accounts: selectedAccountsList,
          config: {
            ...task.config,
            aiSettings: globalSettings
          }
        });

        if (!result.success) {
          toast.error('Chạy tác vụ thất bại: ' + (result.error || 'Lỗi không xác định'));
        } else {
          const failedRuns = result.results?.filter((r: any) => !r.success) || [];
          if (failedRuns.length > 0) {
            toast.warning(`Hoàn thành với cảnh báo: ${failedRuns.length}/${result.results.length} tài khoản lỗi: ${failedRuns.map((r: any) => r.error).join(', ')}`);
          } else {
            toast.success('Tác vụ hoàn thành thành công');
          }
        }
      } else {
        toast.error('Chức năng chưa hỗ trợ trên trình duyệt, vui lòng dùng app Desktop.');
      }
    } catch (e: any) {
      console.error(e);
      toast.error('Lỗi khi chạy tác vụ: ' + (e.message || 'Lỗi hệ thống'));
    } finally {
      setRunningTasks(prev => {
        const next = new Set(prev);
        next.delete(task.id);
        return next;
      });
      await api.patch('/automation-tasks', {
        id: task.id,
        status: 'IDLE'
      }).catch(() => {});
      fetchTasks();
    }
  };

  const formatTaskType = (type: string) => {
    switch (type) {
      case 'fb_auto_interact': return 'Tự động tương tác (Lướt Feed/Group, Like, Share, Comment)';
      case 'fb_buff_post': return 'Auto Comment & Like (Buff 1 bài viết/link cụ thể)';
      case 'fb_farm_reels': return 'Tự động lướt Reels (Xem, thả tim, comment)';
      case 'fb_add_friends_group': return 'Auto Kết Bạn (Thành viên nhóm)';
      case 'fb_invite_to_group': return 'Auto Mời Bạn Bè (Vào nhóm mình)';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-gray-900">Tác vụ Nuôi nick & Tương tác Mạng Xã Hội</h2>
          <p className="text-xs text-gray-500 mt-0.5">Chạy tự động các hành vi lướt feed, like, share, kết bạn theo danh sách profile.</p>
        </div>

        <button
          onClick={() => {
            setEditTaskId(null);
            setTaskName('');
            setTaskType('fb_auto_interact');
            setTargetUrl('');
            setActionCount(5);
            setCommentsStr('');
            setUseAiComment(false);
            setSelectedAccounts(new Set());
            setShowModal(true);
          }}
          className="whitespace-nowrap inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors shadow-sm text-xs font-semibold"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span>Tạo tác vụ mới</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-900">
            <thead className="bg-gray-50/50 text-gray-500 border-b border-gray-100">
              <tr>
                <th className="px-6 py-3.5 font-medium">Tên tác vụ & Cấu hình</th>
                <th className="px-6 py-3.5 font-medium">Hành động</th>
                <th className="px-6 py-3.5 font-medium">Tài khoản</th>
                <th className="px-6 py-3.5 font-medium">Trạng thái</th>
                <th className="px-6 py-3.5 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    Chưa có tác vụ nào. Bấm "Tạo tác vụ mới" để bắt đầu.
                  </td>
                </tr>
              ) : (
                tasks.map(task => (
                  <tr key={task.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="font-semibold text-gray-900">{task.name}</div>
                      {(task.config?.targetUrl || task.config?.comments) && (
                        <div className="text-[11px] text-gray-500 mt-1 space-y-0.5">
                          {task.config.targetUrl && (
                            <div className="flex items-center gap-1">
                              <LinkIcon className="w-3 h-3" />
                              <span className="truncate max-w-[200px]" title={task.config.targetUrl}>
                                {task.config.targetUrl}
                              </span>
                            </div>
                          )}
                          {task.config.comments && task.config.comments.length > 0 && (
                            <div className="flex items-center gap-1">
                              <MessageCircle className="w-3 h-3" />
                              <span className="truncate max-w-[200px]" title={task.config.comments.join(' | ')}>
                                {task.config.comments[0]} {task.config.comments.length > 1 && `(+${task.config.comments.length - 1} nữa)`}
                              </span>
                            </div>
                          )}
                          {task.config.useAiComment && (
                            <div className="flex items-center gap-1 text-purple-600">
                              <MessageCircle className="w-3 h-3" />
                              <span>Bình luận AI tự động</span>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-gray-700">
                      {formatTaskType(task.type)}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 text-xs font-medium">
                        <Users className="w-3.5 h-3.5" />
                        {task.profileIds?.length || 0}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      {(() => {
                        const isTaskActive = runningTasks.has(task.id) || task.status === 'RUNNING';
                        return (
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${isTaskActive ? 'bg-blue-50 text-blue-600' :
                            task.status === 'DONE' ? 'bg-emerald-50 text-emerald-600' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                            {isTaskActive ? 'RUNNING' : (task.status || 'IDLE')}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      {(() => {
                        const isTaskActive = runningTasks.has(task.id) || task.status === 'RUNNING';
                        return (
                          <div className="flex items-center justify-end gap-1.5">
                            {isTaskActive ? (
                              <button
                                onClick={() => handleStopTask(task)}
                                className="px-2.5 py-1 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors flex items-center gap-1 border border-amber-200"
                                title="Dừng tác vụ"
                              >
                                <Square className="w-3 h-3 fill-current" />
                                Dừng
                              </button>
                            ) : (
                              <button
                                onClick={() => handleStartTask(task)}
                                className="px-2.5 py-1 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors flex items-center gap-1 border border-purple-200"
                                title="Chạy tác vụ"
                              >
                                <Play className="w-3 h-3 fill-current" />
                                Chạy
                              </button>
                            )}
                            <button
                              onClick={() => setViewingTask(task)}
                              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Xem chi tiết"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEditClick(task)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Chỉnh sửa"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Xoá"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Create/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {editTaskId ? 'Chỉnh sửa tác vụ' : 'Tạo tác vụ tự động mới'}
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-gray-700 mb-1">Tên tác vụ</label>
                <input
                  type="text"
                  value={taskName}
                  onChange={e => setTaskName(e.target.value)}
                  placeholder="Ví dụ: Tương tác buổi sáng Nick Chính"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Loại hành động</label>
                <select
                  value={taskType}
                  onChange={e => setTaskType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="fb_auto_interact">Tự động tương tác (Lướt Feed/Group, Like, Share, Comment ngẫu nhiên)</option>
                  <option value="fb_buff_post">Auto Comment & Like (Buff 1 bài viết/link cụ thể)</option>
                  <option value="fb_farm_reels">Tự động lướt Reels (Xem video ngắn, thả tim, comment)</option>
                  <option value="fb_add_friends_group">Auto Kết Bạn (Từ thành viên trong nhóm)</option>
                  <option value="fb_invite_to_group">Auto Mời Bạn Bè (Vào nhóm của bạn)</option>
                </select>
              </div>

              {taskType === 'fb_buff_post' && (
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Link bài viết Facebook cần buff</label>
                  <input
                    type="text"
                    value={targetUrl}
                    onChange={e => setTargetUrl(e.target.value)}
                    placeholder="https://facebook.com/..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              )}

              {(taskType === 'fb_add_friends_group' || taskType === 'fb_invite_to_group') && (
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Link Nhóm Facebook (Group URL)</label>
                  <input
                    type="text"
                    value={targetUrl}
                    onChange={e => setTargetUrl(e.target.value)}
                    placeholder="https://facebook.com/groups/..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              )}

              <div>
                <label className="block font-medium text-gray-700 mb-1">Số lượng hành động tối đa / tài khoản</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={actionCount}
                  onChange={e => setActionCount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Nội dung bình luận (mỗi dòng một câu)</label>
                <textarea
                  rows={3}
                  value={commentsStr}
                  onChange={e => setCommentsStr(e.target.value)}
                  placeholder="Tuyệt vời quá!&#10;Shop ở đâu vậy ạ?&#10;Inbox mình nhé"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="useAi"
                  checked={useAiComment}
                  onChange={e => setUseAiComment(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500 h-4 w-4"
                />
                <label htmlFor="useAi" className="font-medium text-gray-700 cursor-pointer">
                  Sử dụng AI tự động nghĩ bình luận theo ngữ cảnh bài viết
                </label>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-medium text-gray-700">Chọn tài khoản chạy ({selectedAccounts.size} đã chọn)</label>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedAccounts.size === accounts.length) setSelectedAccounts(new Set());
                      else setSelectedAccounts(new Set(accounts.map(a => a.id)));
                    }}
                    className="text-xs text-purple-600 hover:underline"
                  >
                    {selectedAccounts.size === accounts.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                  </button>
                </div>
                <div className="border border-gray-200 rounded-xl p-3 max-h-40 overflow-y-auto space-y-2">
                  {accounts.length === 0 ? (
                    <div className="text-gray-400 text-center py-2">Chưa có tài khoản Facebook nào</div>
                  ) : (
                    accounts.map(acc => (
                      <div
                        key={acc.id}
                        onClick={() => toggleAccount(acc.id)}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${selectedAccounts.has(acc.id) ? 'bg-purple-50 border border-purple-200' : 'hover:bg-gray-50'
                          }`}
                      >
                        <span className="font-medium text-gray-900">{acc.name}</span>
                        <span className="text-xs text-gray-500 font-mono">{acc.uid || 'No UID'}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors text-xs font-semibold"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleCreateTask}
                className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors text-xs font-semibold shadow-sm"
              >
                {editTaskId ? 'Lưu thay đổi' : 'Tạo tác vụ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Detail Modal */}
      {viewingTask && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl border border-gray-100 overflow-hidden text-xs">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-sm">Chi tiết tác vụ: {viewingTask.name}</h3>
              <button onClick={() => setViewingTask(null)} className="p-1 rounded-lg text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <span className="text-gray-500">Hành động:</span>
                <p className="font-semibold text-gray-900 mt-0.5">{formatTaskType(viewingTask.type)}</p>
              </div>
              {viewingTask.config?.targetUrl && (
                <div>
                  <span className="text-gray-500">Link mục tiêu:</span>
                  <p className="font-mono text-gray-900 mt-0.5 break-all">{viewingTask.config.targetUrl}</p>
                </div>
              )}
              <div>
                <span className="text-gray-500">Số tài khoản thực hiện:</span>
                <p className="font-semibold text-gray-900 mt-0.5">{viewingTask.profileIds?.length || 0} tài khoản</p>
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setViewingTask(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
