import { TID } from "@/redactorium/constants/testIds";

export default function ActionBar({ onApply, onReset, canApply, applying, salt, setSalt, seed, setSeed, sigKey, setSigKey, columnPlan = [] }) {
  const transformed = columnPlan.filter((c) => c.transform !== "keep").length;
  const kept = columnPlan.length - transformed;
  return (
    <section className="max-w-6xl mx-auto px-4 md:px-6 mt-6">
      <details className="red-advanced">
        <summary>Advanced: salt, seed, signing</summary>
        <div className="red-advanced-grid">
          <div className="flex flex-col">
            <label className="field-label mb-1" htmlFor="red-salt">Hash salt (optional)</label>
            <input
              id="red-salt"
              data-testid={TID.saltInput}
              value={salt}
              onChange={(e) => setSalt(e.target.value)}
              placeholder="tenant-2026-q1"
              className="red-adv-input"
            />
            <span className="red-adv-help">Salted SHA-256 prevents rainbow-table lookups.</span>
          </div>
          <div className="flex flex-col">
            <label className="field-label mb-1" htmlFor="red-seed">Synthetic seed</label>
            <input
              id="red-seed"
              data-testid={TID.seedInput}
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              placeholder="redactorium-run"
              className="red-adv-input"
            />
            <span className="red-adv-help">Deterministic — same seed reproduces the same synthetic values.</span>
          </div>
          <div className="flex flex-col">
            <label className="field-label mb-1" htmlFor="red-sig">Signing key (optional)</label>
            <input
              id="red-sig"
              data-testid="sig-key-input"
              value={sigKey || ""}
              onChange={(e) => setSigKey(e.target.value)}
              type="password"
              placeholder="e.g. legal-team-key-2026"
              className="red-adv-input"
            />
            <span className="red-adv-help">HMAC-SHA-256 seals the log so tampering is detectable.</span>
          </div>
        </div>
      </details>

      <div className="red-apply-row">
        <button
          data-testid={TID.applyBtn}
          onClick={onApply}
          disabled={!canApply || applying}
          className="btn-forest disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {applying ? "Applying…" : "Apply treatments"}
        </button>
        <span className="red-apply-count">{transformed} column{transformed === 1 ? "" : "s"} transformed · {kept} kept</span>
        <button
          data-testid={TID.resetBtn}
          onClick={onReset}
          className="text-action red-apply-reset"
          disabled={applying}
        >
          Start over
        </button>
      </div>
    </section>
  );
}

export function DownloadPanel({ onDownloadClean, onDownloadJson, onDownloadPdf, onDownloadZip }) {
  return (
    <div className="red-record-actions">
      <button data-testid={TID.downloadCleanBtn} onClick={onDownloadClean} className="btn-forest">
        Download clean file
      </button>
      <button data-testid={TID.downloadJsonLogBtn} onClick={onDownloadJson} className="btn-ghost-ink">
        Download record
      </button>
      <button data-testid={TID.downloadPdfLogBtn} onClick={onDownloadPdf} className="text-action">
        Record as PDF
      </button>
      <button data-testid={TID.downloadZipBtn} onClick={onDownloadZip} className="text-action">
        Evidence bundle (.zip)
      </button>
    </div>
  );
}
