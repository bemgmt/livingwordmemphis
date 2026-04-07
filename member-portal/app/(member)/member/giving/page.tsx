import Link from "next/link";
import { ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pagination } from "@/components/pagination";
import { requireAuth } from "@/lib/supabase/auth-helpers";

import { GivingNoteForm } from "./giving-note-form";

const TITHE_LY_URL =
  "https://tithe.ly/give_new/www/#/tithely/give-one-time/6059493";
const PAGE_SIZE = 20;

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n);
}

export default async function MemberGivingPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10) || 1);
  const { supabase, user } = await requireAuth();

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data: notes, count } = await supabase
    .from("personal_giving_notes")
    .select("id, amount_usd, category, category_detail, note_created_at", {
      count: "exact",
    })
    .eq("user_id", user.id)
    .order("note_created_at", { ascending: false })
    .range(from, to);

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

      <GivingNoteForm />

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

      <Pagination page={page} pageSize={PAGE_SIZE} totalCount={count ?? 0} />

      <p className="text-sm text-muted-foreground">
        Public giving page:{" "}
        <Link href="/giving.html" className="text-primary hover:underline">
          giving.html
        </Link>
      </p>
    </div>
  );
}
