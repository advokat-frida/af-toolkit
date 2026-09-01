import { Table2, ShieldCheck, ScanSearch } from "lucide-react";
import ProofPanel from "./components/ProofPanel";
import { SiteFooter, SiteHeader } from "./components/SiteChrome";

export default function App() {
  return (
    <div className="page-shell">
      <SiteHeader />
      <div className="site">
        <main className="site-main">
          {/* HERO */}
          <section className="hero">
            <div className="hero-lead gen-intro">
              <p className="hero-eyebrow">Synthetic test data</p>
              <h1 className="hero-headline">
                Trusted <span className="hl">synthetic</span> PII-shaped data
              </h1>
              <p className="hero-sub">
                Generated without ingesting production records. Every field is tied to a versioned protocol reservation,
                authority policy, test designation, or deliberately obvious fake — and a built-in receipt lets you check
                 that the current file still matches its recorded bytes and catalog constraints.
              </p>
              <details className="gen-changelog">
                <summary>Changelog (last updated: August 20, 2026)</summary>
                <div className="gen-changelog-body">
                  <time dateTime="2026-08-20">August 20, 2026</time>
                  <strong>Practical sales and marketing schemas</strong>
                  <ul>
                    <li>Added editable CRM, attribution, hashed-audience, and UK contact presets.</li>
                    <li>Added Ofcom drama phones, constrained UTM URLs, obvious business IDs, and catalog-derived SHA-256 match keys.</li>
                    <li>Added exact CSV and record verification plus named-column range checks.</li>
                  </ul>
                </div>
              </details>
              <div className="verb-chips">
                <span className="verb-chip">
                  <Table2 className="verb-icon" aria-hidden="true" /> Generate
                </span>
                <span className="verb-chip">
                  <ShieldCheck className="verb-icon" aria-hidden="true" /> Verify
                </span>
                <span className="verb-chip">
                  <ScanSearch className="verb-icon" aria-hidden="true" /> Scan
                </span>
              </div>
              <div className="hero-ctas">
                <a className="hero-cta" href="#proof">
                  Run it yourself <span aria-hidden="true">↓</span>
                </a>
                {/* The committed/deployed single-file is named safeseed-generator.html —
                    ./generator.html only exists inside the dev build and 404s live. */}
                <a className="hero-cta-alt" href="./safeseed-generator.html">
                  Open the generator <span aria-hidden="true">→</span>
                </a>
              </div>
            </div>
          </section>

          {/* PROOF PANEL (interactive centerpiece) */}
          <ProofPanel />

        </main>
      </div>

      <SiteFooter />
    </div>
  );
}
