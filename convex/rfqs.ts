import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  assertPositiveMoney,
  formatTrigger,
  getBidCount,
  getRankedBids,
  getSupplierBid,
  statusForTimes,
  writeLog,
} from "./rfqHelpers";
import { extensionTriggerValidator, minuteMs } from "./rfqTypes";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("you must be signed in");
    }

    const rfqs = await ctx.db
      .query("rfqs")
      .withIndex("by_auctionType_and_createdAt", (q) =>
        q.eq("auctionType", "british"),
      )
      .order("desc")
      .take(100);

    return rfqs.map((rfq) => ({
      ...rfq,
      derivedStatus: statusForTimes(
        Date.now(),
        rfq.bidStartAt,
        rfq.currentBidCloseAt,
        rfq.forcedBidCloseAt,
      ),
    }));
  },
});

export const get = query({
  args: { rfqId: v.id("rfqs") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("you must be signed in");
    } 

    const rfq = await ctx.db.get(args.rfqId);
    if (!rfq) {
      return null;
    }

    const [config, bids, logs] = await Promise.all([
      ctx.db
        .query("auctionConfigs")
        .withIndex("by_rfqId", (q) => q.eq("rfqId", args.rfqId))
        .unique(),
      getRankedBids(ctx, args.rfqId, 200),
      ctx.db
        .query("auctionActivityLogs")
        .withIndex("by_rfqId_and_createdAt", (q) => q.eq("rfqId", args.rfqId))
        .order("desc")
        .take(200),
    ]);

    const currentUserBid = await getSupplierBid(
      ctx,
      args.rfqId,
      identity.tokenIdentifier,
    );

    const enrichedBids = bids.map((bid, index) => ({
      ...bid,
      supplierTokenIdentifier: null,
      rank: index + 1,
      supplierName: bid.supplierName ?? bid.supplierEmail ?? "Supplier",
      supplierEmail: bid.supplierEmail,
      isCurrentUserBid:
        identity?.tokenIdentifier === bid.supplierTokenIdentifier,
    }));

    return {
      rfq: {
        ...rfq,
        createdByTokenIdentifier: null,
        derivedStatus: statusForTimes(
          Date.now(),
          rfq.bidStartAt,
          rfq.currentBidCloseAt,
          rfq.forcedBidCloseAt,
        ),
      },
      config,
      bids: enrichedBids,
      logs,
      currentUserBid,
    };
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    referenceId: v.string(),
    bidStartAt: v.number(),
    bidCloseAt: v.number(),
    forcedBidCloseAt: v.number(),
    pickupServiceAt: v.number(),
    triggerWindowMinutes: v.number(),
    extensionDurationMinutes: v.number(),
    extensionTrigger: extensionTriggerValidator,
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("You must be signed in.");
    }
    const now = Date.now();

    if (!args.name.trim()) {
      throw new Error("RFQ name is required.");
    }
    if (!args.referenceId.trim()) {
      throw new Error("Reference ID is required.");
    }
    if (args.bidStartAt >= args.bidCloseAt) {
      throw new Error("Bid start time must be before bid close time.");
    }
    if (args.forcedBidCloseAt <= args.bidCloseAt) {
      throw new Error(
        "Forced bid close time must be later than bid close time.",
      );
    }
    if (args.triggerWindowMinutes <= 0) {
      throw new Error("Trigger window must be greater than zero.");
    }
    if (args.extensionDurationMinutes <= 0) {
      throw new Error("Extension duration must be greater than zero.");
    }

    const duplicate = await ctx.db
      .query("rfqs")
      .withIndex("by_referenceId", (q) =>
        q.eq("referenceId", args.referenceId.trim()),
      )
      .unique();
    if (duplicate) {
      throw new Error("Reference ID already exists.");
    }

    const status = statusForTimes(
      now,
      args.bidStartAt,
      args.bidCloseAt,
      args.forcedBidCloseAt,
    );

    const rfqId = await ctx.db.insert("rfqs", {
      name: args.name.trim(),
      referenceId: args.referenceId.trim(),
      createdByTokenIdentifier: identity.tokenIdentifier,
      auctionType: "british",
      bidStartAt: args.bidStartAt,
      initialBidCloseAt: args.bidCloseAt,
      currentBidCloseAt: args.bidCloseAt,
      forcedBidCloseAt: args.forcedBidCloseAt,
      pickupServiceAt: args.pickupServiceAt,
      status,
      bidCount: 0,
      extensionCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("auctionConfigs", {
      rfqId,
      triggerWindowMinutes: args.triggerWindowMinutes,
      extensionDurationMinutes: args.extensionDurationMinutes,
      extensionTrigger: args.extensionTrigger,
    });

    await writeLog(ctx, {
      rfqId,
      actorTokenIdentifier: identity.tokenIdentifier,
      type: "rfq_created",
      message: `RFQ ${args.referenceId.trim()} was created.`,
      createdAt: now,
    });

    if (status === "active") {
      await writeLog(ctx, {
        rfqId,
        type: "auction_started",
        message: "Auction is active.",
        createdAt: now,
      });
    }

    return rfqId;
  },
});

export const submitBid = mutation({
  args: {
    rfqId: v.id("rfqs"),
    carrierName: v.string(),
    freightCharges: v.number(),
    originCharges: v.number(),
    destinationCharges: v.number(),
    transitTime: v.number(),
    quoteValidityAt: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("You must be signed in.");
    }
    const supplierName =
      identity.name ?? identity.nickname ?? identity.givenName;
    const supplierEmail = identity.email;
    const now = Date.now();
    const rfq = await ctx.db.get(args.rfqId);
    if (!rfq) {
      throw new Error("RFQ not found.");
    }

    const liveStatus = statusForTimes(
      now,
      rfq.bidStartAt,
      rfq.currentBidCloseAt,
      rfq.forcedBidCloseAt,
    );
    if (liveStatus !== "active" || rfq.status !== "active") {
      throw new Error("Bidding is only allowed while the auction is active.");
    }
    if (now >= rfq.currentBidCloseAt || now >= rfq.forcedBidCloseAt) {
      throw new Error("Bidding has closed for this RFQ.");
    }

    assertPositiveMoney(args.freightCharges, "Freight charges");
    assertPositiveMoney(args.originCharges, "Origin charges");
    assertPositiveMoney(args.destinationCharges, "Destination charges");

    if (!args.carrierName.trim()) {
      throw new Error("Carrier name is required.");
    }
    if (!args.transitTime) {
      throw new Error("Transit time is required.");
    }
    if (args.quoteValidityAt <= now) {
      throw new Error("Quote validity must be in the future.");
    }
    const transitTime = args.transitTime;

    const config = await ctx.db
      .query("auctionConfigs")
      .withIndex("by_rfqId", (q) => q.eq("rfqId", args.rfqId))
      .unique();
    if (!config) {
      throw new Error("Auction configuration is missing.");
    }

    const totalAmount =
      args.freightCharges + args.originCharges + args.destinationCharges;
    const existingBid = await getSupplierBid(
      ctx,
      args.rfqId,
      identity.tokenIdentifier,
    );
    if (existingBid && totalAmount > existingBid.totalAmount) {
      throw new Error("Updated bids must keep or lower the current total.");
    }

    const previousRanked = await getRankedBids(ctx, args.rfqId, 200);
    const previousL1 = previousRanked[0];
    const previousOrder = previousRanked.map((bid) => bid._id);

    const bidId = existingBid
      ? existingBid._id
      : await ctx.db.insert("bids", {
          rfqId: args.rfqId,
          supplierTokenIdentifier: identity.tokenIdentifier,
          ...(supplierName ? { supplierName } : {}),
          ...(supplierEmail ? { supplierEmail } : {}),
          carrierName: args.carrierName.trim(),
          freightCharges: args.freightCharges,
          originCharges: args.originCharges,
          destinationCharges: args.destinationCharges,
          totalAmount,
          transitTime,
          quoteValidityAt: args.quoteValidityAt,
          submittedAt: now,
        });

    if (existingBid) {
      await ctx.db.patch(existingBid._id, {
        carrierName: args.carrierName.trim(),
        ...(supplierName ? { supplierName } : {}),
        ...(supplierEmail ? { supplierEmail } : {}),
        freightCharges: args.freightCharges,
        originCharges: args.originCharges,
        destinationCharges: args.destinationCharges,
        totalAmount,
        transitTime,
        quoteValidityAt: args.quoteValidityAt,
        submittedAt: now,
      });
    }

    const ranked = await getRankedBids(ctx, args.rfqId, 200);
    const currentL1 = ranked[0];
    const l1Changed = previousL1?._id !== currentL1?._id;
    const anyRankChanged = ranked.some(
      (bid, index) => previousOrder[index] !== bid._id,
    );
    const insideTriggerWindow =
      now >= rfq.currentBidCloseAt - config.triggerWindowMinutes * minuteMs;

    let shouldExtend = false;
    if (insideTriggerWindow) {
      shouldExtend =
        config.extensionTrigger === "bid_received" ||
        (config.extensionTrigger === "any_rank_change" && anyRankChanged) ||
        (config.extensionTrigger === "l1_rank_change" && l1Changed);
    }

    let nextBidCloseAt = rfq.currentBidCloseAt;
    let extensionApplied = false;
    if (shouldExtend && rfq.currentBidCloseAt < rfq.forcedBidCloseAt) {
      nextBidCloseAt = Math.min(
        rfq.currentBidCloseAt + config.extensionDurationMinutes * minuteMs,
        rfq.forcedBidCloseAt,
      );
      extensionApplied = nextBidCloseAt > rfq.currentBidCloseAt;
    }

    const bidCount = await getBidCount(ctx, args.rfqId);
    const extensionCount = rfq.extensionCount + (extensionApplied ? 1 : 0);

    await ctx.db.patch(args.rfqId, {
      initialBidCloseAt: rfq.currentBidCloseAt,
      currentBidCloseAt: nextBidCloseAt,
      currentLowestAmount: currentL1?.totalAmount,
      bidCount,
      extensionCount,
      updatedAt: now,
    });

    await writeLog(ctx, {
      rfqId: args.rfqId,
      actorTokenIdentifier: identity.tokenIdentifier,
      type: existingBid ? "bid_updated" : "bid_submitted",
      message: `${supplierName ?? supplierEmail ?? "Supplier"} ${
        existingBid ? "updated" : "submitted"
      } ${totalAmount.toFixed(2)}.`,
      createdAt: now,
    });

    if (extensionApplied) {
      await writeLog(ctx, {
        rfqId: args.rfqId,
        actorTokenIdentifier: identity.tokenIdentifier,
        type: "time_extended",
        message: "Auction close time was extended.",
        reason: formatTrigger(config.extensionTrigger),
        oldBidCloseAt: rfq.currentBidCloseAt,
        newBidCloseAt: nextBidCloseAt,
        createdAt: now,
      });
    }

    return bidId;
  },
});