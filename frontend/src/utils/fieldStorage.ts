const STORAGE_KEY = 'geomap_selected_fields';

export function loadSavedFields(): string[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

export function saveFieldSelection(fields: string[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(fields));
}
