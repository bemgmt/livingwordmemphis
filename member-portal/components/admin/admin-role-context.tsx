"use client";

import { createContext, useContext } from "react";
import type { AdminRole } from "@/lib/auth/staff";

type AdminRoleContextValue = {
  role: AdminRole;
  userId: string;
};

const AdminRoleContext = createContext<AdminRoleContextValue | null>(null);

export function AdminRoleProvider({
  role,
  userId,
  children,
}: {
  role: AdminRole;
  userId: string;
  children: React.ReactNode;
}) {
  return (
    <AdminRoleContext.Provider value={{ role, userId }}>
      {children}
    </AdminRoleContext.Provider>
  );
}

export function useAdminRole(): AdminRoleContextValue {
  const ctx = useContext(AdminRoleContext);
  if (!ctx) {
    throw new Error("useAdminRole must be used within an AdminRoleProvider");
  }
  return ctx;
}
