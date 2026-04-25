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
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface AuctionListsProps {
  rfqs:
    | (Doc<"rfqs"> & {
        derivedStatus: string;
      })[]
    | undefined;
}

export const AuctionLists = ({ rfqs }: AuctionListsProps) => {
  return (
    <Card className="surface-panel h-fit rounded-2xl">
      <CardHeader>
        <CardTitle className="font-sans text-2xl">Auction Listing</CardTitle>
        <CardDescription className="text-base">
          British auctions sorted by most recently created.
        </CardDescription>
      </CardHeader>
      <CardContent className="w-full">
        <ScrollArea className="min-h-0 rounded-xl px-2">
          <Table className="w-full min-w-230 text-base [&_td]:whitespace-normal [&_th]:whitespace-normal">
            <TableHeader className="sticky top-0 z-10 bg-card/95 backdrop-blur">
              <TableRow>
                <TableHead className="h-12">RFQ</TableHead>
                <TableHead>Lowest bid</TableHead>
                <TableHead>Start time</TableHead>
                <TableHead>Current close</TableHead>
                <TableHead>Forced close</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Bids</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rfqs === undefined ? (
                <TableRow>
                  <TableCell
                    className="py-10 text-muted-foreground"
                    colSpan={6}
                  >
                    Loading auctions...
                  </TableCell>
                </TableRow>
              ) : rfqs.length === 0 ? (
                <TableRow>
                  <TableCell
                    className="py-10 text-muted-foreground"
                    colSpan={6}
                  >
                    No British auctions yet.
                  </TableCell>
                </TableRow>
              ) : (
                rfqs.map((rfq) => (
                  <TableRow key={rfq._id} className="">
                    <TableCell>
                      <Link
                        className="text-base font-semibold hover:underline"
                        href={`/rfqs/${rfq._id}`}
                        prefetch
                      >
                        {rfq.name}
                      </Link>
                      <div className="pt-1 text-sm text-muted-foreground">
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
                        {dateTime.format(new Date(rfq.bidStartAt))}
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
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
