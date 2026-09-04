const SEPARATOR_LINE = /^\s*---\s*$/m;

/**
 * Splits a draft only on an explicit three-dash line. Blank lines are
 * meaningful paragraph spacing inside a post and never create extra slides.
 */
export function parseThread(raw: string): string[] {
  const normalized = raw.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  const tweets = normalized
    .split(SEPARATOR_LINE)
    .map((block) => block.trim())
    .filter(Boolean);

  return tweets.length > 0 ? tweets : [normalized];
}
