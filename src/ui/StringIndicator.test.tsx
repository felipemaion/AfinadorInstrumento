// @vitest-environment happy-dom
import { act, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { playTone } from '../audio/playTone'
import { useTunerStore } from '../state/useTunerStore'
import { StringIndicator } from './StringIndicator'

vi.mock('../audio/playTone', () => ({
  playTone: vi.fn(),
}))

describe('StringIndicator', () => {
  beforeEach(() => {
    vi.mocked(playTone).mockClear()
    useTunerStore.setState({
      tuningId: 'guitar-standard',
      match: null,
      frequency: 0,
    })
  })

  it('renders one button per string of the active tuning', () => {
    render(<StringIndicator />)
    expect(screen.getAllByRole('button')).toHaveLength(6)
  })

  it('renders nothing for the chromatic preset (no fixed strings)', () => {
    useTunerStore.setState({ tuningId: 'chromatic' })
    const { container } = render(<StringIndicator />)
    expect(container.firstChild).toBeNull()
  })

  it('clicking a string calls playTone with the right frequency', () => {
    render(<StringIndicator />)
    const buttons = screen.getAllByRole('button')
    fireEvent.click(buttons[0]) // E2 = 82.41 Hz
    expect(playTone).toHaveBeenCalledWith(82.41, expect.any(Number))
  })

  it('exposes the frequency in the title tooltip', () => {
    render(<StringIndicator />)
    const firstString = screen.getAllByRole('button')[0]
    expect(firstString.getAttribute('title')).toBe('Tocar E2 (82.41 Hz)')
  })

  it('reacts to tuning changes (e.g. bass-4 has 4 strings)', () => {
    render(<StringIndicator />)
    expect(screen.getAllByRole('button')).toHaveLength(6)
    act(() => {
      useTunerStore.setState({ tuningId: 'bass-4' })
    })
    expect(screen.getAllByRole('button')).toHaveLength(4)
  })

  it('clicking different strings sends each frequency to playTone', () => {
    render(<StringIndicator />)
    const buttons = screen.getAllByRole('button')
    fireEvent.click(buttons[0]) // E2
    fireEvent.click(buttons[5]) // E4
    expect(playTone).toHaveBeenNthCalledWith(1, 82.41, expect.any(Number))
    expect(playTone).toHaveBeenNthCalledWith(2, 329.63, expect.any(Number))
  })
})
