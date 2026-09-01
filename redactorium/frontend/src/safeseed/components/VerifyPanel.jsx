import { useRef, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, XCircle, FileText, UploadCloud, ShieldCheck } from "lucide-react";
import { verifyFixture } from "@/safeseed/lib/safeVerify";

export default function VerifyPanel() {
  const [csvText, setCsvText] = useState("");
  const [recordText, setRecordText] = useState("");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [scoped, setScoped] = useState(false);
  const csvRef = useRef(null);
  const recRef = useRef(null);

  const readFile = async (f, setter) => {
    if (!f) return;
    setter(await f.text());
  };

  const run = async () => {
    if (!csvText.trim() || !recordText.trim()) { toast.error("Provide both the fixture and its record."); return; }
    let record;
    try { record = JSON.parse(recordText); }
    catch (e) { toast.error("Record is not valid JSON: " + e.message); return; }
    setBusy(true);
    try {
      const r = await verifyFixture(csvText, record, { allowAddedColumns: scoped });
      setResult(r);
      if (r.ok) toast.success("Fixture verified — inside every declared range.");
      else toast.error("Verification failed — see details below.");
    } catch (e) {
      toast.error(e.message || "Verify failed");
    } finally { setBusy(false); }
  };

  return (
    <section className="max-w-6xl mx-auto px-4 md:px-6 mt-8">
      <div className="paper-card p-5 md:p-6" data-testid="verify-panel">
        <p className="eyebrow tag-toolkit">Verify · byte-for-byte and value-by-value</p>
        <h2 className="text-3xl md:text-4xl mt-1">Prove a fixture hasn't drifted</h2>
        <p className="mt-2 text-sm text-[hsl(var(--ink-muted))] max-w-3xl">
          Provide the fixture CSV and its SafeSeed run-record JSON. Runs the same checks the GitHub Action runs:
          the file's SHA-256 must match the record's declared hash, and every value must sit inside its cited catalog range.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="eyebrow tag-desk">Fixture CSV</label>
              <button
                onClick={() => csvRef.current?.click()}
                className="btn-ghost-ink text-xs flex items-center gap-1 px-2 py-1"
                data-testid="verify-csv-upload"
              >
                <UploadCloud className="w-3 h-3" /> Upload
              </button>
              <input ref={csvRef} type="file" accept=".csv,.txt" hidden
                     onChange={(e) => readFile(e.target.files?.[0], setCsvText)}/>
            </div>
            <textarea
              data-testid="verify-csv-input"
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              rows={10}
              placeholder="Paste the fixture CSV (or upload)"
              className="w-full px-3 py-2 border border-[hsl(var(--ink))] bg-[hsl(var(--paper))] font-mono text-xs"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="eyebrow tag-desk">Run record (JSON)</label>
              <button
                onClick={() => recRef.current?.click()}
                className="btn-ghost-ink text-xs flex items-center gap-1 px-2 py-1"
                data-testid="verify-record-upload"
              >
                <UploadCloud className="w-3 h-3" /> Upload
              </button>
              <input ref={recRef} type="file" accept=".json,application/json" hidden
                     onChange={(e) => readFile(e.target.files?.[0], setRecordText)}/>
            </div>
            <textarea
              data-testid="verify-record-input"
              value={recordText}
              onChange={(e) => setRecordText(e.target.value)}
              rows={10}
              placeholder='{"tool":"SafeSeed"...}'
              className="w-full px-3 py-2 border border-[hsl(var(--ink))] bg-[hsl(var(--paper))] font-mono text-xs"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4 justify-between">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              data-testid="verify-scoped-toggle"
              type="checkbox"
              checked={scoped}
              onChange={(e) => setScoped(e.target.checked)}
              className="w-4 h-4 accent-[hsl(var(--forest))]"
            />
            <span>Column-scoped verify <span className="text-[hsl(var(--ink-muted))]">— allow added columns; only declared columns must match. Added columns are reported, not failed.</span></span>
          </label>
          <button
            data-testid="verify-run-btn"
            onClick={run}
            disabled={busy}
            className="btn-forest flex items-center gap-2 disabled:opacity-40"
          >
            <ShieldCheck className="w-4 h-4" /> {busy ? "Verifying…" : "Verify fixture"}
          </button>
        </div>

        {result && (
          <div className="mt-6" data-testid="verify-result">
            <div className={`p-4 border ${result.ok ? "border-[hsl(var(--forest))] bg-[hsl(var(--forest)_/_0.06)]" : "border-[hsl(var(--brick))] bg-[hsl(var(--brick)_/_0.06)]"}`}>
              <div className="flex items-center gap-3">
                {result.ok ? <CheckCircle2 className="w-6 h-6 text-[hsl(var(--forest))]"/> : <XCircle className="w-6 h-6 text-[hsl(var(--brick))]"/>}
                <div>
                  <div className="font-semibold" data-testid="verify-outcome">
                    {result.ok ? "PASS" : "FAIL"} · {result.mode}
                  </div>
                  <div className="text-xs text-[hsl(var(--ink-muted))]">
                    {result.rowsChecked} rows checked · {result.columnsChecked?.length || 0} declared columns
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              <div className="paper-card--soft p-3 text-xs mono break-all">
                <div className="eyebrow mb-1">Actual SHA-256</div>
                {result.actualHash}
              </div>
              <div className="paper-card--soft p-3 text-xs mono break-all">
                <div className="eyebrow mb-1">Declared SHA-256</div>
                {result.declaredHash || "—"}
                <div className={`mt-1 text-[10px] uppercase tracking-wider ${result.hashMatch ? "text-[hsl(var(--forest))]" : "text-[hsl(var(--brick))]"}`}>
                  {result.hashMatch ? "Hash matches" : "Hash does not match"}
                </div>
              </div>
            </div>

            {(result.missingColumns?.length > 0 || result.addedColumns?.length > 0) && (
              <div className="paper-card--soft p-3 mt-3 text-xs">
                {result.missingColumns?.length > 0 && (
                  <div className="text-[hsl(var(--brick))]">Missing declared columns: {result.missingColumns.join(", ")}</div>
                )}
                {result.addedColumns?.length > 0 && (
                  <div className={result.mode === "column-scoped" ? "text-[hsl(var(--ink-muted))]" : "text-[hsl(var(--brick))]"}>
                    Added columns ({result.mode === "column-scoped" ? "unattested — scan them" : "not declared → fails strict"}):
                    {" " + result.addedColumns.join(", ")}
                  </div>
                )}
              </div>
            )}

            {result.failures?.length > 0 && (
              <div className="mt-3">
                <div className="eyebrow tag-desk mb-1">Out-of-range values ({result.failures.length}{result.truncated ? "+" : ""})</div>
                <div className="paper-card--soft overflow-x-auto">
                  <table className="editorial-table" style={{ minWidth: 640 }}>
                    <thead>
                      <tr><th>Row</th><th>Column</th><th>Value</th><th>Expected</th></tr>
                    </thead>
                    <tbody>
                      {result.failures.slice(0, 50).map((f, i) => (
                        <tr key={i}>
                          <td className="mono text-xs">{f.row}</td>
                          <td className="font-semibold text-sm">{f.column}</td>
                          <td className="mono text-xs break-all">{f.value}</td>
                          <td className="text-xs">{f.expected}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {result.failures.length > 50 && (
                    <div className="p-2 text-[11px] text-[hsl(var(--ink-muted))] italic border-t border-[hsl(var(--rule))]">
                      Showing first 50 of {result.failures.length}{result.truncated ? "+" : ""}.
                    </div>
                  )}
                </div>
              </div>
            )}

            {result.ok && result.mode === "strict-whole-file" && (
              <div className="mt-3 text-xs text-[hsl(var(--ink-muted))] italic">
                The file is byte-for-byte the generated one and every declared value is inside its cited range.
                A green result covers the whole file.
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
