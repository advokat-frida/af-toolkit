import { useRef, useState } from "react";
import {
  verify,
  validateRunRecord,
  type RunRecord,
  type VerifyResult,
  type VerifyFailure,
} from "safeseed";

function FileDrop({
  label,
  hint,
  accept,
  fileName,
  error,
  onFile,
}: {
  label: string;
  hint: string;
  accept: string;
  fileName: string;
  error?: string;
  onFile: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const take = (files: FileList | null) => {
    if (files?.[0]) onFile(files[0]);
  };

  return (
    <div
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

async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function VerifyPanel() {
  const csvReadRef = useRef(0);
  const recordReadRef = useRef(0);
  const pairRevisionRef = useRef(0);
  const verdictRef = useRef<HTMLDivElement>(null);
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
    if (csvText === null || !record) return;
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
            <FileDrop label="SafeSeed CSV" hint="Click or drop the data file." accept=".csv,text/csv" fileName={csvName} error={csvError} onFile={onCsv} />
            <FileDrop label="Receipt" hint="Click or drop the .json downloaded with it." accept=".json,application/json" fileName={recordName} error={pairError} onFile={onRecord} />
          </div>
          <p className="gen-hint">The check is strict: an added, removed, reordered, or edited column fails.</p>
          <div className="gen-actions">
            <button type="button" className="btn btn-primary verify-go" disabled={csvText === null || !record || busy} onClick={run}>
              {busy ? "Checking…" : "Verify the pair"}
            </button>
          </div>
        </>
      )}

      {result && (
        <div className="verify-result" role="status" aria-live="polite">
          <div className={`verdict-block ${result.ok ? "is-pass" : "is-fail"}`} ref={verdictRef} tabIndex={-1}>
            <strong className="verdict-title">{result.ok ? "Receipt matches" : "Receipt does not match"}</strong>
            <span className="verdict-sub">{csvName} · checked against {recordName}</span>
          </div>

          <div className="verify-rows">
            <span className="verify-key">File hash</span><span className="verify-value">{csvHash || "—"}</span>
            <span className="verify-key">Receipt hash</span><span className="verify-value">{record?.contentSha256 ?? "—"}</span>
            <span className="verify-key">Seed</span><span className="verify-value">{record?.seed ?? "—"}</span>
            <span className="verify-key">Rows checked</span><span className="verify-value">{result.checked.rows.toLocaleString()} rows · {result.checked.fields} columns</span>
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
