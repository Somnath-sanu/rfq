import { v } from "convex/values";

export type AuctionStatus = "scheduled" | "active" | "closed" | "force_closed";
export type ExtensionTrigger =
  | "bid_received"
  | "any_rank_change"
  | "l1_rank_change";
export type ActivityType =
  | "rfq_created"
  | "auction_started"
  | "bid_submitted"
  | "bid_updated"
  | "time_extended"
  | "auction_closed"
  | "auction_force_closed";

export const minuteMs = 60 * 1000;

export const extensionTriggerValidator = v.union(
  v.literal("bid_received"),
  v.literal("any_rank_change"),
  v.literal("l1_rank_change"),
);
