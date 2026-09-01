import { useRef, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, XCircle, ShieldCheck, UploadCloud, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import Masthead from "@/redactorium/components/Masthead";
import Footer from "@/redactorium/components/Footer";
import { verifyLog } from "@/redactorium/lib/signing";

export default function VerifyLogPage({ embedded = false }) {
  const [logText, setLogText] = useState("");
  const [key, setKey] = useState("");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  const readFile = async (f) => { if (f) setLogText(await f.text()); };

  const run = async () => {
    if (!logText.trim() || !key.trim()) { toast.error("Provide both the JSON log and the signing key."); return; }
    let log;
    try { log = JSON.parse(logText); }
    catch (e) { toast.error("Log is not valid JSON: " + e.message); return; }
    setBusy(true);
    try {
      const r = await verifyLog(log, key);
      setResult({ ...r, tool: log?.tool, run: log?.run, input: log?.input, output: log?.output, sig: log?.signature });
      if (r.ok) toast.success("Signature valid — the record binds to this key.");
      else toast.error(r.reason || "Signature does not match.");
    } catch (e) {
      toast.error(e.message || "Verify failed");
      setResult(null);
    } finally { setBusy(false); }
  };

  return (
    <div className={embedded ? "min-h-0 pb-10" : "min-h-screen"}>
      {!embedded && <Masthead />}

      <section className="max-w-6xl mx-auto px-4 md:px-6 mt-2">
        <Link to="/" className="inline-flex items-center gap-1 text-xs text-[hsl(var(--ink-muted))] hover:text-[hsl(var(--ink))] underline underline-offset-2">
          <ArrowLeft className="w-3 h-3" /> back to Redactorium
        </Link>
      </section>

      <section className="max-w-6xl mx-auto px-4 md:px-6 mt-4">
        <div className="paper-card p-5 md:p-6" data-testid="verify-log-panel">
          <p className="eyebrow tag-toolkit">Verify a signed log</p>
          <h2 className="text-3xl md:text-4xl mt-1">Prove nobody rewrote the record</h2>
          <p className="mt-2 text-sm text-[hsl(var(--ink-muted))] max-w-3xl">
            Paste the JSON log Redactorium produced and the HMAC-SHA-256 key you signed it with.
            The check runs in this browser tab; the key never leaves.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-4 mt-5">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="eyebrow tag-desk">JSON log</label>
                <button
                  data-testid="verify-log-upload"
                  onClick={() => fileRef.current?.click()}
                  className="btn-ghost-ink text-xs flex items-center gap-1 px-2 py-1"
                >
                  <UploadCloud className="w-3 h-3" /> Upload
                </button>
                <input ref={fileRef} type="file" accept=".json,application/json" hidden
                       onChange={(e) => readFile(e.target.files?.[0])}/>
              </div>
              <textarea
                data-testid="verify-log-input"
                value={logText}
                onChange={(e) => setLogText(e.target.value)}
                rows={14}
                placeholder='{"tool":"Redactorium","signature":{...}}'
                className="w-full px-3 py-2 border border-[hsl(var(--ink))] bg-[hsl(var(--paper))] font-mono text-xs"
              />
            </div>
            <div className="flex flex-col gap-3">
              <div>
                <label className="eyebrow tag-desk mb-1 block">HMAC-SHA-256 key</label>
                <input
                  data-testid="verify-log-key"
                  type="password"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="legal-team-key-2026"
                  className="w-full px-3 py-2 border border-[hsl(var(--ink))] bg-[hsl(var(--paper))] font-mono text-sm"
                />
                <span className="text-[10px] text-[hsl(var(--ink-muted))] mt-1 block">
                  Same key used at signing time. Wrong key → signature mismatch.
                </span>
              </div>
              <button
                data-testid="verify-log-run"
                onClick={run}
                disabled={busy}
                className="btn-forest flex items-center justify-center gap-2 disabled:opacity-40"
              >
                <ShieldCheck className="w-4 h-4" /> {busy ? "Verifying…" : "Verify signature"}
              </button>
              <div className="paper-card--soft p-3 text-[11px] text-[hsl(var(--ink-muted))]">
                <p className="eyebrow mb-1">What this proves</p>
                A pass means the JSON is byte-for-byte the one signed by this key. It does NOT prove the file the log refers to is untouched — cross-check the input/output SHA-256 fields below against your actual file.
              </div>
            </div>
          </div>

          {result && (
            <div className="mt-6" data-testid="verify-log-result">
              <div className={`p-4 border ${result.ok ? "border-[hsl(var(--forest))] bg-[hsl(var(--forest)_/_0.06)]" : "border-[hsl(var(--brick))] bg-[hsl(var(--brick)_/_0.06)]"}`}>
                <div className="flex items-center gap-3">
                  {result.ok ? <CheckCircle2 className="w-6 h-6 text-[hsl(var(--forest))]"/> : <XCircle className="w-6 h-6 text-[hsl(var(--brick))]"/>}
                  <div>
                    <div className="font-semibold" data-testid="verify-log-outcome">
                      {result.ok ? "SIGNATURE VALID" : "SIGNATURE INVALID"}
                    </div>
                    <div className="text-xs text-[hsl(var(--ink-muted))]">{result.reason}</div>
                  </div>
                </div>
              </div>

              {(result.input || result.output) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                  {result.input && (
                    <div className="paper-card--soft p-3 text-xs mono">
                      <div className="eyebrow mb-1">Declared input SHA-256</div>
                      <div className="break-all">{result.input.sha256}</div>
                      <div className="mt-2 text-[10px] text-[hsl(var(--ink-muted))]">
                        {result.input.name} · {result.input.size_bytes} bytes · {result.input.format}
                      </div>
                    </div>
                  )}
                  {result.output && (
                    <div className="paper-card--soft p-3 text-xs mono">
                      <div className="eyebrow mb-1">Declared output SHA-256</div>
                      <div className="break-all">{result.output.sha256}</div>
                    </div>
                  )}
                </div>
              )}

              {result.sig && (
                <div className="paper-card--soft p-3 mt-3 text-xs">
                  <div className="eyebrow mb-1">Signature block</div>
                  <div className="mono text-[11px]">
                    <div>Algorithm: {result.sig.algorithm}</div>
                    <div>Key fingerprint: {result.sig.key_fingerprint_sha256}</div>
                    <div>Signed at: {result.sig.signed_at}</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {!embedded && <Footer />}
    </div>
  );
}
