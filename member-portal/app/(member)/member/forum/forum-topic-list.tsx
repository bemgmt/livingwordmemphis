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
};

type Props = {
  topics: Topic[];
  profileMap: Record<string, string>;
};

export function ForumTopicList({ topics, profileMap }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleCreate(formData: FormData) {
    startTransition(async () => {
      const res = await createForumTopic(formData);
      if (!res.ok) toast.error(res.error);
      else {
        toast.success("Topic created");
        setShowForm(false);
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
              <Button type="submit" disabled={isPending}>
                {isPending ? "Creating…" : "Create topic"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {topics.map((topic) => (
          <Link key={topic.id} href={`/member/forum/${topic.id}`}>
            <Card className="transition-shadow hover:shadow-md">
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
          </Link>
        ))}
        {topics.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No topics yet. Start the first discussion!
          </p>
        )}
      </div>
    </div>
  );
}
