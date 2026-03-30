"use client";

import { createClient } from "@/lib/supabase/client";

/** Fire-and-forget analytics event; see docs/portal/analytics-taxonomy.md */
export async function trackEvent(
  name: string,
  properties: Record<string, string | number | boolean> = {},
) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await supabase.from("analytics_events").insert({
      name,
      properties,
      user_id: user?.id ?? null,
    });
  } catch {
    /* non-blocking */
  }
}
