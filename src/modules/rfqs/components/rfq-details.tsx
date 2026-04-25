"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { IconArrowLeft, IconEdit, IconSend } from "@tabler/icons-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
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
import { Header } from "./header";
import { dateTime, money, statusVariant, toDateTimeLocal } from "@/lib/utils";
import { ActivityLogs } from "./activity-logs";
import { AuctionConfig } from "./auction-config";
import { Ranking } from "./ranking";
import { Loader2 } from "lucide-react";
import { bidFormSchema } from "../lib/bid-form-schema";
import { z } from "zod";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ConvexError } from "convex/values";
import { formatDuration, intervalToDuration } from "date-fns";

type BidFormValues = z.infer<typeof bidFormSchema>;

export function RfqDetails({ rfqId }: { rfqId: Id<"rfqs"> }) {
  const details = useQuery(api.rfqs.get, { rfqId });
  const submitBid = useMutation(api.rfqs.submitBid);

  const [serverError, setServerError] = useState<string | null>(null);

  const currentUserBid = details?.currentUserBid;

  const now = new Date();

  const form = useForm<BidFormValues>({
    resolver: zodResolver(bidFormSchema),
    mode: "onChange",
    defaultValues: {
      carrierName: "",
      freightCharges: 4200,
      originCharges: 700,
      destinationCharges: 650,
      transitTime: 5,
      quoteValidityAt: toDateTimeLocal(
        new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
      ),
    },
  });

  useEffect(() => {
    if (!currentUserBid) return;

    form.reset({
      carrierName: currentUserBid.carrierName,
      freightCharges: currentUserBid.freightCharges,
      originCharges: currentUserBid.originCharges,
      destinationCharges: currentUserBid.destinationCharges,
      transitTime: currentUserBid.transitTime,
      quoteValidityAt: toDateTimeLocal(
        new Date(currentUserBid.quoteValidityAt),
      ),
    });
  }, [currentUserBid, form]);

  const [freight, origin, destination] = useWatch({
    control: form.control,
    name: ["freightCharges", "originCharges", "destinationCharges"],
  });

  if (details === undefined) {
    return (
      <main className="min-h-screen w-full flex items-center justify-center bg-background px-6 py-10 text-foreground">
        <div className="mx-auto max-w-7xl text-muted-foreground">
          <Loader2 className="animate-spin size-8" />
        </div>
      </main>
    );
  }

  if (details === null) {
    return (
      <main className="min-h-screen bg-background px-6 py-10 text-foreground">
        <div className="mx-auto max-w-7xl">
          <Button asChild variant="outline">
            <Link href="/auctions">
              <IconArrowLeft />
              Back to auctions
            </Link>
          </Button>
          <h1 className="mt-6 text-2xl font-semibold">RFQ not found</h1>
        </div>
      </main>
    );
  }

  const { rfq, config, bids, logs } = details;
  const isActive = rfq.derivedStatus === "active" && rfq.status === "active";

  const total = (freight ?? 0) + (origin ?? 0) + (destination ?? 0);
  const existingTotal = currentUserBid?.totalAmount;

  async function onSubmit(values: BidFormValues) {
    setServerError(null);

    const total =
      values.freightCharges + values.originCharges + values.destinationCharges;

    if (existingTotal !== undefined && total > existingTotal) {
      form.setError("freightCharges", {
        message: "You can only lower your bid",
      });
      return;
    }

    if (currentUserBid) {
      const prev = {
        carrierName: currentUserBid.carrierName,
        freightCharges: currentUserBid.freightCharges,
        originCharges: currentUserBid.originCharges,
        destinationCharges: currentUserBid.destinationCharges,
        transitTime: currentUserBid.transitTime,
        quoteValidityAt: currentUserBid.quoteValidityAt,
      };

      const next = {
        ...values,
        quoteValidityAt: new Date(values.quoteValidityAt).getTime(),
      };

      if (JSON.stringify(prev) === JSON.stringify(next)) {
        toast.warning("No changes to update", {
          position: "top-center",
        });
        return;
      }
    }

    try {
      await submitBid({
        rfqId,
        carrierName: values.carrierName,
        freightCharges: values.freightCharges,
        originCharges: values.originCharges,
        destinationCharges: values.destinationCharges,
        transitTime: values.transitTime,
        quoteValidityAt: new Date(values.quoteValidityAt).getTime(),
      });
      toast.success("Bid submitted successfully", {
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
        <div className="mx-auto max-w-7xl px-6 py-8 w-full">
          <Button asChild size="sm" variant="outline">
            <Link href="/auctions">
              <IconArrowLeft />
              Back to auctions
            </Link>
          </Button>
          <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-heading text-4xl font-normal leading-tight tracking-tight md:text-5xl">
                  {rfq.name}
                </h1>
                <Badge
                  className="capitalize"
                  variant={statusVariant(rfq.derivedStatus)}
                >
                  {rfq.derivedStatus.replace("_", " ")}
                </Badge>
              </div>
              <p className="mt-2 text-base text-muted-foreground">
                {rfq.referenceId}
              </p>
            </div>
            <div className="grid w-full grid-cols-2 gap-3 lg:max-w-xl lg:grid-cols-2">
              <Card className="surface-panel rounded-2xl py-2" size="sm">
                <CardHeader>
                  <CardDescription className="text-sm">
                    Current L1
                  </CardDescription>
                  <CardTitle className="font-sans text-xl">
                    {rfq.currentLowestAmount === undefined
                      ? "No bids"
                      : money.format(rfq.currentLowestAmount)}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card className="surface-panel rounded-2xl py-2" size="sm">
                <CardHeader>
                  <CardDescription className="text-sm">
                    Current close
                  </CardDescription>
                  <CardTitle className="font-sans text-base">
                    {dateTime.format(new Date(rfq.currentBidCloseAt))}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card className="surface-panel rounded-2xl py-2" size="sm">
                <CardHeader>
                  <CardDescription className="text-sm">
                    Forced close
                  </CardDescription>
                  <CardTitle className="font-sans text-base">
                    {dateTime.format(new Date(rfq.forcedBidCloseAt))}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card className="surface-panel rounded-2xl py-2" size="sm">
                <CardHeader>
                  <CardDescription className="text-sm">
                    Extensions
                  </CardDescription>
                  <CardTitle className="font-sans text-xl">
                    {rfq.extensionCount}
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-6 px-6 py-8 lg:grid-cols-[390px_1fr]">
        <div className="grid h-fit gap-6">
          <Card className="surface-panel rounded-2xl">
            <CardHeader>
              <CardTitle className="font-sans text-2xl">
                {currentUserBid ? "Update Your Quote" : "Submit Quote"}
              </CardTitle>
              <CardDescription className="text-base">
                Suppliers keep one live quote per RFQ and may lower it while
                bidding is active.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <FieldGroup>
                  <Controller
                    name="carrierName"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Carrier name</FieldLabel>
                        <Input {...field} disabled={!isActive} />
                        {fieldState.error && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
                    <Controller
                      name="freightCharges"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel>Freight charges</FieldLabel>
                          <Input
                            type="number"
                            {...field}
                            disabled={!isActive}
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
                      name="originCharges"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel>Origin charges</FieldLabel>
                          <Input
                            type="number"
                            {...field}
                            disabled={!isActive}
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
                      name="destinationCharges"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel>Destination charges</FieldLabel>
                          <Input
                            type="number"
                            {...field}
                            disabled={!isActive}
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

                  <div className="rounded-lg border bg-muted/40 p-3 text-sm">
                    <div className="flex justify-between">
                      <span>Total quote</span>
                      <span className="font-semibold">
                        {money.format(total)}
                      </span>
                    </div>

                    {existingTotal && (
                      <p className="text-xs text-muted-foreground">
                        Current total: {money.format(existingTotal)}
                      </p>
                    )}
                  </div>

                  <Controller
                    name="transitTime"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Transit time (days)</FieldLabel>
                        <Input
                          type="number"
                          {...field}
                          disabled={!isActive}
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
                    name="quoteValidityAt"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Quote validity</FieldLabel>
                        <Input
                          type="datetime-local"
                          {...field}
                          disabled={!isActive}
                          min={toDateTimeLocal(new Date())}
                        />
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
                    className="h-11 w-full text-base cursor-pointer"
                    disabled={
                      !form.formState.isValid ||
                      form.formState.isSubmitting ||
                      !isActive
                    }
                    type="submit"
                  >
                    {currentUserBid ? <IconEdit /> : <IconSend />}
                    {form.formState.isSubmitting
                      ? "Saving..."
                      : currentUserBid
                        ? "Update Quote"
                        : "Submit Quote"}
                  </Button>

                  {!isActive ? (
                    <FieldDescription>
                      Quote submission is disabled because this auction is not
                      active.
                    </FieldDescription>
                  ) : null}
                </FieldGroup>
              </form>
            </CardContent>
          </Card>

          <AuctionConfig config={config} />
        </div>

        <div className="grid gap-6">
          <Ranking bids={bids} />

          <ActivityLogs logs={logs} />
        </div>
      </div>
    </main>
  );
}
