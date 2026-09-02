import { TID } from "@/redactorium/constants/testIds";

export default function ActionBar({ onApply, canApply, applying, salt, setSalt, seed, setSeed, columnPlan = [], children }) {
  const transformed = columnPlan.filter((c) => c.transform !== "keep").length;
  const kept = columnPlan.length - transformed;
  return (
    <section className="max-w-6xl mx-auto px-4 md:px-6 mt-6">
      <div className="red-apply-row">
        <button
          data-testid={TID.applyBtn}
          onClick={() => {
            if (applying) return;
            if (!canApply) { document.querySelector('[data-testid^="transform-select-"]')?.focus(); return; }
            onApply();
          }}
          aria-disabled={!canApply || applying}
          className="btn-forest"
        >
          {applying ? "Applying…" : "Apply treatments"}
        </button>
        <span className="red-apply-count">{transformed} column{transformed === 1 ? "" : "s"} transformed · {kept} kept</span>
      </div>

      <details className="red-advanced">
        <summary>Advanced: salt, seed, presets</summary>
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
            <span className="red-adv-help">Same seed, same synthetic values.</span>
          </div>
        </div>
        {children}
      </details>
    </section>
  );
}

export function DownloadPanel({ onDownloadClean, onDownloadJson, onStartAnother }) {
  return (
    <div className="red-record-actions">
      <button data-testid={TID.downloadCleanBtn} onClick={onDownloadClean} className="btn-forest">
        Download clean file
      </button>
      <button data-testid={TID.downloadJsonLogBtn} onClick={onDownloadJson} className="btn-ghost-ink">
        Download record
      </button>
      <button data-testid={TID.resetBtn} onClick={onStartAnother} className="text-action">
        Start another file
      </button>
    </div>
  );
}
