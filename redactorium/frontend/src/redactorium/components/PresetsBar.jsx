import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Save, BookMarked, Trash2, Wand2 } from "lucide-react";
import { loadPresets, savePresets, makePresetFromPlan, applyPresetToPlan } from "@/redactorium/lib/presets";

export default function PresetsBar({ columnPlan, detection, onPlanChange }) {
  const [presets, setPresets] = useState([]);
  const [name, setName] = useState("");
  useEffect(() => { setPresets(loadPresets()); }, []);
  const persist = (next) => { setPresets(next); savePresets(next); };

  const savePreset = () => {
    if (!name.trim()) { toast.error("Give the preset a name"); return; }
    const p = makePresetFromPlan(name.trim(), columnPlan, detection);
    const next = [...presets, p];
    persist(next); setName("");
    toast.success(`Saved preset "${p.name}" (${Object.keys(p.byHeader).length} columns)`);
  };

  const applyPreset = (p) => {
    const { plan, matches } = applyPresetToPlan(p, columnPlan, detection);
    onPlanChange(plan);
    toast.success(matches > 0 ? `Applied "${p.name}" · ${matches} column${matches===1?"":"s"} updated` : `Applied "${p.name}" · nothing to update on this file`);
  };

  const deletePreset = (id) => persist(presets.filter(p => p.id !== id));

  return (
    <section className="max-w-6xl mx-auto px-4 md:px-6 mt-4">
      <div className="red-presets">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <BookMarked className="w-4 h-4" />
            <p className="field-label">Presets</p>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <input
              data-testid="preset-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. HR-export-EU"
              className="flex-1 md:w-56 px-3 py-1.5 border border-[hsl(var(--ink))] bg-[hsl(var(--paper))] text-sm"
            />
            <button
              data-testid="save-preset-btn"
              onClick={savePreset}
              className="btn-ghost-ink text-xs flex items-center gap-1 px-3 py-1.5"
            >
              <Save className="w-3.5 h-3.5" /> Save current plan
            </button>
          </div>
        </div>

        {presets.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2" data-testid="preset-list">
            {presets.map(p => (
              <div key={p.id} data-testid={`preset-${p.id}`} className="inline-flex items-center gap-1 border border-[hsl(var(--ink))] bg-[hsl(var(--paper))] pr-1">
                <button
                  data-testid={`apply-preset-${p.id}`}
                  onClick={() => applyPreset(p)}
                  className="pl-3 pr-2 py-1 text-xs font-semibold hover:bg-[hsl(var(--paper-2))] flex items-center gap-1"
                  title={`Header rules: ${Object.keys(p.byHeader).length} · detector rules: ${Object.keys(p.byDetector).length}`}
                >
                  <Wand2 className="w-3 h-3" /> {p.name}
                </button>
                <button
                  data-testid={`delete-preset-${p.id}`}
                  onClick={() => deletePreset(p.id)}
                  className="p-1 hover:bg-[hsl(var(--paper-2))]"
                  aria-label="Delete preset"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
