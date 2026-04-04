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

import { deleteMember, updateMemberRole } from "./actions";

type Member = {
  id: string;
  display_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  roles: string[];
};

const ALL_ROLES = ["member", "ministry_leader", "staff", "executive", "apostle"];

export function MembersAdmin({ members }: { members: Member[] }) {
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  const filtered = members.filter((m) =>
    (m.display_name ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  function handleRoleToggle(userId: string, role: string, has: boolean) {
    startTransition(async () => {
      const res = await updateMemberRole(userId, role, has ? "remove" : "add");
      if (!res.ok) toast.error(res.error);
      else toast.success(`Role ${has ? "removed" : "added"}`);
    });
  }

  function handleDelete(userId: string) {
    startTransition(async () => {
      const res = await deleteMember(userId);
      if (!res.ok) toast.error(res.error);
      else toast.success("Member deleted");
    });
  }

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Search by name…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-sm rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <div className="space-y-3">
        {filtered.map((m) => (
          <Card key={m.id}>
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-base font-medium">
                  {m.display_name || "(no name)"}
                </CardTitle>
                <span className="text-xs text-muted-foreground">
                  Joined{" "}
                  {m.created_at
                    ? new Date(m.created_at).toLocaleDateString()
                    : "—"}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {m.phone && (
                <p className="text-sm text-muted-foreground">{m.phone}</p>
              )}
              <div className="flex flex-wrap gap-2">
                {ALL_ROLES.map((role) => {
                  const has = m.roles.includes(role);
                  return (
                    <button
                      key={role}
                      disabled={isPending}
                      onClick={() => handleRoleToggle(m.id, role, has)}
                      className={`rounded-full px-3 py-0.5 text-xs font-medium transition-colors ${
                        has
                          ? "bg-primary text-primary-foreground"
                          : "border border-border text-muted-foreground hover:bg-secondary"
                      }`}
                    >
                      {role.replace("_", " ")}
                    </button>
                  );
                })}
              </div>
              <div className="flex justify-end">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete member?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete{" "}
                        <strong>{m.display_name || "this member"}</strong> and
                        all their data. This cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(m.id)}>
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
            No members found.
          </p>
        )}
      </div>
    </div>
  );
}
