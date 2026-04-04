import { requireAuth } from "@/lib/supabase/auth-helpers";

import { StudyAssistant } from "./study-assistant";

export default async function MemberStudyPage() {
  const { supabase, user } = await requireAuth();

  const { data: sessions } = await supabase
    .from("study_sessions")
    .select("id, title, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(20);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-medium text-foreground">
          Study assistant
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Research Bible topics and deepen your biblical understanding with
          AI-assisted study.
        </p>
      </div>
      <StudyAssistant sessions={sessions ?? []} userId={user.id} />
    </div>
  );
}
