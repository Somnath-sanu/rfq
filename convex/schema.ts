import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const auctionStatus = v.union(
  v.literal("scheduled"),
  v.literal("active"),
  v.literal("closed"),
  v.literal("force_closed"),
);

const extensionTrigger = v.union(
  v.literal("bid_received"),
  v.literal("any_rank_change"),
  v.literal("l1_rank_change"),
);

const activityType = v.union(
  v.literal("rfq_created"),
  v.literal("auction_started"),
  v.literal("bid_submitted"),
  v.literal("bid_updated"),
  v.literal("time_extended"),
  v.literal("auction_closed"),
  v.literal("auction_force_closed"),
);

export default defineSchema({
  rfqs: defineTable({
    name: v.string(),
    referenceId: v.string(),
    createdByTokenIdentifier: v.string(),
    auctionType: v.literal("british"),
    bidStartAt: v.number(),
    initialBidCloseAt: v.number(),
    currentBidCloseAt: v.number(),
    forcedBidCloseAt: v.number(),
    pickupServiceAt: v.number(),
    status: auctionStatus,
    currentLowestAmount: v.optional(v.number()),
    bidCount: v.number(),
    extensionCount: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_referenceId", ["referenceId"])
    .index("by_status_and_currentBidCloseAt", ["status", "currentBidCloseAt"])
    .index("by_status_and_forcedBidCloseAt", ["status", "forcedBidCloseAt"])
    .index("by_status_and_bidStartAt", ["status", "bidStartAt"])
    .index("by_createdByTokenIdentifier_and_createdAt", [
      "createdByTokenIdentifier",
      "createdAt",
    ])
    .index("by_auctionType_and_createdAt", ["auctionType", "createdAt"]),

  auctionConfigs: defineTable({
    rfqId: v.id("rfqs"),
    triggerWindowMinutes: v.number(),
    extensionDurationMinutes: v.number(),
    extensionTrigger,
  }).index("by_rfqId", ["rfqId"]),

  bids: defineTable({
    rfqId: v.id("rfqs"),
    supplierTokenIdentifier: v.string(),
    supplierName: v.optional(v.string()),
    supplierEmail: v.optional(v.string()),
    carrierName: v.string(),
    freightCharges: v.number(),
    originCharges: v.number(),
    destinationCharges: v.number(),
    totalAmount: v.number(),
    transitTime: v.number(),
    quoteValidityAt: v.number(),
    submittedAt: v.number(),
  })
    .index("by_rfqId", ["rfqId"])
    .index("by_rfqId_and_totalAmount", ["rfqId", "totalAmount"])
    .index("by_rfqId_and_submittedAt", ["rfqId", "submittedAt"])
    .index("by_supplierTokenIdentifier_and_submittedAt", [
      "supplierTokenIdentifier",
      "submittedAt",
    ])
    .index("by_rfqId_and_supplierTokenIdentifier", [
      "rfqId",
      "supplierTokenIdentifier"
    ]),

  auctionActivityLogs: defineTable({
    rfqId: v.id("rfqs"),
    actorTokenIdentifier: v.optional(v.string()),
    type: activityType,
    message: v.string(),
    reason: v.optional(v.string()),
    oldBidCloseAt: v.optional(v.number()),
    newBidCloseAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_rfqId_and_createdAt", ["rfqId", "createdAt"])
    .index("by_type_and_createdAt", ["type", "createdAt"]),
});
