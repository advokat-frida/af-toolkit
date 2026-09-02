import { TID } from "@/redactorium/constants/testIds";
import { ChevronDown } from "lucide-react";

const TRANSFORM_OPTIONS = [
  { v: "keep",       label: "Keep" },
  { v: "hash",       label: "Hash" },
  { v: "redact",     label: "Redact" },
  { v: "generalize", label: "Generalize" },
  { v: "synthetic",  label: "Synthetic-swap" },
];

function TransformSelect({ i, plan, hasTop, onChange }) {
  return (
    <div className="red-treatment">
      <select
        data-testid={TID.transformSelect(i)}
        value={plan.transform}
        aria-label="Treatment"
        onChange={(e) => onChange({ ...plan, transform: e.target.value })}
      >
        {TRANSFORM_OPTIONS.filter((o) => o.v !== "synthetic" || hasTop).map((o) => (
          <option key={o.v} value={o.v}>{o.label}</option>
        ))}
      </select>
      <ChevronDown className="red-treatment-chevron" aria-hidden="true" />
    </div>
  );
}

export default function DetectionView({ detection, columnPlan, onPlanChange, fileMeta, onChangeFile }) {
  return (
    <section className="max-w-6xl mx-auto px-4 md:px-6 mt-8 md:mt-12">
      <div className="red-findings-head">
        <h2 className="red-task-heading">{fileMeta.name}</h2>
        <button type="button" className="text-action" onClick={onChangeFile}>Change file</button>
      </div>

      {/* MOBILE / TABLET cards */}
      <div className="md:hidden mt-6">
        {detection.map((col, i) => {
          const t = col.top;
          const plan = columnPlan[i];
          return (
            <div key={col.index} data-testid={TID.detectionRow(i)} className="red-finding-card">
              <div className="red-finding-card-head">
                <span className="mono text-sm">{col.header || <em className="red-muted">(unnamed)</em>}</span>
                {t && <span data-testid={TID.confidencePill(i)} className="mono text-sm">{t.confidence.toFixed(2)}</span>}
              </div>
              <p className="red-finding-card-line">
                {t ? (
                  <>
                    <span data-testid={TID.detectorBadge(i)}>{t.name}{t.isCustom ? " (custom rule)" : ""}</span> · <span>{t.citation}</span>
                  </>
                ) : "—"}
              </p>
              <TransformSelect i={i} plan={plan} hasTop={!!t} onChange={(np) => onPlanChange(i, np)} />
            </div>
          );
        })}
      </div>

      {/* DESKTOP table */}
      <div className="mt-4 hidden md:block">
        <div className="overflow-x-auto">
          <table data-testid={TID.detectionTable} className="editorial-table" style={{ minWidth: 780 }}>
            <thead>
              <tr>
                <th style={{ width: 180 }}>Column</th>
                <th style={{ width: 190 }}>Detected</th>
                <th style={{ width: 110 }}>Confidence</th>
                <th>Citation</th>
                <th style={{ width: 220 }}>Treatment</th>
              </tr>
            </thead>
            <tbody>
              {detection.map((col, i) => {
                const t = col.top;
                const plan = columnPlan[i];
                return (
                  <tr key={col.index} data-testid={TID.detectionRow(i)}>
                    <td className="mono">{col.header || <em className="red-muted">(unnamed)</em>}</td>
                    <td>
                      {t ? (
                        <span data-testid={TID.detectorBadge(i)}>{t.name}{t.isCustom ? " (custom rule)" : ""}</span>
                      ) : <span className="red-muted">—</span>}
                    </td>
                    <td>
                      {t ? (
                        <span data-testid={TID.confidencePill(i)} className="mono">{t.confidence.toFixed(2)}</span>
                      ) : <span className="red-muted">—</span>}
                    </td>
                    <td className="red-muted">{t ? t.citation : "—"}</td>
                    <td>
                      <TransformSelect i={i} plan={plan} hasTop={!!t} onChange={(np) => onPlanChange(i, np)} />
                      {plan.transform === "synthetic" && !col.top && (
                        <p className="red-treatment-note">Requires a detected type</p>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
