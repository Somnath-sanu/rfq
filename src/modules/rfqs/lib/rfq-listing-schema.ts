import { z } from "zod";
import { isAfter, isEqual } from "date-fns";

export const rfqListingFormSchema = z
  .object({
    name: z.string().min(1, "RFQ name is required"),
    referenceId: z.string().min(1),

    bidStartAt: z.string().min(1, "Start time is required"),
    bidCloseAt: z.string().min(1, "Bid close time is required"),
    forcedBidCloseAt: z.string().min(1, "Forced close time is required"),
    pickupServiceAt: z.string().min(1, "Pickup/service date is required"),

    triggerWindowMinutes: z.number().min(1),
    extensionDurationMinutes: z.number().min(1),

    extensionTrigger: z.enum([
      "bid_received",
      "any_rank_change",
      "l1_rank_change",
    ]),
  })
  .superRefine((data, ctx) => {
    const now = new Date();

    const start = new Date(data.bidStartAt);
    const bidClose = new Date(data.bidCloseAt);
    const forcedClose = new Date(data.forcedBidCloseAt);
    const bidStart = new Date(data.bidStartAt);

    if (!(isAfter(start, now) || isEqual(start, now))) {
      ctx.addIssue({
        code: "custom",
        path: ["bidStartAt"],
        message: "Start time must be now or in the future",
      });
    }

    if (!isAfter(bidClose, bidStart)) {
      ctx.addIssue({
        code: "custom",
        path: ["bidCloseAt"],
        message: "Bid close must be after bid start",
      });
    }

    if (!isAfter(forcedClose, bidClose)) {
      ctx.addIssue({
        code: "custom",
        path: ["forcedBidCloseAt"],
        message: "Forced close must be after bid close",
      });
    }

    if (isAfter(bidStart, bidClose)) {
      ctx.addIssue({
        code: "custom",
        path: ["bidStartAt"],
        message: "Bid start time must be less than bid close time",
      });
    }
  });
