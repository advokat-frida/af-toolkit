import { CATALOG, GROUPS, BY_ID, TIERS } from "@/safeseed/lib/safeCatalog";
import { Plus, Trash2, ChevronDown, GripVertical } from "lucide-react";

const uid = () => Math.random().toString(36).slice(2, 8);

function TierPill({ tier }) {
  const t = TIERS[tier];
  return (
    <span
      className="pill text-[10px] whitespace-nowrap"
      style={{ background: t.color, color: "#F5EFE1", borderColor: t.color }}
    >
      {t.label}
    </span>
  );
}

function FieldRow({ field, index, onChange, onRemove, onMove, dragProps }) {
  const spec = BY_ID[field.type];
  const opts = field.options || {};
  return (
    <div
      data-testid={`schema-row-${index}`}
      className="p-2 border border-[hsl(var(--rule))] bg-[hsl(var(--paper))]"
      {...dragProps}
    >
      {/* Row 1: drag handle + column name + remove */}
      <div className="flex items-center gap-2">
        <div className="text-[hsl(var(--ink-muted))] cursor-grab select-none shrink-0" title="drag to reorder">
          <GripVertical className="w-4 h-4" />
        </div>
        <input
          data-testid={`field-name-${index}`}
          value={field.name}
          onChange={(e) => onChange({ ...field, name: e.target.value })}
          placeholder="column name"
          className="flex-1 min-w-0 px-2 py-1.5 border border-[hsl(var(--ink))] bg-[hsl(var(--paper))] text-sm font-semibold mono focus:outline-none focus:ring-2 focus:ring-[hsl(var(--forest))]"
        />
        <button
          data-testid={`remove-field-${index}`}
          onClick={onRemove}
          className="p-2 hover:bg-[hsl(var(--paper-2))] shrink-0"
          aria-label="remove"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Row 2: type + tier + citation + options */}
      <div className="mt-2 ml-6 flex flex-col gap-1 min-w-0">
        <div className="relative">
          <select
            data-testid={`field-type-${index}`}
            value={field.type}
            onChange={(e) => onChange({ ...field, type: e.target.value, options: undefined })}
            className="appearance-none w-full pl-2 pr-8 py-1.5 border border-[hsl(var(--ink))] bg-[hsl(var(--paper))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--forest))]"
          >
            {GROUPS.map(g => (
              <optgroup key={g.id} label={g.label}>
                {CATALOG.filter(f => f.group === g.id).map(f => (
                  <option key={f.id} value={f.id}>{f.label}</option>
                ))}
              </optgroup>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
        <div className="flex flex-wrap items-center gap-1 text-[10px]">
          <TierPill tier={spec.tier} />
          <span className="text-[hsl(var(--ink-muted))] italic break-words min-w-0">{spec.citation}</span>
        </div>
        {spec.hasOptions && (
          <div className="flex flex-wrap gap-1 mt-1">
            {spec.id === "enum" && (
              <input
                data-testid={`field-values-${index}`}
                value={opts.values || ""}
                onChange={(e) => onChange({ ...field, options: { ...opts, values: e.target.value } })}
                placeholder="value1,value2,value3"
                className="flex-1 min-w-[160px] px-2 py-1 text-xs mono border border-[hsl(var(--rule))] bg-[hsl(var(--paper))]"
              />
            )}
            {(spec.id === "randomInt" || spec.id === "randomFloat") && (
              <>
                <input
                  data-testid={`field-min-${index}`}
                  type="number"
                  value={opts.min ?? ""}
                  onChange={(e) => onChange({ ...field, options: { ...opts, min: e.target.value } })}
                  placeholder="min"
                  className="w-24 px-2 py-1 text-xs mono border border-[hsl(var(--rule))] bg-[hsl(var(--paper))]"
                />
                <input
                  data-testid={`field-max-${index}`}
                  type="number"
                  value={opts.max ?? ""}
                  onChange={(e) => onChange({ ...field, options: { ...opts, max: e.target.value } })}
                  placeholder="max"
                  className="w-24 px-2 py-1 text-xs mono border border-[hsl(var(--rule))] bg-[hsl(var(--paper))]"
                />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SchemaEditor({ schema, onChange }) {
  const setField = (i, next) => {
    const copy = [...schema]; copy[i] = next; onChange(copy);
  };
  const remove = (i) => onChange(schema.filter((_, k) => k !== i));
  const add = () => onChange([...schema, { name: `column_${schema.length + 1}`, type: "opaqueId" }]);

  // Simple drag & drop reorder via HTML5 API
  const onDragStart = (i) => (e) => { e.dataTransfer.setData("text/plain", String(i)); };
  const onDragOver = (e) => { e.preventDefault(); };
  const onDrop = (target) => (e) => {
    const src = parseInt(e.dataTransfer.getData("text/plain"), 10);
    if (Number.isNaN(src) || src === target) return;
    const copy = [...schema];
    const [m] = copy.splice(src, 1);
    copy.splice(target, 0, m);
    onChange(copy);
  };

  return (
    <section className="max-w-6xl mx-auto px-4 md:px-6 mt-8">
      <div className="flex items-baseline justify-between gap-3 flex-wrap mb-3">
        <div>
          <p className="eyebrow tag-desk">Step two · schema</p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl mt-1">Schema editor</h2>
          <p className="text-sm text-[hsl(var(--ink-muted))] mt-1">
            Every column carries a citation and an assurance tier. Add / rename / reorder freely; drag the handle to sort.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="pill">{schema.length} column{schema.length === 1 ? "" : "s"}</span>
          <button
            data-testid="add-field-btn"
            onClick={add}
            className="btn-ghost-ink text-xs flex items-center gap-1 px-3 py-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Add field
          </button>
        </div>
      </div>

      <div className="paper-card p-2 md:p-3 space-y-2" data-testid="schema-editor">
        {schema.map((f, i) => (
          <FieldRow
            key={i + "-" + (f.type || "")}
            field={f}
            index={i}
            onChange={(next) => setField(i, next)}
            onRemove={() => remove(i)}
            dragProps={{
              draggable: true,
              onDragStart: onDragStart(i),
              onDragOver,
              onDrop: onDrop(i),
            }}
          />
        ))}
        {schema.length === 0 && (
          <div className="text-center py-6 text-sm text-[hsl(var(--ink-muted))] italic">
            Empty schema. Pick a preset above or add a field to begin.
          </div>
        )}
      </div>
    </section>
  );
}
