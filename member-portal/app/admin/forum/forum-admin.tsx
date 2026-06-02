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

import {
  deleteForumTopic,
  toggleLockTopic,
  togglePinTopic,
  approveTopic,
  rejectTopic,
} from "./actions";

type ApprovalStatus = "pending" | "approved" | "rejected";

type Topic = {
  id: string;
  sermon_id: string | null;
  title: string;
  body: string;
  author_id: string;
  is_locked: boolean;
  is_pinned: boolean;
  created_at: string;
  approval_status: ApprovalStatus;
  approved_by: string | null;
  approved_at: string | null;
};

type FilterTab = "pending" | "approved" | "rejected" | "all";

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

export function ForumAdmin({ topics }: { topics: Topic[] }) {
  const [filter, setFilter] = useState<FilterTab>("pending");
  const [isPending, startTransition] = useTransition();

  const pendingCount = topics.filter((t) => t.approval_status === "pending").length;

  const filtered =
    filter === "all" ? topics : topics.filter((t) => t.approval_status === filter);

  function handleLock(topicId: string, locked: boolean) {
    startTransition(async () => {
      const res = await toggleLockTopic(topicId, locked);
      if (!res.ok) toast.error(res.error);
    });
  }

  function handlePin(topicId: string, pinned: boolean) {
    startTransition(async () => {
      const res = await togglePinTopic(topicId, pinned);
      if (!res.ok) toast.error(res.error);
    });
  }

  function handleDelete(topicId: string) {
    startTransition(async () => {
      const res = await deleteForumTopic(topicId);
      if (!res.ok) toast.error(res.error);
      else toast.success("Topic deleted");
    });
  }

  function handleApprove(topicId: string) {
    startTransition(async () => {
      const res = await approveTopic(topicId);
      if (!res.ok) toast.error(res.error);
      else toast.success("Topic approved — now visible to all members");
    });
  }

  function handleReject(topicId: string) {
    startTransition(async () => {
      const res = await rejectTopic(topicId);
      if (!res.ok) toast.error(res.error);
      else toast.success("Topic rejected");
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
      {/* Filter tabs */}
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

      {/* Topic list */}
      <div className="space-y-3">
        {filtered.map((t) => (
          <Card key={t.id}>
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base font-medium">
                    {t.title}
                  </CardTitle>
                  <ApprovalBadge status={t.approval_status} />
                  {t.is_locked && (
                    <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                      Locked
                    </span>
                  )}
                  {t.is_pinned && (
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                      Pinned
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(t.created_at).toLocaleString()}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {t.body}
              </p>
              <div className="flex flex-wrap justify-end gap-2">
                {/* Approval actions */}
                {t.approval_status !== "approved" && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isPending}
                    className="border-emerald-500/40 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950"
                    onClick={() => handleApprove(t.id)}
                  >
                    Approve
                  </Button>
                )}
                {t.approval_status !== "rejected" && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isPending}
                    className="border-amber-500/40 text-amber-600 hover:bg-amber-50 hover:text-amber-700 dark:text-amber-400 dark:hover:bg-amber-950"
                    onClick={() => handleReject(t.id)}
                  >
                    Reject
                  </Button>
                )}
                {/* Moderation */}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isPending}
                  onClick={() => handlePin(t.id, t.is_pinned)}
                >
                  {t.is_pinned ? "Unpin" : "Pin"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isPending}
                  onClick={() => handleLock(t.id, t.is_locked)}
                >
                  {t.is_locked ? "Unlock" : "Lock"}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" disabled={isPending}>
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete topic?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete this topic and all its
                        replies.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(t.id)}>
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
            No {filter === "all" ? "" : filter} forum topics.
          </p>
        )}
      </div>
    </div>
  );
}
