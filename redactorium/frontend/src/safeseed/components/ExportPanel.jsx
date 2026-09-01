import { Download, FileJson, FileText, Package } from "lucide-react";
import { FORMATS } from "@/safeseed/lib/safeExporters";

export default function ExportPanel({ format, onDownloadOutput, onDownloadRecordJson, onDownloadRecordPdf, onDownloadBundle, outputFilename, sha256 }) {
  const fmt = FORMATS[format];
  return (
    <section className="max-w-6xl mx-auto px-4 md:px-6 mt-8">
      <div className="paper-card p-5 md:p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="eyebrow tag-toolkit">Step three · commit as a fixture</p>
            <h3 className="text-2xl md:text-3xl mt-1">Ship the bundle</h3>
            <p className="mt-1 text-sm text-[hsl(var(--ink-muted))]">
              Every download binds to an unsigned run-record that lists each field's tier and citation.
              Store the record independently from the fixture to give the drift check any teeth.
            </p>
          </div>
          <button
            data-testid="download-bundle-btn"
            onClick={onDownloadBundle}
            className="btn-forest flex items-center gap-2"
          >
            <Package className="w-4 h-4" /> Download bundle (.zip)
          </button>
        </div>

        {sha256 && (
          <div className="mt-4 paper-card--soft p-3 text-xs mono break-all">
            <div className="eyebrow tag-desk mb-1">Output SHA-256</div>
            {sha256}
          </div>
        )}

        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            data-testid="download-output-btn"
            onClick={onDownloadOutput}
            className="paper-card--soft text-left p-4 hover:bg-[hsl(var(--paper-2))] transition"
          >
            <div className="flex items-center gap-3">
              <Download className="w-5 h-5" />
              <span className="eyebrow">Fixture · {fmt.label}</span>
            </div>
            <div className="mt-3 font-semibold break-all">{outputFilename}</div>
          </button>
          <button
            data-testid="download-record-json-btn"
            onClick={onDownloadRecordJson}
            className="paper-card--soft text-left p-4 hover:bg-[hsl(var(--paper-2))] transition"
          >
            <div className="flex items-center gap-3">
              <FileJson className="w-5 h-5" />
              <span className="eyebrow">Run record</span>
            </div>
            <div className="mt-3 font-semibold">safeseed.record.json</div>
            <div className="text-xs text-[hsl(var(--ink-muted))] mt-1">Machine-readable, per-column tier + citation + SHA-256.</div>
          </button>
          <button
            data-testid="download-record-pdf-btn"
            onClick={onDownloadRecordPdf}
            className="paper-card--soft text-left p-4 hover:bg-[hsl(var(--paper-2))] transition"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5" />
              <span className="eyebrow">Provenance sheet</span>
            </div>
            <div className="mt-3 font-semibold">safeseed.record.pdf</div>
            <div className="text-xs text-[hsl(var(--ink-muted))] mt-1">Human-readable evidence with tier claims + disclaimers.</div>
          </button>
        </div>
      </div>
    </section>
  );
}
