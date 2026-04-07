"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const VISIBILITY = new Set([
  "pastoral_staff_only",
  "prayer_ministry",
  "public_praise_ok",
]);

export type PrayerResult = { ok: true } | { ok: false; error: string };

export async function submitPrayerRequest(
  _prev: PrayerResult | undefined,
  formData: FormData,
): Promise<PrayerResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const body = String(formData.get("body") ?? "").trim().slice(0, 5000);
  const titleRaw = String(formData.get("title") ?? "").trim().slice(0, 200);
  const visibility = String(formData.get("visibility") ?? "");
  const isAnonymous = formData.get("is_anonymous_to_team") === "on";

  if (!body) {
    return { ok: false, error: "Please describe your prayer need." };
  }

  if (!VISIBILITY.has(visibility)) {
    return { ok: false, error: "Please select a visibility option." };
  }

  const { error } = await supabase.from("prayer_requests").insert({
    user_id: user.id,
    body,
    title: titleRaw || null,
    visibility,
    is_anonymous_to_team: isAnonymous,
  });

  if (error) {
    console.error("submitPrayerRequest:", error);
    return { ok: false, error: "Could not save your prayer request." };
  }

  revalidatePath("/member/dashboard");
  revalidatePath("/member/prayer");
  return { ok: true };
}
