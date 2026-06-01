import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { matchToPreset } from '../audio/matchToPreset'
import { noteFromFrequency } from '../audio/noteFromFrequency'
import { getTuning } from '../presets/tunings'
import { useTunerStore } from './useTunerStore'

function sampleAt(frequency: number, rms = 0.05) {
  const tuning = getTuning(useTunerStore.getState().tuningId)
  return {
    frequency,
    clarity: 0.95,
    rms,
    reading: frequency > 0 ? noteFromFrequency(frequency) : null,
    match: frequency > 0 ? matchToPreset(frequency, tuning) : null,
  }
}

describe('useTunerStore', () => {
  let now = 0
  beforeEach(() => {
    now = 1_000
    vi.spyOn(performance, 'now').mockImplementation(() => now)
    useTunerStore.getState().resetReading()
    useTunerStore.setState({
      status: 'idle',
      errorMessage: null,
      smoothedCents: 0,
    })
  })

  afterEach(() => vi.restoreAllMocks())

  it('updates frequency, reading and match on a valid sample', () => {
    useTunerStore.getState().pushSample(sampleAt(440))
    const s = useTunerStore.getState()
    expect(s.frequency).toBe(440)
    expect(s.reading?.note).toBe('A')
    expect(s.match?.target?.name).toBe('E4') // closest guitar string to 440Hz is high E
  })

  it('smooths cents over multiple samples', () => {
    // 113Hz vs A2=110Hz → ~+47 cents (clearly detuned, so smoothing is observable)
    useTunerStore.getState().pushSample(sampleAt(113))
    const rawCents = useTunerStore.getState().match!.cents
    expect(rawCents).toBeGreaterThan(0)

    const first = useTunerStore.getState().smoothedCents
    // first sample should not jump straight to the raw cents value
    expect(first).toBeGreaterThan(0)
    expect(first).toBeLessThan(rawCents)

    // repeated samples converge toward the raw value
    for (let i = 0; i < 30; i++) useTunerStore.getState().pushSample(sampleAt(113))
    const converged = useTunerStore.getState().smoothedCents
    expect(Math.abs(converged - rawCents)).toBeLessThan(0.5)
  })

  it('holds the last valid reading when frequency drops to 0 within HOLD_MS', () => {
    useTunerStore.getState().pushSample(sampleAt(440))
    expect(useTunerStore.getState().reading?.note).toBe('A')

    now += 500 // 0.5s later, signal dies
    useTunerStore.getState().pushSample(sampleAt(0, 0.001))

    const s = useTunerStore.getState()
    expect(s.reading?.note).toBe('A') // still holding
    expect(s.frequency).toBe(440)
    expect(s.rms).toBe(0.001) // but rms is updated (so visuals decay)
  })

  it('clears the reading after the hold window expires', () => {
    useTunerStore.getState().pushSample(sampleAt(440))
    now += 2_500 // past 1.8s HOLD_MS
    useTunerStore.getState().pushSample(sampleAt(0, 0.001))

    const s = useTunerStore.getState()
    expect(s.reading).toBeNull()
    expect(s.frequency).toBe(0)
    expect(s.match).toBeNull()
  })

  it('replaces the held reading when a new valid sample arrives', () => {
    useTunerStore.getState().pushSample(sampleAt(440)) // A4
    now += 500
    useTunerStore.getState().pushSample(sampleAt(0, 0.001)) // hold
    expect(useTunerStore.getState().reading?.note).toBe('A')

    now += 100
    useTunerStore.getState().pushSample(sampleAt(82.41)) // E2
    expect(useTunerStore.getState().reading?.note).toBe('E')
    expect(useTunerStore.getState().reading?.octave).toBe(2)
  })

  it('setTuning updates the tuning id', () => {
    useTunerStore.getState().setTuning('bass-4')
    expect(useTunerStore.getState().tuningId).toBe('bass-4')
  })

  it('setStatus stores status and optional error', () => {
    useTunerStore.getState().setStatus('error', 'mic denied')
    const s = useTunerStore.getState()
    expect(s.status).toBe('error')
    expect(s.errorMessage).toBe('mic denied')
  })
})
