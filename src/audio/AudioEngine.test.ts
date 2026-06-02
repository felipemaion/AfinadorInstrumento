import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { PitchSample } from './AudioEngine'

const { findPitchMock } = vi.hoisted(() => ({
  findPitchMock: vi.fn<(input: Float32Array, sr: number) => [number, number]>(),
}))

vi.mock('pitchy', () => ({
  PitchDetector: {
    forFloat32Array: vi.fn(() => ({
      findPitch: findPitchMock,
      minVolumeDecibels: -40,
    })),
  },
}))

class MockAnalyserNode {
  fftSize = 0
  fakeBuffer: Float32Array = new Float32Array(2048)
  getFloatTimeDomainData(out: Float32Array) {
    out.set(this.fakeBuffer)
  }
}

class MockMediaStream {
  tracks = [{ stop: vi.fn() }, { stop: vi.fn() }]
  getTracks() {
    return this.tracks
  }
}

const mockSource = { connect: vi.fn() }
let mockAnalyser: MockAnalyserNode
let mockStream: MockMediaStream
let mockCtx: MockAudioContext
let rafCallbacks: Array<FrameRequestCallback> = []

class MockAudioContext {
  sampleRate = 44100
  state = 'running'
  close = vi.fn(() => Promise.resolve())
  createMediaStreamSource = vi.fn(() => mockSource)
  createAnalyser = vi.fn(() => {
    mockAnalyser = new MockAnalyserNode()
    return mockAnalyser
  })
}

beforeEach(() => {
  vi.resetModules()
  rafCallbacks = []
  mockStream = new MockMediaStream()

  vi.stubGlobal(
    'AudioContext',
    vi.fn(() => {
      mockCtx = new MockAudioContext()
      return mockCtx
    }),
  )
  vi.stubGlobal('navigator', {
    mediaDevices: { getUserMedia: vi.fn(() => Promise.resolve(mockStream)) },
  })
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    rafCallbacks.push(cb)
    return rafCallbacks.length
  })
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
  vi.stubGlobal('performance', { now: () => 0 })

  findPitchMock.mockReset().mockReturnValue([0, 0])
})

afterEach(() => vi.unstubAllGlobals())

function setSignal(amplitude: number) {
  mockAnalyser.fakeBuffer.fill(amplitude)
}

function flushFrame() {
  const cbs = rafCallbacks
  rafCallbacks = []
  cbs.forEach((cb) => cb(0))
}

describe('AudioEngine', () => {
  it('requests mic with raw audio settings (no processing)', async () => {
    const { AudioEngine } = await import('./AudioEngine')
    await new AudioEngine().start()
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    })
  })

  it('wires source → analyser with fftSize 2048', async () => {
    const { AudioEngine } = await import('./AudioEngine')
    await new AudioEngine().start()
    expect(mockCtx.createMediaStreamSource).toHaveBeenCalledWith(mockStream)
    expect(mockSource.connect).toHaveBeenCalledWith(mockAnalyser)
    expect(mockAnalyser.fftSize).toBe(2048)
  })

  it('emits frequency=0 when RMS is below threshold (silence)', async () => {
    const { AudioEngine } = await import('./AudioEngine')
    const engine = new AudioEngine()
    const samples: PitchSample[] = []
    engine.subscribe((s) => samples.push(s))
    await engine.start()

    setSignal(0.001) // RMS = 0.001 < MIN_RMS (0.004)
    flushFrame()

    expect(samples.at(-1)?.frequency).toBe(0)
    expect(findPitchMock).not.toHaveBeenCalled()
  })

  it('emits the detected frequency when RMS and clarity are good', async () => {
    findPitchMock.mockReturnValue([329.63, 0.97])
    const { AudioEngine } = await import('./AudioEngine')
    const engine = new AudioEngine()
    const samples: PitchSample[] = []
    engine.subscribe((s) => samples.push(s))
    await engine.start()

    setSignal(0.1)
    flushFrame()

    expect(samples.at(-1)?.frequency).toBeCloseTo(329.63, 2)
    expect(samples.at(-1)?.clarity).toBeCloseTo(0.97, 2)
    expect(samples.at(-1)?.rms).toBeCloseTo(0.1, 5)
  })

  it('emits frequency=0 when clarity is below threshold (uncertain pitch)', async () => {
    findPitchMock.mockReturnValue([329.63, 0.5]) // clarity < MIN_CLARITY (0.85)
    const { AudioEngine } = await import('./AudioEngine')
    const engine = new AudioEngine()
    const samples: PitchSample[] = []
    engine.subscribe((s) => samples.push(s))
    await engine.start()

    setSignal(0.1)
    flushFrame()

    expect(samples.at(-1)?.frequency).toBe(0)
  })

  it('passes the configured sample rate to pitchy', async () => {
    findPitchMock.mockReturnValue([440, 0.95])
    const { AudioEngine } = await import('./AudioEngine')
    const engine = new AudioEngine()
    engine.subscribe(() => {})
    await engine.start()

    setSignal(0.1)
    flushFrame()

    expect(findPitchMock).toHaveBeenCalledWith(expect.any(Float32Array), 44100)
  })

  it('subscribe returns an unsubscribe function', async () => {
    findPitchMock.mockReturnValue([440, 0.95])
    const { AudioEngine } = await import('./AudioEngine')
    const engine = new AudioEngine()
    const samples: PitchSample[] = []
    const unsub = engine.subscribe((s) => samples.push(s))
    await engine.start()

    setSignal(0.1)
    flushFrame()
    const lenBeforeUnsub = samples.length

    unsub()
    flushFrame()

    expect(samples.length).toBe(lenBeforeUnsub)
  })

  it('fans samples out to multiple subscribers', async () => {
    findPitchMock.mockReturnValue([440, 0.95])
    const { AudioEngine } = await import('./AudioEngine')
    const engine = new AudioEngine()
    await engine.start()
    // subscribe after start so we don't count the initial synchronous frame
    const a: PitchSample[] = []
    const b: PitchSample[] = []
    engine.subscribe((s) => a.push(s))
    engine.subscribe((s) => b.push(s))

    setSignal(0.1)
    flushFrame()

    expect(a).toHaveLength(1)
    expect(b).toHaveLength(1)
  })

  it('start is idempotent (no re-init on a second call)', async () => {
    const { AudioEngine } = await import('./AudioEngine')
    const engine = new AudioEngine()
    await engine.start()
    await engine.start()
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledTimes(1)
  })

  it('stop closes context, stops mic tracks, and cancels rAF', async () => {
    const { AudioEngine } = await import('./AudioEngine')
    const engine = new AudioEngine()
    await engine.start()
    const trackStops = mockStream.tracks.map((t) => t.stop)
    const closeSpy = mockCtx.close

    await engine.stop()

    expect(closeSpy).toHaveBeenCalled()
    trackStops.forEach((s) => expect(s).toHaveBeenCalled())
    expect(globalThis.cancelAnimationFrame).toHaveBeenCalled()
  })

  it('subsequent rAF ticks after stop are no-ops (no crash, no new emits)', async () => {
    findPitchMock.mockReturnValue([440, 0.95])
    const { AudioEngine } = await import('./AudioEngine')
    const engine = new AudioEngine()
    const samples: PitchSample[] = []
    engine.subscribe((s) => samples.push(s))
    await engine.start()

    const lenAfterStart = samples.length
    await engine.stop()

    expect(() => flushFrame()).not.toThrow()
    expect(samples).toHaveLength(lenAfterStart)
  })
})
