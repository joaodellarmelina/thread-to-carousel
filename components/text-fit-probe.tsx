"use client";

import { useRef } from "react";
import { TweetCard } from "./tweet-card";
import { trimToFit } from "@/lib/text-fit";
import { TWEET_MAX_CHARS } from "@/lib/constants";
import { useIsomorphicLayoutEffect } from "@/lib/use-isomorphic-layout-effect";
import type { Profile, Slide, CardTheme, CardStyle, AspectRatio } from "@/lib/types";

export interface TextFitResult {
  /** The real capacity for this exact configuration, independent of how much
   *  of it the current text actually uses — this is what makes the counter's
   *  denominator move as media/aspect-ratio/template change, not just once
   *  the current text happens to overflow. */
  maxChars: number;
  overflowed: boolean;
  trimmedText: string;
}

const FILLER = "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor ";

/** Pads text out to `length` with filler words so a short string can still be
 *  used to probe the true wrap boundary, not just "does this text overflow". */
function padToLength(text: string, length: number): string {
  if (text.length >= length) return text;
  let result = text;
  while (result.length < length) {
    result += (result && !result.endsWith(" ") ? " " : "") + FILLER;
  }
  return result.slice(0, length);
}

/**
 * Off-screen, non-interactive clone of the live card used purely to measure
 * whether the current text fits its box. Never touches the element the user is
 * typing into — eliminates the DOM-mutation races that made the old in-place
 * measurement (inside TweetCard's own effects) unreliable.
 */
export function TextFitProbe({
  slide,
  profile,
  theme,
  cardStyle,
  frameBackground,
  aspectRatio,
  postDateTime,
  showXLogo,
  onMeasured,
}: {
  slide: Slide;
  profile: Profile;
  theme: CardTheme;
  cardStyle: CardStyle;
  frameBackground: string;
  aspectRatio: AspectRatio;
  postDateTime: string;
  showXLogo: boolean;
  onMeasured: (result: TextFitResult) => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  // Layout effect: runs synchronously before paint, after the probe's own child
  // TweetCard has synced its textContent (child layout effects commit before the
  // parent's, per React's effect ordering) — so this always measures the current
  // text, and any resulting setState is applied before the browser ever paints
  // the stale state. That's what makes the dialog/counter feel instant instead
  // of lagging a frame behind the media attach.
  useIsomorphicLayoutEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const body = card.querySelector<HTMLElement>("[data-tweet-body]");
    if (!body) return;

    function measure() {
      // Probe with text padded to the hard ceiling — not the user's current
      // text — so maxChars is always the real capacity for this exact
      // configuration, whether or not the current text happens to reach it yet.
      const probeText = padToLength(slide.text, TWEET_MAX_CHARS);
      body!.textContent = probeText;
      const { text: fitProbeText } = trimToFit(body!);
      const maxChars = fitProbeText.length;

      const overflowed = slide.text.length > maxChars;
      onMeasured({
        maxChars,
        overflowed,
        trimmedText: overflowed ? slide.text.slice(0, maxChars) : slide.text,
      });
    }

    measure();

    // A freshly-attached image hasn't finished decoding yet at this point —
    // even data: URLs load asynchronously, so it has no layout size the instant
    // it's added to the DOM. The first measurement above can therefore miss an
    // overflow the image is about to cause. Re-measure once it's actually
    // loaded and has real dimensions.
    const img = card.querySelector<HTMLImageElement>("[data-media-image]");
    if (img && !img.complete) {
      img.addEventListener("load", measure, { once: true });
      return () => img.removeEventListener("load", measure);
    }
    // Only true layout-affecting inputs — profile/theme don't change available height.
  }, [slide.text, slide.media, cardStyle, aspectRatio, postDateTime, showXLogo]);

  return (
    <div style={{ position: "fixed", left: -9999, top: 0, width: 480, pointerEvents: "none" }} aria-hidden="true">
      <div style={{ width: 480 }}>
        <TweetCard
          ref={cardRef}
          slide={slide}
          profile={profile}
          theme={theme}
          cardStyle={cardStyle}
          frameBackground={frameBackground}
          aspectRatio={aspectRatio}
          postDateTime={postDateTime}
          maxChars={TWEET_MAX_CHARS}
          showXLogo={showXLogo}
        />
      </div>
    </div>
  );
}
