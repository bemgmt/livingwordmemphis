import Link from "next/link";
import { ExternalLink } from "lucide-react";

import { savePersonalGivingNote } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requireAuth } from "@/lib/supabase/auth-helpers";

const TITHE_LY_URL =
  "https://tithe.ly/give_new/www/#/tithely/give-one-time/6059493";

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n);
}

export default async function MemberGivingPage() {
  const { supabase, user } = await requireAuth();

  const { data: notes } = await supabase
    .from("personal_giving_notes")
    .select("id, amount_usd, category, category_detail, note_created_at")
    .eq("user_id", user.id)
    .order("note_created_at", { ascending: false });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-medium text-foreground">
          Giving
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Official giving happens through Tithe.ly. Your notes here are private
          reminders only.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-xl font-medium">
            Give securely
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground max-w-xl">
            Tax statements and ledger data come from Tithe.ly and the church
            office. Use the button to complete a gift.
          </p>
          <Button asChild className="shrink-0">
            <a href={TITHE_LY_URL} target="_blank" rel="noopener noreferrer">
              Open Tithe.ly
              <ExternalLink className="size-4" aria-hidden />
            </a>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-xl font-medium">
            Personal giving note
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
            This is <strong>not</strong> your official giving record. You are
            only saving a private reminder on your account.
          </p>
          <form action={savePersonalGivingNote} className="space-y-4 max-w-lg">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (USD)</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                min="0.01"
                step="0.01"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                name="category"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                defaultValue="tithe"
              >
                <option value="tithe">Tithe</option>
                <option value="offering">Offering</option>
                <option value="missions">Missions</option>
                <option value="building">Building / facilities</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category_detail">
                Other detail{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </Label>
              <Input
                id="category_detail"
                name="category_detail"
                type="text"
                maxLength={120}
              />
            </div>
            <Button type="submit">Save note</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-xl font-medium">
            Your saved notes
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {notes?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="p-4 font-medium text-muted-foreground">
                      Date
                    </th>
                    <th className="p-4 font-medium text-muted-foreground">
                      Amount
                    </th>
                    <th className="p-4 font-medium text-muted-foreground">
                      Category
                    </th>
                    <th className="p-4 font-medium text-muted-foreground">
                      Detail
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {notes.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-border last:border-0"
                    >
                      <td className="p-4 text-foreground">
                        {row.note_created_at
                          ? new Date(row.note_created_at).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="p-4 font-medium tabular-nums text-foreground">
                        {formatMoney(Number(row.amount_usd))}
                      </td>
                      <td className="p-4 capitalize text-foreground">
                        {row.category}
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {row.category_detail ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="p-6 pt-0 text-sm text-muted-foreground">
              No notes saved yet.
            </p>
          )}
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        Public giving page:{" "}
        <Link href="/giving.html" className="text-primary hover:underline">
          giving.html
        </Link>
      </p>
    </div>
  );
}
