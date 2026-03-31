import {
  CreditCard,
  Heart,
  LayoutDashboard,
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
