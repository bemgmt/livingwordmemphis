"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { type UpdateProfileResult, updateProfile } from "./actions";

type ProfileRow = {
  display_name: string | null;
  preferred_bible_version: string | null;
  phone: string | null;
  bio: string | null;
  avatar_url: string | null;
};

type BibleTranslation = { abbreviation: string; name: string };

export function ProfileClient({
  profile,
  bibleTranslations = [],
}: {
  profile: ProfileRow | null;
  bibleTranslations?: BibleTranslation[];
}) {
  const [state, formAction, isPending] = useActionState<
    UpdateProfileResult | undefined,
    FormData
  >(updateProfile, undefined);

  useEffect(() => {
    if (state?.ok) {
      toast.success("Profile saved");
    } else if (state?.ok === false) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="font-serif text-xl font-medium">
          Your details
        </CardTitle>
        <CardDescription>
          Updates apply to your member profile. Staff may use this for pastoral
          care and directory accuracy.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="display_name">Display name</Label>
            <Input
              id="display_name"
              name="display_name"
              defaultValue={profile?.display_name ?? ""}
              maxLength={200}
              autoComplete="name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="preferred_bible_version">
              Preferred Bible version
            </Label>
            {bibleTranslations.length > 0 ? (
              <select
                id="preferred_bible_version"
                name="preferred_bible_version"
                defaultValue={profile?.preferred_bible_version ?? ""}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">— no preference —</option>
                {bibleTranslations.map((t) => (
                  <option key={t.abbreviation} value={t.abbreviation}>
                    {t.abbreviation} — {t.name}
                  </option>
                ))}
              </select>
            ) : (
              <Input
                id="preferred_bible_version"
                name="preferred_bible_version"
                defaultValue={profile?.preferred_bible_version ?? ""}
                placeholder="e.g. KJV, ASV"
                maxLength={80}
              />
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              defaultValue={profile?.phone ?? ""}
              autoComplete="tel"
              maxLength={40}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              name="bio"
              defaultValue={profile?.bio ?? ""}
              placeholder="A short introduction about yourself"
              rows={3}
              maxLength={500}
            />
          </div>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving…" : "Save profile"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
