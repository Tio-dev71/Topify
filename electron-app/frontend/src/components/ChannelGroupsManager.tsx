import React, { useState, useEffect } from 'react';
import {
  FolderKanban,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Layers,
  Sparkles,
  Users,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/axios';

interface SocialAccountItem {
  id: string;
  provider: string;
  accountName?: string | null;
}

interface ChannelGroup {
  id: string;
  name: string;
  description?: string | null;
  accounts: SocialAccountItem[];
  createdAt: string;
}

interface ChannelGroupsManagerProps {
  socialAccounts: SocialAccountItem[];
}

export function ChannelGroupsManager({ socialAccounts }: ChannelGroupsManagerProps) {
  const [groups, setGroups] = useState<ChannelGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ChannelGroup | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const res = await api.get('/channel-groups');
      if (Array.isArray(res.data)) {
        setGroups(res.data);
      }
    } catch (e) {
      console.error('Failed to load channel groups', e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingGroup(null);
    setName('');
    setDescription('');
    setSelectedAccountIds([]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (group: ChannelGroup) => {
    setEditingGroup(group);
    setName(group.name);
    setDescription(group.description || '');
    setSelectedAccountIds(group.accounts ? group.accounts.map((a) => a.id) : []);
    setIsModalOpen(true);
  };

  const toggleAccountSelection = (accountId: string) => {
    setSelectedAccountIds((prev) =>
      prev.includes(accountId) ? prev.filter((id) => id !== accountId) : [...prev, accountId]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Vui lòng nhập tên nhóm kênh');
      return;
    }

    setSubmitting(true);
    try {
      if (editingGroup) {
        await api.put(`/channel-groups/${editingGroup.id}`, {
          name: name.trim(),
          description: description.trim() || null,
          accountIds: selectedAccountIds,
        });
        toast.success('Cập nhật nhóm kênh thành công!');
      } else {
        await api.post('/channel-groups', {
          name: name.trim(),
          description: description.trim() || null,
          accountIds: selectedAccountIds,
        });
        toast.success('Tạo nhóm kênh mới thành công!');
      }
      setIsModalOpen(false);
      fetchGroups();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Có lỗi xảy ra khi lưu nhóm kênh');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (groupId: string, groupName: string) => {
    if (!window.confirm(`Bạn có chắc muốn xoá nhóm kênh "${groupName}"?`)) return;

    try {
      await api.delete(`/channel-groups/${groupId}`);
      toast.success('Đã xoá nhóm kênh');
      setGroups((prev) => prev.filter((g) => g.id !== groupId));
    } catch {
      toast.error('Không thể xoá nhóm kênh');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FolderKanban className="w-5 h-5 text-indigo-600" />
          <div>
            <h2 className="text-[15px] font-semibold text-gray-900 flex items-center gap-2">
              Nhóm Kênh Mạng Xã Hội (Channel Groups)
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                Đặc tả F010
              </span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Gom nhiều kênh (Fanpage, TikTok, YouTube) vào một nhóm chiến dịch để đăng và phân phối nội dung hàng loạt
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleOpenCreate}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          Tạo nhóm kênh mới
        </button>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="py-8 text-center text-xs text-gray-400">Đang tải danh sách nhóm kênh...</div>
        ) : groups.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-gray-200 rounded-xl bg-gray-50/40 space-y-2">
            <FolderKanban className="w-8 h-8 text-gray-300 mx-auto" />
            <p className="text-xs font-semibold text-gray-700">Chưa có nhóm kênh nào</p>
            <p className="text-[11px] text-gray-400 max-w-sm mx-auto">
              Tạo nhóm kênh để nhóm các tài khoản Facebook, TikTok hoặc YouTube cùng thương hiệu hoặc ngành hàng.
            </p>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="mt-2 text-xs font-bold text-indigo-600 hover:text-indigo-800"
            >
              + Tạo nhóm đầu tiên
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map((group) => (
              <div
                key={group.id}
                className="p-4 rounded-xl border border-gray-200/80 bg-white hover:border-indigo-300 hover:shadow-sm transition-all space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-sm text-gray-900 line-clamp-1">{group.name}</h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 shrink-0">
                      {group.accounts?.length || 0} kênh
                    </span>
                  </div>
                  {group.description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{group.description}</p>
                  )}
                  <div className="flex flex-wrap gap-1 mt-3">
                    {group.accounts && group.accounts.length > 0 ? (
                      group.accounts.map((acc) => (
                        <span
                          key={acc.id}
                          className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-700"
                        >
                          {acc.provider}: {acc.accountName || 'Kênh'}
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] text-gray-400 italic">Chưa gắn kênh nào</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-1 pt-2 border-t border-gray-100 text-xs">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(group)}
                    className="p-1.5 text-gray-500 hover:text-indigo-600 rounded-lg hover:bg-gray-50"
                    title="Chỉnh sửa nhóm"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(group.id, group.name)}
                    className="p-1.5 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                    title="Xoá nhóm"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Create / Edit Channel Group */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-[9999] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/60">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-indigo-600" />
                {editingGroup ? 'Chỉnh sửa Nhóm Kênh (F010)' : 'Tạo Nhóm Kênh Mới (F010)'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Tên nhóm kênh *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: Nhóm Kênh Thời Trang, Hệ thống Fanpage Sale..."
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Mô tả nhóm</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ghi chú mục đích của nhóm kênh..."
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">
                  Chọn các kênh đưa vào nhóm ({selectedAccountIds.length} đã chọn):
                </label>
                {socialAccounts.length === 0 ? (
                  <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-xl border border-amber-200">
                    Chưa có tài khoản mạng xã hội nào được liên kết. Vui lòng kết nối tài khoản Meta, YouTube, TikTok
                    hoặc Zalo ở bảng phía trên trước.
                  </p>
                ) : (
                  <div className="max-h-48 overflow-y-auto space-y-2 border border-gray-200 rounded-xl p-3 bg-gray-50/40">
                    {socialAccounts.map((account) => {
                      const isSelected = selectedAccountIds.includes(account.id);
                      return (
                        <div
                          key={account.id}
                          onClick={() => toggleAccountSelection(account.id)}
                          className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-semibold'
                              : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-2 text-xs">
                            <span className="w-5 h-5 rounded-md bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-[10px]">
                              {account.provider.substring(0, 2)}
                            </span>
                            <span>{account.accountName || account.provider}</span>
                          </div>
                          <div
                            className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                              isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-300 bg-white'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Đang lưu...' : editingGroup ? 'Lưu thay đổi' : 'Tạo nhóm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
