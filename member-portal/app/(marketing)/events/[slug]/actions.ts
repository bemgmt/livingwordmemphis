"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function toggleRsvp(
  sanityEventId: string,
  slug: string,
  title: string,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false as const, error: "Not authenticated." };

  const { data: existing } = await supabase
    .from("event_rsvps")
    .select("id")
    .eq("sanity_event_id", sanityEventId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("event_rsvps")
      .delete()
      .eq("id", existing.id);
    if (error) return { ok: false as const, error: error.message };
    revalidatePath(`/events/${slug}`);
    return { ok: true as const, registered: false };
  }

  const { error } = await supabase.from("event_rsvps").insert({
    sanity_event_id: sanityEventId,
    sanity_event_slug: slug,
    sanity_event_title: title,
    user_id: user.id,
  });

  if (error) return { ok: false as const, error: error.message };
  revalidatePath(`/events/${slug}`);
  return { ok: true as const, registered: true };
}
