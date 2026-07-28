/**
 * Finds the longest prefix of an element's current text that fits without
 * visually overflowing its box, via binary search (O(log n) DOM reflows
 * instead of removing one character at a time) — this runs on every
 * keystroke via TextFitProbe, so it has to stay cheap.
 */
export function trimToFit(el: HTMLElement): { text: string; trimmed: boolean } {
  const fullText = el.textContent ?? "";
  el.textContent = fullText;
  if (el.scrollHeight <= el.clientHeight + 1) {
    return { text: fullText, trimmed: false };
  }

  let lo = 0;
  let hi = fullText.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    el.textContent = fullText.slice(0, mid);
    if (el.scrollHeight <= el.clientHeight + 1) {
      lo = mid; // fits — try a longer prefix
    } else {
      hi = mid - 1; // overflows — try a shorter prefix
    }
  }

  const text = fullText.slice(0, lo);
  el.textContent = text;
  return { text, trimmed: true };
}
