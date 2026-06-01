import { describe, expect, it } from 'vitest'
import { matchToPreset } from './matchToPreset'
import { getTuning } from '../presets/tunings'

describe('matchToPreset', () => {
  const guitar = getTuning('guitar-standard')

  it('matches low E to first string', () => {
    const m = matchToPreset(82.41, guitar)
    expect(m.stringIndex).toBe(0)
    expect(m.target?.name).toBe('E2')
    expect(Math.abs(m.cents)).toBeLessThanOrEqual(1)
  })

  it('matches high E to last string', () => {
    const m = matchToPreset(329.63, guitar)
    expect(m.stringIndex).toBe(5)
    expect(m.target?.name).toBe('E4')
  })

  it('matches A (110Hz) to second string', () => {
    const m = matchToPreset(110, guitar)
    expect(m.stringIndex).toBe(1)
    expect(m.target?.name).toBe('A2')
  })

  it('reports cents deviation when slightly out of tune', () => {
    const m = matchToPreset(115, guitar)
    expect(m.stringIndex).toBe(1)
    expect(m.cents).toBeGreaterThan(0)
  })

  it('chromatic preset returns nearest note rather than string index', () => {
    const chromatic = getTuning('chromatic')
    const m = matchToPreset(440, chromatic)
    expect(m.stringIndex).toBe(-1)
    expect(m.target?.name).toBe('A4')
    expect(m.cents).toBe(0)
  })
})
