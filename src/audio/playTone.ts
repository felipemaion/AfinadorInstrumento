// Toca um tom senoidal de referência na frequência alvo.
// Contexto independente do AudioEngine — não depende do mic estar ativo.

let ctx: AudioContext | null = null
let currentOsc: OscillatorNode | null = null
let currentGain: GainNode | null = null

function getContext(): AudioContext {
  if (!ctx) ctx = new AudioContext()
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

function stopCurrent(context: AudioContext) {
  if (!currentOsc || !currentGain) return
  const now = context.currentTime
  currentGain.gain.cancelScheduledValues(now)
  currentGain.gain.setValueAtTime(currentGain.gain.value, now)
  currentGain.gain.linearRampToValueAtTime(0, now + 0.04)
  currentOsc.stop(now + 0.05)
  currentOsc = null
  currentGain = null
}

export function playTone(frequency: number, duration = 1.6): void {
  if (!Number.isFinite(frequency) || frequency <= 0) return
  const context = getContext()
  stopCurrent(context)

  const osc = context.createOscillator()
  const gain = context.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(frequency, context.currentTime)

  const now = context.currentTime
  const attack = 0.02
  const release = 0.3
  const sustainLevel = 0.18

  gain.gain.setValueAtTime(0, now)
  gain.gain.linearRampToValueAtTime(sustainLevel, now + attack)
  gain.gain.setValueAtTime(sustainLevel, now + Math.max(attack, duration - release))
  gain.gain.linearRampToValueAtTime(0, now + duration)

  osc.connect(gain).connect(context.destination)
  osc.start(now)
  osc.stop(now + duration + 0.05)

  currentOsc = osc
  currentGain = gain
  osc.onended = () => {
    if (currentOsc === osc) {
      currentOsc = null
      currentGain = null
    }
  }
}
