import { z } from "zod";
import { isAfter } from "date-fns";

export const bidFormSchema = z
  .object({
    carrierName: z.string().min(1, "Carrier name is required"),

    freightCharges: z.number().min(0),
    originCharges: z.number().min(0),
    destinationCharges: z.number().min(0),

    transitTime: z.number().min(1, "Transit time required"),

    quoteValidityAt: z.string().min(1),
  })
  .superRefine((data, ctx) => {
    const validity = new Date(data.quoteValidityAt);

    if (!isAfter(validity, new Date())) {
      ctx.addIssue({
        code: "custom",
        path: ["quoteValidityAt"],
        message: "Quote validity must be in the future",
      });
    }
  });
