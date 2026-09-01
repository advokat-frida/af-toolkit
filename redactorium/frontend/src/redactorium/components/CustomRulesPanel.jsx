import { useEffect, useState } from "react";
import { Plus, Trash2, Save, TestTube2 } from "lucide-react";
import { toast } from "sonner";
import { loadCustomRules, saveCustomRules } from "@/redactorium/lib/customRules";

const uid = () => Math.random().toString(36).slice(2, 10);

export default function CustomRulesPanel({ onRulesChange }) {
  const [rules, setRules] = useState([]);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ id: uid(), name: "", pattern: "", flags: "", columnHint: "", category: "custom", base: 0.85 });
  const [testValue, setTestValue] = useState("");
  const [testResult, setTestResult] = useState(null);

  useEffect(() => { setRules(loadCustomRules()); }, []);
  useEffect(() => { onRulesChange && onRulesChange(rules); }, [rules, onRulesChange]);

  const persist = (next) => { setRules(next); saveCustomRules(next); };

  const addRule = () => {
    if (!draft.name || !draft.pattern) { toast.error("Name and pattern are required"); return; }
    try { new RegExp(draft.pattern, draft.flags || ""); }
    catch (e) { toast.error("Invalid regex: " + e.message); return; }
    const next = [...rules, { ...draft }];
    persist(next);
    setDraft({ id: uid(), name: "", pattern: "", flags: "", columnHint: "", category: "custom", base: 0.85 });
    setTestResult(null); setTestValue("");
    toast.success(`Added "${next[next.length - 1].name}"`);
  };

  const deleteRule = (id) => { persist(rules.filter(r => r.id !== id)); };

  const runTest = () => {
    try {
      const re = new RegExp(draft.pattern, draft.flags || "");
      setTestResult(re.test(testValue));
    } catch (e) {
      setTestResult(null); toast.error(e.message);
    }
  };

  return (
    <section className="max-w-6xl mx-auto px-4 md:px-6 mt-4">
      <div className="paper-card--soft">
        <button
          data-testid="toggle-custom-rules"
          onClick={() => setOpen(o => !o)}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-[hsl(var(--paper-2))] transition"
        >
          <div>
            <p className="eyebrow tag-guides">Custom rules · jurisdiction IDs, internal formats</p>
            <p className="text-sm text-[hsl(var(--ink-muted))] mt-1">
              {rules.length === 0
                ? "No custom rules yet. Add one to detect patterns the built-in set doesn't cover."
                : `${rules.length} custom rule${rules.length === 1 ? "" : "s"} active · saved in this browser.`}
            </p>
          </div>
          <span className="pill">{open ? "close" : "open"}</span>
        </button>

        {open && (
          <div className="border-t border-[hsl(var(--rule))] p-5 space-y-6">
            {rules.length > 0 && (
              <div>
                <p className="eyebrow tag-desk mb-2">Saved rules</p>
                <ul className="space-y-2">
                  {rules.map(r => (
                    <li key={r.id} data-testid={`custom-rule-${r.id}`} className="flex items-center gap-3 p-3 border border-[hsl(var(--rule))] bg-[hsl(var(--paper))]">
                      <div className="flex-1">
                        <div className="font-semibold text-sm">{r.name} <span className="pill pill-plum ml-2">{r.category}</span></div>
                        <div className="text-xs mono text-[hsl(var(--ink-muted))]">/{r.pattern}/{r.flags || ""} {r.columnHint && `· hint: /${r.columnHint}/`}</div>
                      </div>
                      <button
                        data-testid={`delete-rule-${r.id}`}
                        className="p-2 hover:bg-[hsl(var(--paper-2))]"
                        onClick={() => deleteRule(r.id)}
                        aria-label="Delete rule"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <p className="eyebrow tag-toolkit mb-2">Add a rule</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold">Name</label>
                  <input
                    data-testid="rule-name"
                    className="w-full px-3 py-2 border border-[hsl(var(--ink))] bg-[hsl(var(--paper))] text-sm mt-1"
                    placeholder="Norwegian fødselsnummer"
                    value={draft.name}
                    onChange={(e) => setDraft(d => ({ ...d, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold">Category</label>
                  <input
                    data-testid="rule-category"
                    className="w-full px-3 py-2 border border-[hsl(var(--ink))] bg-[hsl(var(--paper))] text-sm mt-1"
                    placeholder="government-id"
                    value={draft.category}
                    onChange={(e) => setDraft(d => ({ ...d, category: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold">Pattern (regex source)</label>
                  <input
                    data-testid="rule-pattern"
                    className="w-full px-3 py-2 border border-[hsl(var(--ink))] bg-[hsl(var(--paper))] text-sm mono mt-1"
                    placeholder="^\\d{6}\\s?\\d{5}$"
                    value={draft.pattern}
                    onChange={(e) => setDraft(d => ({ ...d, pattern: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold">Flags</label>
                  <input
                    data-testid="rule-flags"
                    className="w-full px-3 py-2 border border-[hsl(var(--ink))] bg-[hsl(var(--paper))] text-sm mono mt-1"
                    placeholder="i"
                    value={draft.flags}
                    onChange={(e) => setDraft(d => ({ ...d, flags: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold">Column-name hint (regex, optional)</label>
                  <input
                    data-testid="rule-hint"
                    className="w-full px-3 py-2 border border-[hsl(var(--ink))] bg-[hsl(var(--paper))] text-sm mono mt-1"
                    placeholder="(fnr|personnummer)"
                    value={draft.columnHint}
                    onChange={(e) => setDraft(d => ({ ...d, columnHint: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold">Base confidence (0–1)</label>
                  <input
                    data-testid="rule-base"
                    type="number" step="0.05" min="0" max="1"
                    className="w-full px-3 py-2 border border-[hsl(var(--ink))] bg-[hsl(var(--paper))] text-sm mt-1"
                    value={draft.base}
                    onChange={(e) => setDraft(d => ({ ...d, base: parseFloat(e.target.value) || 0.85 }))}
                  />
                </div>
              </div>

              <div className="mt-4 p-3 border border-dashed border-[hsl(var(--ink))] bg-[hsl(var(--paper-2))] flex items-center gap-3">
                <TestTube2 className="w-4 h-4" />
                <input
                  data-testid="rule-test-value"
                  className="flex-1 px-2 py-1 bg-[hsl(var(--paper))] border border-[hsl(var(--rule))] text-sm mono"
                  placeholder="test a sample value against the pattern…"
                  value={testValue}
                  onChange={(e) => setTestValue(e.target.value)}
                />
                <button
                  data-testid="rule-run-test"
                  onClick={runTest}
                  className="btn-ghost-ink text-xs px-3 py-1"
                >Test</button>
                {testResult !== null && (
                  <span className={`pill ${testResult ? "pill-forest" : "pill-brick"}`}>
                    {testResult ? "match" : "no match"}
                  </span>
                )}
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button
                  data-testid="add-custom-rule-btn"
                  onClick={addRule}
                  className="btn-forest flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Save rule
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
