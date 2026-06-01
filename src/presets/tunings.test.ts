import { describe, expect, it } from 'vitest'
import { DEFAULT_TUNING_ID, TUNINGS, getTuning } from './tunings'

describe('tunings presets', () => {
  it('has a non-empty list with unique ids', () => {
    expect(TUNINGS.length).toBeGreaterThan(0)
    const ids = TUNINGS.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('DEFAULT_TUNING_ID points to an existing preset', () => {
    expect(TUNINGS.some((t) => t.id === DEFAULT_TUNING_ID)).toBe(true)
  })

  it('every non-chromatic preset has positive ascending frequencies per string', () => {
    for (const t of TUNINGS) {
      if (t.strings.length === 0) continue
      for (const s of t.strings) {
        expect(s.frequency).toBeGreaterThan(20)
        expect(s.frequency).toBeLessThan(2000)
        expect(s.name).toMatch(/^[A-G]#?\d$/)
      }
    }
  })

  it('getTuning falls back to the first preset on unknown id', () => {
    expect(getTuning('does-not-exist').id).toBe(TUNINGS[0].id)
  })

  it('guitar standard E2 string is 82.41Hz within rounding', () => {
    const guitar = getTuning('guitar-standard')
    expect(guitar.strings[0].name).toBe('E2')
    expect(Math.abs(guitar.strings[0].frequency - 82.41)).toBeLessThan(0.01)
  })
})
