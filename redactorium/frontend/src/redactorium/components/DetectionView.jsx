import { useState, useEffect, Fragment } from "react";
import { TID } from "@/redactorium/constants/testIds";
import { ChevronDown, PenLine } from "lucide-react";

const TRANSFORM_OPTIONS = [
  { v: "keep",       label: "Keep as-is" },
  { v: "hash",       label: "Hash (SHA-256)" },
  { v: "redact",     label: "Redact" },
  { v: "generalize", label: "Generalize" },
  { v: "synthetic",  label: "Swap synthetic" },
];

function TransformSelect({ i, plan, hasTop, onChange }) {
  return (
    <div className="relative">
      <select
        data-testid={TID.transformSelect(i)}
        value={plan.transform}
        onChange={(e) => onChange({ ...plan, transform: e.target.value })}
        className="appearance-none w-full pl-3 pr-8 py-2 bg-[hsl(var(--paper))] border border-[hsl(var(--ink))] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[hsl(var(--forest))]"
      >
        {TRANSFORM_OPTIONS.filter(o => o.v === "keep" || o.v === "redact" || o.v === "hash" || o.v === "generalize" || (o.v === "synthetic" && hasTop)).map(o => (
          <option key={o.v} value={o.v}>{o.label}</option>
        ))}
      </select>
      <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
    </div>
  );
}

function NoteField({ i, plan, onChange, openInitially }) {
  const [open, setOpen] = useState(openInitially || !!plan.note);
  useEffect(() => { if (plan.note) setOpen(true); }, [plan.note]);
  return (
    <div className="mt-2">
      {!open ? (
        <button
          data-testid={TID.addNoteBtn(i)}
          onClick={() => setOpen(true)}
          className="text-[11px] underline underline-offset-2 text-[hsl(var(--forest))] hover:text-[hsl(var(--forest-2))] flex items-center gap-1"
        >
          <PenLine className="w-3 h-3" /> add reviewer note
        </button>
      ) : (
        <div>
          <label className="text-[10px] mono text-[hsl(var(--ink-muted))] block mb-1">
            reviewer note · flows into JSON log + PDF record
          </label>
          <textarea
            data-testid={TID.noteInput(i)}
            value={plan.note || ""}
            onChange={(e) => onChange({ ...plan, note: e.target.value })}
            rows={2}
            placeholder="e.g. GDPR Art.6(1)(f) legitimate interest — retained for internal accounting."
            className="w-full text-xs px-2 py-1.5 border border-[hsl(var(--ink))] bg-[hsl(var(--paper))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--forest))]"
            maxLength={500}
          />
          <div className="flex items-center justify-between mt-1">
            <span className="text-[10px] mono text-[hsl(var(--ink-muted))]">{(plan.note || "").length}/500</span>
            {(plan.note || "").length === 0 && (
              <button
                onClick={() => setOpen(false)}
                className="text-[10px] text-[hsl(var(--ink-muted))] underline"
              >hide</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DrillPanel({ finding, weaker }) {
  return (
    <div className="text-[11px] eyebrow tag-desk">
      <div className="mb-2">sample matches · eyeball for false positives</div>
      <div className="flex flex-wrap gap-2 normal-case tracking-normal">
        {(finding.examples && finding.examples.length > 0) ? finding.examples.map((ex, k) => (
          <code key={k} className="pill bg-[hsl(var(--paper))] mono text-[11px] px-3 py-1 break-all">
            {String(ex).length > 60 ? String(ex).slice(0, 60) + "…" : String(ex)}
          </code>
        )) : <span className="text-xs text-[hsl(var(--ink-muted))] italic">no per-value hits captured (column-hint match)</span>}
      </div>
      {weaker.length > 0 && (
        <div className="mt-3 text-[11px] normal-case tracking-normal text-[hsl(var(--ink-muted))]">
          <span className="font-semibold">Weaker matches:</span>{" "}
          {weaker.map(f => `${f.name} (${(f.confidence*100).toFixed(0)}%)`).join(" · ")}
        </div>
      )}
    </div>
  );
}

export default function DetectionView({ detection, columnPlan, onPlanChange, fileMeta, onChangeFile }) {
  const piiCount = detection.filter(c => c.containsPII).length;
  const [openDrill, setOpenDrill] = useState({});

  return (
    <section className="max-w-6xl mx-auto px-4 md:px-6 mt-8 md:mt-12">
      <div className="red-findings-head">
        <h2 className="red-task-heading">{fileMeta.name}</h2>
        <button type="button" className="text-action" onClick={onChangeFile}>Change file</button>
      </div>

      {/* MOBILE / TABLET cards */}
      <div className="md:hidden mt-6 space-y-3">
        {detection.map((col, i) => {
          const t = col.top;
          const plan = columnPlan[i];
          const isOpen = !!openDrill[i];
          return (
            <div key={col.index} data-testid={TID.detectionRow(i)} className="paper-card--soft p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="mono text-[10px] text-[hsl(var(--ink-muted))]">{String(col.index + 1).padStart(2, "0")}</span>
                <span className="font-semibold text-sm truncate flex-1">{col.header || <em className="text-[hsl(var(--ink-muted))]">(unnamed)</em>}</span>
                {t && (
                  <span data-testid={TID.confidencePill(i)} className="mono text-xs shrink-0">
                    {t.confidence.toFixed(2)}
                  </span>
                )}
              </div>
              {t ? (
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span data-testid={TID.detectorBadge(i)} className="text-sm">{t.name}{t.isCustom ? " (custom rule)" : ""}</span>
                  <button
                    data-testid={TID.toggleDrill(i)}
                    onClick={() => setOpenDrill(o => ({ ...o, [i]: !o[i] }))}
                    className="ml-auto text-action text-[12px]"
                  >
                    {isOpen ? "hide examples" : "examples"}
                  </button>
                </div>
              ) : (
                <div className="text-xs italic text-[hsl(var(--ink-muted))] mb-2">no pattern matched · sampled {col.sampled}</div>
              )}
              {isOpen && t && (
                <div data-testid={TID.drillPanel(i)} className="p-2 mb-2 border border-dashed border-[hsl(var(--ink)/0.35)]">
                  <DrillPanel finding={t} weaker={col.findings.slice(1)} />
                </div>
              )}
              <TransformSelect i={i} plan={plan} hasTop={!!t} onChange={(np) => onPlanChange(i, np)} />
              {plan.transform !== "keep" && (
                <NoteField i={i} plan={plan} onChange={(np) => onPlanChange(i, np)} />
              )}
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
                const isOpen = !!openDrill[i];
                return (
                  <Fragment key={col.index}>
                  <tr data-testid={TID.detectionRow(i)}>
                    <td className="mono text-sm align-top">{col.header || <em className="text-[hsl(var(--ink-muted))]">(unnamed)</em>}</td>
                    <td className="align-top">
                      {t ? (
                        <div>
                          <span data-testid={TID.detectorBadge(i)} className="text-sm">{t.name}{t.isCustom ? " (custom rule)" : ""}</span>
                          <div>
                            <button
                              data-testid={TID.toggleDrill(i)}
                              onClick={() => setOpenDrill(o => ({ ...o, [i]: !o[i] }))}
                              className="text-action text-[12px]"
                            >
                              {isOpen ? "hide examples" : `examples (${t.hits}/${t.sampled})`}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <span className="text-[hsl(var(--ink-muted))]">—</span>
                      )}
                    </td>
                    <td className="align-top">
                      {t ? (
                        <span data-testid={TID.confidencePill(i)} className="mono text-sm">{t.confidence.toFixed(2)}</span>
                      ) : <span className="text-[hsl(var(--ink-muted))]">—</span>}
                    </td>
                    <td className="align-top text-sm text-[hsl(var(--ink-muted))]">
                      {t ? (
                        <div>
                          {t.citation}
                          {col.findings.length > 1 && (
                            <div className="text-[12px]">+ {col.findings.length - 1} weaker match{col.findings.length > 2 ? "es" : ""}</div>
                          )}
                        </div>
                      ) : "—"}
                    </td>
                    <td className="align-top">
                      <TransformSelect i={i} plan={plan} hasTop={!!t} onChange={(np) => onPlanChange(i, np)} />
                      {plan.transform === "synthetic" && !col.top && (
                        <p className="mt-1 text-[10px] text-[hsl(var(--brick))]">Requires a detected type</p>
                      )}
                      {plan.transform !== "keep" && (
                        <NoteField i={i} plan={plan} onChange={(np) => onPlanChange(i, np)} />
                      )}
                    </td>
                  </tr>
                  {isOpen && t && (
                    <tr data-testid={TID.drillPanel(i)} className="bg-[hsl(var(--paper-2))]">
                      <td></td>
                      <td colSpan={5} className="py-3">
                        <DrillPanel finding={t} weaker={col.findings.slice(1)} />
                      </td>
                    </tr>
                  )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
