"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function deletePrayerRequest(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("prayer_requests").delete().eq("id", id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/admin/prayer");
  return { ok: true as const };
}

export async function updatePrayerRequest(
  id: string,
  data: { title?: string; body?: string; visibility?: string },
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("prayer_requests")
    .update(data)
    .eq("id", id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/admin/prayer");
  return { ok: true as const };
}
