import { redirect } from "next/navigation";
import { Download, Users } from "lucide-react";

import { requireAuth } from "@/lib/supabase/auth-helpers";
import { sanityFetch } from "@/lib/sanity/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type YouthDocument = {
  _id: string;
  title: string;
  description: string | null;
  series: string | null;
  week: number | null;
  fileUrl: string | null;
};

const documentsQuery = `*[_type == "youthMinistryDocument"] | order(series asc, week asc) {
  _id,
  title,
  description,
  series,
  week,
  "fileUrl": file.asset->url
}`;

export default async function YouthMinistryPage() {
  const { supabase, user } = await requireAuth();

  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  const roleSet = new Set(roles?.map((r) => r.role) ?? []);
  const isYouthMember =
    roleSet.has("youth_ministry") ||
    roleSet.has("staff") ||
    roleSet.has("executive") ||
    roleSet.has("apostle");

  if (!isYouthMember) {
    redirect("/member/dashboard");
  }

  const documents = await sanityFetch<YouthDocument[]>(documentsQuery, {}, 10);

  // Group by series
  const bySeries = documents.reduce<Record<string, YouthDocument[]>>(
    (acc, doc) => {
      const series = doc.series || "Other";
      if (!acc[series]) acc[series] = [];
      acc[series].push(doc);
      return acc;
    },
    {}
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="flex items-center gap-2 font-serif text-3xl font-medium text-foreground">
          <Users className="size-8 text-primary" aria-hidden />
          Youth Ministry
        </h1>
        <p className="mt-2 text-muted-foreground">
          Access class documents and curriculum for our youth programs.
        </p>
      </div>

      <div className="grid gap-6">
        {Object.entries(bySeries).map(([series, docs]) => (
          <Card key={series}>
            <CardHeader>
              <CardTitle className="font-serif text-xl font-medium">
                {series}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {docs.map((doc) => (
                  <li
                    key={doc._id}
                    className="flex flex-col gap-2 rounded-lg border border-border p-4 transition-colors hover:bg-secondary/50 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium text-foreground">
                        {doc.title}
                        {doc.week ? (
                          <span className="ml-2 text-sm text-muted-foreground">
                            (Week {doc.week})
                          </span>
                        ) : null}
                      </p>
                      {doc.description && (
                        <p className="text-sm text-muted-foreground">
                          {doc.description}
                        </p>
                      )}
                    </div>
                    {doc.fileUrl && (
                      <a
                        href={`${doc.fileUrl}?dl=`}
                        className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
                      >
                        <Download className="size-4" aria-hidden />
                        Download
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}

        {Object.keys(bySeries).length === 0 && (
          <p className="text-muted-foreground">No documents uploaded yet.</p>
        )}
      </div>
    </div>
  );
}
