import { useCallback, useEffect, useRef, useState } from 'react';
import {
  parseLegendYaml,
  saveLegendYaml,
  clearLegendYaml,
  loadLegendYaml,
  fetchDefaultLegendYaml,
} from '../api/legend';
import type { LegendConfig } from '../types/legend';

interface LegendEditorProps {
  open: boolean;
  onClose: () => void;
  onApply: (config: LegendConfig, yamlText: string) => void;
}

export default function LegendEditor({ open, onClose, onApply }: LegendEditorProps) {
  const [yaml, setYaml] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load current YAML when the modal opens
  useEffect(() => {
    if (!open) return;
    const saved = loadLegendYaml();
    if (saved) {
      setYaml(saved);
    } else {
      fetchDefaultLegendYaml()
        .then(text => setYaml(text))
        .catch(() => setYaml('# Failed to load default legend.yaml'));
    }
    setError(null);
    setStatus(null);
  }, [open]);

  // Focus the textarea when opened
  useEffect(() => {
    if (open) setTimeout(() => textareaRef.current?.focus(), 50);
  }, [open]);

  const validate = useCallback((): LegendConfig | null => {
    try {
      const config = parseLegendYaml(yaml);
      setError(null);
      return config;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Invalid YAML');
      return null;
    }
  }, [yaml]);

  const handleApply = useCallback(() => {
    const config = validate();
    if (!config) return;
    saveLegendYaml(yaml);
    onApply(config, yaml);
    setStatus('Applied successfully');
    setTimeout(() => setStatus(null), 2000);
  }, [yaml, validate, onApply]);

  const handleReset = useCallback(async () => {
    clearLegendYaml();
    try {
      const text = await fetchDefaultLegendYaml();
      setYaml(text);
      const config = parseLegendYaml(text);
      onApply(config, text);
      setError(null);
      setStatus('Reset to default');
      setTimeout(() => setStatus(null), 2000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load default');
    }
  }, [onApply]);

  const handleExport = useCallback(() => {
    const blob = new Blob([yaml], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'legend.yaml';
    a.click();
    URL.revokeObjectURL(url);
  }, [yaml]);

  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.yaml,.yml';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result as string;
        setYaml(text);
        setError(null);
        setStatus(null);
      };
      reader.readAsText(file);
    };
    input.click();
  }, []);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-2000 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-card border border-border rounded-xl shadow-2xl w-175 max-w-[95vw] max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <h2 className="text-base font-semibold text-text-primary">Edit Legend Configuration</h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary transition-colors text-lg leading-none cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden flex flex-col p-4 gap-3">
          <p className="text-xs text-text-secondary">
            Edit the YAML below to customize legends and thresholds. Changes are saved in your browser.
          </p>

          <textarea
            ref={textareaRef}
            value={yaml}
            onChange={e => { setYaml(e.target.value); setError(null); setStatus(null); }}
            spellCheck={false}
            className="flex-1 min-h-75 w-full bg-surface text-text-primary text-sm font-mono
                        border border-border rounded-lg p-3 resize-none
                        focus:outline-none focus:ring-2 focus:ring-primary/40
                        placeholder:text-text-secondary/50"
            placeholder="# Paste your legend YAML here..."
          />

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          {status && !error && (
            <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-xs rounded-lg px-3 py-2">
              {status}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-border">
          <div className="flex gap-2">
            <button
              onClick={handleImport}
              className="px-3 py-1.5 text-xs bg-surface border border-border text-text-secondary rounded-lg
                         hover:bg-border hover:text-text-primary transition-colors cursor-pointer"
            >
              Import
            </button>
            <button
              onClick={handleExport}
              className="px-3 py-1.5 text-xs bg-surface border border-border text-text-secondary rounded-lg
                         hover:bg-border hover:text-text-primary transition-colors cursor-pointer"
            >
              Export
            </button>
            <button
              onClick={handleReset}
              className="px-3 py-1.5 text-xs bg-surface border border-border text-text-secondary rounded-lg
                         hover:bg-border hover:text-text-primary transition-colors cursor-pointer"
            >
              Reset to Default
            </button>
          </div>
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
