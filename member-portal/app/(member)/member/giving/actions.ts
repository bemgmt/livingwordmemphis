"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function savePersonalGivingNote(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const amount = Number(formData.get("amount"));
  const category = String(formData.get("category") ?? "").trim();
  const categoryDetail = String(formData.get("category_detail") ?? "").trim();

  if (!Number.isFinite(amount) || amount <= 0 || !category) {
    redirect("/member/giving?error=invalid");
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
    console.error(error);
    redirect("/member/giving?error=save");
  }

  revalidatePath("/member/giving");
  redirect("/member/dashboard?giving=saved");
}
