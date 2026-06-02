// @vitest-environment happy-dom
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useTunerStore } from '../state/useTunerStore'
import { NoteDisplay } from './NoteDisplay'

function resetStore() {
  useTunerStore.setState({
    status: 'idle',
    errorMessage: null,
    frequency: 0,
    clarity: 0,
    rms: 0,
    reading: null,
    match: null,
    smoothedCents: 0,
    lastUpdate: 0,
  })
}

describe('NoteDisplay', () => {
  beforeEach(resetStore)

  it('shows placeholder when there is no reading', () => {
    render(<NoteDisplay />)
    expect(screen.getByText('—')).toBeTruthy()
    expect(screen.getByText('aguardando som')).toBeTruthy()
  })

  it('renders note, octave, frequency and target name when reading is present', () => {
    useTunerStore.setState({
      frequency: 440,
      reading: { note: 'A', octave: 4, midi: 69, cents: 0, exactFrequency: 440 },
      match: { target: { name: 'A4', frequency: 440 }, cents: 0, stringIndex: -1 },
      smoothedCents: 0,
    })
    render(<NoteDisplay />)
    expect(screen.getByText('A')).toBeTruthy()
    expect(screen.getByText('4')).toBeTruthy()
    expect(screen.getByText('440.00 Hz')).toBeTruthy()
    expect(screen.getByText('Alvo A4')).toBeTruthy()
  })

  it('formats positive cents with a + sign', () => {
    useTunerStore.setState({
      frequency: 445,
      reading: { note: 'A', octave: 4, midi: 69, cents: 20, exactFrequency: 440 },
      match: { target: { name: 'A4', frequency: 440 }, cents: 20, stringIndex: -1 },
      smoothedCents: 20,
    })
    render(<NoteDisplay />)
    expect(screen.getByText('+20 cents')).toBeTruthy()
  })

  it('formats negative cents with a minus sign', () => {
    useTunerStore.setState({
      frequency: 435,
      reading: { note: 'A', octave: 4, midi: 69, cents: -20, exactFrequency: 440 },
      match: { target: { name: 'A4', frequency: 440 }, cents: -20, stringIndex: -1 },
      smoothedCents: -20,
    })
    render(<NoteDisplay />)
    expect(screen.getByText('-20 cents')).toBeTruthy()
  })

  it('shows "— Hz" while waiting for a reading', () => {
    render(<NoteDisplay />)
    expect(screen.getByText('— Hz')).toBeTruthy()
  })
})
