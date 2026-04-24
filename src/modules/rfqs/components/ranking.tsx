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
import { IconMedal, IconTrendingDown } from "@tabler/icons-react";
import { dateTime, money } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface RankingProps {
  bids: {
    _id: string;
    carrierName: string;
    freightCharges: number;
    originCharges: number;
    destinationCharges: number;
    totalAmount: number;
    transitTime: string | number;
    quoteValidityAt: number;
    rank: number;
    supplierName: string;
    supplierEmail?: string;
    isCurrentUserBid: boolean;
  }[];
}

export const Ranking = ({ bids }: RankingProps) => {
  return (
    <Card className="surface-panel rounded-2xl">
      <CardHeader>
        <CardTitle className="font-sans text-2xl">Supplier Ranking</CardTitle>
        <CardDescription className="text-base">
          L1 is the lowest total quote. Ties keep the earlier submission ahead.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {bids.length > 0 ? (
          <div className="mb-6 grid gap-4 md:grid-cols-3">
            {bids.slice(0, 3).map((bid) => (
              <div className="rounded-2xl border bg-background/45 p-5" key={bid._id}>
                <div className="flex items-center justify-between gap-3">
                  <Badge variant={bid.rank === 1 ? "default" : "outline"}>
                    <IconMedal />L{bid.rank}
                  </Badge>
                  {bid.isCurrentUserBid ? (
                    <Badge variant="secondary">Your quote</Badge>
                  ) : null}
                </div>
                <div className="mt-5 text-3xl font-semibold">
                  {money.format(bid.totalAmount)}
                </div>
                <div className="mt-1 truncate text-base text-muted-foreground">
                  {bid.supplierName}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        <ScrollArea className=" rounded-xl">
          <Table className="min-w-226 text-base">
            <TableHeader className="sticky top-0 z-10 bg-card/95 backdrop-blur">
              <TableRow>
                <TableHead className="h-12">Rank</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Carrier</TableHead>
                <TableHead>Charges</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Transit</TableHead>
                <TableHead>Validity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bids.length === 0 ? (
              <TableRow>
                <TableCell className="py-10 text-muted-foreground" colSpan={7}>
                  No supplier bids yet.
                </TableCell>
              </TableRow>
              ) : (
              bids.map((bid) => (
                <TableRow key={bid._id}>
                  <TableCell>
                    <Badge variant={bid.rank === 1 ? "default" : "outline"}>
                      L{bid.rank}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{bid.supplierName}</div>
                    <div className="flex gap-2 text-xs text-muted-foreground">
                      {bid.supplierEmail}
                      {bid.isCurrentUserBid ? (
                        <span className="font-medium text-foreground">You</span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>{bid.carrierName}</TableCell>
                  <TableCell className="text-xs leading-5 text-muted-foreground">
                    F {money.format(bid.freightCharges)}
                    <br />O {money.format(bid.originCharges)}
                    <br />D {money.format(bid.destinationCharges)}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1 font-semibold">
                      <IconTrendingDown className="size-4 text-muted-foreground" />
                      {money.format(bid.totalAmount)}
                    </span>
                  </TableCell>
                  <TableCell>{bid.transitTime}</TableCell>
                  <TableCell>
                    {dateTime.format(new Date(bid.quoteValidityAt))}
                  </TableCell>
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
