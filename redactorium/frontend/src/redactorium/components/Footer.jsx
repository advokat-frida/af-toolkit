export default function Footer() {
  return (
    <footer className="mt-20 border-t border-[hsl(var(--ink))]">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
        <div>
          <p className="eyebrow text-[hsl(var(--ink-muted))]">Colophon</p>
          <p className="mt-2">
            Redactorium is part of the <a className="underline underline-offset-2" href="https://advokatfrida.com" target="_blank" rel="noreferrer">Advokat Frida</a> toolkit —
            practical instruments for privacy and AI practitioners.
          </p>
          <p className="mt-3 text-xs">
            <a href="#/verify-log" className="underline underline-offset-2 font-semibold">Verify a signed log →</a>
          </p>
        </div>
        <div>
          <p className="eyebrow text-[hsl(var(--ink-muted))]">How it works</p>
          <p className="mt-2">
            All processing happens inside your browser tab. Your files never touch a server.
            Hashing uses WebCrypto SHA-256; synthetic swaps draw from RFC-reserved or
            authority-designated ranges (SafeSeed catalog).
          </p>
        </div>
        <div>
          <p className="eyebrow text-[hsl(var(--ink-muted))]">Not a scope-out</p>
          <p className="mt-2">
            Pattern matching finds what the patterns catch. Treat a clean report as
            &quot;nothing outside configured patterns&quot; — not &quot;no PII.&quot; Review before release.
          </p>
        </div>
      </div>
      <div className="bg-[hsl(var(--ink))] text-[hsl(var(--paper))] text-xs">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between gap-3 flex-wrap">
          <span>© Advokat Frida · Redactorium v0.4</span>
          <span className="mono text-[10px] md:text-xs">SHA-256 · RFC 2606 · RFC 5737 · ISO 7812 · SafeSeed</span>
        </div>
      </div>
    </footer>
  );
}
