import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { X, UploadCloud, Copy, FileJson, FileSpreadsheet } from "lucide-react";
import { CATALOG, BY_ID, TIERS } from "@/safeseed/lib/safeCatalog";
import { guessSchemaFromCSV } from "@/safeseed/lib/csvInference";

const EXAMPLE_JSON = JSON.stringify([
  { name: "customer_id", type: "opaqueId" },
  { name: "email",       type: "email" },
  { name: "phone",       type: "phone" },
  { name: "signed_up",   type: "timestamp" },
  { name: "region",      type: "enum", options: { values: "eu,us,apac" } },
], null, 2);

const EXAMPLE_CSV =
`customer_id,email,age,region,signed_up
CUST_0001,ada@example.com,32,eu,2025-11-14
CUST_0002,grace@example.org,45,us,2025-12-02
CUST_0003,turing@example.net,28,eu,2025-10-30
CUST_0004,curie@example.com,51,apac,2025-09-11`;

function normalizeJson(text) {
  const parsed = JSON.parse(text);
  if (!Array.isArray(parsed)) throw new Error("Schema must be a JSON array of field objects.");
  const known = new Set(CATALOG.map(f => f.id));
  return parsed.map((f, i) => {
    if (!f || typeof f !== "object") throw new Error(`Field ${i + 1}: must be an object.`);
    const name = String(f.name ?? f.column ?? "").trim();
    if (!name) throw new Error(`Field ${i + 1}: missing "name".`);
    const type = String(f.type ?? "").trim();
    if (!known.has(type)) throw new Error(`Field "${name}": unknown type "${type}" (not in catalog).`);
    const options = f.options && typeof f.options === "object" ? f.options : undefined;
    return { name, type, options };
  });
}

export default function ImportSchemaModal({ open, onClose, onApply }) {
  const [tab, setTab] = useState("json"); // "json" | "csv"
  const [jsonText, setJsonText] = useState(EXAMPLE_JSON);
  const [csvText, setCsvText] = useState(EXAMPLE_CSV);
  const [err, setErr] = useState("");
  const fileRef = useRef(null);

  // JSON preview
  const jsonPreview = useMemo(() => {
    try { return normalizeJson(jsonText); } catch { return null; }
  }, [jsonText]);

  // CSV inference
  const csvInference = useMemo(() => {
    if (!csvText.trim()) return null;
    try { return guessSchemaFromCSV(csvText); } catch { return null; }
  }, [csvText]);

  if (!open) return null;

  const applyJson = () => {
    try {
      const s = normalizeJson(jsonText);
      setErr("");
      onApply(s);
      toast.success(`Imported ${s.length} field${s.length === 1 ? "" : "s"} from JSON`);
      onClose();
    } catch (e) { setErr(e.message); toast.error(e.message); }
  };
  const applyCsv = () => {
    if (!csvInference) { setErr("CSV could not be parsed."); toast.error("CSV could not be parsed."); return; }
    const s = csvInference.schema.map(f => {
      const out = { name: f.name, type: f.type };
      if (f.options) out.options = f.options;
      return out;
    });
    setErr("");
    onApply(s);
    toast.success(`Guessed ${s.length} field${s.length === 1 ? "" : "s"} from CSV headers + samples`);
    onClose();
  };

  const readFile = async (f) => {
    if (!f) return;
    const text = await f.text();
    if (tab === "json") setJsonText(text);
    else setCsvText(text);
  };

  return (
    <div
      data-testid="import-schema-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-[hsl(var(--ink)/0.55)]"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="paper-card w-full max-w-3xl max-h-[90vh] overflow-y-auto p-5 md:p-6">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <p className="eyebrow tag-toolkit">Bring your own schema</p>
            <h3 className="text-2xl md:text-3xl mt-1">Import from JSON or CSV</h3>
            <p className="text-sm text-[hsl(var(--ink-muted))] mt-1">
              Paste a SafeSeed schema JSON, or drop a CSV and let SafeSeed guess a type per column.
            </p>
          </div>
          <button
            data-testid="import-close-btn"
            onClick={onClose}
            className="p-2 hover:bg-[hsl(var(--paper-2))]"
            aria-label="close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab strip */}
        <div className="paper-card--soft p-1 inline-flex mb-3" role="tablist">
          <button
            data-testid="import-tab-json"
            role="tab"
            aria-selected={tab === "json"}
            onClick={() => { setTab("json"); setErr(""); }}
            className={`px-3 py-1.5 text-sm font-semibold flex items-center gap-2 ${tab === "json" ? "bg-[hsl(var(--ink))] text-[hsl(var(--paper))]" : "hover:bg-[hsl(var(--paper-2))]"}`}
          >
            <FileJson className="w-4 h-4" /> Paste JSON
          </button>
          <button
            data-testid="import-tab-csv"
            role="tab"
            aria-selected={tab === "csv"}
            onClick={() => { setTab("csv"); setErr(""); }}
            className={`px-3 py-1.5 text-sm font-semibold flex items-center gap-2 ${tab === "csv" ? "bg-[hsl(var(--ink))] text-[hsl(var(--paper))]" : "hover:bg-[hsl(var(--paper-2))]"}`}
          >
            <FileSpreadsheet className="w-4 h-4" /> Guess from CSV
          </button>
        </div>

        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <button
            onClick={() => fileRef.current?.click()}
            data-testid="import-upload-btn"
            className="btn-ghost-ink text-xs flex items-center gap-1 px-2 py-1"
          >
            <UploadCloud className="w-3 h-3" /> Upload {tab === "json" ? ".json" : ".csv"}
          </button>
          <button
            onClick={() => {
              if (tab === "json") { setJsonText(EXAMPLE_JSON); toast("Loaded example JSON"); }
              else { setCsvText(EXAMPLE_CSV); toast("Loaded example CSV"); }
            }}
            data-testid="import-example-btn"
            className="btn-ghost-ink text-xs flex items-center gap-1 px-2 py-1"
          >
            <Copy className="w-3 h-3" /> Load example
          </button>
          <input
            ref={fileRef}
            type="file"
            accept={tab === "json" ? ".json,application/json" : ".csv,text/csv"}
            hidden
            onChange={(e) => readFile(e.target.files?.[0])}
          />
          <span className="text-[10px] text-[hsl(var(--ink-muted))] ml-auto">
            {tab === "json"
              ? `${CATALOG.length} valid catalog types`
              : csvInference ? `${csvInference.columnCount} cols · ${csvInference.rowCount} sample rows` : "waiting for CSV"}
          </span>
        </div>

        {tab === "json" ? (
          <textarea
            data-testid="import-textarea"
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            rows={12}
            className="w-full px-3 py-2 border border-[hsl(var(--ink))] bg-[hsl(var(--paper))] font-mono text-xs"
          />
        ) : (
          <textarea
            data-testid="import-csv-textarea"
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            rows={12}
            className="w-full px-3 py-2 border border-[hsl(var(--ink))] bg-[hsl(var(--paper))] font-mono text-xs"
          />
        )}

        {err && (
          <div data-testid="import-error" className="mt-2 p-2 text-[11px] text-[hsl(var(--brick))] border border-[hsl(var(--brick))] bg-[hsl(var(--brick)_/_0.06)]">
            {err}
          </div>
        )}

        {tab === "json" && jsonPreview && (
          <div className="mt-3 paper-card--soft p-3" data-testid="import-json-preview">
            <div className="eyebrow tag-desk mb-2">Preview · {jsonPreview.length} field{jsonPreview.length === 1 ? "" : "s"}</div>
            <div className="flex flex-wrap gap-1.5">
              {jsonPreview.map((f, i) => (
                <span key={i} className="pill text-[10px]">
                  {f.name} <span className="mono text-[hsl(var(--ink-muted))] ml-1">{f.type}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {tab === "csv" && csvInference && (
          <div className="mt-3 paper-card--soft p-3" data-testid="import-csv-preview">
            <div className="eyebrow tag-desk mb-2">Guessed schema · {csvInference.columnCount} field{csvInference.columnCount === 1 ? "" : "s"}</div>
            <ul className="space-y-1.5">
              {csvInference.schema.map((f, i) => {
                const spec = BY_ID[f.type];
                const tier = spec?.tier;
                return (
                  <li key={i} className="flex items-start gap-2 flex-wrap text-[12px]">
                    <span className="mono text-[10px] text-[hsl(var(--ink-muted))] w-6 shrink-0">{String(i + 1).padStart(2, "0")}</span>
                    <span className="font-semibold min-w-0 truncate max-w-[40%]">{f.name}</span>
                    <span className="pill text-[10px] whitespace-nowrap">{spec?.label || f.type}</span>
                    {tier && (
                      <span
                        className="pill text-[10px]"
                        style={{ background: TIERS[tier].color, color: "#F5EFE1", borderColor: TIERS[tier].color }}
                      >{tier}</span>
                    )}
                    <span className="text-[11px] text-[hsl(var(--ink-muted))] italic ml-auto min-w-0">
                      {f.inference?.basis}
                    </span>
                  </li>
                );
              })}
            </ul>
            <p className="text-[10px] text-[hsl(var(--ink-muted))] italic mt-2">
              Note: SafeSeed does not keep any values from your CSV — only the header names and the guessed type per column flow into the schema.
            </p>
          </div>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="btn-ghost-ink">Cancel</button>
          <button
            data-testid="import-apply-btn"
            onClick={tab === "json" ? applyJson : applyCsv}
            className="btn-forest"
          >
            {tab === "json" ? "Apply schema" : "Apply guessed schema"}
          </button>
        </div>
      </div>
    </div>
  );
}
