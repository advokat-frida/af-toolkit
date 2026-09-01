import { useCallback, useRef, useState } from "react";
import { TID } from "@/redactorium/constants/testIds";

const ACCEPT = ".csv,.xlsx,.xls,.pdf,.docx,.txt,.md,.log";

export default function FileDropZone({ onFile, onSample }) {
  const [drag, setDrag] = useState(false);
  const inputRef = useRef(null);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer?.files?.[0];
    if (f) onFile(f);
  }, [onFile]);

  return (
    <section className="red-upload-stage max-w-6xl mx-auto px-4 md:px-6 mt-4">
      <div
        data-testid={TID.dropzone}
        onDragEnter={(e) => { e.preventDefault(); setDrag(true); }}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`red-drop-card dropzone cursor-pointer ${drag ? "is-drag" : ""}`}
      >
        <h2 className="red-drop-title">Drop a file here</h2>
        <p className="red-drop-formats">CSV · XLSX · PDF · DOCX · TXT · Markdown · log files.</p>
        <div className="red-upload-actions">
          <button className="btn-forest" onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}>
            Choose a file
          </button>
          <button
            data-testid={TID.useSampleBtn}
            className="btn-ghost-ink"
            onClick={(e) => { e.stopPropagation(); onSample(); }}
          >
            Try with sample data
          </button>
        </div>
        <input
          data-testid={TID.fileInput}
          ref={inputRef}
          type="file"
          className="hidden"
          accept={ACCEPT}
          onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
        />
      </div>

      <div className="red-under-zone">
        <details className="red-howitworks">
          <summary>How it works</summary>
          <ol className="red-field-guide-list">
            <li>Your file is parsed in this browser tab. No network request is made.</li>
            <li>Twenty-plus regex detectors scan every column. Each finding gets a citation and a confidence score.</li>
            <li>Pick a treatment per column: hash, redact, generalize, synthetic-swap, or keep.</li>
            <li>Download the clean file plus a JSON and PDF record you can hand to legal.</li>
          </ol>
          <p className="red-field-sources">
            Detector citations: RFC 5322, RFC 5737, RFC 3849, ISO/IEC 7812 (Luhn),
            ISO 13616 (IBAN mod-97), SSA randomization rules, NANPA fictitious range, ICAO Doc 9303.
          </p>
        </details>
      </div>
    </section>
  );
}
