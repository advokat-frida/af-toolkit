import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { toast } from "sonner";
import Masthead from "@/redactorium/components/Masthead";
import Footer from "@/redactorium/components/Footer";
import FileDropZone from "@/redactorium/components/FileDropZone";
import DetectionView from "@/redactorium/components/DetectionView";
import PreviewTable from "@/redactorium/components/PreviewTable";
import ActionBar, { DownloadPanel } from "@/redactorium/components/ActionBar";
import CustomRulesPanel from "@/redactorium/components/CustomRulesPanel";
import PresetsBar from "@/redactorium/components/PresetsBar";
import BatchView from "@/redactorium/components/BatchView";
import { parseFile } from "@/redactorium/lib/parsers";
import { detectColumns } from "@/redactorium/lib/detector";
import { applyTransformations } from "@/redactorium/lib/transformers";
import { buildOutput, buildLogJSON, buildLogPDF, saveBlob, bytesSha256, buildEvidenceZip } from "@/redactorium/lib/exporters";
import { signLog } from "@/redactorium/lib/signing";
import { compileRule } from "@/redactorium/lib/customRules";
import { getVerifyLogUrl } from "@/redactorium/lib/urls";
import { LoaderCircle, Files, FileText } from "lucide-react";

const SAMPLE_CSV = `full_name,email,phone,dob,ssn,card_number,street_address,zip,ip,company,job_title
Ada Lovelace,ada.lovelace@analyticalengine.co,+1 415 555 0134,1985-12-10,123-45-6789,4111111111111111,10 Downing Street,94107,192.168.1.10,Analytical Engine Inc,Chief Mathematician
Grace Hopper,grace.hopper@navy.mil,(202) 555-0119,1980-01-15,987-65-4321,5555555555554444,1600 Pennsylvania Ave,20500,10.0.0.4,USN Ltd,Rear Admiral
Alan Turing,alan.t@bletchley.example,+44 7700 900123,1978-06-23,111-22-3333,378282246310005,1 Enigma Lane,SW1A 1AA,203.0.113.7,Bletchley Park Co.,Cryptographer
Marie Curie,curie@radium.example,+33 1 2345 6789,1990-11-07,222-33-4444,6011111111111117,5 Rue de la Science,75005,198.51.100.42,Radium GmbH,Physicist
Katherine Johnson,katherine.j@nasa.gov,+1 212 555 0100,1975-08-26,333-44-5555,4242424242424242,300 E Street SW,20024,172.16.0.5,NASA LLC,Aerospace Engineer`;

export default function Redactorium({ embedded = false }) {
  const [file, setFile] = useState(null);
  const [parsed, setParsed] = useState(null);   // {format, headers, rows, meta, kind}
  const [detection, setDetection] = useState(null); // per-column
  const [columnPlan, setColumnPlan] = useState([]);
  const [applied, setApplied] = useState(null); // {headers, rows, stats, changedMap, log, outputArtifact, inputHash, outputHash}
  const [busy, setBusy] = useState(false);
  const [busyMsg, setBusyMsg] = useState("");
  const [salt, setSalt] = useState("");
  const [seed, setSeed] = useState("redactorium-2026");
  const [customRules, setCustomRules] = useState([]);
  const [mode, setMode] = useState("single"); // "single" | "batch"
  const [sigKey, setSigKey] = useState("");

  const onRulesChange = useCallback((rules) => setCustomRules(rules), []);

  const compiledCustom = useMemo(() => {
    const out = [];
    for (const r of customRules) {
      try { out.push(compileRule(r)); } catch { /* skip broken */ }
    }
    return out;
  }, [customRules]);

  const handleFile = async (f) => {
    setBusy(true); setBusyMsg("Parsing file…");
    setApplied(null);
    try {
      const p = await parseFile(f);
      const det = detectColumns(p, { customDetectors: compiledCustom });
      const plan = det.map(c => ({
        index: c.index,
        header: c.header,
        detectorId: c.top?.detectorId || null,
        transform: c.suggested,
      }));
      setFile(f); setParsed(p); setDetection(det); setColumnPlan(plan);
      toast.success(`Parsed ${p.format.toUpperCase()} · ${p.rows.length} rows · ${p.headers.length} columns`);
    } catch (e) {
      console.error(e);
      toast.error(e.message || "Could not read that file");
    } finally { setBusy(false); setBusyMsg(""); }
  };

  const handleSample = async () => {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv" });
    const f = new File([blob], "sample-contacts.csv", { type: "text/csv" });
    await handleFile(f);
  };

  const handlePlanChange = (i, next) => {
    setColumnPlan(prev => { const cp = [...prev]; cp[i] = next; return cp; });
  };

  const handleReset = () => {
    setFile(null); setParsed(null); setDetection(null); setColumnPlan([]); setApplied(null);
  };

  const canApply = !!parsed && detection && columnPlan.some(p => p.transform !== "keep");

  const handleApply = async () => {
    if (!parsed) return;
    setBusy(true); setBusyMsg("Applying transformations…");
    const startedAt = new Date().toISOString();
    try {
      const inputBytes = await file.arrayBuffer();
      const inputHash = await bytesSha256(new Uint8Array(inputBytes));
      const { headers, rows, stats } = await applyTransformations(parsed, columnPlan, { salt, seed });

      // changed map for preview highlighting
      const changedMap = rows.map((r, ri) => r.map((cell, ci) => cell !== parsed.rows[ri]?.[ci]));

      const outputArtifact = await buildOutput({ format: parsed.format, headers, rows, meta: parsed.meta });
      const outputHash = await bytesSha256(new Uint8Array(await outputArtifact.blob.arrayBuffer()));
      const finishedAt = new Date().toISOString();

      const log = buildLogJSON({
        inputFile: file, format: parsed.format, columnPlan, stats,
        detectionResults: detection, inputHash, outputHash,
        salt, seed, startedAt, finishedAt,
      });
      if (sigKey) {
        log.signature = await signLog(log, sigKey);
      }

      setApplied({ headers, rows, stats, changedMap, log, outputArtifact, inputHash, outputHash });
      toast.success("Transformations applied — evidence package ready");
    } catch (e) {
      console.error(e);
      toast.error(e.message || "Something went wrong applying transformations");
    } finally { setBusy(false); setBusyMsg(""); }
  };

  const recordHeadingRef = useRef(null);
  useEffect(() => {
    if (applied) recordHeadingRef.current?.focus();
  }, [applied]);

  const cleanFilename = useMemo(() => {
    if (!file || !applied) return "cleaned-file";
    const base = file.name.replace(/\.[^.]+$/, "");
    const ext = applied.outputArtifact.ext;
    return `${base}.redacted.${ext}`;
  }, [file, applied]);

  const dlClean = () => saveBlob(applied.outputArtifact.blob, cleanFilename);
  const dlJson  = () => saveBlob(new Blob([JSON.stringify(applied.log, null, 2)], { type: "application/json" }), "redactorium-log.json");
  const verifyUrl = getVerifyLogUrl();
  const dlPdf   = () => saveBlob(buildLogPDF(applied.log, { verifyUrl }), "redactorium-record.pdf");
  const dlZip   = async () => {
    const pdfBlob = buildLogPDF(applied.log, { verifyUrl });
    const zipBlob = await buildEvidenceZip({
      cleanBlob: applied.outputArtifact.blob,
      cleanFilename,
      log: applied.log,
      pdfBlob,
    });
    saveBlob(zipBlob, `redactorium-evidence-${Date.now()}.zip`);
    toast.success("Evidence package assembled");
  };

  return (
    <div className={embedded ? "min-h-0 pb-10" : "min-h-screen"}>
      {!embedded && <Masthead />}

      {/* Mode toggle */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 mt-4">
        <div className="tool-mode-switch" role="tablist">
          <button
            data-testid="mode-single-btn"
            role="tab"
            aria-selected={mode === "single"}
            onClick={() => setMode("single")}
            className={`px-3 md:px-4 py-2 text-xs md:text-sm font-semibold flex items-center gap-2 transition ${mode==="single" ? "bg-[hsl(var(--ink))] text-[hsl(var(--paper))]" : "hover:bg-[hsl(var(--paper-2))]"}`}
          >
            <FileText className="w-4 h-4" /> Single file
          </button>
          <button
            data-testid="mode-batch-btn"
            role="tab"
            aria-selected={mode === "batch"}
            onClick={() => setMode("batch")}
            className={`px-3 md:px-4 py-2 text-xs md:text-sm font-semibold flex items-center gap-2 transition ${mode==="batch" ? "bg-[hsl(var(--ink))] text-[hsl(var(--paper))]" : "hover:bg-[hsl(var(--paper-2))]"}`}
          >
            <Files className="w-4 h-4" /> Batch (multi-file)
          </button>
        </div>
      </section>

      {mode === "single" && !parsed && <FileDropZone onFile={handleFile} onSample={handleSample} />}
      {mode === "single" && !parsed && (
        <section className="max-w-6xl mx-auto px-4 md:px-6">
          <details className="red-disclosure"><summary>Custom rules</summary><CustomRulesPanel onRulesChange={onRulesChange} /></details>
        </section>
      )}

      {mode === "batch" && (
        <>
          <BatchView compiledCustom={compiledCustom} salt={salt} seed={seed} sigKey={sigKey} setSigKey={setSigKey} />
          <section className="max-w-6xl mx-auto px-4 md:px-6">
            <details className="red-disclosure"><summary>Custom rules</summary><CustomRulesPanel onRulesChange={onRulesChange} /></details>
          </section>
        </>
      )}

      {busy && (
        <div className="max-w-6xl mx-auto px-4 md:px-6 mt-6">
          <div className="paper-card--soft p-4 flex items-center gap-3 text-sm">
            <LoaderCircle className="w-4 h-4 animate-spin" />
            <span>{busyMsg}</span>
          </div>
        </div>
      )}

      {mode === "single" && parsed && detection && !applied && (
        <>
          <PresetsBar
            columnPlan={columnPlan}
            detection={detection}
            onPlanChange={(newPlan) => setColumnPlan(newPlan)}
          />
          <DetectionView
            detection={detection}
            columnPlan={columnPlan}
            onPlanChange={handlePlanChange}
            fileMeta={{ name: file.name, format: parsed.format, rowCount: parsed.rows.length }}
            onChangeFile={handleReset}
          />
          <ActionBar
            onApply={handleApply}
            onReset={handleReset}
            canApply={canApply}
            applying={busy}
            salt={salt} setSalt={setSalt}
            seed={seed} setSeed={setSeed}
            sigKey={sigKey} setSigKey={setSigKey}
            columnPlan={columnPlan}
          />
        </>
      )}

      {mode === "single" && parsed && !applied && (
        <section className="max-w-6xl mx-auto px-4 md:px-6 mt-8">
          <PreviewTable
            headers={parsed.headers}
            rows={parsed.rows}
            title="Original preview (first 8 rows)"
          />
        </section>
      )}

      {mode === "single" && applied && (
        <>
          <section className="max-w-6xl mx-auto px-4 md:px-6 mt-8">
            <h2 className="red-task-heading" tabIndex={-1} ref={recordHeadingRef}>{cleanFilename}</h2>

            <div className="red-stat-band">
              <span><span className="field-label">Rows</span><strong>{applied.rows.length.toLocaleString()}</strong></span>
              <span><span className="field-label">Transformed</span><strong>{applied.stats.filter(c => c.changed > 0).length} columns</strong></span>
              <span><span className="field-label">Cells rewritten</span><strong>{applied.stats.reduce((s, c) => s + c.changed, 0).toLocaleString()}</strong></span>
              <span><span className="field-label">Signed</span><strong>{applied.log.signature ? "HMAC-SHA-256" : "SHA-256"}</strong></span>
            </div>

            <p className="red-hash-line">in&nbsp;&nbsp;{applied.inputHash}</p>
            <p className="red-hash-line">out&nbsp;{applied.outputHash} · {applied.log.finishedAt}</p>

            <DownloadPanel
              onDownloadClean={dlClean}
              onDownloadJson={dlJson}
              onDownloadPdf={dlPdf}
              onDownloadZip={dlZip}
            />
            <div className="red-record-links">
              <button className="text-action" onClick={() => setApplied(null)}>Edit treatments</button>
              <button className="text-action" onClick={handleReset}>Start another file</button>
            </div>

            <div className="mt-8">
              <PreviewTable
                headers={applied.headers}
                rows={applied.rows}
                changedMap={applied.changedMap}
                title="Transformed preview (first 8 rows · green = changed)"
              />
            </div>
          </section>
        </>
      )}

      {!embedded && <Footer />}
    </div>
  );
}
