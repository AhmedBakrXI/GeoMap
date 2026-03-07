import { useCallback, useEffect, useRef, useState } from 'react';
import { FIELD_GROUPS, MANDATORY_FIELDS, fieldLabel } from '../types/measurement';
import { saveFieldSelection } from '../utils/fieldStorage';

interface FieldSelectorProps {
  selectedFields: string[];
  onApply: (fields: string[]) => void;
}

export default function FieldSelector({ selectedFields, onApply }: FieldSelectorProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Set<string>>(new Set(selectedFields));
  const panelRef = useRef<HTMLDivElement>(null);

  // Sync draft when props change
  useEffect(() => {
    setDraft(new Set(selectedFields));
  }, [selectedFields]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const toggle = useCallback((field: string) => {
    setDraft(prev => {
      const next = new Set(prev);
      if (next.has(field)) next.delete(field);
      else next.add(field);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    const all = new Set<string>();
    FIELD_GROUPS.forEach(g => g.fields.forEach(f => all.add(f)));
    setDraft(all);
  }, []);

  const deselectAll = useCallback(() => {
    setDraft(new Set());
  }, []);

  const handleApply = useCallback(() => {
    const fields = Array.from(draft);
    saveFieldSelection(fields);
    onApply(fields);
    setOpen(false);
  }, [draft, onApply]);

  const allFields = FIELD_GROUPS.flatMap(g => g.fields);
  const allSelected = allFields.every(f => draft.has(f));
  const noneSelected = allFields.every(f => !draft.has(f));

  return (
    <div ref={panelRef} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="px-3 py-1.5 text-xs font-medium bg-card border border-border rounded-lg
                   hover:bg-primary hover:text-white transition-colors cursor-pointer
                   flex items-center gap-1.5"
        title="Select data fields"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
        </svg>
        Fields ({draft.size})
      </button>

      {open && (
        <div className="absolute bottom-full right-0 mb-2 w-72 max-h-[70vh] overflow-y-auto
                        bg-card border border-border rounded-lg shadow-lg z-9999 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-text-primary">Data Fields</span>
            <div className="flex gap-1">
              <button
                onClick={selectAll}
                disabled={allSelected}
                className="px-2 py-0.5 text-[10px] rounded bg-primary/10 text-primary
                           hover:bg-primary/20 disabled:opacity-40 cursor-pointer"
              >
                All
              </button>
              <button
                onClick={deselectAll}
                disabled={noneSelected}
                className="px-2 py-0.5 text-[10px] rounded bg-primary/10 text-primary
                           hover:bg-primary/20 disabled:opacity-40 cursor-pointer"
              >
                None
              </button>
            </div>
          </div>

          {/* Mandatory fields (always included, shown as disabled) */}
          <div className="mb-2">
            <p className="text-[10px] uppercase tracking-wider text-text-secondary mb-1 font-semibold">
              Mandatory (always included)
            </p>
            <div className="flex flex-wrap gap-1">
              {MANDATORY_FIELDS.map(f => (
                <span key={f} className="px-2 py-0.5 text-[11px] bg-primary/15 text-primary rounded">
                  {fieldLabel(f)}
                </span>
              ))}
            </div>
          </div>

          {/* Optional field groups */}
          {FIELD_GROUPS.map(group => (
            <div key={group.label} className="mb-2">
              <p className="text-[10px] uppercase tracking-wider text-text-secondary mb-1 font-semibold">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.fields.map(field => (
                  <label
                    key={field}
                    className="flex items-center gap-2 px-1.5 py-0.5 rounded hover:bg-border/40
                               cursor-pointer text-[12px] text-text-primary"
                  >
                    <input
                      type="checkbox"
                      checked={draft.has(field)}
                      onChange={() => toggle(field)}
                      className="accent-primary w-3.5 h-3.5"
                    />
                    {fieldLabel(field)}
                  </label>
                ))}
              </div>
            </div>
          ))}

          <button
            onClick={handleApply}
            className="w-full mt-2 py-1.5 text-xs font-medium bg-primary text-white rounded-lg
                       hover:bg-primary-hover transition-colors cursor-pointer"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
}
