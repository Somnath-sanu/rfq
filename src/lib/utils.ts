import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";

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

export function toDateTimeLocal(date: Date): string {
  return format(date, "yyyy-MM-dd'T'HH:mm");
}
