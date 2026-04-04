"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requestToJoinGroup(groupId: string, message: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { error } = await supabase.from("group_join_requests").insert({
    group_id: groupId,
    user_id: user.id,
    message: message.trim() || null,
  });

  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/member/groups");
  return { ok: true as const };
}
