const NUMBERED_PREFIX = /^\s*\d{1,3}[.)/]\s+/;
const SEPARATOR_LINE = /^\s*-{3,}\s*$/m;

/**
 * Splits a pasted X thread into individual tweet bodies. Heuristic only —
 * the result always lands in fully-editable slides, so a wrong split is a
 * one-click fix, not a blocker.
 */
export function parseThread(raw: string): string[] {
  const normalized = raw.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  const splitPattern = new RegExp(`(?:\\n{2,})|(?:${SEPARATOR_LINE.source})`, "m");
  const blocks = normalized.split(splitPattern);

  const tweets = blocks
    .map((block) => block.replace(NUMBERED_PREFIX, "").trim())
    .filter((block) => block.length > 0);

  return tweets.length > 0 ? tweets : [normalized];
}
