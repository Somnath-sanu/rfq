import { Doc, Id } from "./_generated/dataModel";
import { MutationCtx, QueryCtx } from "./_generated/server";
import { ActivityType, AuctionStatus } from "./rfqTypes";

export function statusForTimes(
  now: number,
  bidStartAt: number,
  currentBidCloseAt: number,
  forcedBidCloseAt: number,
): AuctionStatus {
  if (now >= forcedBidCloseAt) {
    return "force_closed";
  }
  if (now >= currentBidCloseAt) {
    return "closed";
  }
  if (now >= bidStartAt) {
    return "active";
  }
  return "scheduled";
}

export async function getRankedBids(
  ctx: QueryCtx | MutationCtx,
  rfqId: Id<"rfqs">,
  limit = 100,
): Promise<Doc<"bids">[]> {
  const bids = await ctx.db
    .query("bids")
    .withIndex("by_rfqId", (q) => q.eq("rfqId", rfqId))
    .take(limit);

  return bids.sort((a, b) => {
    if (a.totalAmount !== b.totalAmount) {
      return a.totalAmount - b.totalAmount;
    }
    return a.submittedAt - b.submittedAt;
  });
}

export async function getSupplierBid(
  ctx: QueryCtx | MutationCtx,
  rfqId: Id<"rfqs">,
  supplierTokenIdentifier: string,
): Promise<Doc<"bids"> | null> {
  return await ctx.db
    .query("bids")
    .withIndex("by_rfqId_and_supplierTokenIdentifier", (q) =>
      q
        .eq("rfqId", rfqId)
        .eq("supplierTokenIdentifier", supplierTokenIdentifier),
    )
    .unique();
}

export async function getBidCount(ctx: MutationCtx, rfqId: Id<"rfqs">) {
  const bids = await ctx.db
    .query("bids")
    .withIndex("by_rfqId", (q) => q.eq("rfqId", rfqId))
    .collect();
  return bids.length;
}

export async function writeLog(
  ctx: MutationCtx,
  input: {
    rfqId: Id<"rfqs">;
    actorTokenIdentifier?: string;
    type: ActivityType;
    message: string;
    reason?: string;
    oldBidCloseAt?: number;
    newBidCloseAt?: number;
    createdAt: number;
  },
) {
  await ctx.db.insert("auctionActivityLogs", input);
}

export function assertPositiveMoney(value: number, label: string) {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be zero or greater.`);
  }
}

export function formatTrigger(trigger: string): string {
  if (trigger === "bid_received") {
    return "bid received in trigger window";
  }
  if (trigger === "any_rank_change") {
    return "supplier rank changed in trigger window";
  }
  return "L1 bidder changed in trigger window";
}
