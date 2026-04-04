import {
  BookOpen,
  CreditCard,
  FolderOpen,
  GraduationCap,
  Heart,
  LayoutDashboard,
  MessageSquare,
  MessagesSquare,
  UserRound,
} from "lucide-react";

export const memberSidebarNav = [
  {
    href: "/member/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/member/profile",
    label: "Profile",
    icon: UserRound,
  },
  {
    href: "/member/bulletin",
    label: "Bulletin Board",
    icon: MessageSquare,
  },
  {
    href: "/member/forum",
    label: "Sermon Forum",
    icon: MessagesSquare,
  },
  {
    href: "/member/bible",
    label: "Bible",
    icon: BookOpen,
  },
  {
    href: "/member/groups",
    label: "Groups",
    icon: FolderOpen,
  },
  {
    href: "/member/study",
    label: "Study Assistant",
    icon: GraduationCap,
  },
  {
    href: "/member/prayer",
    label: "Prayer",
    icon: Heart,
  },
  {
    href: "/member/giving",
    label: "Giving",
    icon: CreditCard,
  },
] as const;
