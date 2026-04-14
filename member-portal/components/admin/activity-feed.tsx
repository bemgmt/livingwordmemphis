import { Heart, MessageSquare, MessagesSquare } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type ActivityItem = {
  id: string;
  type: "prayer" | "bulletin" | "forum";
  title: string;
  created_at: string;
  meta?: string;
};

const typeConfig = {
  prayer: {
    icon: Heart,
    label: "Prayer request",
    color: "text-rose-500",
  },
  bulletin: {
    icon: MessageSquare,
    label: "Bulletin post",
    color: "text-blue-500",
  },
  forum: {
    icon: MessagesSquare,
    label: "Forum topic",
    color: "text-violet-500",
  },
} as const;

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Recent activity
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ul className="divide-y divide-border text-sm">
          {items.map((item) => {
            const config = typeConfig[item.type];
            const Icon = config.icon;
            return (
              <li
                key={`${item.type}-${item.id}`}
                className="flex items-start gap-3 py-3 first:pt-0"
              >
                <Icon
                  className={`mt-0.5 size-4 shrink-0 ${config.color}`}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground truncate">
                    {item.title || "(no title)"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {config.label}
                    {item.meta ? ` \u00b7 ${item.meta}` : ""}
                    {" \u00b7 "}
                    {new Date(item.created_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </li>
            );
          })}
          {items.length === 0 && (
            <li className="py-4 text-muted-foreground">No recent activity.</li>
          )}
        </ul>
      </CardContent>
    </Card>
  );
}
