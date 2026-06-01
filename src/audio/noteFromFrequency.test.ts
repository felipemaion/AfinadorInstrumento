import { describe, expect, it } from 'vitest'
import { centsBetween, noteFromFrequency } from './noteFromFrequency'

describe('noteFromFrequency', () => {
  it('returns null for invalid frequencies', () => {
    expect(noteFromFrequency(0)).toBeNull()
    expect(noteFromFrequency(-1)).toBeNull()
    expect(noteFromFrequency(NaN)).toBeNull()
    expect(noteFromFrequency(Infinity)).toBeNull()
  })

  it('identifies A4 = 440Hz', () => {
    const r = noteFromFrequency(440)!
    expect(r.note).toBe('A')
    expect(r.octave).toBe(4)
    expect(r.midi).toBe(69)
    expect(r.cents).toBe(0)
  })

  it('identifies guitar low E (E2 ~ 82.41Hz)', () => {
    const r = noteFromFrequency(82.41)!
    expect(r.note).toBe('E')
    expect(r.octave).toBe(2)
    expect(Math.abs(r.cents)).toBeLessThanOrEqual(1)
  })

  it('identifies guitar high E (E4 ~ 329.63Hz)', () => {
    const r = noteFromFrequency(329.63)!
    expect(r.note).toBe('E')
    expect(r.octave).toBe(4)
    expect(Math.abs(r.cents)).toBeLessThanOrEqual(1)
  })

  it('reports positive cents when sharp', () => {
    const r = noteFromFrequency(445)!
    expect(r.note).toBe('A')
    expect(r.cents).toBeGreaterThan(0)
  })

  it('reports negative cents when flat', () => {
    const r = noteFromFrequency(435)!
    expect(r.note).toBe('A')
    expect(r.cents).toBeLessThan(0)
  })

  it('handles low octaves (B0 ~ 30.87Hz)', () => {
    const r = noteFromFrequency(30.87)!
    expect(r.note).toBe('B')
    expect(r.octave).toBe(0)
  })
})

describe('centsBetween', () => {
  it('is zero for identical frequencies', () => {
    expect(centsBetween(440, 440)).toBe(0)
  })

  it('is +100 for one semitone up', () => {
    expect(centsBetween(466.16, 440)).toBe(100)
  })

  it('is -100 for one semitone down', () => {
    expect(centsBetween(415.3, 440)).toBe(-100)
  })

  it('is 0 for invalid inputs', () => {
    expect(centsBetween(0, 440)).toBe(0)
    expect(centsBetween(440, 0)).toBe(0)
  })
})
