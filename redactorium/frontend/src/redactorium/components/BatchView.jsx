import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { UploadCloud, Trash2, FolderTree, Package } from "lucide-react";
import { parseFile } from "@/redactorium/lib/parsers";
import { detectColumns } from "@/redactorium/lib/detector";
import { applyTransformations } from "@/redactorium/lib/transformers";
import { buildOutput, buildLogJSON, buildLogPDF, bytesSha256, saveBlob } from "@/redactorium/lib/exporters";
import { signLog } from "@/redactorium/lib/signing";
import { CATEGORY_COLORS } from "@/redactorium/lib/piiPatterns";
import { getVerifyLogUrl } from "@/redactorium/lib/urls";
import JSZip from "jszip";

const ACCEPT = ".csv,.xlsx,.xls,.pdf,.docx,.txt,.md,.log";

function shortName(n, len = 32) { return n.length > len ? n.slice(0, len - 1) + "…" : n; }

export default function BatchView({ compiledCustom, salt, seed, sigKey, setSigKey }) {
  const [items, setItems] = useState([]); // {id, file, parsed, detection, plan, error, appliedResult}
  const [busy, setBusy] = useState(false);
  const [busyMsg, setBusyMsg] = useState("");
  const fileRef = useRef(null);
  const folderRef = useRef(null);

  useEffect(() => {
    if (folderRef.current) {
      folderRef.current.setAttribute("webkitdirectory", "");
      folderRef.current.setAttribute("directory", "");
      folderRef.current.setAttribute("mozdirectory", "");
    }
  }, []);

  const addFiles = useCallback(async (files) => {
    if (!files || files.length === 0) return;
    setBusy(true); setBusyMsg(`Parsing ${files.length} file${files.length===1?"":"s"}…`);
    const next = [...items];
    for (const f of Array.from(files)) {
      const id = `${f.name}-${f.size}-${Math.random().toString(36).slice(2,6)}`;
      try {
        const parsed = await parseFile(f);
        const det = detectColumns(parsed, { customDetectors: compiledCustom });
        const plan = det.map(c => ({
          index: c.index, header: c.header,
          detectorId: c.top?.detectorId || null,
          transform: c.suggested,
        }));
        next.push({ id, file: f, parsed, detection: det, plan });
      } catch (e) {
        next.push({ id, file: f, error: e.message || "Failed to parse" });
      }
    }
    setItems(next);
    setBusy(false); setBusyMsg("");
    toast.success(`Added ${files.length} file${files.length===1?"":"s"} to batch`);
  }, [items, compiledCustom]);

  const removeItem = (id) => setItems(list => list.filter(it => it.id !== id));

  const updatePlan = (id, colIdx, transform) => {
    setItems(list => list.map(it => {
      if (it.id !== id) return it;
      const plan = it.plan.map((p, i) => i === colIdx ? { ...p, transform } : p);
      return { ...it, plan };
    }));
  };

  const updateNote = (id, colIdx, note) => {
    setItems(list => list.map(it => {
      if (it.id !== id) return it;
      const plan = it.plan.map((p, i) => i === colIdx ? { ...p, note } : p);
      return { ...it, plan };
    }));
  };

  const totals = useMemo(() => {
    let rows = 0, cols = 0, piiCols = 0;
    for (const it of items) {
      if (!it.parsed) continue;
      rows += it.parsed.rows.length;
      cols += it.parsed.headers.length;
      piiCols += (it.detection || []).filter(c => c.containsPII).length;
    }
    return { rows, cols, piiCols };
  }, [items]);

  const applyAndBundle = async () => {
    const usable = items.filter(it => it.parsed && !it.error);
    if (usable.length === 0) { toast.error("Add at least one parseable file"); return; }
    setBusy(true); setBusyMsg("Applying transformations across batch…");
    const startedAt = new Date().toISOString();
    try {
      const zip = new JSZip();
      const manifest = [];
      const usedNames = new Set();

      for (const it of usable) {
        const { parsed, plan, detection, file } = it;
        const inputBytes = new Uint8Array(await file.arrayBuffer());
        const inputHash = await bytesSha256(inputBytes);
        const { headers, rows, stats } = await applyTransformations(parsed, plan, { salt, seed });
        const outputArtifact = await buildOutput({ ...parsed, headers, rows });
        const outputHash = await bytesSha256(new Uint8Array(await outputArtifact.blob.arrayBuffer()));
        const finishedAt = new Date().toISOString();

        const log = buildLogJSON({
          inputFile: file, format: parsed.format, columnPlan: plan, stats,
          detectionResults: detection, inputHash, outputHash,
          salt, seed, startedAt, finishedAt,
        });
        if (sigKey) log.signature = await signLog(log, sigKey);

        const base = file.name.replace(/\.[^.]+$/, "");
        let folder = base;
        let counter = 1;
        while (usedNames.has(folder)) { folder = `${base}-${counter++}`; }
        usedNames.add(folder);

        zip.folder(folder).file(`${base}.redacted.${outputArtifact.ext}`, outputArtifact.blob);
        zip.folder(folder).file("redactorium-log.json", JSON.stringify(log, null, 2));
        zip.folder(folder).file("redactorium-record.pdf", buildLogPDF(log, { verifyUrl: getVerifyLogUrl() }));

        manifest.push({
          file: file.name,
          format: parsed.format,
          rows: parsed.rows.length,
          columns: parsed.headers.length,
          pii_columns: detection.filter(c => c.containsPII).length,
          transformed_cells: stats.reduce((s, c) => s + c.changed, 0),
          input_sha256: inputHash,
          output_sha256: outputHash,
          signed: !!sigKey,
        });
      }

      zip.file("MANIFEST.json", JSON.stringify({
        tool: "Redactorium", version: "0.3.0", mode: "batch",
        generated_at: new Date().toISOString(),
        files_processed: manifest.length,
        signed: !!sigKey,
        manifest,
      }, null, 2));

      zip.file("README.txt",
`Redactorium — batch evidence archive
====================================
Files processed: ${manifest.length}
Signed: ${sigKey ? "yes (HMAC-SHA-256)" : "no"}
Generated: ${new Date().toISOString()}

Each file has its own subfolder containing:
  · <name>.redacted.<ext>         — cleaned file
  · redactorium-log.json          — machine-readable log
  · redactorium-record.pdf        — human-readable record

MANIFEST.json lists every input/output hash for verification.
`);

      const blob = await zip.generateAsync({ type: "blob", mimeType: "application/zip" });
      saveBlob(blob, `redactorium-batch-${Date.now()}.zip`);
      toast.success(`Batch archive assembled · ${manifest.length} files`);
    } catch (e) {
      console.error(e);
      toast.error(e.message || "Batch processing failed");
    } finally { setBusy(false); setBusyMsg(""); }
  };

  return (
    <section className="max-w-6xl mx-auto px-4 md:px-6 mt-4">
      <div className="paper-card p-4 md:p-6" data-testid="batch-view">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="eyebrow tag-toolkit">Batch mode · one archive out</p>
            <h2 className="text-3xl mt-1">Drop many, review at a glance</h2>
            <p className="text-sm text-[hsl(var(--ink-muted))] mt-1">
              Every file is parsed and detected client-side. Configure per-file plans, then export
              one archive containing a cleaned file, log, and record for each.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <input ref={fileRef} type="file" multiple hidden accept={ACCEPT}
                   onChange={(e) => addFiles(e.target.files)}
                   data-testid="batch-file-input"/>
            <input ref={folderRef} type="file" hidden
                   onChange={(e) => addFiles(e.target.files)}
                   data-testid="batch-folder-input"/>
            <button
              data-testid="batch-add-files"
              className="btn-ghost-ink text-sm flex items-center gap-2"
              onClick={() => fileRef.current?.click()}
            >
              <UploadCloud className="w-4 h-4" /> Add files
            </button>
            <button
              data-testid="batch-add-folder"
              className="btn-ghost-ink text-sm flex items-center gap-2"
              onClick={() => folderRef.current?.click()}
            >
              <FolderTree className="w-4 h-4" /> Add folder
            </button>
          </div>
        </div>

        {items.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2 text-xs">
            <span className="pill pill-ink">{items.length} files</span>
            <span className="pill">{totals.rows} rows</span>
            <span className="pill">{totals.cols} columns</span>
            <span className="pill pill-brick">{totals.piiCols} PII columns</span>
            {sigKey && <span className="pill pill-forest">HMAC-SHA-256 signing enabled</span>}
          </div>
        )}

        {setSigKey && (
          <div className="mt-4 flex items-center gap-3 flex-wrap">
            <label className="eyebrow tag-desk">HMAC signing key (optional)</label>
            <input
              data-testid="batch-sig-key-input"
              type="password"
              value={sigKey || ""}
              onChange={(e) => setSigKey(e.target.value)}
              placeholder="legal-team-key-2026"
              className="px-3 py-1.5 border border-[hsl(var(--ink))] bg-[hsl(var(--paper))] font-mono text-sm w-64"
            />
            <span className="text-[11px] text-[hsl(var(--ink-muted))]">Signs every per-file log with HMAC-SHA-256.</span>
          </div>
        )}

        {items.length === 0 && (
          <div className="mt-6 border-2 border-dashed border-[hsl(var(--ink)/0.4)] p-8 text-center text-sm text-[hsl(var(--ink-muted))]">
            No files yet. Add files or an entire folder to begin.
          </div>
        )}

        <div className="mt-5 space-y-4">
          {items.map((it, idx) => (
            <BatchItem
              key={it.id}
              item={it}
              onRemove={() => removeItem(it.id)}
              onPlanChange={(colIdx, transform) => updatePlan(it.id, colIdx, transform)}
              onNoteChange={(colIdx, note) => updateNote(it.id, colIdx, note)}
              indexLabel={String(idx + 1).padStart(2, "0")}
            />
          ))}
        </div>

        {items.length > 0 && (
          <div className="mt-6 flex justify-end">
            <button
              data-testid="batch-apply-btn"
              onClick={applyAndBundle}
              disabled={busy}
              className="btn-forest flex items-center gap-2 disabled:opacity-40"
            >
              <Package className="w-4 h-4" />
              {busy ? "Working…" : `Apply & bundle ${items.filter(i => i.parsed).length} file${items.filter(i => i.parsed).length===1?"":"s"} → .zip`}
            </button>
          </div>
        )}
        {busy && <p className="text-xs text-[hsl(var(--ink-muted))] mt-3">{busyMsg}</p>}
      </div>
    </section>
  );
}

function BatchItem({ item, onRemove, onPlanChange, onNoteChange, indexLabel }) {
  const [open, setOpen] = useState(true);
  if (item.error) {
    return (
      <div className="paper-card--soft p-4 border-[hsl(var(--brick))]" data-testid="batch-item-error">
        <div className="flex justify-between items-center gap-3">
          <div>
            <div className="font-semibold text-sm">{item.file.name}</div>
            <div className="text-xs text-[hsl(var(--brick))]">Error: {item.error}</div>
          </div>
          <button className="btn-ghost-ink text-xs" onClick={onRemove}><Trash2 className="w-3.5 h-3.5"/></button>
        </div>
      </div>
    );
  }
  const { parsed, detection, plan, file } = item;
  const piiCols = detection.filter(c => c.containsPII).length;

  return (
    <div className="paper-card--soft" data-testid="batch-item">
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(o => !o)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen(o => !o); } }}
        className="w-full flex items-center justify-between gap-3 p-4 hover:bg-[hsl(var(--paper-2))] transition text-left cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <span className="mono text-xs text-[hsl(var(--ink-muted))]">{indexLabel}</span>
          <span className="font-semibold text-sm">{shortName(file.name, 44)}</span>
          <span className="pill">{parsed.format.toUpperCase()}</span>
          <span className="pill">{parsed.rows.length} rows</span>
          <span className={`pill ${piiCols > 0 ? "pill-brick" : ""}`}>{piiCols} PII</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] mono text-[hsl(var(--ink-muted))]">{open ? "collapse" : "expand"}</span>
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="p-1 hover:bg-[hsl(var(--paper))]"
            aria-label="Remove file"
            data-testid="batch-remove-item"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      {open && (
        <div className="p-3 md:p-4 border-t border-[hsl(var(--rule))] space-y-4">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-2">
            {detection.map((c, i) => {
              const t = c.top;
              const catCls = t ? (CATEGORY_COLORS[t.category] || "pill") : "";
              const p = plan[i];
              return (
                <div key={i} className="p-2 border border-[hsl(var(--rule))] bg-[hsl(var(--paper))]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="mono text-[10px] text-[hsl(var(--ink-muted))] w-6 shrink-0">{String(i+1).padStart(2,"0")}</span>
                    <span className="text-sm font-semibold flex-1 min-w-0 truncate">{c.header || <em>col {i+1}</em>}</span>
                    {t ? (
                      <>
                        <span className={`pill ${catCls} text-[10px] whitespace-nowrap`}>{t.name}</span>
                        <span className="pill text-[10px] whitespace-nowrap">{(t.confidence*100).toFixed(0)}%</span>
                      </>
                    ) : (
                      <span className="text-[11px] italic text-[hsl(var(--ink-muted))]">no match</span>
                    )}
                    <select
                      value={p.transform}
                      onChange={(e) => onPlanChange(i, e.target.value)}
                      className="text-xs px-2 py-1 border border-[hsl(var(--ink))] bg-[hsl(var(--paper))] ml-auto"
                      data-testid={`batch-transform-${item.id}-${i}`}
                    >
                      <option value="keep">Keep</option>
                      <option value="hash">Hash</option>
                      <option value="redact">Redact</option>
                      <option value="generalize">Generalize</option>
                      {t && <option value="synthetic">Synthetic</option>}
                    </select>
                  </div>
                  {p.transform !== "keep" && (
                    <input
                      data-testid={`batch-note-${item.id}-${i}`}
                      value={p.note || ""}
                      onChange={(e) => onNoteChange(i, e.target.value)}
                      placeholder="reviewer note (optional) — flows into log + PDF"
                      className="mt-2 w-full text-[11px] px-2 py-1 border border-[hsl(var(--rule))] bg-[hsl(var(--paper))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--forest))]"
                      maxLength={500}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
