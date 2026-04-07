"use client";

import { useState, useTransition } from "react";
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

import { ConfirmDelete } from "@/components/confirm-delete";

import { createBulletinComment, createBulletinPost, deleteBulletinPost } from "./actions";

type Comment = {
  id: string;
  author_id: string;
  body: string;
  created_at: string;
};

type Post = {
  id: string;
  author_id: string;
  title: string;
  body: string;
  is_pinned: boolean;
  is_announcement: boolean;
  created_at: string;
};

type Props = {
  posts: Post[];
  commentsByPost: Record<string, Comment[]>;
  profileMap: Record<string, string>;
  currentUserId: string;
};

export function BulletinBoard({
  posts,
  commentsByPost,
  profileMap,
  currentUserId,
}: Props) {
  const [showForm, setShowForm] = useState(false);
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  function handleCreate(formData: FormData) {
    startTransition(async () => {
      const res = await createBulletinPost(formData);
      if (!res.ok) toast.error(res.error);
      else {
        toast.success("Post created");
        setShowForm(false);
      }
    });
  }

  function handleComment(postId: string) {
    const body = commentText[postId] ?? "";
    startTransition(async () => {
      const res = await createBulletinComment(postId, body);
      if (!res.ok) toast.error(res.error);
      else {
        toast.success("Comment added");
        setCommentText((prev) => ({ ...prev, [postId]: "" }));
      }
    });
  }

  function handleDelete(postId: string) {
    startTransition(async () => {
      const res = await deleteBulletinPost(postId);
      if (!res.ok) toast.error(res.error);
      else toast.success("Post deleted");
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "New post"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Create a post</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="body">Message</Label>
                <Textarea id="body" name="body" required rows={4} />
              </div>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Posting..." : "Post"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {posts.map((post) => {
          const comments = commentsByPost[post.id] ?? [];

          return (
            <Card
              key={post.id}
              className={
                post.is_announcement
                  ? "border-primary/30 bg-primary/5"
                  : undefined
              }
            >
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base font-medium">
                      {post.title}
                    </CardTitle>
                    {post.is_announcement && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        Announcement
                      </span>
                    )}
                    {post.is_pinned && (
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                        Pinned
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {profileMap[post.author_id] ?? "Member"} &middot;{" "}
                    {new Date(post.created_at).toLocaleDateString()}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="whitespace-pre-wrap text-sm text-foreground">
                  {post.body}
                </p>

                {comments.length > 0 && (
                  <div className="space-y-2 rounded-lg bg-secondary/50 p-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Comments ({comments.length})
                    </p>
                    {comments.map((c) => (
                      <div key={c.id} className="text-sm">
                        <p className="text-foreground">{c.body}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {profileMap[c.author_id] ?? "Member"} &middot;{" "}
                          {new Date(c.created_at).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Add a comment..."
                    value={commentText[post.id] ?? ""}
                    onChange={(e) =>
                      setCommentText((prev) => ({
                        ...prev,
                        [post.id]: e.target.value,
                      }))
                    }
                    className="text-sm"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isPending || !(commentText[post.id] ?? "").trim()}
                    onClick={() => handleComment(post.id)}
                  >
                    Reply
                  </Button>
                </div>
                {post.author_id === currentUserId && (
                  <div className="flex justify-end">
                    <ConfirmDelete
                      onConfirm={() => handleDelete(post.id)}
                      disabled={isPending}
                      title="Delete this post?"
                      description="This will permanently remove the post and all its comments."
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
        {posts.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No posts yet. Be the first to share!
          </p>
        )}
      </div>
    </div>
  );
}
