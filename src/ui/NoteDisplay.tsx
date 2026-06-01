import { useTunerStore } from '../state/useTunerStore'

export function NoteDisplay() {
  const reading = useTunerStore((s) => s.reading)
  const match = useTunerStore((s) => s.match)
  const smoothedCents = useTunerStore((s) => s.smoothedCents)
  const frequency = useTunerStore((s) => s.frequency)

  const noteText = reading ? reading.note : '—'
  const octave = reading?.octave
  const targetName = match?.target?.name ?? ''
  const inTune = Math.abs(smoothedCents) < 5 && frequency > 0

  return (
    <div className="pointer-events-none flex flex-col items-center text-center select-none">
      <div className="text-xs uppercase tracking-[0.3em] text-white/40">
        {targetName ? `Alvo ${targetName}` : 'aguardando som'}
      </div>
      <div className="mt-1 flex items-baseline gap-1 font-display">
        <span
          className={`text-[140px] leading-none font-bold transition-colors duration-200 ${
            inTune ? 'text-emerald-300' : 'text-white'
          }`}
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {noteText}
        </span>
        {octave !== undefined && reading && (
          <span className="text-3xl font-medium text-white/40">{octave}</span>
        )}
      </div>
      <div className="mt-2 font-mono text-sm tabular-nums text-white/50">
        {frequency > 0 ? `${frequency.toFixed(2)} Hz` : '— Hz'}
      </div>
      <div
        className={`mt-1 font-mono text-base tabular-nums transition-colors ${
          inTune ? 'text-emerald-300' : Math.abs(smoothedCents) < 20 ? 'text-amber-300' : 'text-rose-400'
        }`}
      >
        {frequency > 0
          ? `${smoothedCents >= 0 ? '+' : ''}${smoothedCents.toFixed(0)} cents`
          : ' '}
      </div>
    </div>
  )
}
