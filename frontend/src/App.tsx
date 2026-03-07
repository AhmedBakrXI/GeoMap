import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import GeoMap from './components/GeoMap'
import LegendPanel from './components/LegendPanel'
import LegendEditor from './components/LegendEditor'
import RangeSlider from './components/RangeSlider'
import FieldSelector from './components/FieldSelector'
import { loadSavedFields, saveFieldSelection } from './utils/fieldStorage'
import { connectWebSocket, fetchAllHistory } from './api/measurements'
import { loadLegendConfig } from './api/legend'
import type { MapPoint } from './types/measurement'
import { DEFAULT_OPTIONAL_FIELDS } from './types/measurement'
import type { LegendConfig, LegendState } from './types/legend'
import {
  buildDefaultState,
  loadLegendState,
  saveLegendState
} from './types/legend'

type AppState = 'connecting' | 'error' | 'loading-history' | 'ready'

function App () {
  const [state, setState] = useState<AppState>('connecting')
  const [errorMsg, setErrorMsg] = useState('')
  const [points, setPoints] = useState<MapPoint[]>([])
  const [progress, setProgress] = useState({ page: 0, totalPages: 0 })
  const [filterStartTime, setFilterStartTime] = useState<string | null>(null)
  const [filterEndTime, setFilterEndTime] = useState<string | null>(null)
  const [legendConfig, setLegendConfig] = useState<LegendConfig | null>(null)
  const [legendState, setLegendState] = useState<LegendState | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [selectedFields, setSelectedFields] = useState<string[]>(
    () => loadSavedFields() ?? DEFAULT_OPTIONAL_FIELDS
  )
  const wsRef = useRef<{ close: () => void; setFields: (f: string[]) => void } | null>(null)

  // Load legend config on mount
  useEffect(() => {
    const config = loadLegendConfig()
    setLegendConfig(config)
    const saved = loadLegendState()
    setLegendState(saved ?? buildDefaultState(config))
  }, [])

  const handleLegendStateChange = useCallback((state: LegendState) => {
    setLegendState(state)
    saveLegendState(state)
  }, [])

  const handleLegendConfigApply = useCallback((config: LegendConfig) => {
    setLegendConfig(config)
    const newState = buildDefaultState(config)
    setLegendState(newState)
    saveLegendState(newState)
  }, [])

  const startLoadingHistory = useCallback(async () => {
    setState('loading-history')
    try {
      const history = await fetchAllHistory(500, (_pagePoints, prog) => {
        setProgress(prog)
      }, selectedFields)
      // Merge: history first, then any WS points that arrived during loading
      setPoints(prev => {
        const seenIds = new Set(history.map(p => p.id))
        const wsOnly = prev.filter(p => !seenIds.has(p.id))
        return [...history, ...wsOnly]
      })
      setState('ready')
    } catch {
      setState('error')
      setErrorMsg('Failed to load history data.')
    }
  }, [selectedFields])

  useEffect(() => {
    const ws = connectWebSocket({
      onMessage: newPoints => {
        console.log(
          `[App] Received ${newPoints.length} new points from WebSocket`
        )
        setPoints(prev => [...prev, ...newPoints])
      },
      onOpen: () => {
        startLoadingHistory()
      },
      onError: () => {
        setState('error')
        setErrorMsg(
          'Failed to connect to WebSocket. Please check the server and try again.'
        )
      },
      onClose: () => {
        console.log('[App] WebSocket closed')
      },
      fields: selectedFields,
    })

    wsRef.current = ws
    return () => ws.close()
  }, [startLoadingHistory, selectedFields])

  const handleFieldsApply = useCallback(async (fields: string[]) => {
    setSelectedFields(fields)
    saveFieldSelection(fields)
    // Update WebSocket field filter immediately
    wsRef.current?.setFields(fields)
    // Reload history with the new field set
    setState('loading-history')
    setPoints([])
    try {
      const history = await fetchAllHistory(500, (_pagePoints, prog) => {
        setProgress(prog)
      }, fields)
      setPoints(prev => {
        const seenIds = new Set(history.map(p => p.id))
        const wsOnly = prev.filter(p => !seenIds.has(p.id))
        return [...history, ...wsOnly]
      })
      setState('ready')
    } catch {
      setState('error')
      setErrorMsg('Failed to reload history with updated fields.')
    }
  }, [])

  const sortedIndices = useMemo(() => {
    const indices: number[] = []
    for (let i = 0; i < points.length; i++) {
      if (points[i].time != null) indices.push(i)
    }
    indices.sort((a, b) => points[a].time!.localeCompare(points[b].time!))
    return indices
  }, [points])

  // Pre-compute sorted time strings for binary search
  const sortedTimes = useMemo(
    () => sortedIndices.map(i => points[i].time!),
    [sortedIndices, points]
  )

  // Derive slider percentage positions from stored timestamps
  const sliderStart = useMemo(() => {
    if (filterStartTime == null || sortedTimes.length <= 1) return 0
    let low = 0,
      high = sortedTimes.length - 1
    while (low < high) {
      const mid = (low + high) >> 1
      if (sortedTimes[mid] < filterStartTime) low = mid + 1
      else high = mid
    }
    return (low / (sortedTimes.length - 1)) * 100
  }, [filterStartTime, sortedTimes])

  const sliderEnd = useMemo(() => {
    if (filterEndTime == null || sortedTimes.length <= 1) return 100
    let low = 0,
      high = sortedTimes.length - 1
    while (low < high) {
      const mid = (low + high + 1) >> 1
      if (sortedTimes[mid] > filterEndTime) high = mid - 1
      else low = mid
    }
    return (low / (sortedTimes.length - 1)) * 100
  }, [filterEndTime, sortedTimes])

  // Build a Set of visible point IDs based on timestamp range
  const visibleIds = useMemo(() => {
    if (filterStartTime == null && filterEndTime == null) return null
    if (sortedTimes.length === 0) return null

    let startIndex = 0
    if (filterStartTime != null) {
      let low = 0,
        high = sortedTimes.length - 1
      while (low < high) {
        const mid = (low + high) >> 1
        if (sortedTimes[mid] < filterStartTime) low = mid + 1
        else high = mid
      }
      startIndex = low
    }

    let endIndex = sortedTimes.length - 1
    if (filterEndTime != null) {
      let low = 0,
        high = sortedTimes.length - 1
      while (low < high) {
        const mid = (low + high + 1) >> 1
        if (sortedTimes[mid] > filterEndTime) high = mid - 1
        else low = mid
      }
      endIndex = low
    }

    if (startIndex === 0 && endIndex === sortedTimes.length - 1) return null

    const ids = new Set<number>()
    for (let i = startIndex; i <= endIndex; i++) {
      ids.add(points[sortedIndices[i]].id)
    }
    return ids
  }, [filterStartTime, filterEndTime, sortedTimes, sortedIndices, points])

  const lastPointTime =
    points.length > 0 ? points[points.length - 1].time ?? '—' : null

  const sliderStartTime =
    filterStartTime ?? (sortedTimes.length > 0 ? sortedTimes[0] : null)
  const sliderEndTime =
    filterEndTime ??
    (sortedTimes.length > 0 ? sortedTimes[sortedTimes.length - 1] : null)

  // All active legend entries for GeoMap coloring
  const activeLegends = useMemo(() => {
    if (!legendConfig || !legendState) return []
    const indices = legendState.activeIndices ?? []
    return indices
      .filter(idx => legendConfig.legends[idx] != null)
      .map(idx => ({
        entry: legendConfig.legends[idx],
        visible: legendState.visibleThresholds[idx] ?? []
      }))
  }, [legendConfig, legendState])

  if (state === 'connecting') {
    return (
      <div className='h-screen flex items-center justify-center bg-surface'>
        <div className='text-center'>
          <div className='inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent mb-4' />
          <p className='text-text-secondary'>Connecting to server…</p>
        </div>
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className='h-screen flex items-center justify-center bg-surface'>
        <div className='bg-card rounded-lg shadow-soft p-8 max-w-md text-center'>
          <div className='text-red-500 text-4xl mb-4'>⚠</div>
          <h2 className='text-xl font-semibold text-text-primary mb-2'>
            Connection Failed
          </h2>
          <p className='text-text-secondary mb-6'>{errorMsg}</p>
          <button
            onClick={() => window.location.reload()}
            className='px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors cursor-pointer'
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (state === 'loading-history') {
    const pct =
      progress.totalPages > 0
        ? Math.round((progress.page / progress.totalPages) * 100)
        : 0

    return (
      <div className='h-screen flex items-center justify-center bg-surface'>
        <div className='w-80 text-center'>
          <p className='text-text-primary font-medium mb-3'>Loading history…</p>
          <div className='w-full bg-border rounded-full h-3 overflow-hidden'>
            <div
              className='bg-primary h-3 rounded-full transition-all duration-300'
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className='text-text-secondary text-sm mt-2'>
            Page {progress.page} / {progress.totalPages} ({pct}%)
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className='h-screen w-screen flex flex-col'>
      {/* Map fills all available space */}
      <div className='flex-1 relative'>
        <GeoMap
          points={points}
          activeLegends={activeLegends}
          visibleIds={visibleIds}
          selectedFields={selectedFields}
        />
        {legendConfig && legendState && (
          <LegendPanel
            config={legendConfig}
            legendState={legendState}
            onStateChange={handleLegendStateChange}
            onEditClick={() => setEditorOpen(true)}
          />
        )}
        <LegendEditor
          open={editorOpen}
          onClose={() => setEditorOpen(false)}
          onApply={handleLegendConfigApply}
          currentConfig={legendConfig}
          selectedFields={selectedFields}
        />
      </div>

      {/* Status bar */}
      <div className='h-14 bg-card border-t border-border flex items-center px-4 shrink-0'>
        {/* Left: last point time */}
        <div className='text-sm text-text-secondary whitespace-nowrap overflow-hidden text-ellipsis'>
          <span className='font-medium text-text-primary'>Last:</span>{' '}
          {lastPointTime ?? '—'}
          {/* Display available optional fields from the last point */}
          {/* {lastPointTime && points.length > 0 && (() => {
            const last = points[points.length - 1];
            const extras = selectedFields
              .filter(f => last[f] != null)
              .slice(0, 3)
              .map(f => `${fieldLabel(f)}: ${last[f]}`)
              .join(', ');
            return extras ? <>{' '}- {extras}</> : null;
          })()} */}
        </div>

        <div className='ml-auto flex items-center gap-3'>
          <FieldSelector
            selectedFields={selectedFields}
            onApply={handleFieldsApply}
          />
          <span className='text-xs text-text-secondary whitespace-nowrap min-w-24'>
            {sliderStartTime ?? '—'}
          </span>
          <div className='w-56'>
            <RangeSlider
              start={sliderStart}
              end={sliderEnd}
              onChange={(sPct, ePct) => {
                const maxI = sortedTimes.length - 1
                if (maxI <= 0) return
                setFilterStartTime(
                  sPct <= 0
                    ? null
                    : sortedTimes[Math.round((sPct / 100) * maxI)]
                )
                setFilterEndTime(
                  ePct >= 100
                    ? null
                    : sortedTimes[Math.round((ePct / 100) * maxI)]
                )
              }}
            />
          </div>
          <span className='text-xs text-text-secondary whitespace-nowrap min-w-24'>
            {sliderEndTime ?? '—'}
          </span>
        </div>
      </div>
    </div>
  )
}

export default App
