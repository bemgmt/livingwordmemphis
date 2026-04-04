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

import { deletePrayerRequest } from "./actions";

type Prayer = {
  id: string;
  user_id: string;
  title: string | null;
  body: string;
  visibility: string;
  is_anonymous_to_team: boolean;
  created_at: string;
  updated_at: string;
};

const VISIBILITY_OPTIONS = [
  "pastoral_staff_only",
  "prayer_ministry",
  "public_praise_ok",
];

export function PrayerAdmin({ prayers }: { prayers: Prayer[] }) {
  const [filter, setFilter] = useState("all");
  const [isPending, startTransition] = useTransition();

  const filtered =
    filter === "all"
      ? prayers
      : prayers.filter((p) => p.visibility === filter);

  function handleDelete(id: string) {
    startTransition(async () => {
      const res = await deletePrayerRequest(id);
      if (!res.ok) toast.error(res.error);
      else toast.success("Prayer request deleted");
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            filter === "all"
              ? "bg-primary text-primary-foreground"
              : "border border-border text-muted-foreground hover:bg-secondary"
          }`}
        >
          All ({prayers.length})
        </button>
        {VISIBILITY_OPTIONS.map((v) => {
          const count = prayers.filter((p) => p.visibility === v).length;
          return (
            <button
              key={v}
              onClick={() => setFilter(v)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filter === v
                  ? "bg-primary text-primary-foreground"
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
                <CardTitle className="text-base font-medium">
                  {p.title || "(no title)"}
                </CardTitle>
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
              <div className="flex justify-end">
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
