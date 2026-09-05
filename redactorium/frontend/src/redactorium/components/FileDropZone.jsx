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

      {customRulesPanel && (
        <div className="red-under-zone">
          <button type="button" className="text-action" aria-expanded={panel === "rules"} aria-controls="red-custom-rules" onClick={() => toggle("rules")}>
            Custom rules
          </button>
        </div>
      )}
      {customRulesPanel && (
        <div id="red-custom-rules" className="red-under-panel" hidden={panel !== "rules"}>{customRulesPanel}</div>
      )}
    </section>
  );
}
