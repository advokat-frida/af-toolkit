import { useMemo } from "react";
import { PRESETS, PRESET_BY_ID } from "@/safeseed/lib/safePresets";
import { BookOpen, Sparkles, Quote, Download } from "lucide-react";
import { BY_ID, TIERS } from "@/safeseed/lib/safeCatalog";
import SearchableCombobox from "@/safeseed/components/SearchableCombobox";

export default function PresetPicker({ activePreset, onPick, onImportClick, onExportClick }) {
  const active = activePreset ? PRESET_BY_ID[activePreset] : null;

  const options = useMemo(() => PRESETS.map(p => ({
    id: p.id,
    label: p.label,
    group: p.origin.startsWith("SafeSeed") ? "SafeSeed native" : "Practical extensions",
    hint: `${p.schema.length} cols`,
    keywords: `${p.tagline} ${p.schema.map(f => f.name).join(" ")}`,
  })), []);

  const tierChips = useMemo(() => {
    if (!active) return [];
    const counts = {};
    for (const f of active.schema) {
      const spec = BY_ID[f.type];
      if (!spec) continue;
      counts[spec.tier] = (counts[spec.tier] || 0) + 1;
    }
    return Object.entries(counts);
  }, [active]);

  // Assurance basis: pick up to 3 most-cited fields (unique specs), showing
  // their citation so the reviewer sees the RFC/authority basis at a glance.
  const citations = useMemo(() => {
    if (!active) return [];
    const seen = new Set();
    const out = [];
    for (const f of active.schema) {
      const spec = BY_ID[f.type];
      if (!spec || seen.has(spec.id)) continue;
      // Prefer higher-assurance tiers first
      out.push({ spec, columns: [f.name] });
      seen.add(spec.id);
    }
    // Merge columns per spec (same spec reused across multiple columns)
    const merged = {};
    for (const f of active.schema) {
      const spec = BY_ID[f.type];
      if (!spec) continue;
      if (!merged[spec.id]) merged[spec.id] = { spec, columns: [] };
      merged[spec.id].columns.push(f.name);
    }
    const tierOrder = { "protocol-reserved": 0, "authority-reserved": 1, "designated-test-only": 2, "structurally-fake": 3 };
    return Object.values(merged)
      .sort((a, b) => tierOrder[a.spec.tier] - tierOrder[b.spec.tier])
      .slice(0, 4);
  }, [active]);

  const columnPreview = active ? active.schema.map(f => f.name).join(", ") : "";

  return (
    <section className="max-w-6xl mx-auto px-4 md:px-6 mt-6">
      <div className="paper-card--soft p-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <p className="eyebrow tag-toolkit">Step one · start from a schema</p>
            <p className="text-xs text-[hsl(var(--ink-muted))] mt-1">
              Pick a starting point, import your own JSON, or build from scratch below.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SearchableCombobox
              value={activePreset || null}
              onChange={(id) => { const p = PRESET_BY_ID[id]; if (p) onPick(p); }}
              options={options}
              placeholder="— choose a preset —"
              testId="preset-select"
            />
            <button
              data-testid="open-import-schema"
              onClick={onImportClick}
              className="btn-ghost-ink text-xs px-3 py-1.5"
            >
              Import JSON…
            </button>
            <button
              data-testid="export-schema-btn"
              onClick={onExportClick}
              className="btn-ghost-ink text-xs px-3 py-1.5 flex items-center gap-1"
              title="Export current schema as JSON"
            >
              <Download className="w-3 h-3" /> Export JSON
            </button>
          </div>
        </div>

        {active && (
          <div data-testid={`preset-details-${active.id}`} className="mt-3 pt-3 border-t border-[hsl(var(--rule))] space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              {active.origin.startsWith("SafeSeed") ? <BookOpen className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
              <span className="font-semibold">{active.label}</span>
              <span className="pill text-[10px]">{active.schema.length} cols</span>
              <span className="mono text-[10px] text-[hsl(var(--ink-muted))]">{active.origin}</span>
            </div>
            <p className="text-sm">{active.tagline}</p>
            <p className="text-[11px] mono text-[hsl(var(--ink-muted))] break-all">{columnPreview}</p>
            {tierChips.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tierChips.map(([tier, count]) => (
                  <span
                    key={tier}
                    className="pill text-[10px]"
                    style={{ background: TIERS[tier].color, color: "#F5EFE1", borderColor: TIERS[tier].color }}
                  >
                    {tier}: {count}
                  </span>
                ))}
              </div>
            )}

            {citations.length > 0 && (
              <div className="mt-1">
                <p className="eyebrow tag-desk mb-2 flex items-center gap-1">
                  <Quote className="w-3 h-3" /> Assurance basis · citations
                </p>
                <ul className="space-y-1.5">
                  {citations.map(c => (
                    <li key={c.spec.id} className="flex items-start gap-2 flex-wrap text-[12px]">
                      <span
                        className="pill text-[10px] shrink-0 mt-0.5"
                        style={{ background: TIERS[c.spec.tier].color, color: "#F5EFE1", borderColor: TIERS[c.spec.tier].color }}
                      >
                        {c.spec.tier}
                      </span>
                      <div className="min-w-0 flex-1">
                        <span className="font-semibold">{c.columns.join(", ")}</span>
                        <span className="text-[hsl(var(--ink-muted))]"> — {c.spec.citation}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
