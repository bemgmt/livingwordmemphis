import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardDescription,
} from "@/components/ui/card";

type StatCardProps = {
  label: string;
  value: number | null;
  href?: string;
  trend?: { value: number; label: string };
  icon?: LucideIcon;
};

function TrendBadge({ value, label }: { value: number; label: string }) {
  const isUp = value > 0;
  const isFlat = value === 0;
  const Icon = isFlat ? Minus : isUp ? TrendingUp : TrendingDown;
  const color = isFlat
    ? "text-muted-foreground"
    : isUp
      ? "text-emerald-600"
      : "text-rose-600";

  return (
    <span className={`inline-flex items-center gap-1 text-xs ${color}`}>
      <Icon className="size-3" />
      {isFlat ? "No change" : `${Math.abs(value)} ${label}`}
    </span>
  );
}

export function StatCard({ label, value, href, trend, icon: Icon }: StatCardProps) {
  const inner = (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardDescription>{label}</CardDescription>
          {Icon && <Icon className="size-4 text-muted-foreground" />}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold tabular-nums text-foreground">
          {value ?? "\u2014"}
        </p>
        {trend && <TrendBadge value={trend.value} label={trend.label} />}
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link href={href}>{inner}</Link>;
  }
  return inner;
}
