import { requireAuth } from "@/lib/supabase/auth-helpers";

import { BibleReader } from "./bible-reader";

export default async function MemberBiblePage() {
  const { supabase } = await requireAuth();

  const { data: translations } = await supabase
    .from("bible_translations")
    .select("id, name, abbreviation, module, has_strongs")
    .eq("is_active", true)
    .order("name");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-medium text-foreground">
          Bible
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Read, study, and interact with Scripture.
        </p>
      </div>
      <BibleReader translations={translations ?? []} />
    </div>
  );
}
