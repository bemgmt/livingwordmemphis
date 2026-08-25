"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { deleteYouthCurriculum } from "./actions";

export type ManageableCurriculumDocument = {
  _id: string;
  title: string;
  series: string | null;
  week: number | null;
  resourceType: string | null;
  protectedFile: {
    originalFilename: string | null;
    storagePath: string | null;
  } | null;
};

function canonicalSeriesName(series: string | null) {
  const name = series?.trim() || "Other";
  return /^wonder(?:\s|\(|$)/i.test(name) ? "Wonder" : name;
}

function locationLabel(document: ManageableCurriculumDocument) {
  return document.week ? `Week ${document.week}` : "Series resources";
}

export function CurriculumManager({
  documents: initialDocuments,
}: {
  documents: ManageableCurriculumDocument[];
}) {
  const router = useRouter();
  const [documents, setDocuments] = useState(initialDocuments);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [seriesFilter, setSeriesFilter] = useState("all");
  const [isDeleting, setIsDeleting] = useState(false);

  const seriesOptions = useMemo(
    () =>
      Array.from(
        new Set(documents.map((document) => canonicalSeriesName(document.series))),
      ).sort((left, right) => left.localeCompare(right)),
    [documents],
  );

  const visibleDocuments = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return documents.filter((document) => {
      const series = canonicalSeriesName(document.series);
      if (seriesFilter !== "all" && series !== seriesFilter) return false;
      if (!normalizedSearch) return true;

      return [
        document.title,
        document.protectedFile?.originalFilename,
        series,
        locationLabel(document),
      ].some((value) => value?.toLowerCase().includes(normalizedSearch));
    });
  }, [documents, search, seriesFilter]);

  const allVisibleSelected =
    visibleDocuments.length > 0 &&
    visibleDocuments.every((document) => selectedIds.has(document._id));

  function toggleDocument(documentId: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(documentId)) next.delete(documentId);
      else next.add(documentId);
      return next;
    });
  }

  function toggleVisible() {
    setSelectedIds((current) => {
      const next = new Set(current);
      for (const document of visibleDocuments) {
        if (allVisibleSelected) next.delete(document._id);
        else next.add(document._id);
      }
      return next;
    });
  }

  async function deleteSelected() {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    setIsDeleting(true);
    try {
      const result = await deleteYouthCurriculum(ids);

      if (!result.ok) throw new Error(result.error);

      setDocuments((current) =>
        current.filter((document) => !selectedIds.has(document._id)),
      );
      setSelectedIds(new Set());
      toast.success(
        `${result.deleted} curriculum ${
          result.deleted === 1 ? "item" : "items"
        } deleted`,
      );
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "The curriculum could not be deleted.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-4 p-4 sm:p-6">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(12rem,0.35fr)]">
            <label className="relative block">
              <span className="sr-only">Search curriculum</span>
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search title or filename"
                className="min-h-11 w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>
            <label>
              <span className="sr-only">Filter by series</span>
              <select
                value={seriesFilter}
                onChange={(event) => setSeriesFilter(event.target.value)}
                className="min-h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="all">All series</option>
                {seriesOptions.map((series) => (
                  <option key={series} value={series}>
                    {series}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-medium">
              <input
                type="checkbox"
                checked={allVisibleSelected}
                onChange={toggleVisible}
                className="size-4 rounded border-border accent-primary"
              />
              Select all shown ({visibleDocuments.length})
            </label>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="lg"
                  disabled={selectedIds.size === 0 || isDeleting}
                >
                  <Trash2 className="size-4" aria-hidden />
                  Delete selected ({selectedIds.size})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Delete {selectedIds.size} curriculum {selectedIds.size === 1 ? "item" : "items"}?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This permanently removes the selected Sanity records and
                    their protected Supabase files. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    disabled={isDeleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={() => void deleteSelected()}
                  >
                    Permanently delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {visibleDocuments.map((document) => (
          <label
            key={document._id}
            className="flex min-h-16 cursor-pointer items-start gap-3 rounded-lg border border-border bg-card p-4 shadow-sm transition-colors [contain-intrinsic-size:0_96px] [content-visibility:auto] hover:bg-secondary/30"
          >
            <input
              type="checkbox"
              checked={selectedIds.has(document._id)}
              onChange={() => toggleDocument(document._id)}
              className="mt-1 size-4 shrink-0 rounded border-border accent-primary"
            />
            <span className="min-w-0 flex-1">
              <span className="block font-medium text-foreground">
                {document.title}
              </span>
              <span className="mt-1 block text-sm text-muted-foreground">
                {canonicalSeriesName(document.series)} / {locationLabel(document)}
              </span>
              {document.protectedFile?.originalFilename ? (
                <span className="mt-1 block break-all text-xs text-muted-foreground">
                  {document.protectedFile.originalFilename}
                </span>
              ) : null}
            </span>
          </label>
        ))}

        {visibleDocuments.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            {documents.length === 0
              ? "No curriculum is currently uploaded."
              : "No curriculum matches these filters."}
          </p>
        ) : null}
      </div>
    </div>
  );
}
