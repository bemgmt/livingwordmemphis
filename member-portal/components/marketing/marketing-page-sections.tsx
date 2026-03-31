import { cn } from "@/lib/utils";

export function PageHeroText({
  eyebrow,
  title,
  subtitle,
  className,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <header className={cn("space-y-4", className)}>
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground text-balance md:text-4xl lg:text-5xl">
        {title}
      </h1>
      {subtitle ? (
        <p className="max-w-2xl text-lg font-medium leading-relaxed text-muted-foreground md:text-xl">
          {subtitle}
        </p>
      ) : null}
    </header>
  );
}

export function ContentSection({
  id,
  title,
  children,
  className,
  intro,
}: {
  id?: string;
  title: string;
  children: React.ReactNode;
  className?: string;
  intro?: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className={cn("space-y-6", className)}
      aria-labelledby={id ? `${id}-heading` : undefined}
    >
      <h2
        id={id ? `${id}-heading` : undefined}
        className="font-serif text-2xl font-semibold tracking-tight text-foreground md:text-3xl"
      >
        {title}
      </h2>
      {intro ? (
        <div className="text-base leading-relaxed text-muted-foreground">
          {intro}
        </div>
      ) : null}
      <div className="space-y-5 text-base leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  );
}

export function ValueGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <ul
      className={cn(
        "grid gap-6 sm:grid-cols-2",
        className,
      )}
    >
      {children}
    </ul>
  );
}

export function ValueCard({
  title,
  children,
  icon,
}: {
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <li className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex gap-4">
        {icon ? (
          <div className="mt-0.5 shrink-0 text-primary [&_svg]:size-6" aria-hidden>
            {icon}
          </div>
        ) : null}
        <div className="min-w-0 space-y-2">
          <h3 className="font-serif text-lg font-semibold tracking-tight text-foreground">
            {title}
          </h3>
          <p className="text-sm leading-relaxed text-muted-foreground">{children}</p>
        </div>
      </div>
    </li>
  );
}

export function PageShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto max-w-4xl px-4 py-12 sm:px-6 md:py-16 lg:py-20", className)}>
      {children}
    </div>
  );
}

export function Band({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("border-y border-border bg-muted/30", className)}>
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 md:py-16">{children}</div>
    </div>
  );
}
