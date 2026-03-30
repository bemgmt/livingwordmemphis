"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const VISIBILITY = new Set([
  "pastoral_staff_only",
  "prayer_ministry",
  "public_praise_ok",
]);

export async function submitPrayerRequest(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const body = String(formData.get("body") ?? "").trim();
  const titleRaw = String(formData.get("title") ?? "").trim();
  const visibility = String(formData.get("visibility") ?? "");
  const isAnonymous = formData.get("is_anonymous_to_team") === "on";

  if (!body) {
    redirect("/member/prayer?error=body");
  }

  if (!VISIBILITY.has(visibility)) {
    redirect("/member/prayer?error=visibility");
  }

  const { error } = await supabase.from("prayer_requests").insert({
    user_id: user.id,
    body,
    title: titleRaw || null,
    visibility,
    is_anonymous_to_team: isAnonymous,
  });

  if (error) {
    console.error(error);
    redirect("/member/prayer?error=save");
  }

  revalidatePath("/member/dashboard");
  redirect("/member/dashboard?prayer=submitted");
}
