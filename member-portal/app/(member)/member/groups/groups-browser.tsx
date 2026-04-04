"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { requestToJoinGroup } from "./actions";

type Group = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  group_type: string;
  is_active: boolean;
};

type Membership = { group_id: string; role: string };
type JoinRequest = { group_id: string; status: string };

type Props = {
  groups: Group[];
  myMemberships: Membership[];
  myRequests: JoinRequest[];
};

export function GroupsBrowser({ groups, myMemberships, myRequests }: Props) {
  const [requestMessage, setRequestMessage] = useState<Record<string, string>>(
    {},
  );
  const [isPending, startTransition] = useTransition();

  const memberGroupIds = new Set(myMemberships.map((m) => m.group_id));
  const pendingGroupIds = new Set(
    myRequests.filter((r) => r.status === "pending").map((r) => r.group_id),
  );

  function handleJoinRequest(groupId: string) {
    startTransition(async () => {
      const res = await requestToJoinGroup(
        groupId,
        requestMessage[groupId] ?? "",
      );
      if (!res.ok) toast.error(res.error);
      else toast.success("Request submitted");
    });
  }

  return (
    <div className="space-y-4">
      {myMemberships.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Your groups
          </h2>
          <div className="flex flex-wrap gap-2">
            {myMemberships.map((m) => {
              const group = groups.find((g) => g.id === m.group_id);
              return (
                <span
                  key={m.group_id}
                  className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
                >
                  {group?.name ?? "Group"}{" "}
                  {m.role === "leader" && "(leader)"}
                </span>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {groups.map((group) => {
          const isMember = memberGroupIds.has(group.id);
          const isPendingRequest = pendingGroupIds.has(group.id);

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
                  {isMember && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      Joined
                    </span>
                  )}
                  {isPendingRequest && (
                    <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                      Pending
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {group.description && (
                  <p className="text-sm text-muted-foreground">
                    {group.description}
                  </p>
                )}
                {!isMember && !isPendingRequest && (
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Optional message…"
                      value={requestMessage[group.id] ?? ""}
                      onChange={(e) =>
                        setRequestMessage((prev) => ({
                          ...prev,
                          [group.id]: e.target.value,
                        }))
                      }
                      className="text-sm"
                    />
                    <Button
                      size="sm"
                      disabled={isPending}
                      onClick={() => handleJoinRequest(group.id)}
                    >
                      Request to join
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
        {groups.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No groups available yet. Check back soon.
          </p>
        )}
      </div>
    </div>
  );
}
