import type { FC, ReactNode } from 'react';
import { useAuthStore } from '../store/authStore';

interface Props {
  module: string;
  action: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export const PermissionGuard: FC<Props> = ({ module, action, children, fallback = null }) => {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  return hasPermission(module, action) ? <>{children}</> : <>{fallback}</>;
};

export const SuperAdminGuard: FC<{ children: ReactNode }> = ({ children }) => {
  const isSuperAdmin = useAuthStore((s) => s.isSuperAdmin);
  return isSuperAdmin() ? <>{children}</> : null;
};
