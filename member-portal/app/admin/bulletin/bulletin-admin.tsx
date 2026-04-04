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

import { createAnnouncement, deleteBulletinPost, togglePin } from "./actions";

type Post = {
  id: string;
  author_id: string;
  title: string;
  body: string;
  is_pinned: boolean;
  is_announcement: boolean;
  created_at: string;
};

export function BulletinAdmin({ posts }: { posts: Post[] }) {
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handlePin(postId: string, pinned: boolean) {
    startTransition(async () => {
      const res = await togglePin(postId, pinned);
      if (!res.ok) toast.error(res.error);
    });
  }

  function handleDelete(postId: string) {
    startTransition(async () => {
      const res = await deleteBulletinPost(postId);
      if (!res.ok) toast.error(res.error);
      else toast.success("Post deleted");
    });
  }

  async function handleCreateAnnouncement(formData: FormData) {
    startTransition(async () => {
      const res = await createAnnouncement(formData);
      if (!res.ok) toast.error(res.error);
      else {
        toast.success("Announcement created");
        setShowForm(false);
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {posts.length} post{posts.length !== 1 ? "s" : ""}
        </p>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "New announcement"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Create announcement</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={handleCreateAnnouncement} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="body">Body</Label>
                <Textarea id="body" name="body" required rows={4} />
              </div>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Creating…" : "Create"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {posts.map((post) => (
          <Card key={post.id}>
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
                  {new Date(post.created_at).toLocaleString()}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="line-clamp-3 whitespace-pre-wrap text-sm text-foreground">
                {post.body}
              </p>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isPending}
                  onClick={() => handlePin(post.id, post.is_pinned)}
                >
                  {post.is_pinned ? "Unpin" : "Pin"}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" disabled={isPending}>
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete post?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete this bulletin post and all
                        its comments.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(post.id)}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
        {posts.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No bulletin posts yet.
          </p>
        )}
      </div>
    </div>
  );
}
