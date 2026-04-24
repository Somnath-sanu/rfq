import { internalMutation } from "./_generated/server";
import { getRankedBids, statusForTimes, writeLog } from "./rfqHelpers";

export const activateScheduledAuctions = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const due = await ctx.db
      .query("rfqs")
      .withIndex("by_status_and_bidStartAt", (q) =>
        q.eq("status", "scheduled").lte("bidStartAt", now),
      )
      .take(50);

    for (const rfq of due) {
      const status = statusForTimes(
        now,
        rfq.bidStartAt,
        rfq.currentBidCloseAt,
        rfq.forcedBidCloseAt,
      );
      if (status === "active") {
        await ctx.db.patch(rfq._id, { status, updatedAt: now });
        await writeLog(ctx, {
          rfqId: rfq._id,
          type: "auction_started",
          message: "Auction is active.",
          createdAt: now,
        });
      }
    }
  },
});

export const closeExpiredAuctions = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const expired = await ctx.db
      .query("rfqs")
      .withIndex("by_status_and_currentBidCloseAt", (q) =>
        q.eq("status", "active").lte("currentBidCloseAt", now),
      )
      .take(50);

    for (const rfq of expired) {
      if (rfq.forcedBidCloseAt <= now) {
        continue;
      }
      await ctx.db.patch(rfq._id, {
        status: "closed",
        updatedAt: now,
      });
      await writeLog(ctx, {
        rfqId: rfq._id,
        type: "auction_closed",
        message: "Auction closed at the current bid close time.",
        reason: "current bid close reached",
        createdAt: now,
      });
    }
  },
});

export const forceCloseAuctions = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const active = await ctx.db
      .query("rfqs")
      .withIndex("by_status_and_forcedBidCloseAt", (q) =>
        q.eq("status", "active").lte("forcedBidCloseAt", now),
      )
      .take(50);
    const scheduled = await ctx.db
      .query("rfqs")
      .withIndex("by_status_and_forcedBidCloseAt", (q) =>
        q.eq("status", "scheduled").lte("forcedBidCloseAt", now),
      )
      .take(50);

    for (const rfq of [...active, ...scheduled]) {
      await ctx.db.patch(rfq._id, {
        status: "force_closed",
        updatedAt: now,
      });
      await writeLog(ctx, {
        rfqId: rfq._id,
        type: "auction_force_closed",
        message: "Auction was force closed.",
        reason: "forced bid close reached",
        createdAt: now,
      });
    }
  },
});

export const recomputeAuctionSummaries = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const rfqs = await ctx.db
      .query("rfqs")
      .withIndex("by_auctionType_and_createdAt", (q) =>
        q.eq("auctionType", "british"),
      )
      .order("desc")
      .take(100);

    for (const rfq of rfqs) {
      const ranked = await getRankedBids(ctx, rfq._id, 1000);
      const lowest = ranked[0];
      const bidCount = ranked.length;
      const extensionLogs = await ctx.db
        .query("auctionActivityLogs")
        .withIndex("by_rfqId_and_createdAt", (q) => q.eq("rfqId", rfq._id))
        .order("desc")
        .take(1000);
      const extensionCount = extensionLogs.filter(
        (log) => log.type === "time_extended",
      ).length;

      await ctx.db.patch(rfq._id, {
        currentLowestAmount: lowest?.totalAmount,
        bidCount,
        extensionCount,
        status: statusForTimes(
          now,
          rfq.bidStartAt,
          rfq.currentBidCloseAt,
          rfq.forcedBidCloseAt,
        ),
        updatedAt: now,
      });
    }
  },
});
