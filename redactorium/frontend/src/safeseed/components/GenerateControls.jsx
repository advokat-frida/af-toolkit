import { Play, RotateCcw, Dice5 } from "lucide-react";
import { MAX_ROWS } from "@/safeseed/lib/safeGenerate";

export default function GenerateControls({ rows, setRows, seed, setSeed, table, setTable, format, setFormat, onGenerate, onReset, busy, canGenerate }) {
  return (
    <section className="max-w-6xl mx-auto px-4 md:px-6 mt-6">
      <div className="paper-card p-5 md:p-6 flex flex-col md:flex-row md:items-end gap-4 justify-between">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-1">
          <div className="flex flex-col">
            <label className="eyebrow tag-desk mb-1">Rows</label>
            <input
              data-testid="rows-input"
              type="number"
              min={1}
              max={MAX_ROWS}
              value={rows}
              onChange={(e) => setRows(Math.max(1, Math.min(MAX_ROWS, +e.target.value || 1)))}
              className="px-3 py-2 border border-[hsl(var(--ink))] bg-[hsl(var(--paper))] font-mono text-sm"
            />
            <span className="text-[10px] text-[hsl(var(--ink-muted))] mt-1">1..{MAX_ROWS.toLocaleString()}</span>
          </div>
          <div className="flex flex-col">
            <label className="eyebrow tag-desk mb-1">Seed (uint32)</label>
            <div className="flex gap-1">
              <input
                data-testid="seed-input"
                type="number"
                min={0}
                max={4294967295}
                value={seed}
                onChange={(e) => setSeed(Math.max(0, Math.min(4294967295, +e.target.value || 0)))}
                className="flex-1 px-3 py-2 border border-[hsl(var(--ink))] bg-[hsl(var(--paper))] font-mono text-sm"
              />
              <button
                data-testid="randomize-seed"
                onClick={() => setSeed(Math.floor(Math.random() * 4294967295))}
                className="btn-ghost-ink text-xs px-2"
                title="randomize"
              >
                <Dice5 className="w-4 h-4" />
              </button>
            </div>
            <span className="text-[10px] text-[hsl(var(--ink-muted))] mt-1">Deterministic across runs</span>
          </div>
          <div className="flex flex-col">
            <label className="eyebrow tag-desk mb-1">Format</label>
            <select
              data-testid="format-select"
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="px-3 py-2 border border-[hsl(var(--ink))] bg-[hsl(var(--paper))] font-mono text-sm"
            >
              <option value="csv">CSV</option>
              <option value="json">JSON (array)</option>
              <option value="jsonl">JSON Lines</option>
              <option value="sql">SQL INSERT</option>
              <option value="xlsx">Excel (XLSX)</option>
            </select>
          </div>
          {format === "sql" && (
            <div className="flex flex-col">
              <label className="eyebrow tag-desk mb-1">SQL table name</label>
              <input
                data-testid="sql-table-input"
                value={table}
                onChange={(e) => setTable(e.target.value)}
                placeholder="fixture"
                className="px-3 py-2 border border-[hsl(var(--ink))] bg-[hsl(var(--paper))] font-mono text-sm"
              />
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            data-testid="reset-btn"
            onClick={onReset}
            disabled={busy}
            className="btn-ghost-ink flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
          <button
            data-testid="generate-btn"
            onClick={onGenerate}
            disabled={!canGenerate || busy}
            className="btn-forest flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Play className="w-4 h-4" /> {busy ? "Generating…" : "Generate dataset →"}
          </button>
        </div>
      </div>
    </section>
  );
}
