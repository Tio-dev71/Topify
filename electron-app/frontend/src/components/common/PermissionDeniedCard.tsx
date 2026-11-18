import React from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRbac } from '../../lib/rbac';

interface PermissionDeniedCardProps {
  permissionKey?: string;
  moduleName?: string;
  onGoBack?: () => void;
}

export function PermissionDeniedCard({
  permissionKey,
  moduleName,
  onGoBack,
}: PermissionDeniedCardProps) {
  const navigate = useNavigate();
  const { roleDisplayName } = useRbac();

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6 animate-in fade-in duration-200">
      <div className="max-w-md w-full bg-white rounded-3xl border border-rose-100 shadow-xl p-8 text-center space-y-4">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner border border-rose-100">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-xl font-bold text-gray-900">Truy Cập Bị Giới Hạn (403)</h2>
          <p className="text-xs text-gray-500 leading-relaxed">
            Tài khoản của bạn đang có vai trò <span className="font-semibold text-gray-800">{roleDisplayName}</span>.
            {moduleName ? ` Phân hệ "${moduleName}"` : ' Phân hệ này'} hiện chưa được cấp quyền truy cập theo cấu hình <strong>Ma Trận Phân Quyền (RBAC)</strong>.
          </p>
        </div>

        {permissionKey && (
          <div className="inline-block px-3 py-1 bg-gray-50 border border-gray-200 rounded-xl text-[11px] font-mono text-gray-600">
            Quyền yêu cầu: <span className="text-rose-600 font-bold">{permissionKey}</span>
          </div>
        )}

        <div className="pt-2 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => (onGoBack ? onGoBack() : navigate('/dashboard'))}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold transition-all shadow-md"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Quay Về Tổng Quan
          </button>
        </div>
      </div>
    </div>
  );
}

export function RbacGuard({
  permission,
  moduleName,
  children,
}: {
  permission: string;
  moduleName?: string;
  children: React.ReactNode;
}) {
  const { can, isOwner } = useRbac();

  if (isOwner || can(permission)) {
    return <>{children}</>;
  }

  return <PermissionDeniedCard permissionKey={permission} moduleName={moduleName} />;
}
