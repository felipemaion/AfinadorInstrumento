import { create } from 'zustand'
import type { PresetMatch } from '../audio/matchToPreset'
import type { NoteReading } from '../audio/noteFromFrequency'
import { DEFAULT_TUNING_ID } from '../presets/tunings'

export type EngineStatus = 'idle' | 'starting' | 'running' | 'error'

export type TunerState = {
  status: EngineStatus
  errorMessage: string | null
  tuningId: string
  frequency: number
  clarity: number
  rms: number
  reading: NoteReading | null
  match: PresetMatch | null
  smoothedCents: number
  lastUpdate: number

  setStatus: (status: EngineStatus, error?: string | null) => void
  setTuning: (id: string) => void
  pushSample: (data: {
    frequency: number
    clarity: number
    rms: number
    reading: NoteReading | null
    match: PresetMatch | null
  }) => void
  resetReading: () => void
}

const SMOOTHING = 0.35
const HOLD_MS = 1800

export const useTunerStore = create<TunerState>((set, get) => ({
  status: 'idle',
  errorMessage: null,
  tuningId: DEFAULT_TUNING_ID,
  frequency: 0,
  clarity: 0,
  rms: 0,
  reading: null,
  match: null,
  smoothedCents: 0,
  lastUpdate: 0,

  setStatus: (status, error = null) => set({ status, errorMessage: error }),
  setTuning: (id) => set({ tuningId: id }),

  pushSample: ({ frequency, clarity, rms, reading, match }) => {
    const now = performance.now()
    const state = get()

    if (frequency > 0) {
      const smoothedCents = state.smoothedCents + ((match?.cents ?? 0) - state.smoothedCents) * SMOOTHING
      set({
        frequency,
        clarity,
        rms,
        reading,
        match,
        smoothedCents,
        lastUpdate: now,
      })
      return
    }

    // Sem leitura válida: segura a última nota por HOLD_MS para não "piscar".
    if (state.reading && now - state.lastUpdate < HOLD_MS) {
      set({ rms })
      return
    }

    if (state.reading) {
      set({
        frequency: 0,
        clarity: 0,
        rms,
        reading: null,
        match: null,
      })
    } else {
      set({ rms })
    }
  },

  resetReading: () =>
    set({
      frequency: 0,
      clarity: 0,
      rms: 0,
      reading: null,
      match: null,
      lastUpdate: 0,
    }),
}))
