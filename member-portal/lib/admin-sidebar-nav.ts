import {
  LayoutDashboard,
  Users,
  Heart,
  MessageSquare,
  MessagesSquare,
  FolderOpen,
  Palette,
} from "lucide-react";

export const adminSidebarNav = [
  {
    href: "/admin/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/admin/members",
    label: "Members",
    icon: Users,
  },
  {
    href: "/admin/prayer",
    label: "Prayer Requests",
    icon: Heart,
  },
  {
    href: "/admin/bulletin",
    label: "Bulletin Board",
    icon: MessageSquare,
  },
  {
    href: "/admin/forum",
    label: "Forum",
    icon: MessagesSquare,
  },
  {
    href: "/admin/groups",
    label: "Groups",
    icon: FolderOpen,
  },
  {
    href: "/admin/studio",
    label: "Content (CMS)",
    icon: Palette,
  },
] as const;
