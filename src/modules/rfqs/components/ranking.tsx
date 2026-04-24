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
import { IconMedal, IconTrendingDown } from "@tabler/icons-react";
import { dateTime, money } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface RankingProps {
  bids: (Doc<"bids"> & {
    rank: number;
    supplierName: string;
    supplierEmail?: string;
    isCurrentUserBid: boolean;
  })[];
}

export const Ranking = ({ bids }: RankingProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Supplier Ranking</CardTitle>
        <CardDescription>
          L1 is the lowest total quote. Ties keep the earlier submission ahead.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {bids.length > 0 ? (
          <div className="mb-5 grid gap-3 md:grid-cols-3">
            {bids.slice(0, 3).map((bid) => (
              <div className="rounded-lg border bg-muted/30 p-4" key={bid._id}>
                <div className="flex items-center justify-between gap-3">
                  <Badge variant={bid.rank === 1 ? "default" : "outline"}>
                    <IconMedal />L{bid.rank}
                  </Badge>
                  {bid.isCurrentUserBid ? (
                    <Badge variant="secondary">Your quote</Badge>
                  ) : null}
                </div>
                <div className="mt-4 text-2xl font-semibold">
                  {money.format(bid.totalAmount)}
                </div>
                <div className="mt-1 truncate text-sm text-muted-foreground">
                  {bid.supplierName}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rank</TableHead>
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
      </CardContent>
    </Card>
  );
};
