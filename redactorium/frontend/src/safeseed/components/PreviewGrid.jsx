import { BY_ID, TIERS } from "@/safeseed/lib/safeCatalog";

export default function PreviewGrid({ dataset, schema, limit = 12 }) {
  if (!dataset) return null;
  const { columns, rows, meta } = dataset;

  return (
    <section className="max-w-6xl mx-auto px-4 md:px-6 mt-6">
      <div className="paper-card mt-2">
        <div className="p-4 border-b border-[hsl(var(--ink))] flex items-baseline justify-between gap-3 flex-wrap">
          <div>
            <p className="eyebrow tag-desk">Preview · first {Math.min(limit, rows.length)} of {rows.length.toLocaleString()} rows</p>
            <p className="text-xs text-[hsl(var(--ink-muted))]">
              Seed {meta.seed} · generated {new Date(meta.generatedAt).toLocaleString()}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(meta.tierStats).map(([tier, count]) => (
              <span
                key={tier}
                className="pill text-[10px] whitespace-nowrap"
                style={{ background: TIERS[tier].color, color: "#F5EFE1", borderColor: TIERS[tier].color }}
                title={TIERS[tier].claim}
              >
                {tier}: {count}
              </span>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table data-testid="preview-grid" className="editorial-table" style={{ minWidth: Math.max(600, columns.length * 160) }}>
            <thead>
              <tr>
                <th style={{ width: 30 }}>#</th>
                {columns.map((c, i) => {
                  const tier = schema[i] ? BY_ID[schema[i].type].tier : null;
                  const color = tier ? TIERS[tier].color : "hsl(var(--ink))";
                  return (
                    <th key={i}>
                      <div className="flex flex-col gap-1">
                        <span>{c}</span>
                        <span
                          className="h-[3px] w-full"
                          style={{ background: color }}
                          title={tier || ""}
                        />
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, limit).map((row, ri) => (
                <tr key={ri}>
                  <td className="mono text-xs text-[hsl(var(--ink-muted))]">{ri + 1}</td>
                  {row.map((cell, ci) => (
                    <td key={ci}>
                      <span className="text-sm mono break-all">{String(cell ?? "")}</span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
