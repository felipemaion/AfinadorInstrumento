import { useTunerStore } from '../state/useTunerStore'
import { getTuning } from '../presets/tunings'

export function StringIndicator() {
  const tuningId = useTunerStore((s) => s.tuningId)
  const match = useTunerStore((s) => s.match)
  const frequency = useTunerStore((s) => s.frequency)
  const tuning = getTuning(tuningId)

  if (tuning.strings.length === 0) return null

  return (
    <div className="flex items-center gap-2">
      {tuning.strings.map((s, i) => {
        const active = match?.stringIndex === i && frequency > 0
        const inTune = active && Math.abs(match.cents) < 5
        return (
          <div
            key={`${s.name}-${i}`}
            className={`flex h-12 w-10 flex-col items-center justify-center rounded-xl border text-xs font-medium transition-all duration-200 ${
              inTune
                ? 'border-emerald-400/60 bg-emerald-400/15 text-emerald-200 shadow-[0_0_20px_rgba(52,211,153,0.4)]'
                : active
                  ? 'border-amber-400/50 bg-amber-400/10 text-amber-200'
                  : 'border-white/10 bg-white/5 text-white/40'
            }`}
          >
            <span className="font-display text-sm leading-none">{s.name.replace(/\d/, '')}</span>
            <span className="mt-0.5 text-[9px] text-white/40">{s.name.match(/\d/)?.[0]}</span>
          </div>
        )
      })}
    </div>
  )
}
