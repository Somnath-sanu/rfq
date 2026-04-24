"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  IconArrowLeft,
  IconEdit,
  IconSend,
} from "@tabler/icons-react";
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

type BidForm = {
  carrierName: string;
  freightCharges: string;
  originCharges: string;
  destinationCharges: string;
  transitTime: number;
  quoteValidityAt: string;
};

type FormErrors = Partial<Record<keyof BidForm | "total", string>>;

function parseAmount(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
}

function validateBidForm(form: BidForm, existingTotal?: number) {
  const errors: FormErrors = {};
  const freightCharges = parseAmount(form.freightCharges);
  const originCharges = parseAmount(form.originCharges);
  const destinationCharges = parseAmount(form.destinationCharges);
  const quoteValidityAt = new Date(form.quoteValidityAt).getTime();
  const total = freightCharges + originCharges + destinationCharges;

  if (!form.carrierName.trim()) {
    errors.carrierName = "Carrier name is required.";
  }
  if (!Number.isFinite(freightCharges) || freightCharges < 0) {
    errors.freightCharges = "Freight charges must be zero or greater.";
  }
  if (!Number.isFinite(originCharges) || originCharges < 0) {
    errors.originCharges = "Origin charges must be zero or greater.";
  }
  if (!Number.isFinite(destinationCharges) || destinationCharges < 0) {
    errors.destinationCharges = "Destination charges must be zero or greater.";
  }
  if (!form.transitTime) {
    errors.transitTime = "Transit time is required.";
  }
  if (!Number.isFinite(quoteValidityAt) || quoteValidityAt <= Date.now()) {
    errors.quoteValidityAt = "Quote validity must be in the future.";
  }
  if (existingTotal !== undefined && total > existingTotal) {
    errors.total = "Updated bids must keep or lower your current total.";
  }

  return errors;
}

export function RfqDetails({ rfqId }: { rfqId: Id<"rfqs"> }) {
  const details = useQuery(api.rfqs.get, { rfqId });
  const submitBid = useMutation(api.rfqs.submitBid);
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<BidForm>(() => ({
    carrierName: "Prime Carrier Lines",
    freightCharges: "4200",
    originCharges: "700",
    destinationCharges: "650",
    transitTime: 5,
    quoteValidityAt: toDateTimeLocal(
      new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    ),
  }));
  const currentUserBid = details?.currentUserBid;

  useEffect(() => {
    const bid = currentUserBid;
    if (!bid) {
      return;
    }
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) {
        return;
      }
      setForm({
        carrierName: bid.carrierName,
        freightCharges: String(bid.freightCharges),
        originCharges: String(bid.originCharges),
        destinationCharges: String(bid.destinationCharges),
        transitTime: Number(bid.transitTime),
        quoteValidityAt: toDateTimeLocal(new Date(bid.quoteValidityAt)),
      });
    });
    return () => {
      cancelled = true;
    };
  }, [currentUserBid]);

  async function submitFromForm() {
    const existingTotal = details?.currentUserBid?.totalAmount;
    const nextErrors = validateBidForm(form, existingTotal);
    setErrors(nextErrors);
    setServerError(null);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSaving(true);
    try {
      await submitBid({
        rfqId,
        carrierName: form.carrierName,
        freightCharges: Number(form.freightCharges),
        originCharges: Number(form.originCharges),
        destinationCharges: Number(form.destinationCharges),
        transitTime: form.transitTime,
        quoteValidityAt: new Date(form.quoteValidityAt).getTime(),
      });
    } catch (caught) {
      setServerError(
        caught instanceof Error ? caught.message : "Unable to submit bid.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (details === undefined) {
    return (
      <main className="min-h-screen bg-background px-6 py-10 text-foreground">
        <div className="mx-auto max-w-7xl text-muted-foreground">
          Loading RFQ...
        </div>
      </main>
    );
  }

  if (details === null) {
    return (
      <main className="min-h-screen bg-background px-6 py-10 text-foreground">
        <div className="mx-auto max-w-7xl">
          <Button asChild variant="outline">
            <Link href="/">
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
  const totalPreview =
    parseAmount(form.freightCharges) +
    parseAmount(form.originCharges) +
    parseAmount(form.destinationCharges);
  const canSubmit = isActive && !isSaving;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Header />
      <section className="border-b bg-muted/30">
        <div className="mx-auto max-w-7xl px-6 py-7">
          <Button asChild size="sm" variant="outline">
            <Link href="/">
              <IconArrowLeft />
              Back to auctions
            </Link>
          </Button>
          <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-semibold tracking-tight">
                  {rfq.name}
                </h1>
                <Badge
                  className="capitalize"
                  variant={statusVariant(rfq.derivedStatus)}
                >
                  {rfq.derivedStatus.replace("_", " ")}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {rfq.referenceId}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 w-full">
              <Card size="sm">
                <CardHeader>
                  <CardDescription>Current L1</CardDescription>
                  <CardTitle>
                    {rfq.currentLowestAmount === undefined
                      ? "No bids"
                      : money.format(rfq.currentLowestAmount)}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card size="sm">
                <CardHeader>
                  <CardDescription>Current close</CardDescription>
                  <CardTitle className="text-sm">
                    {dateTime.format(new Date(rfq.currentBidCloseAt))}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card size="sm">
                <CardHeader>
                  <CardDescription>Forced close</CardDescription>
                  <CardTitle className="text-sm">
                    {dateTime.format(new Date(rfq.forcedBidCloseAt))}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card size="sm">
                <CardHeader>
                  <CardDescription>Extensions</CardDescription>
                  <CardTitle>{rfq.extensionCount}</CardTitle>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-6 px-6 py-6 lg:grid-cols-[400px_1fr]">
        <div className="grid h-fit gap-6">
          <Card>
            <CardHeader>
              <CardTitle>
                {currentUserBid ? "Update Your Quote" : "Submit Quote"}
              </CardTitle>
              <CardDescription>
                Suppliers keep one live quote per RFQ and may lower it while
                bidding is active.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={submitFromForm}>
                <FieldGroup>
                  <Field data-invalid={Boolean(errors.carrierName)}>
                    <FieldLabel htmlFor="carrierName">Carrier name</FieldLabel>
                    <Input
                      aria-invalid={Boolean(errors.carrierName)}
                      disabled={!isActive}
                      id="carrierName"
                      name="carrierName"
                      onChange={(event) =>
                        setForm({ ...form, carrierName: event.target.value })
                      }
                      value={form.carrierName}
                    />
                    <FieldError>{errors.carrierName}</FieldError>
                  </Field>

                  <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
                    <Field data-invalid={Boolean(errors.freightCharges)}>
                      <FieldLabel htmlFor="freightCharges">
                        Freight charges
                      </FieldLabel>
                      <Input
                        aria-invalid={Boolean(errors.freightCharges)}
                        disabled={!isActive}
                        id="freightCharges"
                        min="0"
                        name="freightCharges"
                        onChange={(event) =>
                          setForm({
                            ...form,
                            freightCharges: event.target.value,
                          })
                        }
                        type="number"
                        value={form.freightCharges}
                      />
                      <FieldError>{errors.freightCharges}</FieldError>
                    </Field>
                    <Field data-invalid={Boolean(errors.originCharges)}>
                      <FieldLabel htmlFor="originCharges">
                        Origin charges
                      </FieldLabel>
                      <Input
                        aria-invalid={Boolean(errors.originCharges)}
                        disabled={!isActive}
                        id="originCharges"
                        min="0"
                        name="originCharges"
                        onChange={(event) =>
                          setForm({
                            ...form,
                            originCharges: event.target.value,
                          })
                        }
                        type="number"
                        value={form.originCharges}
                      />
                      <FieldError>{errors.originCharges}</FieldError>
                    </Field>
                    <Field data-invalid={Boolean(errors.destinationCharges)}>
                      <FieldLabel htmlFor="destinationCharges">
                        Destination charges
                      </FieldLabel>
                      <Input
                        aria-invalid={Boolean(errors.destinationCharges)}
                        disabled={!isActive}
                        id="destinationCharges"
                        min="0"
                        name="destinationCharges"
                        onChange={(event) =>
                          setForm({
                            ...form,
                            destinationCharges: event.target.value,
                          })
                        }
                        type="number"
                        value={form.destinationCharges}
                      />
                      <FieldError>{errors.destinationCharges}</FieldError>
                    </Field>
                  </div>

                  <div className="rounded-lg border bg-muted/40 p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Total quote</span>
                      <span className="font-semibold">
                        {Number.isFinite(totalPreview)
                          ? money.format(totalPreview)
                          : "-"}
                      </span>
                    </div>
                    {currentUserBid ? (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Current total:{" "}
                        {money.format(currentUserBid.totalAmount)}
                      </p>
                    ) : null}
                    <FieldError>{errors.total}</FieldError>
                  </div>

                  <Field data-invalid={Boolean(errors.transitTime)}>
                    <FieldLabel htmlFor="transitTime">
                      Transit time (days)
                    </FieldLabel>
                    <Input
                      aria-invalid={Boolean(errors.transitTime)}
                      disabled={!isActive}
                      id="transitTime"
                      type="number"
                      name="transitTime"
                      onChange={(event) =>
                        setForm({
                          ...form,
                          transitTime: Number(event.target.value),
                        })
                      }
                      value={form.transitTime}
                    />
                    <FieldError>{errors.transitTime}</FieldError>
                  </Field>

                  <Field data-invalid={Boolean(errors.quoteValidityAt)}>
                    <FieldLabel htmlFor="quoteValidityAt">
                      Quote validity
                    </FieldLabel>
                    <Input
                      aria-invalid={Boolean(errors.quoteValidityAt)}
                      disabled={!isActive}
                      id="quoteValidityAt"
                      name="quoteValidityAt"
                      onChange={(event) =>
                        setForm({
                          ...form,
                          quoteValidityAt: event.target.value,
                        })
                      }
                      type="datetime-local"
                      value={form.quoteValidityAt}
                    />
                    <FieldError>{errors.quoteValidityAt}</FieldError>
                  </Field>

                  {serverError ? (
                    <FieldError className="rounded-lg border border-destructive/20 bg-destructive/10 p-3">
                      {serverError}
                    </FieldError>
                  ) : null}

                  <Button
                    className="w-full"
                    disabled={!canSubmit}
                    type="submit"
                  >
                    {currentUserBid ? <IconEdit /> : <IconSend />}
                    {isSaving
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
