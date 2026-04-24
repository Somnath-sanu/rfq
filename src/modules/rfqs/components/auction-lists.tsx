import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Doc } from "../../../../convex/_generated/dataModel";
import Link from "next/link";
import { IconClock, IconTrendingDown } from "@tabler/icons-react";
import { dateTime, money, statusVariant } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface AuctionListsProps {
  rfqs:
    | (Doc<"rfqs"> & {
        derivedStatus: string;
      })[]
    | undefined;
}

export const AuctionLists = ({ rfqs }: AuctionListsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Auction Listing</CardTitle>
        <CardDescription>
          British auctions sorted by most recently created.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>RFQ</TableHead>
              <TableHead>Lowest bid</TableHead>
              <TableHead>Current close</TableHead>
              <TableHead>Forced close</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Bids</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rfqs === undefined ? (
              <TableRow>
                <TableCell className="py-10 text-muted-foreground" colSpan={6}>
                  Loading auctions...
                </TableCell>
              </TableRow>
            ) : rfqs.length === 0 ? (
              <TableRow>
                <TableCell className="py-10 text-muted-foreground" colSpan={6}>
                  No British auctions yet.
                </TableCell>
              </TableRow>
            ) : (
              rfqs.map((rfq) => (
                <TableRow key={rfq._id}>
                  <TableCell>
                    <Link
                      className="font-medium hover:underline"
                      href={`/rfqs/${rfq._id}`}
                    >
                      {rfq.name}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {rfq.referenceId}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1 font-medium">
                      <IconTrendingDown className="size-4 text-muted-foreground" />
                      {rfq.currentLowestAmount === undefined
                        ? "No bids"
                        : money.format(rfq.currentLowestAmount)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1">
                      <IconClock className="size-4 text-muted-foreground" />
                      {dateTime.format(new Date(rfq.currentBidCloseAt))}
                    </span>
                  </TableCell>
                  <TableCell>
                    {dateTime.format(new Date(rfq.forcedBidCloseAt))}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className="capitalize"
                      variant={statusVariant(rfq.derivedStatus)}
                    >
                      {rfq.derivedStatus.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{rfq.bidCount}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
