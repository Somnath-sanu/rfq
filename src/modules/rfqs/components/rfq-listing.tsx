"use client";

import { useState } from "react";
import { IconPlus } from "@tabler/icons-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Header } from "./header";
import { toDateTimeLocal } from "@/lib/utils";
import { AuctionLists } from "./auction-lists";
import { z } from "zod";
import { rfqListingFormSchema } from "../lib/rfq-listing-schema";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  addMinutes,
  addDays,
  intervalToDuration,
  formatDuration,
} from "date-fns";
import { toast } from "sonner";
import { ConvexError } from "convex/values";

function MetricPill({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="surface-panel flex min-h-16 items-center justify-between gap-4 rounded-2xl px-5 py-3 border border-white/10 shadow">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <span className="font-sans text-xl font-semibold tracking-tight">
        {value}
      </span>
    </div>
  );
}

type FormValues = z.infer<typeof rfqListingFormSchema>;

const defaultValues: FormValues = {
  name: "",
  referenceId: "",
  bidStartAt: toDateTimeLocal(new Date()),
  bidCloseAt: toDateTimeLocal(addMinutes(new Date(), 30)),
  forcedBidCloseAt: toDateTimeLocal(addMinutes(new Date(), 60)),

  pickupServiceAt: toDateTimeLocal(addDays(new Date(), 7)),
  triggerWindowMinutes: 10,
  extensionDurationMinutes: 5,
  extensionTrigger: "bid_received",
};

export function RfqListing() {
  const rfqs = useQuery(api.rfqs.list);
  const createRfq = useMutation(api.rfqs.create);

  const [serverError, setServerError] = useState<string | null>(null);

  const now = new Date();

  const form = useForm<FormValues>({
    resolver: zodResolver(rfqListingFormSchema),
    mode: "onChange",
    defaultValues: {
      ...defaultValues,
      referenceId: `RFQ-${now.getTime().toString().slice(-6)}`,
    },
  });

  async function onSubmit(values: FormValues) {
    setServerError(null);

    try {
      await createRfq({
        name: values.name,
        referenceId: values.referenceId,

        bidStartAt: new Date(values.bidStartAt).getTime(),
        bidCloseAt: new Date(values.bidCloseAt).getTime(),
        forcedBidCloseAt: new Date(values.forcedBidCloseAt).getTime(),
        pickupServiceAt: new Date(values.pickupServiceAt).getTime(),

        triggerWindowMinutes: values.triggerWindowMinutes,
        extensionDurationMinutes: values.extensionDurationMinutes,
        extensionTrigger: values.extensionTrigger,
      });

      const now = new Date();

      form.reset({
        ...defaultValues,
        referenceId: `RFQ-${now.getTime().toString().slice(-6)}`,
      });

      toast.success("Auction created successfully", {
        position: "top-center",
      });
    } catch (err) {
      if (err instanceof ConvexError && err.data.kind === "RateLimited") {
        const retryAfter = err.data.retryAfter; 

        const duration = intervalToDuration({
          start: 0,
          end: retryAfter,
        });

        const formatted = formatDuration(duration, {
          format: ["hours", "minutes", "seconds"],
          zero: false,
        });

        toast.error(`You're acting too fast. Try again in ${formatted}.`, {
          position: "top-center",
        });

        return;
      }

      let errorMessage = "Failed to create auction";
      if (err instanceof ConvexError) {
        errorMessage = err.data;
        setServerError(errorMessage);
      }

      toast.error(errorMessage, {
        position: "top-center",
      });
    }
  }

  return (
    <main className="app-shell text-foreground">
      <Header />

      <section className="border-b border-white/10">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[1fr_360px]">
          <div className="flex flex-col justify-end gap-5">
            <div className="max-w-2xl">
              <h1 className="font-heading text-4xl font-normal leading-tight tracking-tight md:text-5xl">
                Manage RFQs, bids, rankings, and extension activity in real
                time.
              </h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
                Convex subscriptions keep current close times, L1 price, and
                supplier rankings fresh without WebSocket or Redis plumbing.
              </p>
            </div>
          </div>
          <div className="grid content-end gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <MetricPill label="Auctions" value={rfqs?.length ?? "-"} />
            <MetricPill
              label="Live"
              value={
                rfqs?.filter((rfq) => rfq.derivedStatus === "active").length ??
                "-"
              }
            />
            <MetricPill
              label="Extensions"
              value={
                rfqs?.reduce((sum, rfq) => sum + rfq.extensionCount, 0) ?? "-"
              }
            />
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[390px_1fr]">
        <Card className="surface-panel h-fit rounded-2xl">
          <CardHeader>
            <CardTitle className="font-sans text-2xl">
              Create British Auction
            </CardTitle>
            <CardDescription className="text-base">
              Start time is locked to the current time when the RFQ is created.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <FieldGroup>
                <Controller
                  name="name"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="name">RFQ name</FieldLabel>

                      <Input
                        {...field}
                        aria-invalid={fieldState.invalid}
                        defaultValue="Mumbai to Singapore Ocean Freight"
                        id="name"
                        name="name"
                      />

                      {fieldState.error && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                <Controller
                  name="referenceId"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="referenceId">
                        Reference ID
                      </FieldLabel>

                      <Input
                        {...field}
                        id="referenceId"
                        readOnly
                        className="cursor-not-allowed"
                        aria-invalid={fieldState.invalid}
                      />

                      {fieldState.error && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                <Controller
                  name="bidStartAt"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="bidStartAt">
                        Bid start time
                      </FieldLabel>

                      <Input
                        {...field}
                        type="datetime-local"
                        id="bidStartAt"
                        min={toDateTimeLocal(new Date())}
                        aria-invalid={fieldState.invalid}
                      />

                      <FieldDescription>
                        Must be scheduled in the future.
                      </FieldDescription>

                      {fieldState.error && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <Controller
                    name="bidCloseAt"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="bidCloseAt">Bid close</FieldLabel>

                        <Input
                          {...field}
                          type="datetime-local"
                          id="bidCloseAt"
                          aria-invalid={fieldState.invalid}
                        />

                        {fieldState.error && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <Controller
                    name="forcedBidCloseAt"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="forcedBidCloseAt">
                          Forced close
                        </FieldLabel>

                        <Input
                          {...field}
                          type="datetime-local"
                          id="forcedBidCloseAt"
                          aria-invalid={fieldState.invalid}
                        />

                        {fieldState.error && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                </div>

                <Controller
                  name="pickupServiceAt"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="pickupServiceAt">
                        Pickup/service date
                      </FieldLabel>

                      <Input
                        {...field}
                        type="datetime-local"
                        id="pickupServiceAt"
                        aria-invalid={fieldState.invalid}
                      />

                      {fieldState.error && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <Controller
                    name="triggerWindowMinutes"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="triggerWindowMinutes">
                          Trigger window X (minutes)
                        </FieldLabel>

                        <Input
                          {...field}
                          type="number"
                          min={1}
                          id="triggerWindowMinutes"
                          aria-invalid={fieldState.invalid}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />

                        {fieldState.error && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <Controller
                    name="extensionDurationMinutes"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="extensionDurationMinutes">
                          Extension Y (minutes)
                        </FieldLabel>

                        <Input
                          {...field}
                          type="number"
                          min={1}
                          id="extensionDurationMinutes"
                          aria-invalid={fieldState.invalid}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />

                        {fieldState.error && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                </div>

                <Controller
                  name="extensionTrigger"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Extension trigger</FieldLabel>

                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>

                        <SelectContent>
                          <SelectItem value="bid_received">
                            Bid received in last X minutes
                          </SelectItem>
                          <SelectItem value="any_rank_change">
                            Any supplier rank change
                          </SelectItem>
                          <SelectItem value="l1_rank_change">
                            Lowest bidder rank change
                          </SelectItem>
                        </SelectContent>
                      </Select>

                      {fieldState.error && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                {serverError ? (
                  <FieldError errors={[{ message: serverError }]} />
                ) : null}

                <Button
                  className="h-11 w-full cursor-pointer text-base"
                  disabled={
                    !form.formState.isValid || form.formState.isSubmitting
                  }
                  type="submit"
                >
                  <IconPlus />
                  {form.formState.isSubmitting
                    ? "Creating..."
                    : "Create Auction"}
                </Button>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>

        <AuctionLists rfqs={rfqs} />
      </div>
    </main>
  );
}
