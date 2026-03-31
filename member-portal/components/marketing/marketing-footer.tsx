export function MarketingFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border bg-card py-8 text-center text-sm text-muted-foreground">
      <p>
        &copy; {year} Living Word Memphis. All rights reserved.
      </p>
    </footer>
  );
}
