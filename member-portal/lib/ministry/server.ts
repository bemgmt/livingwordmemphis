import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function ministrySession() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user || user.is_anonymous) return null;
  return { supabase, user };
}
export const ministryHeaders = {
  "Cache-Control": "private, no-store",
  "Referrer-Policy": "no-referrer",
};
