import { useRef, useState, type ReactElement, type RefObject } from "react";
import {
  verify,
  validateRunRecord,
  type RunRecord,
  type VerifyResult,
  type VerifyFailure,
} from "safeseed";

// lucide-static v1.31.0 - ISC (byte-exact paths)
const SPREADSHEET_ICON = (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" />
    <path d="M14 2v5a1 1 0 0 0 1 1h5" />
    <path d="M8 13h2" />
    <path d="M14 13h2" />
    <path d="M8 17h2" />
    <path d="M14 17h2" />
  </svg>
);
const RECEIPT_ICON = (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 17V7" />
    <path d="M16 8h-6a2 2 0 0 0 0 4h4a2 2 0 0 1 0 4H8" />
    <path d="M4 3a1 1 0 0 1 1-1 1.3 1.3 0 0 1 .7.2l.933.6a1.3 1.3 0 0 0 1.4 0l.934-.6a1.3 1.3 0 0 1 1.4 0l.933.6a1.3 1.3 0 0 0 1.4 0l.933-.6a1.3 1.3 0 0 1 1.4 0l.934.6a1.3 1.3 0 0 0 1.4 0l.933-.6A1.3 1.3 0 0 1 19 2a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1 1.3 1.3 0 0 1-.7-.2l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.934.6a1.3 1.3 0 0 1-1.4 0l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-1.4 0l-.934-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-.7.2 1 1 0 0 1-1-1z" />
  </svg>
);

function FileDrop({
  icon,
  label,
  hint,
  accept,
  fileName,
  error,
  onFile,
  zoneRef,
}: {
  icon: ReactElement;
  label: string;
  hint: string;
  accept: string;
  fileName: string;
  error?: string;
  onFile: (file: File) => void;
  zoneRef?: RefObject<HTMLDivElement | null>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const take = (files: FileList | null) => {
    if (files?.[0]) onFile(files[0]);
  };

  return (
    <div
      ref={zoneRef}
      className={`file-drop${over ? " is-over" : ""}${error ? " is-error" : fileName ? " is-set" : ""}`}
      role="button"
      tabIndex={0}
      aria-label={`${label}. ${fileName || hint}`}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={(event) => {
        event.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setOver(false);
        take(event.dataTransfer.files);
      }}
    >
      <input ref={inputRef} type="file" accept={accept} hidden onChange={(event) => take(event.target.files)} />
      <span className="file-drop-icon">{icon}</span>
      <span className="file-drop-label">{label}</span>
      <span className="file-drop-name">{fileName || hint}</span>
      {error && <span className="file-drop-error">{error}</span>}
    </div>
  );
}

function plainFailure(failure: VerifyFailure): string {
  const where = failure.row !== undefined ? ` (row ${failure.row + 1})` : "";
  switch (failure.kind) {
    case "content-hash-mismatch":
      return "The current CSV fingerprint does not match this receipt.";
    case "malformed-csv":
      return `The CSV syntax is malformed, so SafeSeed stopped without checking any values. ${failure.message}`;
    case "out-of-range-value":
      return `${failure.field ?? "A column"}${where}: candidate value redacted; it isn't inside the catalog constraint for that column.`;
    case "missing-column":
      return `The receipt expects a column "${failure.field}" that isn't in this CSV.`;
    case "column-hash-mismatch":
      return `Column "${failure.field}" has been changed since it was generated.`;
    case "row-arity-mismatch":
      return `Row ${(failure.row ?? 0) + 1} has a different number of columns than expected.`;
    case "schema-mismatch":
      return failure.field
        ? `The recorded column "${failure.field}" is duplicated or otherwise ambiguous.`
        : "The CSV headers or column order do not exactly match this receipt.";
    default:
      return failure.message;
  }
}

function shortHash(value: string): string {
  return value.length > 24 ? `${value.slice(0, 12)}…${value.slice(-6)}` : value;
}

function stamp(iso: string | undefined): string {
  if (!iso) return "—";
  return iso.replace(/:\d{2}(?:\.\d+)?Z$/, "Z");
}

async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function VerifyPanel() {
  const csvReadRef = useRef(0);
  const recordReadRef = useRef(0);
  const pairRevisionRef = useRef(0);
  const verdictRef = useRef<HTMLDivElement>(null);
  const csvZoneRef = useRef<HTMLDivElement>(null);
  const recordZoneRef = useRef<HTMLDivElement>(null);
  const [csvText, setCsvText] = useState<string | null>(null);
  const [csvName, setCsvName] = useState("");
  const [csvError, setCsvError] = useState("");
  const [csvHash, setCsvHash] = useState("");
  const [record, setRecord] = useState<RunRecord | null>(null);
  const [recordName, setRecordName] = useState("");
  const [pairError, setPairError] = useState("");
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [busy, setBusy] = useState(false);

  async function onCsv(file: File) {
    const readId = ++csvReadRef.current;
    pairRevisionRef.current++;
    setCsvName(file.name);
    setCsvText(null);
    setCsvError("");
    setCsvHash("");
    setPairError("");
    setResult(null);
    setBusy(false);
    try {
      const text = await file.text();
      if (readId === csvReadRef.current) {
        setCsvText(text);
        setCsvHash(await sha256Hex(text));
      }
    } catch {
      if (readId === csvReadRef.current) {
        setCsvText(null);
        setCsvError("SafeSeed could not read this CSV. Choose the file again.");
      }
    }
  }

  async function onRecord(file: File) {
    const readId = ++recordReadRef.current;
    pairRevisionRef.current++;
    setRecordName(file.name);
    setRecord(null);
    setPairError("");
    setResult(null);
    setBusy(false);
    try {
      const validation = validateRunRecord(JSON.parse(await file.text()));
      if (!validation.ok) throw new Error("invalid record");
      if (readId === recordReadRef.current) setRecord(validation.record);
    } catch {
      if (readId === recordReadRef.current) {
        setRecord(null);
        setPairError("Not a current SafeSeed receipt. Use the .json downloaded next to the CSV.");
      }
    }
  }

  function reset() {
    csvReadRef.current++;
    recordReadRef.current++;
    pairRevisionRef.current++;
    setCsvText(null);
    setCsvName("");
    setCsvError("");
    setCsvHash("");
    setRecord(null);
    setRecordName("");
    setPairError("");
    setResult(null);
    setBusy(false);
  }

  async function run() {
    if (busy) return;
    if (csvText === null) {
      csvZoneRef.current?.focus();
      return;
    }
    if (!record) {
      recordZoneRef.current?.focus();
      return;
    }
    const revision = pairRevisionRef.current;
    const selectedCsv = csvText;
    const selectedRecord = record;
    setBusy(true);
    try {
      const next = await verify(selectedCsv, selectedRecord);
      if (revision === pairRevisionRef.current) {
        setResult(next);
        setPairError("");
        requestAnimationFrame(() => verdictRef.current?.focus());
      }
    } catch {
      if (revision === pairRevisionRef.current) {
        setResult(null);
        setPairError("SafeSeed could not read this pair. Check both files and try again.");
      }
    } finally {
      if (revision === pairRevisionRef.current) setBusy(false);
    }
  }

  const rowArityCount = result
    ? result.failures.filter((failure) => failure.kind === "row-arity-mismatch").length
    : 0;
  const otherFailures = result
    ? result.failures.filter((failure) => failure.kind !== "row-arity-mismatch")
    : [];

  return (
    <section className="gen-panel verify-panel" aria-labelledby="verify-heading">
      <h2 id="verify-heading" className="sr-only">Verify a file</h2>

      {!result && (
        <>
          <div className="verify-drops">
            <FileDrop icon={SPREADSHEET_ICON} label="SafeSeed CSV" hint="Click or drop the data file." accept=".csv,text/csv" fileName={csvName} error={csvError} onFile={onCsv} zoneRef={csvZoneRef} />
            <FileDrop icon={RECEIPT_ICON} label="Receipt" hint="Click or drop the .json downloaded with it." accept=".json,application/json" fileName={recordName} error={pairError} onFile={onRecord} zoneRef={recordZoneRef} />
          </div>
          <div className="gen-actions">
            <button type="button" className="btn btn-primary verify-go" aria-disabled={csvText === null || !record || busy} onClick={run}>
              {busy ? "Checking…" : "Verify"}
            </button>
          </div>
        </>
      )}

      {result && (
        <div className="verify-result" role="status" aria-live="polite">
          <div className={`verdict-block ${result.ok ? "is-pass" : "is-fail"}`} ref={verdictRef} tabIndex={-1}>
            <strong className="verdict-title">{result.ok ? "Receipt matches" : "Receipt does not match"}</strong>
            <span className="verdict-sub">{csvName} · {result.ok ? "verified against" : "checked against"} {recordName}</span>
          </div>

          <div className="verify-rows">
            <span className="verify-key">File hash</span><span className="verify-value" title={csvHash || undefined}>{csvHash ? shortHash(csvHash) : "—"}</span>
            <span className="verify-key">Receipt hash</span><span className="verify-value" title={record?.contentSha256}>{record?.contentSha256 ? shortHash(record.contentSha256) : "—"}</span>
            <span className="verify-key">Seed</span><span className="verify-value">{record?.seed ?? "—"}</span>
            <span className="verify-key">Generated</span><span className="verify-value">{stamp(record?.generatedAt)}</span>
          </div>

          {result.failures.length > 0 && (
            <ul className="verify-failures">
              {otherFailures.slice(0, 11).map((failure, index) => <li key={index}>{plainFailure(failure)}</li>)}
              {rowArityCount > 0 && (
                <li>{rowArityCount} row{rowArityCount === 1 ? " has" : "s have"} a different number of columns than the recorded schema.</li>
              )}
              {otherFailures.length > 11 && <li>…and {otherFailures.length - 11} more non-structural findings.</li>}
            </ul>
          )}

          <div className="gen-actions">
            <button type="button" className="btn btn-primary" onClick={reset}>Verify another</button>
          </div>
        </div>
      )}
    </section>
  );
}
