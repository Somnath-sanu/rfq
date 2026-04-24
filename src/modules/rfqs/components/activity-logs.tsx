import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { dateTime } from "@/lib/utils";
import {
  IconClock,
  IconEdit,
  IconHistory,
  IconSend,
} from "@tabler/icons-react";
import { Doc } from "../../../../convex/_generated/dataModel";

function activityIcon(type: string) {
  if (type === "time_extended") {
    return <IconClock className="size-4" />;
  }
  if (type === "bid_updated") {
    return <IconEdit className="size-4" />;
  }
  if (type === "bid_submitted") {
    return <IconSend className="size-4" />;
  }
  return <IconHistory className="size-4" />;
}

export const ActivityLogs = ({
  logs,
}: {
  logs: Doc<"auctionActivityLogs">[];
}) => {
  return (
    <Card className="surface-panel rounded-2xl">
      <CardHeader>
        <CardTitle className="font-sans text-2xl">Activity Log</CardTitle>
        <CardDescription className="text-base">
          Bid submissions, quote updates, extensions, and close events.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="relative grid gap-3">
          {logs.length === 0 ? (
            <li className="py-6 text-sm text-muted-foreground">
              No activity yet.
            </li>
          ) : (
            logs.map((log) => (
              <li
                className="grid grid-cols-[40px_1fr] gap-4 rounded-2xl border bg-background/45 p-4"
                key={log._id}
              >
                <span className="flex size-10 items-center justify-center rounded-xl bg-background ring-1 ring-border">
                  {activityIcon(log.type)}
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-base font-medium">{log.message}</p>
                    <time className="text-sm text-muted-foreground">
                      {dateTime.format(new Date(log.createdAt))}
                    </time>
                  </div>
                  {log.reason ? (
                    <p className="mt-1 text-sm text-muted-foreground">
                      Reason: {log.reason}
                    </p>
                  ) : null}
                  {log.oldBidCloseAt && log.newBidCloseAt ? (
                    <p className="mt-1 text-sm text-muted-foreground">
                      Close moved from{" "}
                      {dateTime.format(new Date(log.oldBidCloseAt))} to{" "}
                      {dateTime.format(new Date(log.newBidCloseAt))}
                    </p>
                  ) : null}
                </div>
              </li>
            ))
          )}
        </ol>
      </CardContent>
    </Card>
  );
};
