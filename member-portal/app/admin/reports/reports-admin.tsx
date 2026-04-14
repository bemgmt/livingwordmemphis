"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

import { updateReportStatus, removeReportedContent } from "./actions";

type Report = {
  id: string;
  content_type: string;
  content_id: string;
  reason: string | null;
  status: string;
  created_at: string;
  reporter_name: string | null;
};

const TYPE_LABELS: Record<string, string> = {
  bulletin_post: "Bulletin post",
  bulletin_comment: "Bulletin comment",
  forum_topic: "Forum topic",
  forum_reply: "Forum reply",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  reviewed: "bg-blue-100 text-blue-800",
  removed: "bg-red-100 text-red-800",
};

export function ReportsAdmin({ reports }: { reports: Report[] }) {
  const [filter, setFilter] = useState<"all" | "pending" | "reviewed" | "removed">("pending");
  const [isPending, startTransition] = useTransition();

  const filtered = filter === "all"
    ? reports
    : reports.filter((r) => r.status === filter);

  function handleDismiss(reportId: string) {
    startTransition(async () => {
      const res = await updateReportStatus(reportId, "reviewed");
      if (!res.ok) toast.error(res.error);
      else toast.success("Report dismissed");
    });
  }

  function handleRemove(reportId: string, contentType: string, contentId: string) {
    startTransition(async () => {
      const res = await removeReportedContent(reportId, contentType, contentId);
      if (!res.ok) toast.error(res.error);
      else toast.success("Content removed");
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(["pending", "reviewed", "removed", "all"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filter === s
                ? "bg-primary text-primary-foreground"
                : "border border-border text-muted-foreground hover:bg-secondary"
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((report) => (
          <Card key={report.id}>
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base font-medium">
                    {TYPE_LABELS[report.content_type] ?? report.content_type}
                  </CardTitle>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[report.status] ?? ""}`}
                  >
                    {report.status}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(report.created_at).toLocaleDateString()}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {report.reason && (
                <p className="text-sm text-foreground">
                  <span className="font-medium">Reason:</span> {report.reason}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Reported by {report.reporter_name || "anonymous"}
              </p>
              {report.status === "pending" && (
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isPending}
                    onClick={() => handleDismiss(report.id)}
                  >
                    Dismiss
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" disabled={isPending}>
                        Remove content
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove content?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete the reported content. This
                          cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() =>
                            handleRemove(
                              report.id,
                              report.content_type,
                              report.content_id,
                            )
                          }
                        >
                          Remove
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No {filter === "all" ? "" : filter} reports.
          </p>
        )}
      </div>
    </div>
  );
}
