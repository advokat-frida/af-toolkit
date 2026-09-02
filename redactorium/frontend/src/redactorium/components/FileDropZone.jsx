import { useCallback, useRef, useState } from "react";
import { TID } from "@/redactorium/constants/testIds";

const ACCEPT = ".csv,.xlsx,.xls,.pdf,.docx,.txt,.md,.log";

export default function FileDropZone({ onFile, onSample, customRulesPanel = null }) {
  const [drag, setDrag] = useState(false);
  const [panel, setPanel] = useState(null);
  const inputRef = useRef(null);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer?.files?.[0];
    if (f) onFile(f);
  }, [onFile]);

  const toggle = (name) => setPanel((current) => (current === name ? null : name));

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
        {customRulesPanel && (
          <button type="button" className="text-action" aria-expanded={panel === "rules"} aria-controls="red-custom-rules" onClick={() => toggle("rules")}>
            Custom rules
          </button>
        )}
        <button type="button" className="text-action" aria-expanded={panel === "how"} aria-controls="red-how-it-works" onClick={() => toggle("how")}>
          How it works
        </button>
      </div>
      {customRulesPanel && (
        <div id="red-custom-rules" className="red-under-panel" hidden={panel !== "rules"}>{customRulesPanel}</div>
      )}
      <div id="red-how-it-works" className="red-under-panel" hidden={panel !== "how"}>
        <ol className="red-steps">
          <li><span className="red-step-num">01</span><strong>Detect</strong><span>Twenty-plus detectors scan every column; each finding carries a citation and a confidence score.</span></li>
          <li><span className="red-step-num">02</span><strong>Treat</strong><span>Pick a treatment per column: hash, redact, generalize, synthetic-swap, or keep.</span></li>
          <li><span className="red-step-num">03</span><strong>Download</strong><span>Take the clean file and its record.</span></li>
        </ol>
        <p className="red-field-sources">
          Detector citations: RFC 5322, RFC 5737, RFC 3849, ISO/IEC 7812 (Luhn),
          ISO 13616 (IBAN mod-97), SSA randomization rules, NANPA fictitious range, ICAO Doc 9303.
        </p>
      </div>
    </section>
  );
}
