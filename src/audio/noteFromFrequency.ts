const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const

export type NoteReading = {
  note: string
  octave: number
  midi: number
  cents: number
  exactFrequency: number
}

export function noteFromFrequency(frequency: number): NoteReading | null {
  if (!Number.isFinite(frequency) || frequency <= 0) return null

  const midiFloat = 69 + 12 * Math.log2(frequency / 440)
  const midi = Math.round(midiFloat)
  const cents = Math.round((midiFloat - midi) * 100)

  const note = NOTE_NAMES[((midi % 12) + 12) % 12]
  const octave = Math.floor(midi / 12) - 1
  const exactFrequency = 440 * Math.pow(2, (midi - 69) / 12)

  return { note, octave, midi, cents, exactFrequency }
}

export function centsBetween(detectedHz: number, targetHz: number): number {
  if (detectedHz <= 0 || targetHz <= 0) return 0
  return Math.round(1200 * Math.log2(detectedHz / targetHz))
}
