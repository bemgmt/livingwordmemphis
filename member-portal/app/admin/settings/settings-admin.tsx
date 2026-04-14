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

import { promoteToRole, revokeRole } from "./actions";

type StaffUser = {
  id: string;
  display_name: string | null;
  roles: string[];
};

const ADMIN_ROLES = ["staff", "executive", "apostle"];

const ROLE_DISPLAY: Record<string, string> = {
  staff: "Leadership",
  executive: "Executive Team",
  apostle: "Apostle",
};

export function SettingsAdmin({
  staffUsers,
  activityLog,
}: {
  staffUsers: StaffUser[];
  activityLog: {
    user_id: string;
    role: string;
    granted_at: string;
    granted_by_name: string | null;
  }[];
}) {
  const [isPending, startTransition] = useTransition();

  function handlePromote(userId: string, role: string) {
    startTransition(async () => {
      const res = await promoteToRole(userId, role);
      if (!res.ok) toast.error(res.error);
      else toast.success(`Role "${ROLE_DISPLAY[role] ?? role}" granted`);
    });
  }

  function handleRevoke(userId: string, role: string) {
    startTransition(async () => {
      const res = await revokeRole(userId, role);
      if (!res.ok) toast.error(res.error);
      else toast.success(`Role "${ROLE_DISPLAY[role] ?? role}" revoked`);
    });
  }

  return (
    <div className="space-y-8">
      {/* Current admin users */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium text-foreground">
          Admin access management
        </h2>
        <p className="text-sm text-muted-foreground">
          Grant or revoke admin roles. Only the Apostle can change these.
        </p>

        <div className="space-y-3">
          {staffUsers.map((u) => (
            <Card key={u.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">
                  {u.display_name || "(no name)"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {ADMIN_ROLES.map((role) => {
                    const has = u.roles.includes(role);
                    return (
                      <span key={role} className="flex items-center gap-1">
                        {has ? (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <button
                                disabled={isPending}
                                className="rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/80"
                              >
                                {ROLE_DISPLAY[role] ?? role}
                              </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Revoke {ROLE_DISPLAY[role] ?? role}?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will remove the{" "}
                                  <strong>
                                    {ROLE_DISPLAY[role] ?? role}
                                  </strong>{" "}
                                  role from{" "}
                                  <strong>{u.display_name || "this user"}</strong>.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleRevoke(u.id, role)}
                                >
                                  Revoke
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        ) : (
                          <button
                            disabled={isPending}
                            onClick={() => handlePromote(u.id, role)}
                            className="rounded-full border border-border px-3 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-secondary"
                          >
                            {ROLE_DISPLAY[role] ?? role}
                          </button>
                        )}
                      </span>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
          {staffUsers.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No admin users found.
            </p>
          )}
        </div>
      </section>

      {/* Role change activity log */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium text-foreground">
          Role change history
        </h2>
        <Card>
          <CardContent className="pt-6">
            <ul className="divide-y divide-border text-sm">
              {activityLog.map((entry, i) => (
                <li key={i} className="flex flex-wrap justify-between gap-2 py-3 first:pt-0">
                  <span className="font-medium text-foreground">
                    {ROLE_DISPLAY[entry.role] ?? entry.role}
                  </span>
                  <span className="text-muted-foreground">
                    granted{" "}
                    {new Date(entry.granted_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    by {entry.granted_by_name || "system"}
                  </span>
                </li>
              ))}
              {activityLog.length === 0 && (
                <li className="py-4 text-muted-foreground">
                  No role changes recorded.
                </li>
              )}
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
