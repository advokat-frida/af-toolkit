import { useEffect, useState } from "react";
import { toast } from "sonner";
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
    toast.success(matches > 0 ? `Applied "${p.name}" · ${matches} column${matches === 1 ? "" : "s"} updated` : `Applied "${p.name}" · nothing to update on this file`);
  };

  const deletePreset = (id) => persist(presets.filter((p) => p.id !== id));

  return (
    <div className="red-presets">
      <label className="field-label" htmlFor="red-preset-name">Save this plan as a preset</label>
      <div className="red-presets-row">
        <input
          id="red-preset-name"
          data-testid="preset-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. HR-export-EU"
          className="red-adv-input"
        />
        <button data-testid="save-preset-btn" onClick={savePreset} className="btn-ghost-ink">
          Save current plan
        </button>
      </div>

      {presets.length > 0 && (
        <div className="red-preset-list" data-testid="preset-list">
          {presets.map((p) => (
            <span key={p.id} data-testid={`preset-${p.id}`} className="red-preset-chip">
              <button
                data-testid={`apply-preset-${p.id}`}
                onClick={() => applyPreset(p)}
                className="text-action"
                title={`Header rules: ${Object.keys(p.byHeader).length} · detector rules: ${Object.keys(p.byDetector).length}`}
              >
                {p.name}
              </button>
              <button
                data-testid={`delete-preset-${p.id}`}
                onClick={() => deletePreset(p.id)}
                className="red-preset-delete"
                aria-label={`Delete preset ${p.name}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
