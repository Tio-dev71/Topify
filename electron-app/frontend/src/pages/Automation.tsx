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
import api from '../lib/axios';
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

export default function Automation() {
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

    // Find the actual profileId (e.g. 'profile_...') for each DB ID
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

      // Call Electron IPC to run locally
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
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Play className="w-6 h-6 text-purple-600" />
            Tự Động Hoá (Automation)
          </h1>
          <p className="text-sm text-gray-500 mt-1">Quản lý và chạy các tác vụ tự động trên nhiều tài khoản.</p>
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
          className="whitespace-nowrap inline-flex items-center justify-center gap-2 shrink-0 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span>Tạo tác vụ mới</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-900">
            <thead className="bg-gray-50/50 text-gray-500 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-medium">Tên tác vụ & Cấu hình</th>
                <th className="px-6 py-4 font-medium">Hành động</th>
                <th className="px-6 py-4 font-medium">Tài khoản</th>
                <th className="px-6 py-4 font-medium">Trạng thái</th>
                <th className="px-6 py-4 font-medium text-right">Thao tác</th>
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
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{task.name}</div>
                      {(task.config?.targetUrl || task.config?.comments) && (
                        <div className="text-xs text-gray-500 mt-1 space-y-0.5">
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
                    <td className="px-6 py-4 text-gray-700">
                      {formatTaskType(task.type)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 text-xs font-medium">
                        <Users className="w-3.5 h-3.5" />
                        {task.profileIds?.length || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4">
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
                    <td className="px-6 py-4 text-right">
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
                              className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                              title="Xem chi tiết tác vụ"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEditClick(task)}
                              disabled={isTaskActive}
                              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-40 rounded-lg transition-colors"
                              title="Chỉnh sửa tác vụ"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                              title="Xoá tác vụ"
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

      {/* Create New Task Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl scale-100">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">{editTaskId ? 'Chỉnh sửa tác vụ' : 'Tạo tác vụ tự động mới'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-400" /> Tên tác vụ
                </label>
                <input
                  type="text"
                  value={taskName}
                  onChange={e => setTaskName(e.target.value)}
                  placeholder="VD: Auto Comment dạo Group..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hành động</label>
                <select
                  value={taskType}
                  onChange={e => setTaskType(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                >
                  <option value="fb_auto_interact">Tự động tương tác (Lướt Feed/Group, Like, Share, Comment)</option>
                  <option value="fb_buff_post">Auto Comment & Like (Buff 1 bài viết/link cụ thể)</option>
                  <option value="fb_farm_reels">Tự động lướt Reels (Xem, thả tim, comment)</option>
                  <option value="fb_add_friends_group">Auto Kết Bạn (Thành viên nhóm)</option>
                  <option value="fb_invite_to_group">Auto Mời Bạn Bè (Vào nhóm mình)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <LinkIcon className="w-4 h-4 text-gray-400" /> {taskType === 'fb_buff_post' ? 'Link Bài Viết (Post URL)' : 'Target URL (Fanpage, Group... Để trống nếu lướt feed ngẫu nhiên)'}
                  </label>
                  <input
                    type="text"
                    value={targetUrl}
                    onChange={e => setTargetUrl(e.target.value)}
                    placeholder="https://www.facebook.com/..."
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" /> Số lượng hành động
                  </label>
                  <input
                    type="number"
                    value={actionCount}
                    onChange={e => setActionCount(parseInt(e.target.value))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {(taskType === 'fb_auto_interact' || taskType === 'fb_farm_reels' || taskType === 'fb_buff_post') && (
                <div className="space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer p-4 border border-purple-100 rounded-xl bg-purple-50 hover:border-purple-200 transition-colors">
                    <input
                      type="checkbox"
                      checked={useAiComment}
                      onChange={e => setUseAiComment(e.target.checked)}
                      className="w-5 h-5 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-purple-700">Tự động bình luận thông minh bằng AI (Gemini)</span>
                      <span className="text-xs text-gray-500 mt-0.5">Sử dụng AI đọc bài viết và tự sinh bình luận tự nhiên theo ngữ cảnh (Cần cấu hình API KEY)</span>
                    </div>
                  </label>

                  {!useAiComment && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-gray-400" /> Hoặc Bình Luận Theo Mẫu Nhập Sẵn (Mỗi câu 1 dòng)
                      </label>
                      <textarea
                        value={commentsStr}
                        onChange={e => setCommentsStr(e.target.value)}
                        placeholder="Thật tuyệt vời!&#10;Hay quá bạn ơi&#10;Quá đỉnh"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 h-24 resize-none"
                      />
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Chọn tài khoản chạy ({selectedAccounts.size}/{accounts.length})</label>
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-2 max-h-40 overflow-y-auto space-y-1 custom-scrollbar">
                  {accounts.length === 0 ? (
                    <div className="p-4 text-sm text-gray-500 text-center">No profiles available.</div>
                  ) : (
                    accounts.map(acc => (
                      <label key={acc.id} className="flex items-center gap-3 p-2.5 hover:bg-white rounded-lg cursor-pointer transition-colors border border-transparent hover:border-gray-200 shadow-sm">
                        <input
                          type="checkbox"
                          checked={selectedAccounts.has(acc.id)}
                          onChange={() => toggleAccount(acc.id)}
                          className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                        />
                        <span className="text-sm font-medium text-gray-700">{acc.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
              >
                Hủy
              </button>
              <button
                onClick={handleCreateTask}
                className="px-6 py-2.5 text-sm font-medium text-white bg-purple-600 rounded-xl hover:bg-purple-700 transition-colors shadow-sm"
              >
                Lưu tác vụ
              </button>
            </div>
          </div>
        </div>
      )}
      {/* View Task Detail Modal */}
      {viewingTask && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
                  <Play className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[16px] font-semibold text-gray-900">Chi Tiết Tác Vụ Tự Động Hóa</h3>
                  <p className="text-xs text-gray-500">{viewingTask.name}</p>
                </div>
              </div>
              <button 
                onClick={() => setViewingTask(null)} 
                className="text-gray-400 hover:text-gray-900 transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
              {/* Type & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <span className="text-xs text-gray-500 block mb-1">Loại hành động</span>
                  <span className="font-semibold text-xs text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-100 inline-block">
                    {formatTaskType(viewingTask.type)}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <span className="text-xs text-gray-500 block mb-1">Trạng thái</span>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full inline-block ${
                    runningTasks.has(viewingTask.id) || viewingTask.status === 'RUNNING' ? 'bg-blue-50 text-blue-600 border border-blue-200' :
                    viewingTask.status === 'DONE' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {runningTasks.has(viewingTask.id) || viewingTask.status === 'RUNNING' ? 'ĐANG CHẠY' : (viewingTask.status || 'IDLE')}
                  </span>
                </div>
              </div>

              {/* Target URL */}
              {viewingTask.config?.targetUrl && (
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
                  <span className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                    <LinkIcon className="w-3.5 h-3.5 text-purple-600" />
                    Đường dẫn mục tiêu (Target URL)
                  </span>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-gray-800 break-all select-all">
                      {viewingTask.config.targetUrl}
                    </span>
                    <a
                      href={viewingTask.config.targetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded text-purple-600 hover:bg-purple-100 transition-colors shrink-0"
                      title="Mở liên kết"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              )}

              {/* Action Count & AI comment */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <span className="text-xs text-gray-500 block mb-1">Số lượt hành động</span>
                  <span className="text-sm font-semibold text-gray-900 font-mono">
                    {viewingTask.config?.actionCount || 5} lượt / profile
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <span className="text-xs text-gray-500 block mb-1">Bình luận AI</span>
                  <span className="text-sm font-semibold flex items-center gap-1 text-gray-900">
                    <Bot className="w-4 h-4 text-purple-600" />
                    {viewingTask.config?.useAiComment ? 'Bật (Tự động)' : 'Tắt'}
                  </span>
                </div>
              </div>

              {/* Comments list if any */}
              {viewingTask.config?.comments && viewingTask.config.comments.length > 0 && (
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-2">
                  <span className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                    <MessageCircle className="w-3.5 h-3.5 text-amber-600" />
                    Danh sách nội dung bình luận ({viewingTask.config.comments.length})
                  </span>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar">
                    {viewingTask.config.comments.map((cmt: string, idx: number) => (
                      <div key={idx} className="p-2 bg-white rounded-lg border border-gray-200/80 text-xs text-gray-700">
                        {cmt}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Assigned Profiles */}
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-2">
                <span className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-blue-600" />
                  Tài khoản Facebook được gán ({viewingTask.profileIds?.length || 0})
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto custom-scrollbar">
                  {(viewingTask.profileIds || []).map((dbId: string) => {
                    const acc = accounts.find(a => a.id === dbId || a.profileId === dbId);
                    return (
                      <span key={dbId} className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-800 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        {acc?.name || dbId}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Created At */}
              {viewingTask.createdAt && (
                <div className="flex items-center gap-1.5 text-xs text-gray-400 px-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Ngày tạo: {new Date(viewingTask.createdAt).toLocaleString('vi-VN')}</span>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  const taskToEdit = viewingTask;
                  setViewingTask(null);
                  handleEditClick(taskToEdit);
                }}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-1.5"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Chỉnh sửa tác vụ
              </button>
              <button
                type="button"
                onClick={() => setViewingTask(null)}
                className="px-5 py-2 text-white bg-purple-600 hover:bg-purple-700 rounded-xl text-xs font-semibold transition-colors"
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
