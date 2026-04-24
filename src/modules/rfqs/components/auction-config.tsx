import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FieldError } from "@/components/ui/field";
import { Doc } from "../../../../convex/_generated/dataModel";

function triggerLabel(trigger: string) {
  if (trigger === "bid_received") {
    return "Bid received in last X minutes";
  }
  if (trigger === "any_rank_change") {
    return "Any supplier rank change";
  }
  return "Lowest bidder rank change";
}

export const AuctionConfig = ({
  config,
}: {
  config: Doc<"auctionConfigs"> | null;
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Auction Configuration</CardTitle>
        <CardDescription>Extension settings for this RFQ.</CardDescription>
      </CardHeader>
      <CardContent>
        {config ? (
          <dl className="grid gap-3 text-sm">
            <div className="flex justify-between gap-3 border-b pb-2">
              <dt className="text-muted-foreground">Trigger window X</dt>
              <dd className="font-medium">
                {config.triggerWindowMinutes} minutes
              </dd>
            </div>
            <div className="flex justify-between gap-3 border-b pb-2">
              <dt className="text-muted-foreground">Extension Y</dt>
              <dd className="font-medium">
                {config.extensionDurationMinutes} minutes
              </dd>
            </div>
            <div className="grid gap-1">
              <dt className="text-muted-foreground">Trigger</dt>
              <dd className="font-medium">
                {triggerLabel(config.extensionTrigger)}
              </dd>
            </div>
          </dl>
        ) : (
          <FieldError>Configuration missing.</FieldError>
        )}
      </CardContent>
    </Card>
  );
};
