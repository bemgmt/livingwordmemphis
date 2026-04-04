"use client";

import { useTransition } from "react";
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

import { deleteForumTopic, toggleLockTopic, togglePinTopic } from "./actions";

type Topic = {
  id: string;
  sermon_id: string | null;
  title: string;
  body: string;
  author_id: string;
  is_locked: boolean;
  is_pinned: boolean;
  created_at: string;
};

export function ForumAdmin({ topics }: { topics: Topic[] }) {
  const [isPending, startTransition] = useTransition();

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

  return (
    <div className="space-y-3">
      {topics.map((t) => (
        <Card key={t.id}>
          <CardHeader className="pb-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-medium">
                  {t.title}
                </CardTitle>
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
      {topics.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No forum topics yet.
        </p>
      )}
    </div>
  );
}
