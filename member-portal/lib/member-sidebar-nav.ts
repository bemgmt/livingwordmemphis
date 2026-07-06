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
  Users,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";

export type MemberNavItem = {
  readonly href: string;
  readonly label: string;
  readonly icon: LucideIcon;
  readonly youthMinistryOnly?: boolean;
};

export const memberSidebarNav: MemberNavItem[] = [
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
  {
    href: "/member/youth",
    label: "Youth Ministry",
    icon: Users,
    youthMinistryOnly: true,
  },
];
