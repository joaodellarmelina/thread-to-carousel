/** Counts Unicode code points instead of UTF-16 units, so emoji are never split. */
export function countCharacters(text: string): number {
  return Array.from(text).length;
}

export function truncateCharacters(text: string, limit: number): string {
  return Array.from(text).slice(0, limit).join("");
}
