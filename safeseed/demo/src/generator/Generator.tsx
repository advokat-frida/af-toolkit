import { useEffect, useMemo, useRef, useState } from "react";
import {
  generate,
  toCsv,
  makeRunRecord,
  CATALOG,
  SCHEMA_PRESETS,
  getSchemaPreset,
  getEntry,
  isSafeColumnName,
  type FieldType,
  type Tier,
  type RunRecord,
  type SchemaPresetId,
} from "safeseed";
import { VerifyPanel } from "./VerifyPanel";
import { SiteFooter, SiteHeader } from "../components/SiteChrome";

const MAX_ROWS = 10000;
const MAX_SEED = 0xffffffff;
const PREVIEW_ROWS = 12;

// Inside the Toolkit shell the surrounding chrome (name, article link, page
// intro) belongs to the shell; ?embed=1 renders only the working stage.
const EMBED = new URLSearchParams(window.location.search).has("embed");

const TIER_CLASS: Record<Tier, string> = {
  "protocol-reserved": "tier-provable",
  "authority-reserved": "tier-reserved",
  "designated-test-only": "tier-designated",
  "structurally-fake": "tier-fake",
};

const TIER_LABEL: Record<Tier, string> = {
  "protocol-reserved": "Protocol reserved",
  "authority-reserved": "Authority reserved",
  "designated-test-only": "Designated for testing",
  "structurally-fake": "Structurally fake",
};

const DERIVED_TIER_LABEL: Record<Tier, string> = {
  "protocol-reserved": "Derived from protocol input",
  "authority-reserved": "Derived from authority input",
  "designated-test-only": "Derived from test input",
  "structurally-fake": "Derived from fake input",
};

const FIELD_LABEL: Partial<Record<FieldType, string>> = {
  email: "Email",
  sha256Email: "Hashed email (SHA-256)",
  domain: "Domain",
  ipv4: "IPv4 address",
  ipv6: "IPv6 address",
  phone: "US phone",
  ukPhone: "UK phone (Ofcom drama)",
  sha256Phone: "Hashed phone (SHA-256)",
  ssn: "US SSN",
  creditCard: "Credit card (test PAN)",
  marketingUrl: "Marketing URL (UTM)",
  opaqueId: "Opaque business ID",
  firstName: "First name",
  lastName: "Last name",
  fullName: "Full name",
  streetAddress: "Street address",
  freeText: "Obvious test text",
};

const TYPE_OPTIONS = CATALOG.map((entry) => ({
  value: entry.field as FieldType,
  label: FIELD_LABEL[entry.field] ?? entry.field,
}));

interface FieldRow {
  id: number;
  name: string;
  type: FieldType;
}

interface CurrentRecord {
  csv: string;
  record: RunRecord;
}

function assuranceLabel(type: FieldType): string {
  const entry = getEntry(type);
  return entry.derivation === undefined ? TIER_LABEL[entry.tier] : DERIVED_TIER_LABEL[entry.tier];
}

function rowsFromPreset(id: SchemaPresetId, startId = 1): FieldRow[] {
  return getSchemaPreset(id).schema.map((field, index) => ({
    id: startId + index,
    name: field.name,
    type: field.type,
  }));
}

const DEFAULT_FIELDS = rowsFromPreset("crm-contacts");

function download(filename: string, text: string, mime: string): void {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export default function Generator() {
  const idRef = useRef(DEFAULT_FIELDS.length + 1);
  const columnsHeadingRef = useRef<HTMLHeadingElement>(null);
  const resultHeadingRef = useRef<HTMLHeadingElement>(null);
  const [fields, setFields] = useState<FieldRow[]>(() => DEFAULT_FIELDS.map((field) => ({ ...field })));
  const [rowCount, setRowCount] = useState(100);
  const [seed, setSeed] = useState(1);
  const [mode, setMode] = useState<"generate" | "verify">("generate");
  const [stage, setStage] = useState<"edit" | "result">("edit");
  const [presetStatus, setPresetStatus] = useState("CRM contacts loaded. Six editable columns.");
  const [activePreset, setActivePreset] = useState<SchemaPresetId | null>("crm-contacts");
  const [recordState, setRecordState] = useState<CurrentRecord | null>(null);
  const [recordError, setRecordError] = useState("");

  const trimmedNames = fields.map((field) => field.name.trim());
  const emptyName = trimmedNames.some((name) => name === "");
  const duplicateNames = trimmedNames.filter(
    (name, index) => name !== "" && trimmedNames.indexOf(name) !== index,
  );
  const unsafeNames = trimmedNames.filter((name) => name !== "" && !isSafeColumnName(name));
  const rowsValid = Number.isSafeInteger(rowCount) && rowCount >= 1 && rowCount <= MAX_ROWS;
  const seedValid = Number.isSafeInteger(seed) && seed >= 0 && seed <= MAX_SEED;
  const configValid =
    fields.length > 0 && !emptyName && duplicateNames.length === 0 && unsafeNames.length === 0 && rowsValid && seedValid;

  const schemaKey = JSON.stringify(fields.map((field) => [field.name.trim(), field.type]));
  const schema = useMemo(
    () => fields.map((field) => ({ name: field.name.trim(), type: field.type })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [schemaKey],
  );
  const dataset = useMemo(
    () => (configValid ? generate({ schema, rows: rowCount, seed }) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [schemaKey, rowCount, seed, configValid],
  );
  const csv = useMemo(
    () => (dataset ? toCsv(dataset.columns, dataset.rows) : ""),
    [dataset],
  );

  useEffect(() => {
    let cancelled = false;
    setRecordError("");
    if (!dataset || csv === "") {
      setRecordState(null);
      return;
    }
    void makeRunRecord(dataset, csv)
      .then((record) => {
        if (!cancelled) setRecordState({ csv, record });
      })
      .catch(() => {
        if (!cancelled) {
          setRecordState(null);
          setRecordError("SafeSeed could not create a matching receipt. Change the settings and try again.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [dataset, csv]);

  const newId = () => idRef.current++;
  const updateField = (id: number, patch: Partial<FieldRow>) => {
    setActivePreset(null);
    setFields((current) => current.map((field) => (field.id === id ? { ...field, ...patch } : field)));
  };
  const addField = () => {
    const id = newId();
    setActivePreset(null);
    setFields((current) => [
      ...current,
      { id, name: `field_${current.length + 1}`, type: "freeText" },
    ]);
  };
  const removeField = (id: number) => {
    setActivePreset(null);
    setFields((current) => current.filter((field) => field.id !== id));
  };
  const applyPreset = (id: SchemaPresetId) => {
    const preset = getSchemaPreset(id);
    const next = rowsFromPreset(id, idRef.current);
    idRef.current += next.length;
    setFields(next);
    setActivePreset(id);
    setPresetStatus(`${preset.label} loaded. ${next.length} editable columns.`);
    requestAnimationFrame(() => columnsHeadingRef.current?.focus());
  };
  const showResult = () => {
    if (!configValid) return;
    setStage("result");
    requestAnimationFrame(() => resultHeadingRef.current?.focus());
  };
  const backToColumns = () => {
    setStage("edit");
    requestAnimationFrame(() => columnsHeadingRef.current?.focus());
  };

  const previewRows = dataset?.rows.slice(0, PREVIEW_ROWS) ?? [];
  const hasDerivedFields = fields.some((field) => getEntry(field.type).derivation !== undefined);
  const currentRecord = recordState?.csv === csv ? recordState.record : null;
  const canDownload = configValid && dataset !== null && csv !== "" && currentRecord !== null;

  return (
    <div className={`page-shell${EMBED ? " is-embed" : ""}`}>
      <a className="skiplink" href="#main-content">Skip to SafeSeed tool</a>
      {!EMBED && <SiteHeader />}
      <div className="site">
        <main id="main-content" className="site-main gen-main" tabIndex={-1}>
        {!EMBED && (
          <div className="gen-intro">
            <p className="eyebrow">{mode === "generate" ? "Generate" : "Verify"}</p>
            <h1>SafeSeed: In-Browser App</h1>
            {mode === "generate" ? (
              <p className="gen-lede">
                Build a test or demo CSV entirely from SafeSeed&rsquo;s catalog. Every column is generated here;
                download the exact CSV and its matching receipt.
              </p>
            ) : (
              <p className="gen-lede">
                Check a SafeSeed CSV against its matching receipt. The browser requires an exact
                whole-file match: bytes, headers, row shape, and catalog ranges.
              </p>
            )}
            <details className="gen-changelog">
              <summary>Changelog (last updated: August 31, 2026)</summary>
              <div className="gen-changelog-body">
                <time dateTime="2026-08-31">August 31, 2026</time>
                <strong>The Toolkit design system</strong>
                <ul>
                  <li>Adopted the shared Toolkit layout: staged generate flow, dotted assurance labels, receipt language.</li>
                  <li>Added the embedded Toolkit mode.</li>
                </ul>
              </div>
            </details>
          </div>
        )}

        <div className="gen-modes" role="group" aria-label="Mode">
          <button type="button" aria-pressed={mode === "generate"} className="gen-mode" onClick={() => { setMode("generate"); setStage("edit"); }}>Generate</button>
          <button type="button" aria-pressed={mode === "verify"} className="gen-mode" onClick={() => setMode("verify")}>Verify a file</button>
        </div>

        {mode === "generate" && stage === "edit" && (
          <section className="gen-panel" aria-labelledby="columns-heading">
            <h2 id="columns-heading" className="task-heading" ref={columnsHeadingRef} tabIndex={-1}>Columns</h2>

            <div className="gen-presets">
              <p className="field-label" id="preset-label">Start from a preset</p>
              <div className="preset-row" role="group" aria-labelledby="preset-label">
                {SCHEMA_PRESETS.map((preset) => (
                  <button
                    type="button"
                    className="preset-pill"
                    key={preset.id}
                    aria-pressed={activePreset === preset.id}
                    title={preset.description}
                    onClick={() => applyPreset(preset.id)}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <p className="sr-only" aria-live="polite">{presetStatus}</p>
            </div>

            <div className="field-list">
              {fields.map((field, index) => {
                const tier = getEntry(field.type).tier;
                const duplicate = field.name.trim() !== "" && duplicateNames.includes(field.name.trim());
                const empty = field.name.trim() === "";
                const unsafe = field.name.trim() !== "" && !isSafeColumnName(field.name.trim());
                const invalid = duplicate || empty || unsafe;
                return (
                  <div className="field-row" key={field.id}>
                    <input
                      className="field-name"
                      value={field.name}
                      spellCheck={false}
                      aria-label={`Column ${index + 1} name`}
                      aria-invalid={invalid}
                      aria-describedby={invalid ? "generator-errors" : undefined}
                      onChange={(event) => updateField(field.id, { name: event.target.value })}
                    />
                    <select
                      className="field-type"
                      value={field.type}
                      aria-label={`Column ${index + 1} type for ${field.name || "unnamed column"}`}
                      onChange={(event) => updateField(field.id, { type: event.target.value as FieldType })}
                    >
                      {TYPE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                    <span className={`tier-mark ${TIER_CLASS[tier]}`}>
                      <span className="tier-dot" aria-hidden="true" />
                      {assuranceLabel(field.type)}
                    </span>
                    <button
                      type="button"
                      className="field-del"
                      aria-label={`Remove ${field.name || `column ${index + 1}`}`}
                      disabled={fields.length === 1}
                      onClick={() => removeField(field.id)}
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>

            {hasDerivedFields && (
              <p className="gen-aside">
                Hashed is not anonymous. These SHA-256 values come from SafeSeed&rsquo;s published allowlist of
                catalog-constrained inputs; an arbitrary hash fails verification.
              </p>
            )}

            <div className="gen-nums">
              <label className="num-ctl">
                <span className="field-label">Rows</span>
                <input
                  type="number"
                  min={1}
                  max={MAX_ROWS}
                  step={1}
                  value={Number.isNaN(rowCount) ? "" : rowCount}
                  aria-invalid={!rowsValid}
                  aria-describedby={!rowsValid ? "generator-errors" : undefined}
                  onChange={(event) => setRowCount(Number(event.target.value))}
                />
              </label>
              <label className="num-ctl">
                <span className="field-label">Seed</span>
                <input
                  type="number"
                  min={0}
                  max={MAX_SEED}
                  step={1}
                  value={Number.isNaN(seed) ? "" : seed}
                  aria-invalid={!seedValid}
                  aria-describedby={!seedValid ? "generator-errors" : undefined}
                  onChange={(event) => setSeed(Number(event.target.value))}
                />
              </label>
              <span className="gen-hint">Same seed + columns = identical data, every time.</span>
            </div>

            {!configValid && (
              <p id="generator-errors" className="gen-error" role="alert">
                {emptyName && "Every column needs a name. "}
                {duplicateNames.length > 0 && `Duplicate column name: ${duplicateNames[0]}. `}
                {unsafeNames.length > 0 && "Column names cannot begin with =, +, -, or @. "}
                {!rowsValid && `Rows must be a whole number from 1 to ${MAX_ROWS}. `}
                {!seedValid && `Seed must be a whole number from 0 to ${MAX_SEED}.`}
              </p>
            )}

            <div className="gen-actions">
              <button type="button" className="text-action" onClick={addField}>+ Add generated column</button>
              <button
                type="button"
                className="btn btn-primary"
                data-testid="generate"
                disabled={!configValid}
                onClick={showResult}
              >
                Generate
              </button>
            </div>

            <details className="tier-disclosure">
              <summary>How SafeSeed labels generated fields</summary>
              <ul className="tier-key" aria-label="What the assurance tiers mean">
                <li><span className="tier-dot tier-provable" aria-hidden="true" /><span><strong>Protocol reserved</strong> — a published standard reserves the namespace for documentation or testing.</span></li>
                <li><span className="tier-dot tier-reserved" aria-hidden="true" /><span><strong>Authority reserved</strong> — the cited authority currently marks the range fictitious or invalid.</span></li>
                <li><span className="tier-dot tier-designated" aria-hidden="true" /><span><strong>Designated for testing</strong> — valid-looking and published for processor or sandbox test mode.</span></li>
                <li><span className="tier-dot tier-fake" aria-hidden="true" /><span><strong>Structurally fake</strong> — no standard reserves it, so it is built to be obviously fake.</span></li>
              </ul>
            </details>
          </section>
        )}

        {mode === "generate" && stage === "result" && (
          <section className="gen-panel" aria-labelledby="result-heading">
            <div className="result-head">
              <h2 id="result-heading" className="task-heading" ref={resultHeadingRef} tabIndex={-1}>
                {rowCount.toLocaleString()} rows · seed {seed}
              </h2>
              <button type="button" className="text-action" onClick={backToColumns}>Edit columns</button>
            </div>

            {dataset && (
              <div className="gen-table-wrap" role="region" aria-label="Generated CSV preview" tabIndex={0}>
                <table className="gen-table">
                  <thead>
                    <tr>
                      {fields.map((field) => (
                        <th key={field.id}>
                          <span className={`tier-dot ${TIER_CLASS[getEntry(field.type).tier]}`} aria-hidden="true" />
                          {field.name.trim()}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {row.map((cell, columnIndex) => <td key={columnIndex}>{cell}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {dataset && dataset.rows.length > PREVIEW_ROWS && (
              <p className="gen-hint">First {PREVIEW_ROWS} of {dataset.rows.length.toLocaleString()} rows.</p>
            )}

            <p className="gen-aside">
              Every value comes from SafeSeed&rsquo;s catalog of reserved, fictitious, or structurally fake
              ranges. These values cannot reach a real person.
            </p>

            <div className="stat-band">
              <span><span className="field-label">Rows</span><strong>{rowCount.toLocaleString()}</strong></span>
              <span><span className="field-label">Seed</span><strong>{seed}</strong></span>
              <span><span className="field-label">Columns</span><strong>{fields.length}</strong></span>
              <span><span className="field-label">Signed</span><strong>SHA-256</strong></span>
            </div>

            <div className="gen-actions">
              <div className="download-row">
                <button
                  type="button"
                  className="btn btn-primary"
                  data-testid="download-csv"
                  disabled={!canDownload}
                  onClick={() => download("safeseed-data.csv", csv, "text/csv")}
                >
                  Download CSV
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  data-testid="download-record"
                  disabled={!canDownload}
                  onClick={() => currentRecord && download(
                    "safeseed-data.receipt.json",
                    `${JSON.stringify(currentRecord, null, 2)}\n`,
                    "application/json",
                  )}
                >
                  Download receipt
                </button>
              </div>
            </div>
            <p className="gen-hint">Keep the CSV and its receipt together; verification needs the exact pair.</p>
            {recordError && <p className="gen-error" role="alert">{recordError}</p>}
          </section>
        )}

        {mode === "verify" && <VerifyPanel />}

        </main>
      </div>

      {!EMBED && <SiteFooter />}
    </div>
  );
}
