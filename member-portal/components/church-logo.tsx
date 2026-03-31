import Link from "next/link";

import { cn } from "@/lib/utils";

type ChurchLogoProps = {
  heightClass?: string;
  className?: string;
  /** Default: member dashboard; use `/` on public marketing pages. */
  href?: string;
  /** Light text for transparent nav over imagery/video. */
  onDark?: boolean;
};

export function ChurchLogo({
  heightClass = "h-11",
  className = "",
  href = "/member/dashboard",
  onDark = false,
}: ChurchLogoProps) {
  return (
    <Link
      href={href}
      className={cn("flex flex-col justify-center", heightClass, className)}
    >
      <span
        className={cn(
          "font-serif text-lg font-semibold leading-tight tracking-tight",
          onDark ? "text-white" : "text-foreground",
        )}
      >
        Living Word
      </span>
      <span
        className={cn(
          "text-[10px] font-sans font-medium uppercase tracking-[0.2em]",
          onDark ? "text-white/80" : "text-muted-foreground",
        )}
      >
        Memphis
      </span>
    </Link>
  );
}
