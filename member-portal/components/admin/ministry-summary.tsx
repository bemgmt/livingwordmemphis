import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export async function MinistrySummary() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("ministry_enrollment_summary");
  const schools = (data ?? []) as {
    id: string;
    title: string;
    pending: number;
    ready: number;
    approved: number;
  }[];
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif text-2xl">
          <h2>School of Ministry</h2>
        </CardTitle>
        <CardDescription>
          $500 per semester · $1,000 annually. Record spring tuition, then
          approve each student.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <p role="status">
            Enrollment totals are unavailable. Open school administration to
            retry.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {schools.map((school) => (
              <Link
                key={school.id}
                href={`/admin/school-of-ministry?school=${school.id}`}
                className="rounded-lg border p-4 hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              >
                <h3 className="font-medium">{school.title}</h3>
                <p className="mt-2 text-sm">
                  {school.pending} pending · {school.ready} ready for approval
                </p>
                <p className="text-sm text-muted-foreground">
                  {school.approved} approved students
                </p>
              </Link>
            ))}
          </div>
        )}
        <Button asChild>
          <Link href="/admin/school-of-ministry">
            Review payments &amp; approve students
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
