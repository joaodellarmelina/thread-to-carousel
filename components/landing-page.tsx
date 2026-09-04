import Image from "next/image";
import Link from "next/link";

const EXAMPLES = [
  { src: "/img-lp.png", alt: "X-style post about Codex weekly limits" },
  { src: "/img-lp2.png", alt: "X-style post about Claude plan limits" },
  { src: "/img-lp3.png", alt: "Final X-style thread post with a call to action" },
];

const STEPS = [
  {
    title: "write your thread",
    body: "write or paste your own copy. each post becomes a fully editable slide.",
  },
  {
    title: "customize the look",
    body: "pick a theme, template, and profile: light or dark, framed or edge-to-edge, with your name and avatar.",
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
            write every post, profile and metric, attach your own media, then export a carousel that looks real, entirely in your browser.
          </p>
          <Link
            href="/app"
            className="rounded-full px-6 py-3 text-sm font-medium lowercase text-white transition-transform active:scale-[0.97]"
            style={{ background: "var(--app-accent)" }}
          >
            start creating. it&apos;s free
          </Link>
        </section>

        {/* Examples */}
        <section className="flex w-full max-w-5xl flex-col items-center gap-8">
          <h2 className="font-display text-xl font-semibold lowercase sm:text-2xl">real output, not a mockup</h2>
          <div className="flex w-full snap-x gap-6 overflow-x-auto pb-4 sm:justify-center sm:overflow-visible">
            {EXAMPLES.map((example) => (
              <div key={example.src} className="w-56 shrink-0 snap-center overflow-hidden rounded-2xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)] sm:w-64">
                <Image
                  src={example.src}
                  alt={example.alt}
                  width={1080}
                  height={1350}
                  sizes="(min-width: 640px) 256px, 224px"
                  className="h-auto w-full"
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
        thread to carrousel. no signup, nothing leaves your browser.
      </footer>
    </div>
  );
}
