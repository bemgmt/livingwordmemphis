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

import { createGroup, deleteGroup, handleJoinRequest, removeGroupMember } from "./actions";

type Group = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  group_type: string;
  is_active: boolean;
  created_at: string;
};

type JoinRequest = {
  id: string;
  group_id: string;
  user_id: string;
  status: string;
  message: string | null;
  created_at: string;
};

type GroupMember = {
  group_id: string;
  user_id: string;
  role: string;
  joined_at: string;
};

type Props = {
  groups: Group[];
  joinRequests: JoinRequest[];
  groupMembers: GroupMember[];
  profileMap: Record<string, string>;
};

export function GroupsAdmin({
  groups,
  joinRequests,
  groupMembers,
  profileMap,
}: Props) {
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleCreate(formData: FormData) {
    startTransition(async () => {
      const res = await createGroup(formData);
      if (!res.ok) toast.error(res.error);
      else {
        toast.success("Group created");
        setShowForm(false);
      }
    });
  }

  function handleDelete(groupId: string) {
    startTransition(async () => {
      const res = await deleteGroup(groupId);
      if (!res.ok) toast.error(res.error);
      else toast.success("Group deleted");
    });
  }

  function handleRequest(
    requestId: string,
    groupId: string,
    userId: string,
    action: "approved" | "denied",
  ) {
    startTransition(async () => {
      const res = await handleJoinRequest(requestId, groupId, userId, action);
      if (!res.ok) toast.error(res.error);
      else toast.success(action === "approved" ? "Approved" : "Denied");
    });
  }

  function handleRemoveMember(groupId: string, userId: string) {
    startTransition(async () => {
      const res = await removeGroupMember(groupId, userId);
      if (!res.ok) toast.error(res.error);
      else toast.success("Member removed");
    });
  }

  return (
    <div className="space-y-8">
      {joinRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Pending join requests ({joinRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {joinRequests.map((req) => {
              const group = groups.find((g) => g.id === req.group_id);
              return (
                <div
                  key={req.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {profileMap[req.user_id] ?? "Unknown"}{" "}
                      <span className="font-normal text-muted-foreground">
                        wants to join
                      </span>{" "}
                      {group?.name ?? "Unknown group"}
                    </p>
                    {req.message && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        &ldquo;{req.message}&rdquo;
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      disabled={isPending}
                      onClick={() =>
                        handleRequest(req.id, req.group_id, req.user_id, "approved")
                      }
                    >
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isPending}
                      onClick={() =>
                        handleRequest(req.id, req.group_id, req.user_id, "denied")
                      }
                    >
                      Deny
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {groups.length} group{groups.length !== 1 ? "s" : ""}
        </p>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "New group"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Create group</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" rows={3} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="group_type">Type</Label>
                <select
                  id="group_type"
                  name="group_type"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                  defaultValue="ministry"
                >
                  <option value="committee">Committee</option>
                  <option value="ministry">Ministry</option>
                  <option value="study_group">Study group</option>
                </select>
              </div>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Creating…" : "Create"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {groups.map((group) => {
          const members = groupMembers.filter(
            (gm) => gm.group_id === group.id,
          );
          return (
            <Card key={group.id}>
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base font-medium">
                      {group.name}
                    </CardTitle>
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                      {group.group_type.replace("_", " ")}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {members.length} member{members.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {group.description && (
                  <p className="text-sm text-muted-foreground">
                    {group.description}
                  </p>
                )}
                {members.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {members.map((m) => (
                      <span
                        key={m.user_id}
                        className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-xs"
                      >
                        {profileMap[m.user_id] ?? "Unknown"}
                        {m.role === "leader" && (
                          <span className="font-semibold text-primary">
                            (leader)
                          </span>
                        )}
                        <button
                          className="ml-1 text-muted-foreground hover:text-destructive"
                          disabled={isPending}
                          onClick={() =>
                            handleRemoveMember(group.id, m.user_id)
                          }
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex justify-end">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={isPending}
                      >
                        Delete group
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete group?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete &ldquo;{group.name}&rdquo;
                          and remove all members.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(group.id)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {groups.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No groups yet. Create one to get started.
          </p>
        )}
      </div>
    </div>
  );
}
