import { useEffect, useRef } from 'react'
import { AudioEngine } from '../audio/AudioEngine'
import { matchToPreset } from '../audio/matchToPreset'
import { noteFromFrequency } from '../audio/noteFromFrequency'
import { getTuning } from '../presets/tunings'
import { useTunerStore } from '../state/useTunerStore'
import { InstrumentPicker } from './InstrumentPicker'
import { NoteDisplay } from './NoteDisplay'
import { StringIndicator } from './StringIndicator'
import { WaveformRing } from './visualizations/WaveformRing'

export function Tuner() {
  const status = useTunerStore((s) => s.status)
  const errorMessage = useTunerStore((s) => s.errorMessage)
  const engineRef = useRef<AudioEngine | null>(null)

  useEffect(() => {
    return () => {
      void engineRef.current?.stop()
      engineRef.current = null
    }
  }, [])

  const start = async () => {
    const setStatus = useTunerStore.getState().setStatus
    const pushSample = useTunerStore.getState().pushSample

    setStatus('starting')
    try {
      const engine = new AudioEngine()
      engineRef.current = engine
      engine.subscribe(({ frequency, clarity, rms }) => {
        if (frequency <= 0) {
          pushSample({ frequency: 0, clarity, rms, reading: null, match: null })
          return
        }
        const reading = noteFromFrequency(frequency)
        const tuning = getTuning(useTunerStore.getState().tuningId)
        const match = matchToPreset(frequency, tuning)
        pushSample({ frequency, clarity, rms, reading, match })
      })
      await engine.start()
      setStatus('running')
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setStatus('error', msg)
    }
  }

  return (
    <div className="relative flex h-full w-full flex-col">
      <header className="z-10 flex items-center justify-between px-6 pt-6">
        <div className="flex items-center gap-2 font-display">
          <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
          <span className="text-sm font-medium tracking-wide">afinador</span>
        </div>
        <InstrumentPicker />
        <div className="w-[88px]" />
      </header>

      <main className="relative flex flex-1 items-center justify-center">
        <WaveformRing />
        <div className="relative z-10">
          <NoteDisplay />
        </div>
      </main>

      <footer className="z-10 flex flex-col items-center gap-4 pb-10">
        <StringIndicator />

        {status !== 'running' && (
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={start}
              disabled={status === 'starting'}
              className="rounded-full bg-white px-8 py-3 text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-60"
            >
              {status === 'starting' ? 'Conectando…' : 'Ativar microfone'}
            </button>
            {status === 'error' && (
              <div className="max-w-xs text-center text-xs text-rose-300">
                {errorMessage || 'Não foi possível acessar o microfone.'}
              </div>
            )}
            {status === 'idle' && (
              <div className="max-w-xs text-center text-xs text-white/40">
                Permita o acesso ao microfone e toque uma corda.
              </div>
            )}
          </div>
        )}
      </footer>
    </div>
  )
}
