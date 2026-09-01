import { useRef, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, ShieldQuestion, ShieldCheck, UploadCloud, Search } from "lucide-react";
import { scanFixture } from "@/safeseed/lib/safeVerify";
import { TIERS } from "@/safeseed/lib/safeCatalog";

export default function ScanPanel() {
  const [csvText, setCsvText] = useState("");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const csvRef = useRef(null);

  const readFile = async (f) => { if (f) setCsvText(await f.text()); };

  const run = () => {
    if (!csvText.trim()) { toast.error("Paste or upload a CSV to scan."); return; }
    setBusy(true);
    try {
      const r = scanFixture(csvText);
      setResult(r);
      if (r.suspiciousCount === 0 && r.unattestedCount === 0) toast.success("Clean scan — nothing outside configured catalog ranges.");
      else toast(`${r.suspiciousCount} candidate PII value${r.suspiciousCount === 1 ? "" : "s"} across ${r.attestedCount} attested column${r.attestedCount === 1 ? "" : "s"}. ${r.unattestedCount} column${r.unattestedCount === 1 ? "" : "s"} unattested.`);
    } catch (e) {
      toast.error(e.message || "Scan failed");
    } finally { setBusy(false); }
  };

  return (
    <section className="max-w-6xl mx-auto px-4 md:px-6 mt-8">
      <div className="paper-card p-5 md:p-6" data-testid="scan-panel">
        <p className="eyebrow tag-toolkit">Scan · flag values outside the catalog</p>
        <h2 className="text-3xl md:text-4xl mt-1">Check a legacy file for real PII</h2>
        <p className="mt-2 text-sm text-[hsl(var(--ink-muted))] max-w-3xl">
          Drop any CSV — even one generated elsewhere. SafeSeed picks the most likely catalog field for
          each column and flags every value that sits <em>outside</em> that range as a real-PII candidate.
          A clean scan means "nothing outside configured ranges," not "no real PII."
        </p>

        <div className="mt-5">
          <div className="flex items-center justify-between mb-1">
            <label className="eyebrow tag-desk">CSV to scan</label>
            <button
              onClick={() => csvRef.current?.click()}
              className="btn-ghost-ink text-xs flex items-center gap-1 px-2 py-1"
              data-testid="scan-csv-upload"
            >
              <UploadCloud className="w-3 h-3" /> Upload
            </button>
            <input ref={csvRef} type="file" accept=".csv,.txt" hidden
                   onChange={(e) => readFile(e.target.files?.[0])}/>
          </div>
          <textarea
            data-testid="scan-csv-input"
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            rows={10}
            placeholder="Paste the CSV (or upload)"
            className="w-full px-3 py-2 border border-[hsl(var(--ink))] bg-[hsl(var(--paper))] font-mono text-xs"
          />
        </div>

        <div className="mt-4 flex items-center justify-end">
          <button
            data-testid="scan-run-btn"
            onClick={run}
            disabled={busy}
            className="btn-forest flex items-center gap-2 disabled:opacity-40"
          >
            <Search className="w-4 h-4" /> {busy ? "Scanning…" : "Scan CSV"}
          </button>
        </div>

        {result && (
          <div className="mt-6" data-testid="scan-result">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard label="Rows scanned" value={result.rowsScanned} />
              <StatCard label="Columns" value={result.columnsScanned} />
              <StatCard label="Catalog-attested" value={result.attestedCount} tone="forest" />
              <StatCard
                label="Candidate PII cells"
                value={result.suspiciousCount}
                tone={result.suspiciousCount > 0 ? "brick" : "forest"}
              />
            </div>

            <div className="mt-4 paper-card--soft overflow-x-auto">
              <table className="editorial-table" style={{ minWidth: 720 }}>
                <thead>
                  <tr>
                    <th style={{ width: 30 }}>#</th>
                    <th>Column</th>
                    <th>Likely catalog type</th>
                    <th>Match rate</th>
                    <th>Candidates flagged</th>
                  </tr>
                </thead>
                <tbody>
                  {result.columns.map((c, i) => (
                    <tr key={i} data-testid={`scan-col-${i}`}>
                      <td className="mono text-xs text-[hsl(var(--ink-muted))]">{i + 1}</td>
                      <td className="font-semibold text-sm">{c.header || <em>col {i + 1}</em>}</td>
                      <td>
                        {c.empty ? <span className="text-xs italic text-[hsl(var(--ink-muted))]">empty column</span> :
                          c.likelyType ? (
                            <div className="flex items-center gap-2 flex-wrap">
                              <ShieldCheck className="w-3.5 h-3.5 text-[hsl(var(--forest))]" />
                              <span className="text-sm">{c.likelyType.label}</span>
                              <span
                                className="pill text-[10px]"
                                style={{ background: TIERS[c.likelyType.tier].color, color: "#F5EFE1", borderColor: TIERS[c.likelyType.tier].color }}
                              >
                                {c.likelyType.tier}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <ShieldQuestion className="w-3.5 h-3.5 text-[hsl(var(--ink-muted))]" />
                              <span className="text-xs italic text-[hsl(var(--ink-muted))]">unattested — no catalog match ≥60%</span>
                            </div>
                          )
                        }
                      </td>
                      <td className="mono text-xs">
                        {c.likelyType ? `${(c.likelyType.matchRate * 100).toFixed(0)}% (${c.likelyType.hits}/${c.likelyType.sampled})` : "—"}
                      </td>
                      <td>
                        {c.outOfRange.length > 0 ? (
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-3.5 h-3.5 text-[hsl(var(--brick))]" />
                            <span className="text-sm font-semibold text-[hsl(var(--brick))]">{c.outOfRange.length}{c.truncated ? "+" : ""}</span>
                          </div>
                        ) : c.likelyType ? <span className="text-xs text-[hsl(var(--forest))]">clean</span> : <span className="text-xs text-[hsl(var(--ink-muted))]">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {result.columns.some(c => c.outOfRange.length > 0) && (
              <div className="mt-4" data-testid="scan-flagged-values">
                <p className="eyebrow tag-desk mb-2">Flagged values (first 12 per column)</p>
                <div className="space-y-3">
                  {result.columns.filter(c => c.outOfRange.length > 0).map((c, i) => (
                    <div key={i} className="paper-card--soft p-3">
                      <div className="font-semibold text-sm">{c.header} <span className="text-[hsl(var(--ink-muted))] text-xs">(likely {c.likelyType.label})</span></div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {c.outOfRange.slice(0, 12).map((f, k) => (
                          <code key={k} className="pill bg-[hsl(var(--brick)_/_0.12)] mono text-[11px] px-2 py-1 break-all border-[hsl(var(--brick))]">
                            row {f.row}: {String(f.value).length > 40 ? String(f.value).slice(0, 40) + "…" : f.value}
                          </code>
                        ))}
                        {c.outOfRange.length > 12 && (
                          <span className="text-[11px] text-[hsl(var(--ink-muted))] italic">+ {c.outOfRange.length - 12} more</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function StatCard({ label, value, tone }) {
  const cls = tone === "forest" ? "text-[hsl(var(--forest))]" : tone === "brick" ? "text-[hsl(var(--brick))]" : "";
  return (
    <div className="paper-card--soft p-3 text-center">
      <div className={`text-2xl font-bold ${cls}`} style={{ fontFamily: "'Alfa Slab One', serif" }}>{value}</div>
      <div className="eyebrow text-[10px]">{label}</div>
    </div>
  );
}
