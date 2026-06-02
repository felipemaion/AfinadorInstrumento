import { useEffect, useRef, useState } from 'react'
import { playTone } from '../audio/playTone'
import { getTuning } from '../presets/tunings'
import { useTunerStore } from '../state/useTunerStore'

const TONE_DURATION_MS = 1600

export function StringIndicator() {
  const tuningId = useTunerStore((s) => s.tuningId)
  const match = useTunerStore((s) => s.match)
  const frequency = useTunerStore((s) => s.frequency)
  const tuning = getTuning(tuningId)
  const [playingIndex, setPlayingIndex] = useState<number | null>(null)
  const timeoutRef = useRef<number | null>(null)

  useEffect(
    () => () => {
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current)
    },
    [],
  )

  if (tuning.strings.length === 0) return null

  const handlePlay = (index: number, freq: number) => {
    playTone(freq, TONE_DURATION_MS / 1000)
    setPlayingIndex(index)
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current)
    timeoutRef.current = window.setTimeout(() => setPlayingIndex(null), TONE_DURATION_MS)
  }

  return (
    <div className="flex items-center gap-2">
      {tuning.strings.map((s, i) => {
        const active = match?.stringIndex === i && frequency > 0
        const inTune = active && Math.abs(match.cents) < 5
        const playing = playingIndex === i
        return (
          <button
            key={`${s.name}-${i}`}
            onClick={() => handlePlay(i, s.frequency)}
            title={`Tocar ${s.name} (${s.frequency.toFixed(2)} Hz)`}
            className={`flex h-12 w-10 flex-col items-center justify-center rounded-xl border text-xs font-medium transition-all duration-200 active:scale-95 ${
              playing
                ? 'border-sky-400/70 bg-sky-400/15 text-sky-100 shadow-[0_0_24px_rgba(56,189,248,0.55)]'
                : inTune
                  ? 'border-emerald-400/60 bg-emerald-400/15 text-emerald-200 shadow-[0_0_20px_rgba(52,211,153,0.4)]'
                  : active
                    ? 'border-amber-400/50 bg-amber-400/10 text-amber-200'
                    : 'border-white/10 bg-white/5 text-white/50 hover:border-white/30 hover:bg-white/10 hover:text-white/80'
            }`}
          >
            <span className="font-display text-sm leading-none">{s.name.replace(/\d/, '')}</span>
            <span className="mt-0.5 text-[9px] text-white/40">{s.name.match(/\d/)?.[0]}</span>
          </button>
        )
      })}
    </div>
  )
}
