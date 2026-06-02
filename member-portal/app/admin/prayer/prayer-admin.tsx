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

import { deletePrayerRequest, approvePrayer, rejectPrayer } from "./actions";

type ApprovalStatus = "pending" | "approved" | "rejected";

type Prayer = {
  id: string;
  user_id: string;
  title: string | null;
  body: string;
  visibility: string;
  is_anonymous_to_team: boolean;
  created_at: string;
  updated_at: string;
  approval_status: ApprovalStatus;
  approved_by: string | null;
  approved_at: string | null;
};

type FilterTab = "pending" | "approved" | "rejected" | "all";

const VISIBILITY_OPTIONS = [
  "pastoral_staff_only",
  "prayer_ministry",
  "public_praise_ok",
];

function ApprovalBadge({ status }: { status: ApprovalStatus }) {
  if (status === "approved")
    return (
      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
        Approved
      </span>
    );
  if (status === "rejected")
    return (
      <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
        Rejected
      </span>
    );
  return (
    <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
      Pending
    </span>
  );
}

export function PrayerAdmin({ prayers }: { prayers: Prayer[] }) {
  const [filter, setFilter] = useState<FilterTab>("pending");
  const [visibilityFilter, setVisibilityFilter] = useState("all");
  const [isPending, startTransition] = useTransition();

  const pendingCount = prayers.filter((p) => p.approval_status === "pending").length;

  const filtered = prayers
    .filter((p) => filter === "all" || p.approval_status === filter)
    .filter((p) => visibilityFilter === "all" || p.visibility === visibilityFilter);

  function handleDelete(id: string) {
    startTransition(async () => {
      const res = await deletePrayerRequest(id);
      if (!res.ok) toast.error(res.error);
      else toast.success("Prayer request deleted");
    });
  }

  function handleApprove(id: string) {
    startTransition(async () => {
      const res = await approvePrayer(id);
      if (!res.ok) toast.error(res.error);
      else toast.success("Prayer request approved");
    });
  }

  function handleReject(id: string) {
    startTransition(async () => {
      const res = await rejectPrayer(id);
      if (!res.ok) toast.error(res.error);
      else toast.success("Prayer request rejected");
    });
  }

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "pending", label: "Pending" },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
    { key: "all", label: "All" },
  ];

  return (
    <div className="space-y-4">
      {/* Approval status tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`relative rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filter === key
                ? "bg-primary text-primary-foreground"
                : "border border-border text-muted-foreground hover:bg-secondary"
            }`}
          >
            {label}
            {key === "pending" && pendingCount > 0 && (
              <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Visibility filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setVisibilityFilter("all")}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            visibilityFilter === "all"
              ? "bg-secondary text-foreground"
              : "border border-border text-muted-foreground hover:bg-secondary"
          }`}
        >
          All visibility ({prayers.filter((p) => filter === "all" || p.approval_status === filter).length})
        </button>
        {VISIBILITY_OPTIONS.map((v) => {
          const count = prayers.filter(
            (p) =>
              p.visibility === v &&
              (filter === "all" || p.approval_status === filter),
          ).length;
          return (
            <button
              key={v}
              onClick={() => setVisibilityFilter(v)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                visibilityFilter === v
                  ? "bg-secondary text-foreground"
                  : "border border-border text-muted-foreground hover:bg-secondary"
              }`}
            >
              {v.replace(/_/g, " ")} ({count})
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        {filtered.map((p) => (
          <Card key={p.id}>
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-base font-medium">
                    {p.title || "(no title)"}
                  </CardTitle>
                  <ApprovalBadge status={p.approval_status} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                    {p.visibility.replace(/_/g, " ")}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(p.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="whitespace-pre-wrap text-sm text-foreground">
                {p.body}
              </p>
              {p.is_anonymous_to_team && (
                <p className="text-xs italic text-muted-foreground">
                  Submitted anonymously
                </p>
              )}
              <div className="flex flex-wrap justify-end gap-2">
                {/* Approval actions */}
                {p.approval_status !== "approved" && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isPending}
                    className="border-emerald-500/40 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950"
                    onClick={() => handleApprove(p.id)}
                  >
                    Approve
                  </Button>
                )}
                {p.approval_status !== "rejected" && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isPending}
                    className="border-amber-500/40 text-amber-600 hover:bg-amber-50 hover:text-amber-700 dark:text-amber-400 dark:hover:bg-amber-950"
                    onClick={() => handleReject(p.id)}
                  >
                    Reject
                  </Button>
                )}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" disabled={isPending}>
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete prayer request?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently remove this prayer request.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(p.id)}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No prayer requests found.
          </p>
        )}
      </div>
    </div>
  );
}
