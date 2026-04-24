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
import { dateTime, toDateTimeLocal } from "@/lib/utils";
import { AuctionLists } from "./auction-lists";

type ExtensionTrigger = "bid_received" | "any_rank_change" | "l1_rank_change";
type FormErrors = Partial<Record<string, string>>;

function MetricPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="surface-panel flex min-h-16 items-center justify-between gap-4 rounded-2xl px-5 py-3 border border-white/10 shadow">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <span className="font-sans text-xl font-semibold tracking-tight">
        {value}
      </span>
    </div>
  );
}

function parseLocalDateTime(value: FormDataEntryValue | null) {
  return typeof value === "string" && value ? new Date(value).getTime() : NaN;
}

function textValue(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function validateCreateForm(data: FormData, startAt: number): FormErrors {
  const errors: FormErrors = {};
  const name = textValue(data.get("name"));
  const referenceId = textValue(data.get("referenceId"));
  const bidCloseAt = parseLocalDateTime(data.get("bidCloseAt"));
  const forcedBidCloseAt = parseLocalDateTime(data.get("forcedBidCloseAt"));
  const pickupServiceAt = parseLocalDateTime(data.get("pickupServiceAt"));
  const triggerWindowMinutes = Number(data.get("triggerWindowMinutes"));
  const extensionDurationMinutes = Number(data.get("extensionDurationMinutes"));

  if (!name) {
    errors.name = "RFQ name is required.";
  }
  if (!referenceId) {
    errors.referenceId = "Reference ID is required.";
  }
  if (!Number.isFinite(bidCloseAt)) {
    errors.bidCloseAt = "Bid close time is required.";
  } else if (bidCloseAt <= startAt) {
    errors.bidCloseAt = "Bid close time must be after the start time.";
  }
  if (!Number.isFinite(forcedBidCloseAt)) {
    errors.forcedBidCloseAt = "Forced close time is required.";
  } else if (forcedBidCloseAt <= bidCloseAt) {
    errors.forcedBidCloseAt =
      "Forced close time must be later than bid close time.";
  }
  if (!Number.isFinite(pickupServiceAt)) {
    errors.pickupServiceAt = "Pickup/service date is required.";
  }
  if (!Number.isFinite(triggerWindowMinutes) || triggerWindowMinutes <= 0) {
    errors.triggerWindowMinutes = "Trigger window must be greater than zero.";
  }
  if (
    !Number.isFinite(extensionDurationMinutes) ||
    extensionDurationMinutes <= 0
  ) {
    errors.extensionDurationMinutes =
      "Extension duration must be greater than zero.";
  }

  return errors;
}

export function RfqListing() {
  const rfqs = useQuery(api.rfqs.list);
  const createRfq = useMutation(api.rfqs.create);
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [extensionTrigger, setExtensionTrigger] =
    useState<ExtensionTrigger>("bid_received");
  const [defaults, setDefaults] = useState(() => {
    const now = new Date();
    return {
      referenceId: `RFQ-${now.getTime().toString().slice(-6)}`,
      startAtLabel: dateTime.format(now),
      bidCloseAt: toDateTimeLocal(new Date(now.getTime() + 30 * 60 * 1000)),
      forcedBidCloseAt: toDateTimeLocal(
        new Date(now.getTime() + 60 * 60 * 1000),
      ),
      pickupServiceAt: toDateTimeLocal(
        new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      ),
    };
  });

  async function createFromForm(data: FormData) {
    const bidStartAt = Date.now();
    const nextErrors = validateCreateForm(data, bidStartAt);
    setErrors(nextErrors);
    setServerError(null);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSaving(true);
    try {
      await createRfq({
        name: textValue(data.get("name")),
        referenceId: textValue(data.get("referenceId")),
        bidStartAt,
        bidCloseAt: parseLocalDateTime(data.get("bidCloseAt")),
        forcedBidCloseAt: parseLocalDateTime(data.get("forcedBidCloseAt")),
        pickupServiceAt: parseLocalDateTime(data.get("pickupServiceAt")),
        triggerWindowMinutes: Number(data.get("triggerWindowMinutes")),
        extensionDurationMinutes: Number(data.get("extensionDurationMinutes")),
        extensionTrigger,
      });
      const now = new Date();
      setDefaults((current) => ({
        ...current,
        referenceId: `RFQ-${now.getTime().toString().slice(-6)}`,
        startAtLabel: dateTime.format(now),
      }));
    } catch (caught) {
      setServerError(
        caught instanceof Error ? caught.message : "Unable to create RFQ.",
      );
    } finally {
      setIsSaving(false);
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

      <div className="mx-auto grid max-w-6xl gap-6 px-6 py-8 lg:grid-cols-[390px_1fr]">
        <Card className="surface-panel h-fit rounded-2xl">
          <CardHeader>
            <CardTitle className="font-sans text-2xl">Create British Auction</CardTitle>
            <CardDescription className="text-base">
              Start time is locked to the current time when the RFQ is created.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createFromForm}>
              <FieldGroup>
                <Field data-invalid={Boolean(errors.name)}>
                  <FieldLabel htmlFor="name">RFQ name</FieldLabel>
                  <Input
                    aria-invalid={Boolean(errors.name)}
                    defaultValue="Mumbai to Singapore Ocean Freight"
                    id="name"
                    name="name"
                  />
                  <FieldError>{errors.name}</FieldError>
                </Field>

                <Field data-invalid={Boolean(errors.referenceId)}>
                  <FieldLabel htmlFor="referenceId">Reference ID</FieldLabel>
                  <Input
                    aria-invalid={Boolean(errors.referenceId)}
                    defaultValue={defaults.referenceId}
                    id="referenceId"
                    name="referenceId"
                    key={defaults.referenceId}
                    readOnly
                    value={defaults.referenceId}
                    className="cursor-not-allowed"
                  />
                  <FieldError>{errors.referenceId}</FieldError>
                </Field>

                <Field>
                  <FieldLabel>Bid start</FieldLabel>
                  <Input
                    disabled
                    className="cursor-not-allowed"
                    value={defaults.startAtLabel}
                  />
                  <FieldDescription>
                    Captured from the current clock at submit time.
                  </FieldDescription>
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field data-invalid={Boolean(errors.bidCloseAt)}>
                    <FieldLabel htmlFor="bidCloseAt">Bid close</FieldLabel>
                    <Input
                      aria-invalid={Boolean(errors.bidCloseAt)}
                      defaultValue={defaults.bidCloseAt}
                      id="bidCloseAt"
                      name="bidCloseAt"
                      type="datetime-local"
                    />
                    <FieldError>{errors.bidCloseAt}</FieldError>
                  </Field>
                  <Field data-invalid={Boolean(errors.forcedBidCloseAt)}>
                    <FieldLabel htmlFor="forcedBidCloseAt">
                      Forced close
                    </FieldLabel>
                    <Input
                      aria-invalid={Boolean(errors.forcedBidCloseAt)}
                      defaultValue={defaults.forcedBidCloseAt}
                      id="forcedBidCloseAt"
                      name="forcedBidCloseAt"
                      type="datetime-local"
                    />
                    <FieldError>{errors.forcedBidCloseAt}</FieldError>
                  </Field>
                </div>

                <Field data-invalid={Boolean(errors.pickupServiceAt)}>
                  <FieldLabel htmlFor="pickupServiceAt">
                    Pickup/service date
                  </FieldLabel>
                  <Input
                    aria-invalid={Boolean(errors.pickupServiceAt)}
                    defaultValue={defaults.pickupServiceAt}
                    id="pickupServiceAt"
                    name="pickupServiceAt"
                    type="datetime-local"
                  />
                  <FieldError>{errors.pickupServiceAt}</FieldError>
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field data-invalid={Boolean(errors.triggerWindowMinutes)}>
                    <FieldLabel htmlFor="triggerWindowMinutes">
                      Trigger window X (minutes)
                    </FieldLabel>
                    <Input
                      aria-invalid={Boolean(errors.triggerWindowMinutes)}
                      defaultValue="10"
                      id="triggerWindowMinutes"
                      min="1"
                      name="triggerWindowMinutes"
                      type="number"
                    />
                    <FieldError>{errors.triggerWindowMinutes}</FieldError>
                  </Field>
                  <Field
                    data-invalid={Boolean(errors.extensionDurationMinutes)}
                  >
                    <FieldLabel htmlFor="extensionDurationMinutes">
                      Extension Y (minutes)
                    </FieldLabel>
                    <Input
                      aria-invalid={Boolean(errors.extensionDurationMinutes)}
                      defaultValue="5"
                      id="extensionDurationMinutes"
                      min="1"
                      name="extensionDurationMinutes"
                      type="number"
                    />
                    <FieldError>{errors.extensionDurationMinutes}</FieldError>
                  </Field>
                </div>

                <Field>
                  <FieldLabel>Extension trigger</FieldLabel>
                  <Select
                    value={extensionTrigger}
                    onValueChange={(value) =>
                      setExtensionTrigger(value as ExtensionTrigger)
                    }
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
                </Field>

                {serverError ? (
                  <FieldError className="rounded-lg border border-destructive/20 bg-destructive/10 p-3">
                    {serverError}
                  </FieldError>
                ) : null}

                <Button
                  className="h-11 w-full cursor-pointer text-base"
                  disabled={isSaving}
                  type="submit"
                >
                  <IconPlus />
                  {isSaving ? "Creating..." : "Create Auction"}
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
