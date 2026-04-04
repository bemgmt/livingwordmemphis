import { requireAuth } from "@/lib/supabase/auth-helpers";

import { BibleReader } from "./bible-reader";

export default async function MemberBiblePage() {
  const { supabase } = await requireAuth();

  const { data: bibles } = await supabase
    .from("approved_bibles")
    .select("id, name, abbreviation, api_bible_id")
    .eq("is_active", true)
    .order("name");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-medium text-foreground">
          Bible
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Read and study approved Bible translations.
        </p>
      </div>
      <BibleReader approvedBibles={bibles ?? []} />
    </div>
  );
}
