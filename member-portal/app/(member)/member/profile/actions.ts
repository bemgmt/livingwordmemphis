"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type UpdateProfileResult = { ok: true } | { ok: false; error: string };

export async function updateProfile(
  _prev: UpdateProfileResult | undefined,
  formData: FormData,
): Promise<UpdateProfileResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const display_name = String(formData.get("display_name") ?? "").trim();
  const preferred_bible_version = String(
    formData.get("preferred_bible_version") ?? "",
  ).trim();
  const phone = String(formData.get("phone") ?? "").trim();

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: display_name || null,
      preferred_bible_version: preferred_bible_version || null,
      phone: phone || null,
    })
    .eq("id", user.id);

  if (error) {
    console.error(error);
    return { ok: false, error: "Could not save profile." };
  }

  revalidatePath("/member/profile");
  revalidatePath("/member/dashboard");
  return { ok: true };
}
