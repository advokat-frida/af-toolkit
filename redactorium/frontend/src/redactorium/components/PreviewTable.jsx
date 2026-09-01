import { TID } from "@/redactorium/constants/testIds";

export default function PreviewTable({ headers, rows, changedMap, title = "Before → After preview", limit = 8 }) {
  return (
    <div className="paper-card mt-6">
      <div className="p-4 border-b border-[hsl(var(--ink))] flex items-center justify-between">
        <div>
          <p className="eyebrow tag-desk">{title}</p>
          <p className="text-xs text-[hsl(var(--ink-muted))]">Showing the first {Math.min(limit, rows.length)} rows.</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table data-testid={TID.previewTable} className="editorial-table" style={{ minWidth: Math.max(600, headers.length * 140) }}>
          <thead>
            <tr>
              <th style={{ width: 30 }}>#</th>
              {headers.map((h, i) => <th key={i}>{h || <em className="text-[hsl(var(--ink-muted))]">col {i+1}</em>}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, limit).map((row, ri) => (
              <tr key={ri}>
                <td className="mono text-xs text-[hsl(var(--ink-muted))]">{ri + 1}</td>
                {row.map((cell, ci) => {
                  const changed = changedMap?.[ri]?.[ci];
                  return (
                    <td key={ci} className={changed ? "bg-[hsl(var(--forest)_/_0.12)]" : ""}>
                      <span className={`text-sm ${changed ? "mono" : ""}`}>{String(cell ?? "")}</span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
