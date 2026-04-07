"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { createForumReply } from "../actions";

type Topic = {
  id: string;
  title: string;
  body: string;
  author_id: string;
  is_locked: boolean;
  is_pinned: boolean;
  created_at: string;
};

type Reply = {
  id: string;
  author_id: string;
  body: string;
  created_at: string;
};

type Props = {
  topic: Topic;
  replies: Reply[];
  profileMap: Record<string, string>;
};

export function TopicDetail({
  topic,
  replies,
  profileMap,
}: Props) {
  const [replyText, setReplyText] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleReply() {
    startTransition(async () => {
      const res = await createForumReply(topic.id, replyText);
      if (!res.ok) toast.error(res.error);
      else {
        toast.success("Reply posted");
        setReplyText("");
      }
    });
  }

  return (
    <div className="space-y-6">
      <Link
        href="/member/forum"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        &larr; Back to forum
      </Link>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="font-serif text-2xl font-medium">
              {topic.title}
            </CardTitle>
            {topic.is_locked && (
              <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                Locked
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {profileMap[topic.author_id] ?? "Member"} &middot;{" "}
            {new Date(topic.created_at).toLocaleDateString()}
          </p>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm text-foreground">
            {topic.body}
          </p>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Replies ({replies.length})
        </h2>
        {replies.map((reply) => (
          <Card key={reply.id}>
            <CardContent className="pt-4">
              <p className="whitespace-pre-wrap text-sm text-foreground">
                {reply.body}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {profileMap[reply.author_id] ?? "Member"} &middot;{" "}
                {new Date(reply.created_at).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        ))}
        {replies.length === 0 && (
          <p className="py-4 text-sm text-muted-foreground">
            No replies yet. Be the first to respond!
          </p>
        )}
      </div>

      {!topic.is_locked ? (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <Textarea
              placeholder="Write your reply…"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={3}
            />
            <Button
              disabled={isPending || !replyText.trim()}
              onClick={handleReply}
            >
              {isPending ? "Posting…" : "Post reply"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <p className="text-sm text-muted-foreground">
          This topic has been locked by a moderator.
        </p>
      )}
    </div>
  );
}
