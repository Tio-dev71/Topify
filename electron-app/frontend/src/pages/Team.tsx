import React, { useState, useEffect } from 'react';
import {
  Users,
  Mail,
  UserPlus,
  Trash2,
  Eye,
  Edit2,
  X,
  RefreshCw,
  Shield,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  ChevronRight,
  ExternalLink,
  Ban,
  KeyRound,
  Lock,
  EyeOff,
  Sparkles,
  Building2,
  FolderGit2,
  Briefcase,
  Check,
  Percent,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/axios';
import { useNavigate } from 'react-router-dom';
import { useRbac } from '../lib/rbac';

interface TeamMember {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  invitedBy?: {
    name: string | null;
    email: string;
  };
  userId?: string;
  licenseKey?: string;
  hasPassword?: boolean;
  defaultPassword?: string;
}

interface PendingInvite {
  id: string;
  email: string;
  role: 'ADMIN' | 'STAFF';
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';
  invitedAt: string;
  expiresAt: string;
  tempPassword?: string;
  licenseKey?: string;
}

interface SeatQuotaInfo {
  maxSeats: number;
  seatsUsed: number;
  seatsAvailable: number;
  invites: PendingInvite[];
}

interface RbacPermissionItem {
  module: string;
  featureName: string;
  permissionKey: string;
  owner: boolean;
  admin: boolean;
  editor: boolean;
  viewer: boolean;
}

interface OrgTeam {
  id: string;
  name: string;
  description: string;
  leadEmail: string;
  memberCount: number;
  createdAt: string;
}

interface OrgProject {
  id: string;
  name: string;
  teamId?: string;
  teamName?: string;
  clientName: string;
  budget: number;
  status: 'PLANNING' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD';
  progress: number;
  deadline: string;
  createdAt: string;
}

export default function Team() {
  const navigate = useNavigate();
  const { isAdmin, isOwner, isStaff, roleDisplayName } = useRbac();
  const [activeTab, setActiveTab] = useState<'members' | 'rbac' | 'org'>('members');

  // Members & Seats State
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [quotaInfo, setQuotaInfo] = useState<SeatQuotaInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Invite Modal States
  const [showModal, setShowModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'STAFF' | 'ADMIN'>('STAFF');
  const [initialPassword, setInitialPassword] = useState('Topify@123');
  const [showInitialPassword, setShowInitialPassword] = useState(false);
  const [adding, setAdding] = useState(false);

  // Success Credential Banner / Dialog State (BUG-145)
  const [createdCredentials, setCreatedCredentials] = useState<{
    email: string;
    password: string;
    role: string;
    licenseKey: string;
  } | null>(null);

  // View & Edit States
  const [viewingMember, setViewingMember] = useState<TeamMember | null>(null);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [editRole, setEditRole] = useState('STAFF');
  const [updating, setUpdating] = useState(false);

  // Credentials Management Modal States
  const [managingCredentialsMember, setManagingCredentialsMember] = useState<TeamMember | null>(null);
  const [credentialsPassword, setCredentialsPassword] = useState('Topify@123');
  const [credentialsLicenseKey, setCredentialsLicenseKey] = useState('');
  const [savingCredentials, setSavingCredentials] = useState(false);
  const [showCredPassword, setShowCredPassword] = useState(false);

  // RBAC State (F063)
  const [rbacMatrix, setRbacMatrix] = useState<RbacPermissionItem[]>([]);
  const [loadingRbac, setLoadingRbac] = useState(false);
  const [savingRbacKey, setSavingRbacKey] = useState<string | null>(null);

  // Organization & Projects State (F116)
  const [orgData, setOrgData] = useState<{
    organizationName: string;
    workspaceName: string;
    teams: OrgTeam[];
    projects: OrgProject[];
  } | null>(null);
  const [loadingOrg, setLoadingOrg] = useState(false);

  // Create Team Modal
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamDesc, setTeamDesc] = useState('');
  const [teamLeadEmail, setTeamLeadEmail] = useState('');

  // Create Project Modal
  const [showProjModal, setShowProjModal] = useState(false);
  const [projName, setProjName] = useState('');
  const [projClient, setProjClient] = useState('');
  const [projTeamId, setProjTeamId] = useState('');
  const [projBudget, setProjBudget] = useState(10000000);
  const [projDeadline, setProjDeadline] = useState('31/12/2026');

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([fetchTeam(), fetchSeatsQuota(), fetchRbac(), fetchOrgStructure()]);
    setLoading(false);
  };

  const fetchTeam = async () => {
    try {
      const res = await api.get('/team');
      if (res.data?.members) {
        setMembers(res.data.members);
      }
    } catch (e: any) {
      console.error(e);
      if (e.response?.status === 403) {
        toast.error('Bạn không có quyền truy cập trang Nhân sự (Yêu cầu Admin)');
      } else {
        toast.error('Không thể tải danh sách nhân sự');
      }
    }
  };

  const fetchSeatsQuota = async () => {
    try {
      const res = await api.get('/workspace/seats');
      if (res.data?.success) {
        setQuotaInfo({
          maxSeats: res.data.maxSeats,
          seatsUsed: res.data.seatsUsed,
          seatsAvailable: res.data.seatsAvailable,
          invites: res.data.invites || [],
        });
      }
    } catch (e: any) {
      console.error('Failed to load seat quota', e);
    }
  };

  const fetchRbac = async () => {
    setLoadingRbac(true);
    try {
      const res = await api.get('/security/rbac');
      if (res.data?.permissions) {
        setRbacMatrix(res.data.permissions);
      }
    } catch (e) {
      console.error('Failed to load RBAC', e);
    } finally {
      setLoadingRbac(false);
    }
  };

  const handleToggleRbac = async (permissionKey: string, role: 'admin' | 'editor' | 'viewer', currentValue: boolean) => {
    if (!isAdmin) {
      toast.error('Chỉ Quản trị viên (Admin) mới có quyền chỉnh sửa ma trận phân quyền RBAC.');
      return;
    }
    const nextValue = !currentValue;
    setSavingRbacKey(`${permissionKey}-${role}`);

    // Optimistic UI update
    setRbacMatrix((prev) =>
      prev.map((item) =>
        item.permissionKey === permissionKey ? { ...item, [role]: nextValue } : item
      )
    );

    try {
      const res = await api.post('/security/rbac', {
        permissionKey,
        role,
        value: nextValue,
      });
      if (res.data?.success) {
        toast.success(`Đã cập nhật quyền ${permissionKey} cho vai trò ${role.toUpperCase()}`);
      }
    } catch (e: any) {
      // Revert on error
      setRbacMatrix((prev) =>
        prev.map((item) =>
          item.permissionKey === permissionKey ? { ...item, [role]: currentValue } : item
        )
      );
      toast.error(e.response?.data?.error || 'Lỗi khi cập nhật quyền RBAC');
    } finally {
      setSavingRbacKey(null);
    }
  };

  const fetchOrgStructure = async () => {
    setLoadingOrg(true);
    try {
      const res = await api.get('/workspace/organization');
      if (res.data?.success) {
        setOrgData({
          organizationName: res.data.organizationName,
          workspaceName: res.data.workspaceName,
          teams: res.data.teams || [],
          projects: res.data.projects || [],
        });
      }
    } catch (e) {
      console.error('Failed to load org structure', e);
    } finally {
      setLoadingOrg(false);
    }
  };

  const handleOpenCredentials = async (member: TeamMember) => {
    setManagingCredentialsMember(member);
    setCredentialsPassword(member.defaultPassword || 'Topify@123');
    setCredentialsLicenseKey(member.licenseKey || '');
    setShowCredPassword(false);

    try {
      const res = await api.get(`/team/credentials?email=${encodeURIComponent(member.email)}`);
      if (res.data?.credentials) {
        if (res.data.credentials.licenseKey) {
          setCredentialsLicenseKey(res.data.credentials.licenseKey);
        }
        if (res.data.credentials.defaultPassword) {
          setCredentialsPassword(res.data.credentials.defaultPassword);
        }
      }
    } catch (e) {
      console.warn('Could not fetch credentials detail:', e);
    }
  };

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!managingCredentialsMember) return;
    if (!credentialsPassword.trim()) {
      toast.error('Vui lòng nhập mật khẩu');
      return;
    }

    setSavingCredentials(true);
    try {
      const res = await api.post('/team/credentials', {
        email: managingCredentialsMember.email,
        password: credentialsPassword.trim(),
      });
      if (res.data?.success) {
        toast.success(`Đã cập nhật mật khẩu cho ${managingCredentialsMember.email}!`);
        if (res.data.credentials?.licenseKey) {
          setCredentialsLicenseKey(res.data.credentials.licenseKey);
        }
        fetchTeam();
      }
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Lỗi khi lưu mật khẩu');
    } finally {
      setSavingCredentials(false);
    }
  };

  const handleCopyCredentialsInfo = (email: string, pass: string, role: string, licKey: string) => {
    const formatted = [
      `🔐 THÔNG TIN ĐĂNG NHẬP HỆ THỐNG TOPIFY`,
      `====================================`,
      `• Tài khoản / Email: ${email}`,
      `• Mật khẩu: ${pass || 'Topify@123'}`,
      `• Vai trò: ${role === 'ADMIN' ? 'Quản trị viên (Admin)' : 'Nhân viên (Staff)'}`,
      licKey ? `• Mã kích hoạt (License Key): ${licKey}` : '',
      `====================================`,
      `👉 HƯỚNG DẪN ĐĂNG NHẬP:`,
      `1. Mở ứng dụng Topify Desktop`,
      `2. Chọn tab "Email & Mật khẩu"`,
      `3. Nhập Email và Mật khẩu ở trên để đăng nhập trực tiếp vào Workspace.`,
    ].filter(Boolean).join('\n');

    navigator.clipboard.writeText(formatted);
    toast.success(`Đã sao chép thông tin đăng nhập của ${email}!`);
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#';
    let pass = 'Top@';
    for (let i = 0; i < 6; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCredentialsPassword(pass);
    toast.info('Đã tạo mật khẩu ngẫu nhiên: ' + pass);
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) {
      toast.error('Vui lòng nhập email');
      return;
    }

    setAdding(true);
    const pwd = initialPassword.trim() || 'Topify@123';
    try {
      const res = await api.post('/workspace/seats', {
        action: 'invite',
        email: newEmail.trim(),
        role: newRole,
        password: pwd,
      });

      if (res.data?.success) {
        toast.success(`Đã thêm thành viên & cấp tài khoản cho ${newEmail}`);
        const creds = {
          email: newEmail.trim(),
          password: pwd,
          role: newRole,
          licenseKey: res.data.credentials?.licenseKey || '',
        };
        setCreatedCredentials(creds);
        handleCopyCredentialsInfo(creds.email, creds.password, creds.role, creds.licenseKey);
        setNewEmail('');
        setInitialPassword('Topify@123');
        setShowModal(false);
        await Promise.all([fetchTeam(), fetchSeatsQuota()]);
      }
    } catch (e: any) {
      console.error(e);
      if (e.response?.data?.isOverQuota) {
        toast.error(e.response.data.error, {
          action: {
            label: 'Nâng cấp ngay',
            onClick: () => navigate('/settings?tab=quota'),
          },
        });
      } else {
        try {
          const res = await api.post('/team', { email: newEmail, role: newRole, password: pwd });
          toast.success('Đã thêm nhân sự & tạo tài khoản thành công');
          const creds = {
            email: newEmail.trim(),
            password: pwd,
            role: newRole,
            licenseKey: res.data?.licenseKey || '',
          };
          setCreatedCredentials(creds);
          handleCopyCredentialsInfo(creds.email, creds.password, creds.role, creds.licenseKey);
          setNewEmail('');
          setInitialPassword('Topify@123');
          setShowModal(false);
          fetchTeam();
        } catch (fallbackErr: any) {
          toast.error(fallbackErr.response?.data?.error || 'Lỗi khi thêm nhân sự');
        }
      }
    } finally {
      setAdding(false);
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    if (!confirm('Bạn có chắc muốn thu hồi lời mời này?')) return;
    try {
      const res = await api.post('/workspace/seats', {
        action: 'revoke',
        inviteId,
      });
      if (res.data?.success) {
        toast.success('Đã thu hồi lời mời thành công');
        fetchSeatsQuota();
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.response?.data?.error || 'Lỗi khi thu hồi lời mời');
    }
  };

  const handleCopyInviteLink = (inviteId: string) => {
    const inviteUrl = `${window.location.origin}/#/invite?token=${inviteId}`;
    navigator.clipboard.writeText(inviteUrl);
    toast.success('Đã sao chép liên kết tham gia vào bộ nhớ tạm!');
  };

  const handleOpenEdit = (member: TeamMember) => {
    setEditingMember(member);
    setEditRole(member.role);
  };

  const handleUpdateMemberRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;

    setUpdating(true);
    try {
      await api.patch('/team', { id: editingMember.id, role: editRole });
      toast.success('Cập nhật quyền thành công');
      setEditingMember(null);
      fetchTeam();
    } catch (e: any) {
      console.error(e);
      toast.error(e.response?.data?.error || 'Lỗi cập nhật quyền');
    } finally {
      setUpdating(false);
    }
  };

  const handleRemoveMember = async (id: string, email: string) => {
    if (!confirm(`Bạn có chắc muốn xoá ${email} khỏi đội ngũ?`)) return;

    try {
      await api.delete(`/team?id=${id}`);
      toast.success('Đã xoá nhân sự');
      await Promise.all([fetchTeam(), fetchSeatsQuota()]);
    } catch (e: any) {
      console.error(e);
      toast.error(e.response?.data?.error || 'Lỗi khi xoá nhân sự');
    }
  };

  const handleRoleChange = async (id: string, newRole: string) => {
    try {
      await api.patch('/team', { id, role: newRole });
      toast.success('Đã cập nhật quyền');
      fetchTeam();
    } catch (e: any) {
      console.error(e);
      toast.error(e.response?.data?.error || 'Lỗi cập nhật quyền');
    }
  };

  // Team & Project Handlers (F116)
  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim() || !teamLeadEmail.trim()) {
      toast.error('Vui lòng điền tên nhóm và email trưởng nhóm');
      return;
    }
    try {
      const res = await api.post('/workspace/organization', {
        action: 'create_team',
        name: teamName.trim(),
        description: teamDesc.trim(),
        leadEmail: teamLeadEmail.trim(),
      });
      if (res.data?.success) {
        toast.success(`Đã tạo phòng ban/nhóm ${teamName} thành công!`);
        setShowTeamModal(false);
        setTeamName('');
        setTeamDesc('');
        setTeamLeadEmail('');
        fetchOrgStructure();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Lỗi khi tạo nhóm');
    }
  };

  const handleDeleteTeam = async (teamId: string, name: string) => {
    if (!confirm(`Bạn có chắc muốn xoá nhóm "${name}"?`)) return;
    try {
      await api.post('/workspace/organization', { action: 'delete_team', teamId });
      toast.success('Đã xoá nhóm');
      fetchOrgStructure();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Lỗi khi xoá nhóm');
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projName.trim()) {
      toast.error('Vui lòng nhập tên dự án');
      return;
    }
    try {
      const res = await api.post('/workspace/organization', {
        action: 'create_project',
        name: projName.trim(),
        clientName: projClient.trim() || 'Nội bộ công ty',
        teamId: projTeamId || undefined,
        budget: projBudget,
        deadline: projDeadline,
      });
      if (res.data?.success) {
        toast.success(`Đã thêm dự án "${projName}" thành công!`);
        setShowProjModal(false);
        setProjName('');
        setProjClient('');
        fetchOrgStructure();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Lỗi khi tạo dự án');
    }
  };

  const handleUpdateProjectProgress = async (projectId: string, currentProgress: number) => {
    const nextProgress = Math.min(100, currentProgress + 15);
    try {
      await api.post('/workspace/organization', {
        action: 'update_project',
        projectId,
        progress: nextProgress,
        status: nextProgress === 100 ? 'COMPLETED' : 'IN_PROGRESS',
      });
      toast.success(`Đã cập nhật tiến độ: ${nextProgress}%`);
      fetchOrgStructure();
    } catch (err) {
      toast.error('Lỗi khi cập nhật tiến độ');
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Bạn có chắc muốn xoá dự án này?')) return;
    try {
      await api.post('/workspace/organization', { action: 'delete_project', projectId });
      toast.success('Đã xoá dự án');
      fetchOrgStructure();
    } catch (err) {
      toast.error('Lỗi khi xoá dự án');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const pendingInvitesCount = (quotaInfo?.invites || []).filter(
    (i: any) => i.status === 'PENDING' || i.status === 'Đang chờ chấp nhận'
  ).length;
  // Dynamic accurate seat calculation based on members + pending invitations in this workspace
  const seatsUsed = members.length + pendingInvitesCount;
  const maxSeats = quotaInfo?.maxSeats ?? 5;
  const seatsAvailable = Math.max(0, maxSeats - seatsUsed);
  const seatPercentage = Math.min(100, Math.round((seatsUsed / maxSeats) * 100));

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto pb-12">
      {/* Role banner if Staff */}
      {!isAdmin && (
        <div className="p-3.5 bg-indigo-50/90 border border-indigo-200 rounded-2xl flex items-center justify-between gap-3 text-xs text-indigo-900 shadow-sm">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-600 flex-shrink-0" />
            <span>
              Bạn đang đăng nhập với vai trò <strong>{roleDisplayName}</strong>. Bạn có quyền xem danh sách nhân sự, phân nhóm và cấu hình RBAC. Các tác vụ thêm/xóa thành viên và phân quyền chỉ dành cho Quản trị viên (Admin).
            </span>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-600" />
            Thành Viên & Quản Trị Tổ Chức (M8)
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý nhân sự, hạn mức ghế ngồi (F117), phân quyền chi tiết (F063) và cơ cấu nhóm/dự án (F116)
          </p>
        </div>

        {activeTab === 'members' && (
          <button
            onClick={() => {
              if (!isAdmin) {
                toast.error('Chỉ Quản trị viên (Admin) mới có quyền mời thành viên mới.');
                return;
              }
              setShowModal(true);
            }}
            disabled={!isAdmin || seatsAvailable <= 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors shadow-sm font-medium disabled:opacity-50 cursor-pointer"
            title={!isAdmin ? 'Chỉ Quản trị viên mới có quyền mời thành viên' : seatsAvailable <= 0 ? 'Đã hết ghế ngồi' : 'Mời thành viên mới'}
          >
            <UserPlus className="w-4 h-4" />
            Mời thành viên mới
          </button>
        )}
        {activeTab === 'org' && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowTeamModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-sm font-medium text-xs cursor-pointer"
            >
              <Users className="w-3.5 h-3.5" /> Tạo Đội Nhóm (Team)
            </button>
            <button
              onClick={() => setShowProjModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors shadow-sm font-medium text-xs cursor-pointer"
            >
              <Briefcase className="w-3.5 h-3.5" /> Thêm Dự Án (Project)
            </button>
          </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-gray-200 gap-6">
        <button
          onClick={() => setActiveTab('members')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 relative transition-colors cursor-pointer ${
            activeTab === 'members'
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Users className="w-4 h-4" />
          Thành Viên & Ghế Ngồi (Seats - F064, F117)
          <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-purple-50 text-purple-700 font-bold">
            {members.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('rbac')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 relative transition-colors cursor-pointer ${
            activeTab === 'rbac'
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Shield className="w-4 h-4" />
          Phân Quyền RBAC Chi Tiết (F063)
        </button>

        <button
          onClick={() => setActiveTab('org')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 relative transition-colors cursor-pointer ${
            activeTab === 'org'
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Cấu Trúc Tổ Chức, Nhóm & Dự Án (F116)
        </button>
      </div>

      {/* TAB 1: MEMBERS & SEAT MANAGEMENT */}
      {activeTab === 'members' && (
        <div className="space-y-6">
          {/* SUCCESS BANNER WHEN CREDENTIALS CREATED (BUG-145) */}
          {createdCredentials && (
            <div className="p-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 rounded-2xl shadow-sm space-y-2 animate-fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  Đã tạo tài khoản thành công cho {createdCredentials.email}!
                </div>
                <button
                  onClick={() => setCreatedCredentials(null)}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/80 p-3 rounded-xl border border-emerald-100 text-xs">
                <div className="space-y-1">
                  <div><strong>Email:</strong> <span className="font-mono">{createdCredentials.email}</span></div>
                  <div><strong>Mật khẩu khởi tạo:</strong> <span className="font-mono text-purple-700 font-bold">{createdCredentials.password}</span></div>
                  {createdCredentials.licenseKey && (
                    <div><strong>Mã kích hoạt cá nhân:</strong> <span className="font-mono text-indigo-700 font-bold">{createdCredentials.licenseKey}</span></div>
                  )}
                  <div className="text-gray-500 text-[11px]">
                    👉 Nhân viên có thể mở Topify Desktop, chọn tab <strong>Email & Mật khẩu</strong> để đăng nhập ngay.
                  </div>
                </div>

                <button
                  onClick={() =>
                    handleCopyCredentialsInfo(
                      createdCredentials.email,
                      createdCredentials.password,
                      createdCredentials.role,
                      createdCredentials.licenseKey
                    )
                  }
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer whitespace-nowrap"
                >
                  <Copy className="w-3.5 h-3.5" /> Sao Chép Gửi Nhân Viên
                </button>
              </div>
            </div>
          )}

          {/* SEAT QUOTA BANNER (F117) */}
          <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white p-6 rounded-2xl shadow-md border border-purple-400/30 relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-lg">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-300 bg-purple-500/20 px-2.5 py-0.5 rounded-full border border-purple-400/30">
                    Định Mức Ghế Ngồi (Seat Quota)
                  </span>
                  {seatsAvailable === 0 ? (
                    <span className="text-xs font-bold text-rose-300 bg-rose-500/20 px-2 py-0.5 rounded-full">
                      Đã hết ghế
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                      Còn trống {seatsAvailable} ghế
                    </span>
                  )}
                </div>

                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  Đã sử dụng {seatsUsed} trên tổng số {maxSeats} ghế
                </h2>
                <p className="text-xs text-purple-200">
                  Mỗi thành viên chính thức và lời mời đang chờ được tính vào 1 ghế (Seat) trong Workspace.
                </p>

                {/* Progress Bar */}
                <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden pt-0.5">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      seatPercentage >= 100
                        ? 'bg-rose-500'
                        : seatPercentage > 75
                        ? 'bg-amber-400'
                        : 'bg-purple-400'
                    }`}
                    style={{ width: `${seatPercentage}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start md:items-center gap-3">
                <button
                  onClick={() => navigate('/settings?tab=quota')}
                  className="px-4 py-2.5 text-xs font-semibold bg-white text-purple-950 rounded-xl hover:bg-purple-50 transition-colors shadow flex items-center gap-1.5 cursor-pointer"
                >
                  Nâng cấp thêm ghế
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* ACTIVE TEAM MEMBERS TABLE (F064) */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-purple-600" />
                <h3 className="font-bold text-gray-900 text-sm">Thành Viên Chính Thức ({members.length})</h3>
              </div>
              <button
                onClick={fetchTeam}
                className="text-xs text-gray-500 hover:text-purple-600 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Làm mới
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-900">
                <thead className="bg-gray-50/50 text-gray-500 border-b border-gray-100 text-xs">
                  <tr>
                    <th className="px-6 py-3.5 font-medium">Thành viên</th>
                    <th className="px-6 py-3.5 font-medium">Quyền hạn (Role)</th>
                    <th className="px-6 py-3.5 font-medium">Người thêm</th>
                    <th className="px-6 py-3.5 font-medium">Ngày tham gia</th>
                    <th className="px-6 py-3.5 font-medium text-right">Thao tác & Đăng nhập</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {members.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        Chưa có thành viên nào.
                      </td>
                    </tr>
                  ) : (
                    members.map((member) => (
                      <tr key={member.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-xs">
                              {member.email.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">{member.email}</div>
                              <span className="text-[11px] text-emerald-600 flex items-center gap-1 mt-0.5">
                                <CheckCircle2 className="w-3 h-3" /> Đã có tài khoản đăng nhập
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            disabled={!isAdmin}
                            value={member.role}
                            onChange={(e) => handleRoleChange(member.id, e.target.value)}
                            className={`text-xs font-semibold px-2.5 py-1 rounded-full outline-none ${!isAdmin ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'} ${
                              member.role === 'ADMIN'
                                ? 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            <option value="ADMIN">Quản trị viên (Admin)</option>
                            <option value="STAFF">Nhân viên (Staff / Viewer)</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-500">
                          {member.invitedBy?.email || 'Hệ thống'}
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-500">
                          {new Date(member.createdAt).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Explicit BUG-145 button */}
                            <button
                              onClick={() => handleOpenCredentials(member)}
                              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition-colors flex items-center gap-1 cursor-pointer"
                              title="Xem mật khẩu & Hướng dẫn đăng nhập"
                            >
                              <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                              Cấp TK & Pass
                            </button>

                            <button
                              onClick={() => setViewingMember(member)}
                              className="p-1.5 text-gray-400 hover:text-purple-600 rounded-lg hover:bg-purple-50 transition-colors cursor-pointer"
                              title="Xem chi tiết"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {isAdmin && (
                              <>
                                <button
                                  onClick={() => handleOpenEdit(member)}
                                  className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors cursor-pointer"
                                  title="Chỉnh sửa quyền"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleRemoveMember(member.id, member.email)}
                                  className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                                  title="Xóa khỏi nhóm"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* PENDING INVITATIONS TABLE (F117) */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-500" />
                <h3 className="font-bold text-gray-900 text-sm">
                  Lời Mời Đang Chờ Phê Duyệt ({quotaInfo?.invites?.length || 0})
                </h3>
              </div>
              <span className="text-xs text-gray-400">Lời mời có hiệu lực trong 7 ngày</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-900">
                <thead className="bg-gray-50/50 text-gray-500 border-b border-gray-100 text-xs">
                  <tr>
                    <th className="px-6 py-3.5 font-medium">Email Người Nhận</th>
                    <th className="px-6 py-3.5 font-medium">Quyền Dự Kiến</th>
                    <th className="px-6 py-3.5 font-medium">Trạng Thái</th>
                    <th className="px-6 py-3.5 font-medium">Ngày Mời</th>
                    <th className="px-6 py-3.5 font-medium text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(!quotaInfo?.invites || quotaInfo.invites.length === 0) ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-xs text-gray-500">
                        Không có lời mời nào đang chờ xử lý.
                      </td>
                    </tr>
                  ) : (
                    quotaInfo.invites.map((invite) => (
                      <tr key={invite.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900">{invite.email}</td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700">
                            {invite.role === 'ADMIN' ? 'Quản trị viên' : 'Nhân viên'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {invite.status === 'PENDING' && (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                              <Clock className="w-3 h-3" /> Đang chờ chấp nhận
                            </span>
                          )}
                          {invite.status === 'ACCEPTED' && (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" /> Đã tham gia
                            </span>
                          )}
                          {invite.status === 'REVOKED' && (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full">
                              <Ban className="w-3 h-3" /> Đã thu hồi
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-500">
                          {new Date(invite.invitedAt).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {invite.status === 'PENDING' && (
                              <>
                                <button
                                  onClick={() => handleCopyInviteLink(invite.id)}
                                  className="px-2.5 py-1 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                                  title="Sao chép link mời"
                                >
                                  <Copy className="w-3 h-3" /> Link
                                </button>
                                {isAdmin && (
                                  <button
                                    onClick={() => handleRevokeInvite(invite.id)}
                                    className="px-2.5 py-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                                    title="Thu hồi lời mời"
                                  >
                                    <Ban className="w-3 h-3" /> Thu hồi
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RBAC MATRIX (F063) */}
      {activeTab === 'rbac' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-indigo-600" />
                  Ma Trận Phân Quyền Chi Tiết (RBAC Matrix)
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Kiểm soát quyền truy cập chi tiết theo từng vai trò (Quản trị viên, Biên tập viên, Nhân viên) trên tất cả các phân hệ của Topify.
                </p>
              </div>
              <button
                onClick={fetchRbac}
                className="text-xs text-gray-500 hover:text-indigo-600 flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Làm mới ma trận
              </button>
            </div>

            {!isAdmin && (
              <div className="p-3.5 mb-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>
                  <strong>Chế độ chỉ xem:</strong> Bạn đang đăng nhập với vai trò <strong>Nhân viên (Staff / Viewer)</strong>. Bạn chỉ có thể theo dõi ma trận phân quyền, chỉ Quản trị viên (Admin) mới có quyền bật/tắt quyền hạn.
                </span>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-900 border-collapse">
                <thead className="bg-gray-50 text-gray-600 text-xs">
                  <tr>
                    <th className="px-5 py-3 font-semibold border-b border-gray-200">Phân hệ / Module</th>
                    <th className="px-5 py-3 font-semibold border-b border-gray-200">Chức năng & Hành động</th>
                    <th className="px-5 py-3 font-semibold text-center border-b border-gray-200 w-32 bg-purple-50/50">
                      Chủ Sở Hữu (Owner)
                    </th>
                    <th className="px-5 py-3 font-semibold text-center border-b border-gray-200 w-32 bg-indigo-50/50">
                      Quản Trị (Admin)
                    </th>
                    <th className="px-5 py-3 font-semibold text-center border-b border-gray-200 w-32 bg-blue-50/50">
                      Biên Tập (Editor)
                    </th>
                    <th className="px-5 py-3 font-semibold text-center border-b border-gray-200 w-36 bg-gray-50">
                      Nhân Viên (Staff / Viewer)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {loadingRbac ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                        Đang tải ma trận phân quyền RBAC...
                      </td>
                    </tr>
                  ) : rbacMatrix.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        Chưa có cấu hình RBAC nào.
                      </td>
                    </tr>
                  ) : (
                    rbacMatrix.map((item) => (
                      <tr key={item.permissionKey} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-3 font-semibold text-purple-900">{item.module}</td>
                        <td className="px-5 py-3">
                          <div className="font-medium text-gray-900">{item.featureName}</div>
                          <span className="text-[11px] font-mono text-gray-400">{item.permissionKey}</span>
                        </td>
                        <td className="px-5 py-3 text-center bg-purple-50/20">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-700">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        </td>
                        <td className="px-5 py-3 text-center bg-indigo-50/20">
                          <input
                            type="checkbox"
                            checked={item.admin}
                            disabled={!isAdmin}
                            onChange={() => handleToggleRbac(item.permissionKey, 'admin', item.admin)}
                            className={`w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 ${!isAdmin ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                          />
                        </td>
                        <td className="px-5 py-3 text-center bg-blue-50/20">
                          <input
                            type="checkbox"
                            checked={item.editor}
                            disabled={!isAdmin}
                            onChange={() => handleToggleRbac(item.permissionKey, 'editor', item.editor)}
                            className={`w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 ${!isAdmin ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                          />
                        </td>
                        <td className="px-5 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={item.viewer}
                            disabled={!isAdmin}
                            onChange={() => handleToggleRbac(item.permissionKey, 'viewer', item.viewer)}
                            className={`w-4 h-4 text-gray-600 rounded border-gray-300 focus:ring-purple-500 ${!isAdmin ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ORGANIZATION, TEAMS & PROJECTS (F116) */}
      {activeTab === 'org' && (
        <div className="space-y-6">
          {/* Organization & Workspace Info Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 text-purple-700 rounded-2xl flex items-center justify-center font-bold">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {orgData?.organizationName || 'Topify Technology JSC'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Không gian làm việc: <span className="font-semibold text-gray-800">{orgData?.workspaceName}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">
                  Cấu trúc SME & Agency đa khách hàng
                </span>
              </div>
            </div>
          </div>

          {/* TEAMS SECTION */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-gray-900 text-sm">
                  Các Phòng Ban & Đội Nhóm Nội Bộ ({orgData?.teams?.length || 0})
                </h3>
              </div>
              <button
                onClick={() => setShowTeamModal(true)}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Tạo nhóm mới
              </button>
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              {(!orgData?.teams || orgData.teams.length === 0) ? (
                <p className="col-span-2 text-center text-xs text-gray-500 py-6">Chưa có nhóm nào.</p>
              ) : (
                orgData.teams.map((team) => (
                  <div key={team.id} className="p-4 rounded-xl border border-gray-200 hover:border-indigo-300 transition-colors bg-gray-50/50 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <h4 className="font-bold text-gray-900 text-sm">{team.name}</h4>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                          {team.memberCount} thành viên
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mb-3">{team.description}</p>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-gray-400" />
                        Trưởng nhóm: <span className="font-medium text-gray-800">{team.leadEmail}</span>
                      </div>
                    </div>

                    <div className="pt-3 mt-3 border-t border-gray-100 flex justify-end">
                      <button
                        onClick={() => handleDeleteTeam(team.id, team.name)}
                        className="text-xs text-red-500 hover:text-red-700 cursor-pointer flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Xoá nhóm
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* PROJECTS SECTION */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-purple-600" />
                <h3 className="font-bold text-gray-900 text-sm">
                  Dự Án Đang Triển Khai (Projects - SME & Agency) ({orgData?.projects?.length || 0})
                </h3>
              </div>
              <button
                onClick={() => setShowProjModal(true)}
                className="text-xs font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm dự án mới
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-900">
                <thead className="bg-gray-50/50 text-gray-500 border-b border-gray-100 text-xs">
                  <tr>
                    <th className="px-6 py-3.5 font-medium">Tên Dự Án</th>
                    <th className="px-6 py-3.5 font-medium">Khách Hàng / Đối Tác</th>
                    <th className="px-6 py-3.5 font-medium">Nhóm Phụ Trách</th>
                    <th className="px-6 py-3.5 font-medium">Ngân Sách (VND)</th>
                    <th className="px-6 py-3.5 font-medium">Tiến Độ (%)</th>
                    <th className="px-6 py-3.5 font-medium">Thời Hạn</th>
                    <th className="px-6 py-3.5 font-medium text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {(!orgData?.projects || orgData.projects.length === 0) ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                        Chưa có dự án nào được tạo.
                      </td>
                    </tr>
                  ) : (
                    orgData.projects.map((proj) => (
                      <tr key={proj.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-gray-900">{proj.name}</td>
                        <td className="px-6 py-4 font-medium text-gray-700">{proj.clientName}</td>
                        <td className="px-6 py-4 text-indigo-700 font-medium">{proj.teamName || 'Nội bộ'}</td>
                        <td className="px-6 py-4 font-mono font-semibold text-gray-900">
                          {Number(proj.budget).toLocaleString('vi-VN')} đ
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-gray-200 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-purple-600 h-full rounded-full transition-all"
                                style={{ width: `${proj.progress}%` }}
                              ></div>
                            </div>
                            <span className="font-bold text-purple-700">{proj.progress}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-500 whitespace-nowrap">{proj.deadline}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleUpdateProjectProgress(proj.id, proj.progress)}
                              className="px-2 py-1 text-[11px] font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-md cursor-pointer"
                              title="Tăng tiến độ +15%"
                            >
                              + Tiến độ
                            </button>
                            <button
                              onClick={() => handleDeleteProject(proj.id)}
                              className="p-1 text-gray-400 hover:text-red-600 rounded cursor-pointer"
                              title="Xoá dự án"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* INVITE MODAL (F117 Quota Guarded) */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Mời Thành Viên Mới</h3>
                  <p className="text-xs text-gray-500">Còn trống {seatsAvailable} ghế trong Workspace</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMember}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Địa chỉ Email</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="minh@topify.vn"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Vai trò & Quyền hạn</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                  >
                    <option value="STAFF">Nhân viên (Staff / Viewer) - Đăng bài, trả lời tin nhắn, CRM theo RBAC</option>
                    <option value="ADMIN">Quản trị viên (Admin) - Toàn quyền cấu hình</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-medium text-gray-700">Mật khẩu khởi tạo</label>
                    <button
                      type="button"
                      onClick={() => {
                        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#';
                        let pass = 'Top@';
                        for (let i = 0; i < 6; i++) {
                          pass += chars.charAt(Math.floor(Math.random() * chars.length));
                        }
                        setInitialPassword(pass);
                      }}
                      className="text-[11px] text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" /> Tạo ngẫu nhiên
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showInitialPassword ? 'text' : 'password'}
                      value={initialPassword}
                      onChange={(e) => setInitialPassword(e.target.value)}
                      placeholder="Mặc định: Topify@123"
                      className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowInitialPassword(!showInitialPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {showInitialPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100 text-xs text-purple-900 flex items-start gap-2">
                  <Shield className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span>
                    Tài khoản được tạo sẽ kích hoạt ngay lập tức. Nhân viên có thể mở app Topify Desktop và đăng nhập trực tiếp bằng Email & Mật khẩu vừa tạo.
                  </span>
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={adding}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-purple-600 rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {adding && <RefreshCw className="w-4 h-4 animate-spin" />}
                  {adding ? 'Đang kích hoạt...' : 'Tạo Tài Khoản & Mời'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW MEMBER MODAL (WITH COMPLETE CREDENTIALS - BUG-145) */}
      {viewingMember && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                  {viewingMember.email.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Chi Tiết Thành Viên</h3>
                  <p className="text-xs text-gray-500">{viewingMember.email}</p>
                </div>
              </div>
              <button onClick={() => setViewingMember(null)} className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Quyền hạn (Role)</span>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    viewingMember.role === 'ADMIN' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {viewingMember.role === 'ADMIN' ? 'Quản trị viên (Admin)' : 'Nhân viên (Staff)'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Người mời / Thêm</span>
                  <span className="text-xs font-medium text-gray-800">
                    {viewingMember.invitedBy?.email || 'Hệ thống'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Ngày tham gia</span>
                  <span className="text-xs font-medium text-gray-800">
                    {new Date(viewingMember.createdAt).toLocaleString('vi-VN')}
                  </span>
                </div>
              </div>

              {/* Login Credentials Section */}
              <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-100 space-y-2.5">
                <span className="text-xs font-bold text-purple-900 uppercase tracking-wider block">
                  Thông Tin Đăng Nhập Của Nhân Viên
                </span>
                <div className="text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tài khoản:</span>
                    <span className="font-mono font-semibold text-gray-900">{viewingMember.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mật khẩu mặc định:</span>
                    <span className="font-mono font-semibold text-purple-700 bg-white px-2 py-0.5 rounded border border-purple-200">
                      Topify@123
                    </span>
                  </div>
                  {viewingMember.licenseKey && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Mã kích hoạt:</span>
                      <span className="font-mono font-semibold text-indigo-700">{viewingMember.licenseKey}</span>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handleCopyCredentialsInfo(
                      viewingMember.email,
                      'Topify@123',
                      viewingMember.role,
                      viewingMember.licenseKey || ''
                    )
                  }
                  className="w-full mt-2 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                >
                  <Copy className="w-3.5 h-3.5" /> Sao Chép Thông Tin Gửi Nhân Viên
                </button>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-between items-center bg-gray-50/50">
              <button
                type="button"
                onClick={() => {
                  const m = viewingMember;
                  setViewingMember(null);
                  handleOpenEdit(m);
                }}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Chỉnh sửa quyền
              </button>
              <button
                type="button"
                onClick={() => setViewingMember(null)}
                className="px-5 py-2 text-sm font-medium text-white bg-purple-600 rounded-xl hover:bg-purple-700 transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT ROLE MODAL */}
      {editingMember && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Phân Quyền Thành Viên</h3>
                  <p className="text-xs text-gray-500">{editingMember.email}</p>
                </div>
              </div>
              <button onClick={() => setEditingMember(null)} className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateMemberRole}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Quyền hạn trong Workspace</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                  >
                    <option value="ADMIN">Quản trị viên (Admin) - Toàn quyền cấu hình & quản lý</option>
                    <option value="STAFF">Nhân viên (Staff / Viewer) - Quyền theo Ma Trận RBAC</option>
                  </select>
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-purple-600 rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {updating && <RefreshCw className="w-4 h-4 animate-spin" />}
                  {updating ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREDENTIALS & LOGIN SETUP MODAL (BUG-145) */}
      {managingCredentialsMember && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-600">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900">
                    Cấp Quyền & Thông Tin Đăng Nhập
                  </h3>
                  <p className="text-xs text-gray-500">{managingCredentialsMember.email}</p>
                </div>
              </div>
              <button
                onClick={() => setManagingCredentialsMember(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Reset Password Form */}
              <form onSubmit={handleSaveCredentials} className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-800">
                    Thiết lập / Đặt lại mật khẩu nhân viên
                  </label>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="text-[11px] text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Tạo ngẫu nhiên
                  </button>
                </div>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showCredPassword ? 'text' : 'password'}
                      value={credentialsPassword}
                      onChange={(e) => setCredentialsPassword(e.target.value)}
                      placeholder="Nhập mật khẩu mới (VD: Topify@123)"
                      className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCredPassword(!showCredPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {showCredPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <button
                    type="submit"
                    disabled={savingCredentials || !credentialsPassword.trim()}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-sm"
                  >
                    {savingCredentials && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    {savingCredentials ? 'Đang lưu...' : 'Lưu Mật Khẩu'}
                  </button>
                </div>
              </form>

              {/* Login Info Card */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-gray-50 to-purple-50/40 border border-purple-100/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-purple-600" />
                    Thông tin tài khoản đăng nhập
                  </span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Đã kích hoạt
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between py-1 border-b border-gray-100">
                    <span className="text-gray-500">Tài khoản / Email:</span>
                    <span className="font-semibold text-gray-900 font-mono">{managingCredentialsMember.email}</span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-gray-100">
                    <span className="text-gray-500">Mật khẩu hiện tại:</span>
                    <span className="font-semibold text-purple-700 font-mono bg-purple-50 px-2 py-0.5 rounded">
                      {credentialsPassword}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-gray-100">
                    <span className="text-gray-500">Vai trò (Role):</span>
                    <span className="font-medium text-gray-900">
                      {managingCredentialsMember.role === 'ADMIN' ? 'Quản trị viên (Admin)' : 'Nhân viên (Staff)'}
                    </span>
                  </div>

                  {credentialsLicenseKey && (
                    <div className="flex items-center justify-between py-1 border-b border-gray-100">
                      <span className="text-gray-500">Mã kích hoạt cá nhân:</span>
                      <span className="font-semibold text-indigo-700 font-mono bg-indigo-50 px-2 py-0.5 rounded">
                        {credentialsLicenseKey}
                      </span>
                    </div>
                  )}

                  <div className="pt-2 text-[11px] text-gray-600 leading-relaxed bg-white/80 p-2.5 rounded-lg border border-gray-100">
                    💡 <strong>Cách đăng nhập cho nhân viên:</strong> Mở app Topify Desktop → Chọn tab <strong>Email & Mật khẩu</strong> → Nhập Email và Mật khẩu ở trên để đăng nhập trực tiếp vào hệ thống.
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-3 bg-gray-50/50">
              <button
                type="button"
                onClick={() =>
                  handleCopyCredentialsInfo(
                    managingCredentialsMember.email,
                    credentialsPassword,
                    managingCredentialsMember.role,
                    credentialsLicenseKey
                  )
                }
                className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                Sao Chép Thông Tin Gửi Nhân Viên
              </button>

              <button
                type="button"
                onClick={() => setManagingCredentialsMember(null)}
                className="w-full sm:w-auto px-5 py-2.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE TEAM MODAL (F116) */}
      {showTeamModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                Tạo Đội Nhóm / Phòng Ban
              </h3>
              <button onClick={() => setShowTeamModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateTeam}>
              <div className="p-6 space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Tên Nhóm / Phòng Ban</label>
                  <input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="VD: Đội ngũ Content Marketing"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Mô tả nhiệm vụ</label>
                  <textarea
                    value={teamDesc}
                    onChange={(e) => setTeamDesc(e.target.value)}
                    placeholder="Phụ trách đăng bài Reels, theo dõi tương tác..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Email Trưởng Nhóm (Lead)</label>
                  <input
                    type="email"
                    value={teamLeadEmail}
                    onChange={(e) => setTeamLeadEmail(e.target.value)}
                    placeholder="lead@company.com"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>
              <div className="p-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50/50">
                <button
                  type="button"
                  onClick={() => setShowTeamModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl cursor-pointer"
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 cursor-pointer shadow-sm"
                >
                  Tạo Nhóm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE PROJECT MODAL (F116) */}
      {showProjModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-purple-600" />
                Thêm Dự Án Mới
              </h3>
              <button onClick={() => setShowProjModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateProject}>
              <div className="p-6 space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Tên Dự Án</label>
                  <input
                    type="text"
                    value={projName}
                    onChange={(e) => setProjName(e.target.value)}
                    placeholder="VD: Chiến dịch Ra mắt Sản phẩm Mới"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Khách hàng / Đối tác</label>
                  <input
                    type="text"
                    value={projClient}
                    onChange={(e) => setProjClient(e.target.value)}
                    placeholder="VD: Khách hàng VIP A hoặc Nội bộ công ty"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Gán Nhóm Phụ Trách</label>
                  <select
                    value={projTeamId}
                    onChange={(e) => setProjTeamId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                  >
                    <option value="">-- Chọn nhóm phụ trách --</option>
                    {orgData?.teams?.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Ngân sách (VND)</label>
                    <input
                      type="number"
                      value={projBudget}
                      onChange={(e) => setProjBudget(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Hạn hoàn thành</label>
                    <input
                      type="text"
                      value={projDeadline}
                      onChange={(e) => setProjDeadline(e.target.value)}
                      placeholder="31/12/2026"
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>
              <div className="p-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50/50">
                <button
                  type="button"
                  onClick={() => setShowProjModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl cursor-pointer"
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-purple-600 rounded-xl hover:bg-purple-700 cursor-pointer shadow-sm"
                >
                  Thêm Dự Án
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
