import Image from "next/image";
import Link from "next/link";
import { TweetCard } from "./tweet-card";
import { TWEET_MAX_CHARS } from "@/lib/constants";
import { DEFAULT_POST_DATETIME } from "@/lib/types";
import type { Profile, Slide } from "@/lib/types";

const EXAMPLE_PROFILE: Profile = {
  name: "maya chen",
  handle: "mayabuilds",
  verified: true,
};

function exampleSlide(id: string, text: string): Slide {
  return {
    id,
    text,
    profile: EXAMPLE_PROFILE,
    postDateTime: DEFAULT_POST_DATETIME,
    metrics: { replies: "24", reposts: "108", likes: "1.2K", bookmarks: "86", views: "48K" },
    display: { showMetrics: true, showViews: true, showDate: true, showXLogo: true, showSlideNumber: false },
    media: [],
    mediaLayout: "grid",
  };
}

const EXAMPLES: { slide: Slide; theme: "dark" | "light"; cardStyle: "framed" | "square" }[] = [
  {
    slide: exampleSlide("ex-1", "i shipped 3 side projects this year and only one made money.\n\nhere's what i'd do differently 🧵"),
    theme: "dark",
    cardStyle: "framed",
  },
  {
    slide: exampleSlide("ex-2", "1/ start with the distribution, not the product.\n\nyou can build the best tool in the world — if nobody sees it, it doesn't exist."),
    theme: "light",
    cardStyle: "square",
  },
  {
    slide: exampleSlide("ex-3", "2/ charge from day one.\n\nfree users taught me nothing. the first paying customer taught me everything."),
    theme: "dark",
    cardStyle: "framed",
  },
];

const STEPS = [
  {
    title: "write your thread",
    body: "write or paste your own copy — each post becomes a fully editable slide.",
  },
  {
    title: "customize the look",
    body: "pick a theme, template, and profile — light or dark, framed or edge-to-edge, your name and avatar.",
  },
  {
    title: "export & post",
    body: "download every slide as a carousel-ready png and post it straight to instagram.",
  },
];

export function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-6 py-6 sm:px-10">
        <div className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="" width={28} height={28} className="rounded-[7px]" priority />
          <span className="font-display text-sm font-semibold lowercase tracking-tight">thread to carrousel</span>
        </div>
        <Link
          href="/app"
          className="material rounded-full px-4 py-1.5 text-xs font-medium lowercase transition-transform active:scale-[0.97]"
        >
          open the editor
        </Link>
      </header>

      <main className="flex flex-1 flex-col items-center gap-24 px-6 pb-24 sm:px-10">
        {/* Hero */}
        <section className="flex max-w-2xl flex-col items-center gap-6 pt-10 text-center sm:pt-16">
          <Image src="/logo.png" alt="" width={56} height={56} className="rounded-2xl" priority />
          <h1 className="display-heading font-display text-4xl font-semibold lowercase sm:text-6xl">
            create hyper-realistic x threads for instagram
          </h1>
          <p className="max-w-md text-balance text-base text-[var(--app-fg-muted)] sm:text-lg">
            write every post, profile and metric, attach your own media, then export a carousel that looks real — entirely in your browser.
          </p>
          <Link
            href="/app"
            className="rounded-full px-6 py-3 text-sm font-medium lowercase text-white transition-transform active:scale-[0.97]"
            style={{ background: "var(--app-accent)" }}
          >
            start creating — it&apos;s free
          </Link>
        </section>

        {/* Examples */}
        <section className="flex w-full max-w-5xl flex-col items-center gap-8">
          <h2 className="font-display text-xl font-semibold lowercase sm:text-2xl">real output, not a mockup</h2>
          <div className="flex w-full snap-x gap-6 overflow-x-auto pb-4 sm:justify-center sm:overflow-visible">
            {EXAMPLES.map((example) => (
              <div key={example.slide.id} className="w-56 shrink-0 snap-center overflow-hidden rounded-2xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)] sm:w-64">
                <TweetCard
                  slide={example.slide}
                  theme={example.theme}
                  cardStyle={example.cardStyle}
                  frameBackground={example.theme === "dark" ? "#000000" : "#e8f5fd"}
                  aspectRatio="4:5"
                  maxChars={TWEET_MAX_CHARS}
                />
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="flex w-full max-w-4xl flex-col items-center gap-8">
          <h2 className="font-display text-xl font-semibold lowercase sm:text-2xl">how it works</h2>
          <div className="grid w-full gap-4 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <div key={step.title} className="material flex flex-col gap-2 rounded-2xl p-5">
                <span className="text-xs font-semibold" style={{ color: "var(--app-accent)" }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="font-display text-sm font-semibold lowercase">{step.title}</h3>
                <p className="text-sm text-[var(--app-fg-muted)]">{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        <Link
          href="/app"
          className="rounded-full px-6 py-3 text-sm font-medium lowercase text-white transition-transform active:scale-[0.97]"
          style={{ background: "var(--app-accent)" }}
        >
          try it now
        </Link>
      </main>

      <footer className="px-6 py-8 text-center text-xs text-[var(--app-fg-muted)] sm:px-10">
        thread to carrousel — no signup, nothing leaves your browser.
      </footer>
    </div>
  );
}
