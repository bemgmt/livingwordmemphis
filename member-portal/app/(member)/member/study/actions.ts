"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createStudySession(title: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data, error } = await supabase
    .from("study_sessions")
    .insert({ user_id: user.id, title: title || "New Study" })
    .select("id")
    .single();

  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/member/study");
  return { ok: true as const, sessionId: data.id };
}

export async function loadSessionMessages(sessionId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("study_messages")
    .select("id, role, content, created_at")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const, messages: data ?? [] };
}

export async function deleteStudySession(sessionId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("study_sessions")
    .delete()
    .eq("id", sessionId);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/member/study");
  return { ok: true as const };
}
