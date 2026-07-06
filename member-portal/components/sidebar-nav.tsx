"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { meetsMinRole, type AdminRole } from "@/lib/auth/staff";
import { memberSidebarNav } from "@/lib/member-sidebar-nav";
import { adminSidebarNav, type AdminNavItem } from "@/lib/admin-sidebar-nav";

type NavItem = {
  readonly href: string;
  readonly label: string;
  readonly icon: LucideIcon;
  readonly youthMinistryOnly?: boolean;
};

type NavVariant = "member" | "admin";

function getItems(
  variant: NavVariant,
  adminRole?: AdminRole,
  isYouthMember?: boolean,
): NavItem[] {
  if (variant === "member") {
    return memberSidebarNav.filter(
      (item) => !item.youthMinistryOnly || isYouthMember,
    ) as NavItem[];
  }
  return adminSidebarNav.filter((item: AdminNavItem) =>
    meetsMinRole(adminRole ?? null, item.minRole),
  );
}

function NavLink({
  item,
  pathname,
  onClick,
}: {
  item: NavItem;
  pathname: string;
  onClick?: () => void;
}) {
  const isActive =
    pathname === item.href || pathname.startsWith(`${item.href}/`);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
        isActive
          ? "bg-primary/10 font-medium text-primary"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      }`}
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      {item.label}
    </Link>
  );
}

export function SidebarNav({
  variant,
  adminRole,
  isYouthMember,
  footer,
}: {
  variant: NavVariant;
  adminRole?: AdminRole;
  isYouthMember?: boolean;
  footer?: React.ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const items = getItems(variant, adminRole, isYouthMember);

  return (
    <nav className="flex flex-1 flex-col gap-1">
      {items.map((item) => (
        <NavLink key={item.href} item={item} pathname={pathname} />
      ))}
      {footer && (
        <div className="mt-auto border-t border-border pt-4">{footer}</div>
      )}
    </nav>
  );
}

export function MobileNav({
  variant,
  title,
  adminRole,
  isYouthMember,
  footer,
}: {
  variant: NavVariant;
  title: string;
  adminRole?: AdminRole;
  isYouthMember?: boolean;
  footer?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname() ?? "";
  const items = getItems(variant, adminRole, isYouthMember);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="lg:hidden">
          <Menu className="size-4" aria-hidden />
          <span className="ml-2">Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-6">
        <SheetHeader>
          <SheetTitle className="text-left font-serif text-lg">
            {title}
          </SheetTitle>
        </SheetHeader>
        <nav className="mt-6 flex flex-col gap-1">
          {items.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              pathname={pathname}
              onClick={() => setOpen(false)}
            />
          ))}
        </nav>
        {footer && (
          <div className="mt-auto border-t border-border pt-4">{footer}</div>
        )}
      </SheetContent>
    </Sheet>
  );
}
