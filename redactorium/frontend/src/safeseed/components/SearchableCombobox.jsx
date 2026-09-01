import { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, Search, X } from "lucide-react";

/**
 * SearchableCombobox — accessible dropdown with filter input.
 *
 * Props:
 *   value: string | null (option id)
 *   onChange: (id) => void
 *   options: [{ id, label, group?, keywords? }]  (keywords is extra text for filter matching)
 *   placeholder: string
 *   testId: string
 */
export default function SearchableCombobox({ value, onChange, options, placeholder = "Choose…", testId = "combobox" }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const rootRef = useRef(null);
  const inputRef = useRef(null);

  const active_option = options.find(o => o.id === value) || null;

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return options;
    return options.filter(o =>
      (o.label && o.label.toLowerCase().includes(s)) ||
      (o.group && o.group.toLowerCase().includes(s)) ||
      (o.keywords && o.keywords.toLowerCase().includes(s))
    );
  }, [q, options]);

  // Group filtered by group
  const grouped = useMemo(() => {
    const g = new Map();
    for (const o of filtered) {
      const k = o.group || "";
      if (!g.has(k)) g.set(k, []);
      g.get(k).push(o);
    }
    return Array.from(g.entries());
  }, [filtered]);

  useEffect(() => {
    const onDoc = (e) => { if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false); };
    if (open) {
      document.addEventListener("mousedown", onDoc);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => { setActive(0); }, [q, open]);

  const commit = (opt) => {
    if (!opt) return;
    onChange(opt.id);
    setOpen(false);
    setQ("");
  };

  const onKey = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive(a => Math.min(filtered.length - 1, a + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive(a => Math.max(0, a - 1)); }
    else if (e.key === "Enter") { e.preventDefault(); commit(filtered[active]); }
    else if (e.key === "Escape") { setOpen(false); }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        data-testid={testId}
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="w-full min-w-[240px] flex items-center gap-2 pl-3 pr-2 py-2 border border-[hsl(var(--ink))] bg-[hsl(var(--paper))] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[hsl(var(--forest))]"
      >
        <span className="flex-1 text-left truncate">{active_option ? active_option.label : <span className="text-[hsl(var(--ink-muted))] font-normal">{placeholder}</span>}</span>
        <ChevronDown className={`w-4 h-4 shrink-0 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          data-testid={`${testId}-panel`}
          className="absolute z-40 mt-1 w-[min(400px,90vw)] max-h-[60vh] flex flex-col paper-card bg-[hsl(var(--paper))] overflow-hidden"
          role="listbox"
        >
          <div className="p-2 border-b border-[hsl(var(--rule))] flex items-center gap-2">
            <Search className="w-4 h-4 text-[hsl(var(--ink-muted))]" />
            <input
              ref={inputRef}
              data-testid={`${testId}-search`}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={onKey}
              placeholder="Search presets…"
              className="flex-1 px-2 py-1 text-sm bg-transparent focus:outline-none"
            />
            {q && (
              <button onClick={() => setQ("")} className="p-1 hover:bg-[hsl(var(--paper-2))]" aria-label="clear">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <div className="px-3 py-4 text-xs text-[hsl(var(--ink-muted))] italic">No preset matches &quot;{q}&quot;.</div>
            )}
            {grouped.map(([groupName, opts]) => (
              <div key={groupName}>
                {groupName && (
                  <div className="px-3 pt-2 pb-1 eyebrow text-[10px] text-[hsl(var(--ink-muted))]">{groupName}</div>
                )}
                {opts.map((o) => {
                  const globalIdx = filtered.indexOf(o);
                  const isActive = globalIdx === active;
                  const selected = o.id === value;
                  return (
                    <button
                      key={o.id}
                      ref={isActive ? (el) => el?.scrollIntoView({ block: "nearest" }) : null}
                      type="button"
                      data-testid={`${testId}-option-${o.id}`}
                      onClick={() => commit(o)}
                      onMouseEnter={() => setActive(globalIdx)}
                      className={`w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 ${
                        isActive ? "bg-[hsl(var(--paper-2))]" : ""
                      } ${selected ? "font-semibold" : ""}`}
                    >
                      <span className="flex-1 truncate">{o.label}</span>
                      {o.hint && <span className="text-[10px] mono text-[hsl(var(--ink-muted))]">{o.hint}</span>}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
