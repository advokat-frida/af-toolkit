export default function BrandedMasthead({ eyebrow, title, tagline, testId }) {
  return (
    <header data-testid={testId || "site-header"} className="relative">
      <div className="max-w-6xl mx-auto px-4 md:px-6 pt-8 md:pt-10 pb-6">
        <div className="flex items-start justify-between gap-4 md:gap-6 flex-wrap">
          <div className="flex-1 min-w-0">
            <p className="eyebrow text-[hsl(var(--ink-muted))]">{eyebrow}</p>
            <h1
              data-testid="masthead-title"
              className="mt-2 uppercase leading-none break-words"
              style={{
                fontFamily: "'Alfa Slab One', Georgia, serif",
                fontSize: "clamp(1.75rem, 10.5vw, 8rem)",
                letterSpacing: "-0.01em",
              }}
            >
              {title}
            </h1>
            <p
              data-testid="masthead-tagline"
              className="mt-3 text-sm md:text-base lg:text-lg max-w-2xl text-[hsl(var(--ink))]"
            >
              {tagline}
            </p>
          </div>
        </div>
        <div className="double-rule mt-6 md:mt-8" />
      </div>
    </header>
  );
}
