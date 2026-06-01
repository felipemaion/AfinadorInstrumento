import type { StringTarget, Tuning } from '../presets/tunings'
import { centsBetween, noteFromFrequency } from './noteFromFrequency'

export type PresetMatch = {
  target: StringTarget | null
  cents: number
  stringIndex: number
}

export function matchToPreset(frequency: number, tuning: Tuning): PresetMatch {
  if (tuning.strings.length === 0) {
    const reading = noteFromFrequency(frequency)
    if (!reading) return { target: null, cents: 0, stringIndex: -1 }
    return {
      target: { name: `${reading.note}${reading.octave}`, frequency: reading.exactFrequency },
      cents: reading.cents,
      stringIndex: -1,
    }
  }

  let bestIndex = 0
  let bestDistance = Infinity
  for (let i = 0; i < tuning.strings.length; i++) {
    const distance = Math.abs(Math.log2(frequency / tuning.strings[i].frequency))
    if (distance < bestDistance) {
      bestDistance = distance
      bestIndex = i
    }
  }

  const target = tuning.strings[bestIndex]
  return {
    target,
    cents: centsBetween(frequency, target.frequency),
    stringIndex: bestIndex,
  }
}
