import Image from "next/image";

export default function Home() {
  return (
    <div className="flex min-h-full flex-col">
      <header className="absolute inset-x-0 top-0 z-20">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6 md:px-10">
          <a
            href="#top"
            className="font-[family-name:var(--font-syne)] text-xl font-bold tracking-tight text-foam md:text-2xl"
          >
            Tideway
          </a>
          <a
            href="#craft"
            className="text-sm font-medium text-foam/85 transition-colors hover:text-foam"
          >
            How it ships
          </a>
        </div>
      </header>

      <main id="top" className="flex-1">
        <section className="relative isolate min-h-[100svh] overflow-hidden text-foam">
          <div className="absolute inset-0 -z-20 overflow-hidden">
            <Image
              src="https://images.unsplash.com/photo-1505142468610-359e7d316be0?auto=format&fit=crop&w=2400&q=80"
              alt="Soft morning light over a calm coastal shoreline"
              fill
              priority
              sizes="100vw"
              className="hero-media object-cover object-center"
            />
          </div>
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(120deg,rgba(12,31,46,0.78)_0%,rgba(15,76,73,0.55)_48%,rgba(12,31,46,0.35)_100%)]" />
          <div className="hero-sheen absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_70%_20%,rgba(240,160,90,0.28),transparent_45%)]" />

          <div className="mx-auto flex min-h-[100svh] w-full max-w-6xl flex-col justify-end px-6 pb-16 pt-28 md:px-10 md:pb-24">
            <p className="animate-rise font-[family-name:var(--font-syne)] text-5xl font-bold tracking-tight text-foam sm:text-6xl md:text-8xl">
              Tideway
            </p>
            <h1 className="animate-rise-delay-1 mt-5 max-w-2xl text-balance font-[family-name:var(--font-syne)] text-2xl font-semibold leading-tight tracking-tight text-foam sm:text-3xl md:text-4xl">
              Ship calm product surfaces that feel finished on day one.
            </h1>
            <p className="animate-rise-delay-2 mt-5 max-w-xl text-pretty text-base leading-relaxed text-foam/85 sm:text-lg">
              A Next.js landing built for Vercel — clear hierarchy, real
              atmosphere, and motion that earns its place.
            </p>
            <div className="animate-rise-delay-3 mt-9 flex flex-wrap items-center gap-4">
              <a
                href="#craft"
                className="inline-flex items-center justify-center bg-foam px-6 py-3 text-sm font-semibold text-ink transition-transform duration-300 hover:-translate-y-0.5"
              >
                See the craft
              </a>
              <a
                href="https://vercel.com/new"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center border border-foam/55 px-6 py-3 text-sm font-semibold text-foam transition-colors hover:border-foam hover:bg-foam/10"
              >
                Deploy on Vercel
              </a>
            </div>
          </div>
        </section>

        <section
          id="craft"
          className="relative overflow-hidden bg-foam px-6 py-24 md:px-10 md:py-32"
        >
          <div className="pointer-events-none absolute -right-24 top-10 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(31,111,106,0.16),transparent_70%)]" />
          <div className="mx-auto grid w-full max-w-6xl gap-12 md:grid-cols-[1.1fr_0.9fr] md:items-end md:gap-20">
            <div>
              <p className="font-[family-name:var(--font-syne)] text-sm font-semibold uppercase tracking-[0.18em] text-tide">
                One job
              </p>
              <h2 className="mt-4 max-w-xl text-balance font-[family-name:var(--font-syne)] text-3xl font-semibold tracking-tight text-ink sm:text-4xl md:text-5xl">
                Built to go live without the usual launch clutter.
              </h2>
              <p className="mt-6 max-w-lg text-pretty text-base leading-relaxed text-ink-soft sm:text-lg">
                Tideway keeps the first viewport focused: brand, one headline,
                one supporting line, and a clear path to ship. Everything else
                waits its turn.
              </p>
            </div>
            <div className="relative min-h-64 overflow-hidden md:min-h-80">
              <Image
                src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1600&q=80"
                alt="Sunlit ridgeline above a quiet valley"
                fill
                sizes="(max-width: 768px) 100vw, 45vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(12,31,46,0.35),transparent_55%)]" />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-mist bg-foam px-6 py-10 md:px-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-[family-name:var(--font-syne)] text-lg font-bold text-ink">
            Tideway
          </p>
          <p className="text-sm text-ink-soft">
            Next.js · Tailwind · Ready for Vercel
          </p>
        </div>
      </footer>
    </div>
  );
}
