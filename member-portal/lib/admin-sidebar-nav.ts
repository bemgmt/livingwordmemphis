import {
  LayoutDashboard,
  Users,
  Heart,
  MessageSquare,
  MessagesSquare,
  FolderOpen,
  CalendarCheck,
  Palette,
  Flag,
  Shield,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { AdminRole } from "@/lib/auth/staff";

export type AdminNavItem = {
  readonly href: string;
  readonly label: string;
  readonly icon: LucideIcon;
  readonly minRole: AdminRole;
};

export const adminSidebarNav: AdminNavItem[] = [
  {
    href: "/admin/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    minRole: "staff",
  },
  {
    href: "/admin/members",
    label: "Members",
    icon: Users,
    minRole: "executive",
  },
  {
    href: "/admin/prayer",
    label: "Prayer Requests",
    icon: Heart,
    minRole: "staff",
  },
  {
    href: "/admin/bulletin",
    label: "Bulletin Board",
    icon: MessageSquare,
    minRole: "staff",
  },
  {
    href: "/admin/forum",
    label: "Forum",
    icon: MessagesSquare,
    minRole: "staff",
  },
  {
    href: "/admin/groups",
    label: "Groups",
    icon: FolderOpen,
    minRole: "staff",
  },
  {
    href: "/admin/events",
    label: "Events",
    icon: CalendarCheck,
    minRole: "staff",
  },
  {
    href: "/admin/reports",
    label: "Reports",
    icon: Flag,
    minRole: "staff",
  },
  {
    href: "/admin/studio",
    label: "Content (CMS)",
    icon: Palette,
    minRole: "staff",
  },
  {
    href: "/admin/settings",
    label: "Settings",
    icon: Shield,
    minRole: "apostle",
  },
];
