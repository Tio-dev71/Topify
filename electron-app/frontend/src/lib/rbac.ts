import { useState, useEffect } from 'react';
import api from './axios';

export type RoleKey = 'owner' | 'admin' | 'editor' | 'viewer';

export interface RolePermissionItem {
  module: string;
  featureName: string;
  permissionKey: string;
  owner: boolean;
  admin: boolean;
  editor: boolean;
  viewer: boolean;
}

export const DEFAULT_RBAC_MATRIX: RolePermissionItem[] = [
  {
    module: 'Quản lý Bài Viết & Lịch Đăng',
    featureName: 'Tạo, sửa & lên lịch đăng bài đa kênh',
    permissionKey: 'posts.manage',
    owner: true,
    admin: true,
    editor: true,
    viewer: false,
  },
  {
    module: 'Quản lý Bài Viết & Lịch Đăng',
    featureName: 'Xóa bài viết & xóa lịch vĩnh viễn',
    permissionKey: 'posts.delete',
    owner: true,
    admin: true,
    editor: false,
    viewer: false,
  },
  {
    module: 'Ví Điện Tử & Thu Nhập (M12)',
    featureName: 'Lập lệnh rút tiền & quản lý tài khoản ngân hàng',
    permissionKey: 'wallet.withdraw',
    owner: true,
    admin: false,
    editor: false,
    viewer: false,
  },
  {
    module: 'Ví Điện Tử & Thu Nhập (M12)',
    featureName: 'Xem số dư & lịch sử giao dịch',
    permissionKey: 'wallet.view',
    owner: true,
    admin: true,
    editor: false,
    viewer: false,
  },
  {
    module: 'Tự Động Hóa (M11) & Topify AI (M14)',
    featureName: 'Thiết lập Trigger & Kịch bản tự động',
    permissionKey: 'automation.manage',
    owner: true,
    admin: true,
    editor: true,
    viewer: false,
  },
  {
    module: 'Cài Đặt & Nhà Phát Triển (M15)',
    featureName: 'Tạo, thu hồi API Key & cấu hình Webhook',
    permissionKey: 'developer.manage',
    owner: true,
    admin: true,
    editor: false,
    viewer: false,
  },
  {
    module: 'Quản Trị Workspace & Tổ Chức (M8)',
    featureName: 'Quản lý thành viên, ghế ngồi & phân quyền RBAC',
    permissionKey: 'workspace.manage',
    owner: true,
    admin: true,
    editor: false,
    viewer: false,
  },
  {
    module: 'Chiến Dịch & Nhiệm Vụ (M10, M09)',
    featureName: 'Tạo, sửa & quản trị chiến dịch',
    permissionKey: 'campaigns.manage',
    owner: true,
    admin: true,
    editor: true,
    viewer: false,
  },
];

export function getUserRoleKey(rawRole?: string): RoleKey {
  const r = (rawRole || '').toUpperCase();
  if (r === 'SUPER_ADMIN' || r === 'OWNER') return 'owner';
  if (r === 'ADMIN') return 'admin';
  if (r === 'EDITOR') return 'editor';
  return 'viewer'; // STAFF, VIEWER
}

export function getRoleDisplayName(rawRole?: string): string {
  const r = (rawRole || '').toUpperCase();
  if (r === 'SUPER_ADMIN') return 'Super Admin (Chủ sở hữu)';
  if (r === 'OWNER') return 'Chủ sở hữu (Owner)';
  if (r === 'ADMIN') return 'Quản Trị Viên (Admin)';
  if (r === 'EDITOR') return 'Biên Tập Viên (Editor)';
  return 'Nhân Viên (Staff / Viewer)';
}

export function canUser(
  permissionKey: string,
  role?: string,
  customMatrix?: RolePermissionItem[]
): boolean {
  const roleKey = getUserRoleKey(role);
  if (roleKey === 'owner') return true;

  const matrix = customMatrix || DEFAULT_RBAC_MATRIX;
  const item = matrix.find((p) => p.permissionKey === permissionKey);
  if (!item) {
    return roleKey === 'admin';
  }
  return Boolean(item[roleKey]);
}

let cachedMatrix: RolePermissionItem[] | null = null;

export function useRbac() {
  const [matrix, setMatrix] = useState<RolePermissionItem[]>(cachedMatrix || DEFAULT_RBAC_MATRIX);

  let currentUser: any = null;
  try {
    const raw = localStorage.getItem('topify_user') || localStorage.getItem('user');
    currentUser = raw ? JSON.parse(raw) : null;
  } catch {}

  const role = currentUser?.role;
  const roleKey = getUserRoleKey(role);
  const isOwner = roleKey === 'owner';
  const isAdmin = roleKey === 'admin' || isOwner;
  const isEditor = roleKey === 'editor';
  const isViewer = roleKey === 'viewer';
  const isStaff = isViewer;

  useEffect(() => {
    let isMounted = true;
    api.get('/security/rbac')
      .then((res) => {
        if (res.data?.permissions && isMounted) {
          cachedMatrix = res.data.permissions;
          setMatrix(res.data.permissions);
        }
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, []);

  const can = (permissionKey: string): boolean => {
    return canUser(permissionKey, role, matrix);
  };

  return {
    currentUser,
    role,
    roleKey,
    roleDisplayName: getRoleDisplayName(role),
    isOwner,
    isAdmin,
    isEditor,
    isViewer,
    isStaff,
    matrix,
    can,
  };
}
