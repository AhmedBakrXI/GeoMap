import type {
  LegendConfig,
  LegendState,
  NumericThreshold,
  StringThreshold,
} from '../types/legend';
import { formatBound } from '../types/legend';

interface LegendPanelProps {
  config: LegendConfig;
  legendState: LegendState;
  onStateChange: (state: LegendState) => void;
  onEditClick?: () => void;
}

export default function LegendPanel({
  config,
  legendState,
  onStateChange,
  onEditClick,
}: LegendPanelProps) {
  const { activeIndices, visibleThresholds } = legendState;

  const toggleActive = (idx: number) => {
    const current = new Set(activeIndices);
    if (current.has(idx)) {
      current.delete(idx);
    } else {
      current.add(idx);
    }
    onStateChange({
      ...legendState,
      activeIndices: Array.from(current),
    });
  };

  const toggleThreshold = (entryIdx: number, threshIdx: number) => {
    const current = [...(visibleThresholds[entryIdx] ?? [])];
    current[threshIdx] = !current[threshIdx];
    onStateChange({
      ...legendState,
      visibleThresholds: {
        ...visibleThresholds,
        [entryIdx]: current,
      },
    });
  };

  return (
    <div className="absolute top-3 right-3 z-1000 bg-card/95 backdrop-blur-sm border border-border rounded-lg shadow-soft w-64 max-h-[80vh] overflow-y-auto">
      <div className="px-3 py-2 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">Legend</h3>
        {onEditClick && (
          <button
            onClick={onEditClick}
            title="Edit legend YAML"
            className="text-text-secondary hover:text-text-primary transition-colors cursor-pointer text-sm leading-none"
          >
            Edit
          </button>
        )}
      </div>

      <div className="p-2 space-y-1">
        {config.legends.map((entry, eIdx) => {
          const isActive = activeIndices.includes(eIdx);

          return (
            <div key={eIdx}>
              {/* Entry header with checkbox */}
              <label className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-surface cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={() => toggleActive(eIdx)}
                  className="accent-primary w-3.5 h-3.5"
                />
                <span className={`text-xs font-medium ${isActive ? 'text-text-primary' : 'text-text-secondary'}`}>
                  {entry.name}
                </span>
              </label>

              {/* Thresholds (shown when active) */}
              {isActive && (
                <div className="ml-4 pl-2 border-l-2 border-primary/30 space-y-0.5 pb-1">
                  {entry.type === 'numeric'
                    ? (entry.thresholds as NumericThreshold[]).map((t, tIdx) => (
                        <label
                          key={tIdx}
                          className="flex items-center gap-2 px-1 py-0.5 rounded hover:bg-surface cursor-pointer select-none"
                        >
                          <input
                            type="checkbox"
                            checked={visibleThresholds[eIdx]?.[tIdx] ?? true}
                            onChange={() => toggleThreshold(eIdx, tIdx)}
                            className="accent-primary w-3 h-3"
                          />
                          <span
                            className="w-3 h-3 rounded-sm shrink-0 border border-black/10"
                            style={{ backgroundColor: t.color }}
                          />
                          <span className="text-[11px] text-text-secondary">
                            {formatBound(t.min)} to {formatBound(t.max)}
                          </span>
                        </label>
                      ))
                    : (entry.thresholds as StringThreshold[]).map((t, tIdx) => (
                        <label
                          key={tIdx}
                          className="flex items-center gap-2 px-1 py-0.5 rounded hover:bg-surface cursor-pointer select-none"
                        >
                          <input
                            type="checkbox"
                            checked={visibleThresholds[eIdx]?.[tIdx] ?? true}
                            onChange={() => toggleThreshold(eIdx, tIdx)}
                            className="accent-primary w-3 h-3"
                          />
                          <span
                            className="w-3 h-3 rounded-sm shrink-0 border border-black/10"
                            style={{ backgroundColor: t.color }}
                          />
                          <span className="text-[11px] text-text-secondary">
                            {t.value}
                          </span>
                        </label>
                      ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
