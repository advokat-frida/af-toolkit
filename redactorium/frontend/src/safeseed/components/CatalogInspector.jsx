import { useState } from "react";
import { CATALOG, GROUPS, TIERS } from "@/safeseed/lib/safeCatalog";
import { ChevronDown } from "lucide-react";

export default function CatalogInspector() {
  const [open, setOpen] = useState(false);
  return (
    <section className="max-w-6xl mx-auto px-4 md:px-6 mt-8">
      <div className="paper-card--soft">
        <button
          data-testid="toggle-catalog"
          onClick={() => setOpen(o => !o)}
          className="w-full flex items-center justify-between p-4 hover:bg-[hsl(var(--paper-2))] transition text-left"
        >
          <div>
            <p className="eyebrow tag-guides">Catalog inspector · {CATALOG.length} field types across {GROUPS.length} groups</p>
            <p className="text-sm text-[hsl(var(--ink-muted))] mt-1">
              Every citation, every tier, every claim. Cite this before you release.
            </p>
          </div>
          <ChevronDown className={`w-5 h-5 transition ${open ? "rotate-180" : ""}`} />
        </button>
        {open && (
          <div className="border-t border-[hsl(var(--rule))] p-4 md:p-5 space-y-6" data-testid="catalog-panel">
            {GROUPS.map(g => {
              const fields = CATALOG.filter(f => f.group === g.id);
              if (fields.length === 0) return null;
              return (
                <div key={g.id}>
                  <p className="eyebrow tag-desk mb-2">{g.label} · {fields.length}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {fields.map(f => (
                      <div key={f.id} className="p-3 border border-[hsl(var(--rule))] bg-[hsl(var(--paper))]">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="font-semibold text-sm">{f.label}</span>
                          <span
                            className="pill text-[10px] whitespace-nowrap"
                            style={{ background: TIERS[f.tier].color, color: "#F5EFE1", borderColor: TIERS[f.tier].color }}
                          >
                            {f.tier}
                          </span>
                        </div>
                        <div className="text-[11px] mono text-[hsl(var(--ink-muted))] mt-1">{f.id}</div>
                        <div className="text-[11px] italic text-[hsl(var(--ink-muted))] mt-1">{f.citation}</div>
                        <div className="text-[11px] text-[hsl(var(--ink))] mt-1">Claim: {TIERS[f.tier].claim}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
