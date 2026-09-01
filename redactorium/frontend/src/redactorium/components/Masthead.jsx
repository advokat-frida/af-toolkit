import { TID } from "@/redactorium/constants/testIds";

export default function Masthead() {
  return (
    <header data-testid={TID.siteHeader} className="relative">
      {/* Nameplate */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 pt-8 md:pt-10 pb-6">
        <div className="flex items-start justify-between gap-4 md:gap-6 flex-wrap">
          <div className="flex-1 min-w-0">
            <p className="eyebrow text-[hsl(var(--ink-muted))]">The Toolkit · Advokat Frida</p>
            <h1
              data-testid={TID.mastheadTitle}
              tabIndex="-1"
              className="mt-2 uppercase leading-none break-words"
              style={{
                fontFamily: "'Anton', Impact, sans-serif",
                fontSize: "clamp(3rem, 9vw, 7rem)",
                letterSpacing: "-0.02em",
              }}
            >
              Redactorium
            </h1>
            <p
              data-testid={TID.mastheadTagline}
              className="mt-3 text-sm md:text-base lg:text-lg max-w-2xl text-[hsl(var(--ink))]"
            >
              Drop a file. It finds the PII with regex, not a robot. You decide what happens
              to each column. It hands back a clean file <em>and</em> a transformation record you
              can hand to legal.
            </p>
          </div>
        </div>

        <div className="double-rule mt-6 md:mt-8" />
      </div>
    </header>
  );
}
