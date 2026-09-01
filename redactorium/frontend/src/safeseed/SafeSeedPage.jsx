import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import BrandedMasthead from "@/safeseed/components/BrandedMasthead";
import Footer from "@/safeseed/components/Footer";
import PresetPicker from "@/safeseed/components/PresetPicker";
import SchemaEditor from "@/safeseed/components/SchemaEditor";
import GenerateControls from "@/safeseed/components/GenerateControls";
import PreviewGrid from "@/safeseed/components/PreviewGrid";
import ExportPanel from "@/safeseed/components/ExportPanel";
import CatalogInspector from "@/safeseed/components/CatalogInspector";
import VerifyPanel from "@/safeseed/components/VerifyPanel";
import ScanPanel from "@/safeseed/components/ScanPanel";
import { PRESETS, PRESET_BY_ID } from "@/safeseed/lib/safePresets";
import { generateDataset } from "@/safeseed/lib/safeGenerate";
import {
  buildOutputBlob,
  buildRunRecord,
  buildProvenancePDF,
  buildBundleZip,
  saveBlob,
  FORMATS,
} from "@/safeseed/lib/safeExporters";
import ImportSchemaModal from "@/safeseed/components/ImportSchemaModal";
import { Sprout, ShieldCheck, Search } from "lucide-react";

const DEFAULT_PRESET = PRESETS[0];

export default function SafeSeed() {
  const [mode, setMode] = useState("generate"); // "generate" | "verify" | "scan"
  const [activePreset, setActivePreset] = useState(DEFAULT_PRESET.id);
  const [schema, setSchema] = useState(DEFAULT_PRESET.schema.map(f => ({ ...f })));
  const [rows, setRows] = useState(100);
  const [seed, setSeed] = useState(42);
  const [table, setTable] = useState("fixture");
  const [format, setFormat] = useState("csv");
  const [dataset, setDataset] = useState(null);
  const [output, setOutput] = useState(null); // {blob, filename, sha256, record}
  const [busy, setBusy] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const canGenerate = schema.length > 0 && schema.every(f => f.name && f.type);

  const pickPreset = useCallback((p) => {
    setActivePreset(p.id);
    setSchema(p.schema.map(f => ({ ...f })));
    setDataset(null); setOutput(null);
    toast.success(`Loaded preset "${p.label}" · ${p.schema.length} columns`);
  }, []);

  const onSchemaChange = useCallback((next) => {
    // Only unset activePreset if the change is STRUCTURAL (length / order / type / options),
    // not just a field rename. Renames preserve the details card.
    setSchema(prev => {
      const structural =
        !prev ||
        prev.length !== next.length ||
        prev.some((p, i) => p.type !== next[i]?.type || JSON.stringify(p.options || null) !== JSON.stringify(next[i]?.options || null));
      if (structural) setActivePreset(null);
      return next;
    });
    setDataset(null); setOutput(null);
  }, []);

  const handleReset = () => {
    setActivePreset(DEFAULT_PRESET.id);
    setSchema(DEFAULT_PRESET.schema.map(f => ({ ...f })));
    setRows(100); setSeed(42); setTable("fixture"); setFormat("csv");
    setDataset(null); setOutput(null);
    toast("Reset to defaults");
  };

  const handleGenerate = async () => {
    setBusy(true);
    try {
      const ds = await generateDataset(schema, { rows, seed });
      const options = format === "sql" ? { table } : {};
      const blob = await buildOutputBlob(ds, format, options);
      const filenameBase = (activePreset && PRESET_BY_ID[activePreset]?.id) || "fixture";
      const filename = `safeseed-${filenameBase}-${ds.meta.rowCount}rows-seed${ds.meta.seed}.${FORMATS[format].ext}`;
      const record = await buildRunRecord(ds, schema, blob, format, { filename });
      setDataset(ds);
      setOutput({ blob, filename, sha256: record.output.sha256, record });
      toast.success(`Generated ${ds.meta.rowCount.toLocaleString()} rows`);
    } catch (e) {
      console.error(e);
      toast.error(e.message || "Generation failed");
    } finally { setBusy(false); }
  };

  const dlOutput = () => saveBlob(output.blob, output.filename);
  const dlRecordJson = () => saveBlob(
    new Blob([JSON.stringify(output.record, null, 2)], { type: "application/json" }),
    "safeseed.record.json"
  );
  const dlRecordPdf = () => saveBlob(buildProvenancePDF(output.record), "safeseed.record.pdf");
  const dlBundle = async () => {
    const pdfBlob = buildProvenancePDF(output.record);
    const zipBlob = await buildBundleZip({
      outputBlob: output.blob,
      filename: output.filename,
      record: output.record,
      pdfBlob,
    });
    saveBlob(zipBlob, `safeseed-bundle-${Date.now()}.zip`);
    toast.success("Bundle assembled");
  };

  const handleExportSchema = () => {
    const clean = schema.map(f => {
      const out = { name: f.name, type: f.type };
      if (f.options && Object.keys(f.options).length) out.options = f.options;
      return out;
    });
    const blob = new Blob([JSON.stringify(clean, null, 2)], { type: "application/json" });
    const base = activePreset && PRESET_BY_ID[activePreset]?.id ? PRESET_BY_ID[activePreset].id : "custom";
    saveBlob(blob, `safeseed-${base}.schema.json`);
    toast.success("Schema exported");
  };

  const tierStatsChips = useMemo(() => dataset?.meta?.tierStats || {}, [dataset]);

  return (
    <div className="min-h-screen">
      <BrandedMasthead
        eyebrow="The Toolkit · Advokat Frida"
        title="SafeSeed"
        tagline={<>Synthetic test data that's <em>fake by design</em>. Every field cited to a source that's reserved, designated, or built to be never-real — so the fixture path never needed a copy of production.</>}
      />

      {/* Mode toggle */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 mt-4">
        <div className="paper-card--soft p-1 inline-flex flex-wrap" role="tablist">
          <ModeTab id="generate" active={mode} setMode={setMode} icon={Sprout}       label="Generate" />
          <ModeTab id="verify"   active={mode} setMode={setMode} icon={ShieldCheck}  label="Verify" />
          <ModeTab id="scan"     active={mode} setMode={setMode} icon={Search}       label="Scan" />
        </div>
      </section>

      {mode === "generate" && <>
      <PresetPicker
        activePreset={activePreset}
        onPick={pickPreset}
        onImportClick={() => setImportOpen(true)}
        onExportClick={handleExportSchema}
      />
      <ImportSchemaModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onApply={(s) => { setSchema(s); setActivePreset(null); setDataset(null); setOutput(null); }}
      />

      <SchemaEditor schema={schema} onChange={onSchemaChange} />

      <GenerateControls
        rows={rows} setRows={setRows}
        seed={seed} setSeed={setSeed}
        table={table} setTable={setTable}
        format={format} setFormat={setFormat}
        onGenerate={handleGenerate}
        onReset={handleReset}
        busy={busy}
        canGenerate={canGenerate}
      />

      {dataset && (
        <PreviewGrid dataset={dataset} schema={schema} limit={12} />
      )}

      {output && (
        <ExportPanel
          format={format}
          outputFilename={output.filename}
          sha256={output.sha256}
          onDownloadOutput={dlOutput}
          onDownloadRecordJson={dlRecordJson}
          onDownloadRecordPdf={dlRecordPdf}
          onDownloadBundle={dlBundle}
        />
      )}
      </>}

      {mode === "verify" && <VerifyPanel />}
      {mode === "scan"   && <ScanPanel />}

      <CatalogInspector />

      <Footer />
    </div>
  );
}

function ModeTab({ id, active, setMode, icon: Icon, label }) {
  const isActive = active === id;
  return (
    <button
      data-testid={`safeseed-mode-${id}`}
      role="tab"
      aria-selected={isActive}
      onClick={() => setMode(id)}
      className={`px-3 md:px-4 py-2 text-xs md:text-sm font-semibold flex items-center gap-2 transition ${
        isActive ? "bg-[hsl(var(--ink))] text-[hsl(var(--paper))]" : "hover:bg-[hsl(var(--paper-2))]"
      }`}
    >
      <Icon className="w-4 h-4" /> {label}
    </button>
  );
}
