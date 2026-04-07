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
import { memberSidebarNav } from "@/lib/member-sidebar-nav";
import { adminSidebarNav } from "@/lib/admin-sidebar-nav";

type NavItem = {
  readonly href: string;
  readonly label: string;
  readonly icon: LucideIcon;
};

type NavVariant = "member" | "admin";

const navItems: Record<NavVariant, readonly NavItem[]> = {
  member: memberSidebarNav,
  admin: adminSidebarNav,
};

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
  footer,
}: {
  variant: NavVariant;
  footer?: React.ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const items = navItems[variant];

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
  footer,
}: {
  variant: NavVariant;
  title: string;
  footer?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname() ?? "";
  const items = navItems[variant];

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
