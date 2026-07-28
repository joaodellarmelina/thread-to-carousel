import { DEFAULT_POST_DATETIME } from "./types";

const timeFormatter = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
const dateFormatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

/** Formats a "datetime-local" value (e.g. "2023-06-07T10:39") the way X shows post times. */
export function formatPostDateTime(value: string): string {
  const date = new Date(value || DEFAULT_POST_DATETIME);
  if (Number.isNaN(date.getTime())) return formatPostDateTime(DEFAULT_POST_DATETIME);
  return `${timeFormatter.format(date)} · ${dateFormatter.format(date)}`;
}
