"use client";

import { useAdminRole } from "@/components/admin/admin-role-context";
import { meetsMinRole, type AdminRole } from "@/lib/auth/staff";

export function RoleGate({
  minRole,
  children,
}: {
  minRole: AdminRole;
  children: React.ReactNode;
}) {
  const { role } = useAdminRole();
  if (!meetsMinRole(role, minRole)) return null;
  return <>{children}</>;
}
