"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { createForumTopic } from "./actions";

type Topic = {
  id: string;
  sermon_id: string | null;
  title: string;
  body: string;
  author_id: string;
  is_locked: boolean;
  is_pinned: boolean;
  created_at: string;
  approval_status: "pending" | "approved" | "rejected";
};

type Props = {
  topics: Topic[];
  profileMap: Record<string, string>;
  currentUserId: string;
};

export function ForumTopicList({ topics, profileMap, currentUserId }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);

  function handleCreate(formData: FormData) {
    startTransition(async () => {
      const res = await createForumTopic(formData);
      if (!res.ok) toast.error(res.error);
      else {
        setSubmitted(true);
        setShowForm(false);
        toast.success("Topic submitted — it will appear once an admin approves it.");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "New topic"}
        </Button>
      </div>

      {submitted && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm dark:border-amber-800/40 dark:bg-amber-950/30">
          <span className="text-amber-500">⏳</span>
          <p className="text-amber-800 dark:text-amber-300">
            Your topic has been submitted and is <strong>pending admin review</strong>.
            It will appear in the forum once approved.
          </p>
        </div>
      )}

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Start a discussion</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="body">Your thoughts</Label>
                <Textarea id="body" name="body" required rows={4} />
              </div>
              <p className="text-xs text-muted-foreground">
                Your topic will be visible once reviewed by an admin.
              </p>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Submitting…" : "Submit topic"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {topics.map((topic) => {
          const isOwn = topic.author_id === currentUserId;
          const isPendingTopic =
            isOwn && topic.approval_status === "pending";
          const isRejected =
            isOwn && topic.approval_status === "rejected";

          const cardEl = (
            <Card
              className={`transition-shadow ${
                !isPendingTopic && !isRejected
                  ? "hover:shadow-md"
                  : "opacity-80"
              }`}
            >
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base font-medium">
                      {topic.title}
                    </CardTitle>
                    {topic.is_locked && (
                      <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                        Locked
                      </span>
                    )}
                    {topic.is_pinned && (
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                        Pinned
                      </span>
                    )}
                    {isPendingTopic && (
                      <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                        Pending approval
                      </span>
                    )}
                    {isRejected && (
                      <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                        Not approved
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {profileMap[topic.author_id] ?? "Member"} &middot;{" "}
                    {new Date(topic.created_at).toLocaleDateString()}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {topic.body}
                </p>
              </CardContent>
            </Card>
          );

          // Pending/rejected own topics are not clickable yet
          if (isPendingTopic || isRejected) {
            return <div key={topic.id}>{cardEl}</div>;
          }

          return (
            <Link key={topic.id} href={`/member/forum/${topic.id}`}>
              {cardEl}
            </Link>
          );
        })}
        {topics.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No topics yet. Start the first discussion!
          </p>
        )}
      </div>
    </div>
  );
}
