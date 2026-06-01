import { useMemo, useState } from 'react'
import { TUNINGS } from '../presets/tunings'
import { useTunerStore } from '../state/useTunerStore'

export function InstrumentPicker() {
  const tuningId = useTunerStore((s) => s.tuningId)
  const setTuning = useTunerStore((s) => s.setTuning)
  const [open, setOpen] = useState(false)

  const current = useMemo(() => TUNINGS.find((t) => t.id === tuningId)!, [tuningId])

  const grouped = useMemo(() => {
    const map = new Map<string, typeof TUNINGS>()
    for (const t of TUNINGS) {
      const arr = map.get(t.instrument) ?? []
      arr.push(t)
      map.set(t.instrument, arr)
    }
    return Array.from(map.entries())
  }, [])

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium backdrop-blur-md transition hover:border-white/20 hover:bg-white/10"
      >
        <span className="text-white/60">{current.instrument}</span>
        <span className="text-white">·</span>
        <span>{current.label}</span>
        <svg
          className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 12 12"
          fill="none"
        >
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-1/2 z-20 mt-2 w-72 -translate-x-1/2 overflow-hidden rounded-2xl border border-white/10 bg-black/80 backdrop-blur-xl">
            {grouped.map(([instrument, tunings]) => (
              <div key={instrument} className="border-b border-white/5 last:border-b-0">
                <div className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-white/40">
                  {instrument}
                </div>
                {tunings.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setTuning(t.id)
                      setOpen(false)
                    }}
                    className={`flex w-full items-center justify-between px-4 py-2 text-left text-sm transition hover:bg-white/5 ${
                      t.id === tuningId ? 'text-white' : 'text-white/70'
                    }`}
                  >
                    <span>{t.label}</span>
                    {t.id === tuningId && (
                      <span className="text-xs text-emerald-400">●</span>
                    )}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
