import { redirect } from "next/navigation";
import { Download, FolderOpen, Users } from "lucide-react";

import { requireAuth } from "@/lib/supabase/auth-helpers";
import { sanityFetch } from "@/lib/sanity/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type YouthDocument = {
  _id: string;
  title: string;
  description: string | null;
  series: string | null;
  week: number | null;
  resourceType: string | null;
  fileUrl: string | null;
};

const documentsQuery = `*[_type == "youthMinistryDocument"] | order(series asc, week asc) {
  _id,
  title,
  description,
  series,
  week,
  resourceType,
  "fileUrl": file.asset->url
}`;

const resourceTypeLabels: Record<string, string> = {
  overview: "Overview",
  "shopping-prep": "Shopping / prep list",
  "high-school-hacks": "High school hacks",
  "middle-school-hacks": "Middle school hacks",
  "lesson-outline": "Lesson outline",
  "lesson-guide": "Lesson guide",
  "discussion-questions": "Discussion questions",
  handout: "Handout",
};

const resourceOrder = [
  "overview",
  "shopping-prep",
  "high-school-hacks",
  "middle-school-hacks",
  "lesson-outline",
  "lesson-guide",
  "discussion-questions",
  "handout",
];

function documentLabel(document: YouthDocument) {
  return document.resourceType
    ? resourceTypeLabels[document.resourceType] ?? document.title
    : document.title;
}

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

  const bySeries = documents.reduce<Record<string, YouthDocument[]>>(
    (acc, document) => {
      const series = document.series || "Other";
      if (!acc[series]) acc[series] = [];
      acc[series].push(document);
      return acc;
    },
    {},
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
        {Object.entries(bySeries).map(([series, seriesDocuments]) => {
          const folders = [
            {
              label: "Series resources",
              documents: seriesDocuments.filter((document) => !document.week),
            },
            ...Array.from(
              new Set(
                seriesDocuments.flatMap((document) =>
                  document.week ? [document.week] : [],
                ),
              ),
            )
              .sort((a, b) => a - b)
              .map((week) => ({
                label: `Week ${week}`,
                documents: seriesDocuments
                  .filter((document) => document.week === week)
                  .sort(
                    (a, b) =>
                      resourceOrder.indexOf(a.resourceType ?? "") -
                      resourceOrder.indexOf(b.resourceType ?? ""),
                  ),
              })),
          ].filter((folder) => folder.documents.length > 0);

          return (
            <Card key={series}>
              <CardHeader>
                <CardTitle className="font-serif text-xl font-medium">
                  {series}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {folders.map((folder) => (
                  <section key={folder.label}>
                    <h3 className="mb-3 flex items-center gap-2 font-medium text-foreground">
                      <FolderOpen className="size-4 text-primary" aria-hidden />
                      {folder.label}
                    </h3>
                    <ul className="space-y-3">
                      {folder.documents.map((document) => (
                        <li
                          key={document._id}
                          className="flex flex-col gap-2 rounded-lg border border-border p-4 transition-colors hover:bg-secondary/50 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <p className="font-medium text-foreground">
                              {documentLabel(document)}
                            </p>
                            {document.description && (
                              <p className="text-sm text-muted-foreground">
                                {document.description}
                              </p>
                            )}
                          </div>
                          {document.fileUrl && (
                            <a
                              href={`${document.fileUrl}?dl=`}
                              className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
                            >
                              <Download className="size-4" aria-hidden />
                              Download
                            </a>
                          )}
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </CardContent>
            </Card>
          );
        })}

        {Object.keys(bySeries).length === 0 && (
          <p className="text-muted-foreground">No documents uploaded yet.</p>
        )}
      </div>
    </div>
  );
}