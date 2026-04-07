"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export function Pagination({
  page,
  pageSize,
  totalCount,
}: {
  page: number;
  pageSize: number;
  totalCount: number;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const totalPages = Math.ceil(totalCount / pageSize);

  if (totalPages <= 1) return null;

  function makeHref(p: number) {
    const params = new URLSearchParams(searchParams?.toString());
    if (p <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(p));
    }
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  return (
    <div className="flex items-center justify-center gap-2 pt-4">
      <Button variant="outline" size="sm" asChild disabled={page <= 1}>
        <Link
          href={makeHref(page - 1)}
          aria-disabled={page <= 1}
          className={page <= 1 ? "pointer-events-none opacity-50" : ""}
        >
          <ChevronLeft className="size-4" aria-hidden />
          Previous
        </Link>
      </Button>
      <span className="text-sm text-muted-foreground">
        Page {page} of {totalPages}
      </span>
      <Button variant="outline" size="sm" asChild disabled={page >= totalPages}>
        <Link
          href={makeHref(page + 1)}
          aria-disabled={page >= totalPages}
          className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
        >
          Next
          <ChevronRight className="size-4" aria-hidden />
        </Link>
      </Button>
    </div>
  );
}
