import Link from "next/link";

type ChurchLogoProps = {
  heightClass?: string;
  className?: string;
};

export function ChurchLogo({
  heightClass = "h-11",
  className = "",
}: ChurchLogoProps) {
  return (
    <Link
      href="/member/dashboard"
      className={`flex flex-col justify-center ${heightClass} ${className}`}
    >
      <span className="font-serif text-lg font-semibold leading-tight tracking-tight text-foreground">
        Living Word
      </span>
      <span className="text-[10px] font-sans font-medium uppercase tracking-[0.2em] text-muted-foreground">
        Memphis
      </span>
    </Link>
  );
}
