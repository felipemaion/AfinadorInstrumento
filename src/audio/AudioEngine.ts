import { PitchDetector } from 'pitchy'

export type PitchSample = {
  frequency: number
  clarity: number
  rms: number
  timestamp: number
}

export type Listener = (sample: PitchSample) => void

const BUFFER_SIZE = 2048
const MIN_RMS = 0.004
const MIN_CLARITY = 0.85

export class AudioEngine {
  private ctx: AudioContext | null = null
  private stream: MediaStream | null = null
  private analyser: AnalyserNode | null = null
  private detector: PitchDetector<Float32Array> | null = null
  private buffer: Float32Array<ArrayBuffer> = new Float32Array(new ArrayBuffer(BUFFER_SIZE * 4))
  private rafId: number | null = null
  private listeners = new Set<Listener>()

  async start(): Promise<void> {
    if (this.ctx) return

    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    })

    this.ctx = new AudioContext()
    const source = this.ctx.createMediaStreamSource(this.stream)

    this.analyser = this.ctx.createAnalyser()
    this.analyser.fftSize = BUFFER_SIZE
    source.connect(this.analyser)

    this.detector = PitchDetector.forFloat32Array(BUFFER_SIZE)
    this.detector.minVolumeDecibels = -40

    this.loop()
  }

  async stop(): Promise<void> {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId)
    this.rafId = null
    this.stream?.getTracks().forEach((t) => t.stop())
    await this.ctx?.close()
    this.ctx = null
    this.stream = null
    this.analyser = null
    this.detector = null
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private loop = (): void => {
    if (!this.analyser || !this.detector || !this.ctx) return
    this.analyser.getFloatTimeDomainData(this.buffer)

    let sumSquares = 0
    for (let i = 0; i < this.buffer.length; i++) sumSquares += this.buffer[i] * this.buffer[i]
    const rms = Math.sqrt(sumSquares / this.buffer.length)

    let frequency = 0
    let clarity = 0
    if (rms >= MIN_RMS) {
      const [f, c] = this.detector.findPitch(this.buffer, this.ctx.sampleRate)
      if (c >= MIN_CLARITY && f > 0) {
        frequency = f
        clarity = c
      }
    }

    const sample: PitchSample = { frequency, clarity, rms, timestamp: performance.now() }
    for (const listener of this.listeners) listener(sample)

    this.rafId = requestAnimationFrame(this.loop)
  }
}
