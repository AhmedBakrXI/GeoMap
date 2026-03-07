import { useCallback, useEffect, useState } from 'react';
import type { LegendConfig, LegendEntry, NumericThreshold, StringThreshold } from '../types/legend';
import { FIELD_TYPES, fieldLabel } from '../types/measurement';
import { saveLegendConfig, clearLegendConfig } from '../api/legend';

interface LegendEditorProps {
  open: boolean;
  onClose: () => void;
  onApply: (config: LegendConfig) => void;
  /** Current config to populate the editor */
  currentConfig: LegendConfig | null;
  /** Fields selected in FieldSelector – only these are available for legends */
  selectedFields: string[];
}

function randomHexColor(): string {
  const hue = Math.floor(Math.random() * 360);
  const s = 70 / 100;
  const l = 50 / 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + hue / 30) % 12;
    const c = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * c).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function makeEmptyNumericThreshold(): NumericThreshold {
  return { min: -Infinity, max: Infinity, color: randomHexColor() };
}

function makeEmptyStringThreshold(): StringThreshold {
  return { value: '', color: randomHexColor() };
}

function makeEmptyEntry(field: string): LegendEntry {
  const type = FIELD_TYPES[field] ?? 'string';
  return {
    field: field as keyof import('../types/measurement').MapPoint,
    type,
    thresholds: type === 'numeric'
      ? [makeEmptyNumericThreshold()]
      : [makeEmptyStringThreshold()],
  };
}

function formatBoundInput(n: number): string {
  if (n === -Infinity) return '';
  if (n === Infinity) return '';
  return String(n);
}

function parseBound(value: string, defaultVal: number): number {
  const v = value.trim();
  if (v === '') return defaultVal;
  const n = Number(v);
  return isNaN(n) ? defaultVal : n;
}

export default function LegendEditor({
  open,
  onClose,
  onApply,
  currentConfig,
  selectedFields,
}: LegendEditorProps) {
  const [entries, setEntries] = useState<LegendEntry[]>([]);
  const [status, setStatus] = useState<string | null>(null);

  // Populate from currentConfig when modal opens
  useEffect(() => {
    if (!open) return;
    setEntries(currentConfig ? structuredClone(currentConfig.legends) : []);
    setStatus(null);
  }, [open, currentConfig]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  /* ---- entry-level mutations ---- */

  const addEntry = useCallback(() => {
    const field = selectedFields[0];
    if (!field) return;
    setEntries(prev => [...prev, makeEmptyEntry(field)]);
  }, [selectedFields]);

  const removeEntry = useCallback((idx: number) => {
    setEntries(prev => prev.filter((_, i) => i !== idx));
  }, []);

  const updateEntryField = useCallback((idx: number, field: string) => {
    setEntries(prev => {
      const next = structuredClone(prev);
      const newType = FIELD_TYPES[field] ?? 'string';
      const oldType = next[idx].type;
      next[idx].field = field as keyof import('../types/measurement').MapPoint;
      if (newType !== oldType) {
        next[idx].type = newType;
        next[idx].thresholds = newType === 'numeric'
          ? [makeEmptyNumericThreshold()]
          : [makeEmptyStringThreshold()];
      }
      return next;
    });
  }, []);


  /* ---- threshold-level mutations ---- */

  const addThreshold = useCallback((entryIdx: number) => {
    setEntries(prev => {
      const next = structuredClone(prev);
      const entry = next[entryIdx];
      if (entry.type === 'numeric') {
        (entry.thresholds as NumericThreshold[]).push(makeEmptyNumericThreshold());
      } else {
        (entry.thresholds as StringThreshold[]).push(makeEmptyStringThreshold());
      }
      return next;
    });
  }, []);

  const removeThreshold = useCallback((entryIdx: number, threshIdx: number) => {
    setEntries(prev => {
      const next = structuredClone(prev);
      const entry = next[entryIdx];
      if (entry.type === 'numeric') {
        entry.thresholds = (entry.thresholds as NumericThreshold[]).filter((_, i) => i !== threshIdx);
      } else {
        entry.thresholds = (entry.thresholds as StringThreshold[]).filter((_, i) => i !== threshIdx);
      }
      return next;
    });
  }, []);

  const updateNumericThreshold = useCallback(
    (entryIdx: number, threshIdx: number, key: 'min' | 'max' | 'color', value: string) => {
      setEntries(prev => {
        const next = structuredClone(prev);
        const t = (next[entryIdx].thresholds as NumericThreshold[])[threshIdx];
        if (key === 'color') t.color = value;
        else if (key === 'min') t.min = parseBound(value, -Infinity);
        else t.max = parseBound(value, Infinity);
        return next;
      });
    }, []);

  const updateStringThreshold = useCallback(
    (entryIdx: number, threshIdx: number, key: 'value' | 'color', val: string) => {
      setEntries(prev => {
        const next = structuredClone(prev);
        const t = (next[entryIdx].thresholds as StringThreshold[])[threshIdx];
        if (key === 'color') t.color = val;
        else t.value = val;
        return next;
      });
    }, []);

  /* ---- actions ---- */

  const handleApply = useCallback(() => {
    const config: LegendConfig = { legends: entries };
    saveLegendConfig(config);
    onApply(config);
    setStatus('Applied successfully');
    setTimeout(() => setStatus(null), 2000);
  }, [entries, onApply]);

  const handleClear = useCallback(() => {
    clearLegendConfig();
    const config: LegendConfig = { legends: [] };
    setEntries([]);
    onApply(config);
    setStatus('Cleared all legends');
    setTimeout(() => setStatus(null), 2000);
  }, [onApply]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-2000 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-card border border-border rounded-xl shadow-2xl w-175 max-w-[95vw] max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <h2 className="text-base font-semibold text-text-primary">Legend Configuration</h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary transition-colors text-lg leading-none cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {selectedFields.length === 0 && (
            <p className="text-xs text-text-secondary italic">
              No optional fields selected. Choose fields in the Field Selector first.
            </p>
          )}

          {entries.map((entry, eIdx) => (
            <div key={eIdx} className="border border-border rounded-lg p-3 space-y-3 bg-surface/50">
              {/* Entry header */}
              <div className="flex items-center gap-2">
                <select
                  value={entry.field as string}
                  onChange={e => updateEntryField(eIdx, e.target.value)}
                  className="text-sm bg-surface border border-border rounded px-2 py-1
                             text-text-primary focus:outline-none focus:ring-1 focus:ring-primary/40 cursor-pointer"
                >
                  {selectedFields.map(f => (
                    <option key={f} value={f}>{fieldLabel(f)}</option>
                  ))}
                </select>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium uppercase">
                  {entry.type}
                </span>
                <button
                  onClick={() => removeEntry(eIdx)}
                  title="Remove legend"
                  className="text-red-400 hover:text-red-300 transition-colors text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Thresholds */}
              <div className="space-y-1.5 ml-2">
                <div className="text-[11px] text-text-secondary font-medium uppercase tracking-wider">
                  Thresholds
                </div>

                {entry.type === 'numeric'
                  ? (entry.thresholds as NumericThreshold[]).map((t, tIdx) => (
                      <div key={tIdx} className="flex items-center gap-2">
                        <input
                          type="color"
                          value={t.color}
                          onChange={e => updateNumericThreshold(eIdx, tIdx, 'color', e.target.value)}
                          className="w-7 h-7 rounded border border-border cursor-pointer shrink-0 p-0"
                        />
                        <input
                          type="text"
                          value={formatBoundInput(t.min)}
                          onChange={e => updateNumericThreshold(eIdx, tIdx, 'min', e.target.value)}
                          placeholder="min (-∞)"
                          className="w-24 text-xs bg-surface border border-border rounded px-2 py-1
                                     text-text-primary placeholder:text-text-secondary/50
                                     focus:outline-none focus:ring-1 focus:ring-primary/40"
                        />
                        <span className="text-text-secondary text-xs">to</span>
                        <input
                          type="text"
                          value={formatBoundInput(t.max)}
                          onChange={e => updateNumericThreshold(eIdx, tIdx, 'max', e.target.value)}
                          placeholder="max (∞)"
                          className="w-24 text-xs bg-surface border border-border rounded px-2 py-1
                                     text-text-primary placeholder:text-text-secondary/50
                                     focus:outline-none focus:ring-1 focus:ring-primary/40"
                        />
                        <button
                          onClick={() => removeThreshold(eIdx, tIdx)}
                          title="Remove threshold"
                          className="text-red-400 hover:text-red-300 transition-colors text-xs cursor-pointer ml-auto"
                        >
                          ✕
                        </button>
                      </div>
                    ))
                  : (entry.thresholds as StringThreshold[]).map((t, tIdx) => (
                      <div key={tIdx} className="flex items-center gap-2">
                        <input
                          type="color"
                          value={t.color}
                          onChange={e => updateStringThreshold(eIdx, tIdx, 'color', e.target.value)}
                          className="w-7 h-7 rounded border border-border cursor-pointer shrink-0 p-0"
                        />
                        <input
                          type="text"
                          value={t.value}
                          onChange={e => updateStringThreshold(eIdx, tIdx, 'value', e.target.value)}
                          placeholder="Value to match"
                          className="flex-1 text-xs bg-surface border border-border rounded px-2 py-1
                                     text-text-primary placeholder:text-text-secondary/50
                                     focus:outline-none focus:ring-1 focus:ring-primary/40"
                        />
                        <button
                          onClick={() => removeThreshold(eIdx, tIdx)}
                          title="Remove threshold"
                          className="text-red-400 hover:text-red-300 transition-colors text-xs cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ))}

                <button
                  onClick={() => addThreshold(eIdx)}
                  className="text-[11px] text-primary hover:text-primary-hover transition-colors cursor-pointer"
                >
                  + Add threshold
                </button>
              </div>
            </div>
          ))}

          {selectedFields.length > 0 && (
            <button
              onClick={addEntry}
              className="w-full py-2 text-xs border border-dashed border-border rounded-lg
                         text-text-secondary hover:text-text-primary hover:border-primary/50
                         transition-colors cursor-pointer"
            >
              + Add Legend Entry
            </button>
          )}

          {status && (
            <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-xs rounded-lg px-3 py-2">
              {status}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-border">
          <button
            onClick={handleClear}
            className="px-3 py-1.5 text-xs bg-surface border border-border text-text-secondary rounded-lg
                       hover:bg-border hover:text-text-primary transition-colors cursor-pointer"
          >
            Clear All
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs bg-surface border border-border text-text-secondary rounded-lg
                         hover:bg-border hover:text-text-primary transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="px-4 py-1.5 text-xs bg-primary text-white rounded-lg
                         hover:bg-primary-hover transition-colors cursor-pointer"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
