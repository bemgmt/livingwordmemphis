import { requireAuth } from "@/lib/supabase/auth-helpers";

import { ProfileClient } from "./profile-client";

export default async function ProfilePage() {
  const { supabase, user } = await requireAuth();

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, preferred_bible_version, phone")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-medium text-foreground">
          Profile
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage how we know you in the portal.
        </p>
      </div>
      <ProfileClient profile={profile} />
    </div>
  );
}
