import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type MockOsc = {
  type: string
  frequency: { setValueAtTime: ReturnType<typeof vi.fn> }
  connect: ReturnType<typeof vi.fn>
  start: ReturnType<typeof vi.fn>
  stop: ReturnType<typeof vi.fn>
  onended: (() => void) | null
}

type MockGain = {
  gain: {
    value: number
    setValueAtTime: ReturnType<typeof vi.fn>
    linearRampToValueAtTime: ReturnType<typeof vi.fn>
    cancelScheduledValues: ReturnType<typeof vi.fn>
  }
  connect: ReturnType<typeof vi.fn>
}

class MockAudioContext {
  currentTime = 0
  state: 'running' | 'suspended' = 'running'
  destination = { __id: 'destination' }
  resume = vi.fn(() => {
    this.state = 'running'
    return Promise.resolve()
  })

  oscillators: MockOsc[] = []
  gains: MockGain[] = []

  createOscillator(): MockOsc {
    const osc: MockOsc = {
      type: '',
      frequency: { setValueAtTime: vi.fn() },
      connect: vi.fn((dest: unknown) => dest),
      start: vi.fn(),
      stop: vi.fn(),
      onended: null,
    }
    this.oscillators.push(osc)
    return osc
  }

  createGain(): MockGain {
    const gain: MockGain = {
      gain: {
        value: 0,
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        cancelScheduledValues: vi.fn(),
      },
      connect: vi.fn((dest: unknown) => dest),
    }
    this.gains.push(gain)
    return gain
  }
}

let mockCtx: MockAudioContext

beforeEach(() => {
  vi.resetModules()
  mockCtx = new MockAudioContext()
  vi.stubGlobal(
    'AudioContext',
    vi.fn(() => mockCtx),
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
})

async function loadPlayTone() {
  return (await import('./playTone')).playTone
}

describe('playTone', () => {
  it('does nothing for invalid frequencies', async () => {
    const playTone = await loadPlayTone()
    playTone(0)
    playTone(-1)
    playTone(Number.NaN)
    playTone(Number.POSITIVE_INFINITY)
    expect(mockCtx.oscillators).toHaveLength(0)
    expect(mockCtx.gains).toHaveLength(0)
  })

  it('creates a sine oscillator at the requested frequency', async () => {
    const playTone = await loadPlayTone()
    playTone(440)
    expect(mockCtx.oscillators).toHaveLength(1)
    const osc = mockCtx.oscillators[0]
    expect(osc.type).toBe('sine')
    expect(osc.frequency.setValueAtTime).toHaveBeenCalledWith(440, 0)
  })

  it('connects osc → gain → destination', async () => {
    const playTone = await loadPlayTone()
    playTone(440)
    const osc = mockCtx.oscillators[0]
    const gain = mockCtx.gains[0]
    expect(osc.connect).toHaveBeenCalledWith(gain)
    expect(gain.connect).toHaveBeenCalledWith(mockCtx.destination)
  })

  it('schedules an ADSR envelope ending at the given duration', async () => {
    const playTone = await loadPlayTone()
    playTone(440, 1.6)
    const g = mockCtx.gains[0].gain
    // 1) starts at 0
    expect(g.setValueAtTime).toHaveBeenCalledWith(0, 0)
    // 2) attack + release ramps (2 linear ramps total)
    expect(g.linearRampToValueAtTime).toHaveBeenCalledTimes(2)
    const calls = g.linearRampToValueAtTime.mock.calls
    // attack ramps UP to a positive sustain level
    expect(calls[0][0]).toBeGreaterThan(0)
    expect(calls[0][1]).toBeGreaterThan(0)
    // release ramps DOWN to 0 exactly at duration
    expect(calls[1][0]).toBe(0)
    expect(calls[1][1]).toBeCloseTo(1.6, 5)
  })

  it('starts immediately and schedules stop after duration', async () => {
    const playTone = await loadPlayTone()
    playTone(440, 1.6)
    const osc = mockCtx.oscillators[0]
    expect(osc.start).toHaveBeenCalledWith(0)
    expect(osc.stop).toHaveBeenCalledTimes(1)
    expect(osc.stop.mock.calls[0][0]).toBeGreaterThanOrEqual(1.6)
  })

  it('respects a custom duration', async () => {
    const playTone = await loadPlayTone()
    playTone(440, 0.5)
    const release = mockCtx.gains[0].gain.linearRampToValueAtTime.mock.calls.at(-1)!
    expect(release[1]).toBeCloseTo(0.5, 5)
  })

  it('stops the previous tone before starting a new one', async () => {
    const playTone = await loadPlayTone()
    playTone(440)
    playTone(220)

    expect(mockCtx.oscillators).toHaveLength(2)
    const [first, second] = mockCtx.oscillators
    // the previous gain envelope is canceled during the cross-fade
    expect(mockCtx.gains[0].gain.cancelScheduledValues).toHaveBeenCalled()
    // and the previous oscillator is told to stop
    expect(first.stop).toHaveBeenCalled()
    // the new oscillator starts
    expect(second.start).toHaveBeenCalled()
  })

  it('reuses a single AudioContext across calls', async () => {
    const playTone = await loadPlayTone()
    const AudioContextCtor = globalThis.AudioContext as unknown as ReturnType<typeof vi.fn>
    playTone(440)
    playTone(220)
    expect(AudioContextCtor).toHaveBeenCalledTimes(1)
  })

  it('resumes a suspended context', async () => {
    mockCtx.state = 'suspended'
    const playTone = await loadPlayTone()
    playTone(440)
    expect(mockCtx.resume).toHaveBeenCalled()
  })
})
