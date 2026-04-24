import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// crons.interval(
//   "activate scheduled british auctions",
//   { minutes: 1 },
//   internal.internalMutations.activateScheduledAuctions,
//   {},
// );

crons.interval(
  "close expired british auctions",
  { minutes: 1 },
  internal.internalMutations.closeExpiredAuctions,
  {},
);

crons.interval(
  "force close british auctions",
  { minutes: 1 },
  internal.internalMutations.forceCloseAuctions,
  {},
);

// crons.interval(
//   "recompute british auction summaries",
//   { minutes: 5 },
//   internal.internalMutations.recomputeAuctionSummaries,
//   {},
// );

export default crons;
