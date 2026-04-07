"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type GivingResult = { ok: true } | { ok: false; error: string };

export async function savePersonalGivingNote(
  _prev: GivingResult | undefined,
  formData: FormData,
): Promise<GivingResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const amount = Number(formData.get("amount"));
  const category = String(formData.get("category") ?? "").trim();
  const categoryDetail = String(formData.get("category_detail") ?? "")
    .trim()
    .slice(0, 120);

  if (!Number.isFinite(amount) || amount <= 0 || !category) {
    return { ok: false, error: "Please enter a valid amount and category." };
  }

  const detail =
    category === "other" ? categoryDetail || "other" : categoryDetail || null;

  const { error } = await supabase.from("personal_giving_notes").insert({
    user_id: user.id,
    amount_usd: amount,
    category,
    category_detail: detail,
  });

  if (error) {
    console.error("savePersonalGivingNote:", error);
    return { ok: false, error: "Could not save your giving note." };
  }

  revalidatePath("/member/giving");
  revalidatePath("/member/dashboard");
  return { ok: true };
}
