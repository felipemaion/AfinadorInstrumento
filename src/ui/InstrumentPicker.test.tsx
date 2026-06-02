// @vitest-environment happy-dom
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { DEFAULT_TUNING_ID } from '../presets/tunings'
import { useTunerStore } from '../state/useTunerStore'
import { InstrumentPicker } from './InstrumentPicker'

describe('InstrumentPicker', () => {
  beforeEach(() => {
    useTunerStore.setState({ tuningId: DEFAULT_TUNING_ID })
  })

  it('shows the current tuning label', () => {
    render(<InstrumentPicker />)
    expect(screen.getByText('Padrão (EADGBE)')).toBeTruthy()
    expect(screen.getByText('Violão / Guitarra')).toBeTruthy()
  })

  it('opens the dropdown on click and reveals other presets', () => {
    render(<InstrumentPicker />)
    expect(screen.queryByText('Soprano (GCEA)')).toBeNull()
    fireEvent.click(screen.getByText('Padrão (EADGBE)'))
    expect(screen.getByText('Soprano (GCEA)')).toBeTruthy()
    expect(screen.getByText('5 cordas (BEADG)')).toBeTruthy()
  })

  it('groups presets by instrument', () => {
    render(<InstrumentPicker />)
    fireEvent.click(screen.getByText('Padrão (EADGBE)'))
    expect(screen.getByText('Baixo')).toBeTruthy()
    expect(screen.getByText('Ukulele')).toBeTruthy()
    expect(screen.getByText('Cavaquinho')).toBeTruthy()
  })

  it('updates the store and closes the dropdown when a preset is selected', () => {
    render(<InstrumentPicker />)
    fireEvent.click(screen.getByText('Padrão (EADGBE)'))
    fireEvent.click(screen.getByText('Drop D (DADGBE)'))

    expect(useTunerStore.getState().tuningId).toBe('guitar-drop-d')
    // dropdown items no longer visible
    expect(screen.queryByText('Soprano (GCEA)')).toBeNull()
  })
})
