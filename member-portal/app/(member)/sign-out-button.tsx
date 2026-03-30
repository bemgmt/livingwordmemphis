"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function MemberSignOut() {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="h-auto w-full justify-start px-2 py-1.5 text-sm text-muted-foreground hover:bg-transparent hover:text-destructive"
      onClick={async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        window.location.href = "/auth/login";
      }}
    >
      Sign out
    </Button>
  );
}
