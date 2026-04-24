import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function statusVariant(status: string) {
  if (status === "active") {
    return "default";
  }
  if (status === "force_closed") {
    return "destructive";
  }
  return "outline";
}

export const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export const dateTime = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function toDateTimeLocal(value: Date) {
  const offset = value.getTimezoneOffset() * 60 * 1000;
  return new Date(value.getTime() - offset).toISOString().slice(0, 16);
}