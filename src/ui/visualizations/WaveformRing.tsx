import { useEffect, useRef } from 'react'
import { useTunerStore } from '../../state/useTunerStore'

const TAU = Math.PI * 2

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function clamp(x: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, x))
}

function tuningColor(cents: number): { r: number; g: number; b: number } {
  // -50 → vermelho, 0 → verde menta, +50 → vermelho
  const t = clamp(Math.abs(cents) / 50, 0, 1)
  if (t < 0.4) {
    const k = t / 0.4
    return {
      r: lerp(52, 251, k),
      g: lerp(211, 191, k),
      b: lerp(153, 36, k),
    }
  }
  const k = (t - 0.4) / 0.6
  return {
    r: lerp(251, 244, k),
    g: lerp(191, 63, k),
    b: lerp(36, 94, k),
  }
}

export function WaveformRing() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number | null>(null)
  const phaseRef = useRef(0)
  const radiusPulseRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    let prev = performance.now()

    const render = () => {
      const now = performance.now()
      const dt = Math.min(64, now - prev) / 1000
      prev = now

      const state = useTunerStore.getState()
      const { frequency, smoothedCents, rms } = state
      const active = frequency > 0

      const w = canvas.clientWidth
      const h = canvas.clientHeight
      const cx = w / 2
      const cy = h / 2

      ctx.clearRect(0, 0, w, h)

      // fundo radial sutil
      const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) / 1.5)
      bg.addColorStop(0, 'rgba(20, 20, 32, 0.5)')
      bg.addColorStop(1, 'rgba(7, 7, 11, 0)')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, w, h)

      const baseRadius = Math.min(w, h) * 0.32
      const targetPulse = active ? clamp(rms * 80, 0, 12) : 0
      radiusPulseRef.current = lerp(radiusPulseRef.current, targetPulse, 0.15)
      const radius = baseRadius + radiusPulseRef.current

      const color = active ? tuningColor(smoothedCents) : { r: 110, g: 110, b: 130 }
      const colorStr = (a: number) => `rgba(${color.r | 0}, ${color.g | 0}, ${color.b | 0}, ${a})`

      // velocidade angular da fase: cresce com frequência percebida
      const speed = active ? 0.6 + Math.log2(Math.max(frequency, 30) / 80) * 0.8 : 0.2
      phaseRef.current += speed * dt

      // distorção da onda baseada em cents (desafinado = onda turbulenta)
      const detune = Math.min(Math.abs(smoothedCents) / 50, 1)
      const waveAmplitude = active ? lerp(2, 18, detune) : 1
      const harmonics = active ? 1 + detune * 1.5 : 0

      // halo externo
      ctx.beginPath()
      const haloGrad = ctx.createRadialGradient(cx, cy, radius * 0.85, cx, cy, radius * 1.6)
      haloGrad.addColorStop(0, colorStr(active ? 0.25 : 0.05))
      haloGrad.addColorStop(1, colorStr(0))
      ctx.fillStyle = haloGrad
      ctx.fillRect(0, 0, w, h)

      // anel principal: onda senoidal seguindo o círculo
      const segments = 240
      ctx.beginPath()
      for (let i = 0; i <= segments; i++) {
        const t = (i / segments) * TAU
        const wave =
          Math.sin(t * 6 + phaseRef.current * 4) * waveAmplitude +
          Math.sin(t * 11 + phaseRef.current * 7) * waveAmplitude * harmonics * 0.4
        const r = radius + wave
        const x = cx + Math.cos(t) * r
        const y = cy + Math.sin(t) * r
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.closePath()
      ctx.lineWidth = 2.5
      ctx.strokeStyle = colorStr(active ? 0.95 : 0.5)
      ctx.shadowBlur = active ? 24 : 0
      ctx.shadowColor = colorStr(0.8)
      ctx.stroke()
      ctx.shadowBlur = 0

      // anel interno sutil (referência perfeitamente circular)
      ctx.beginPath()
      ctx.arc(cx, cy, radius - 14, 0, TAU)
      ctx.strokeStyle = 'rgba(255,255,255,0.04)'
      ctx.lineWidth = 1
      ctx.stroke()

      // marcadores de cents (escala horizontal sob o anel)
      const gaugeY = cy + radius + 56
      const gaugeWidth = Math.min(w * 0.7, 520)
      const gaugeLeft = cx - gaugeWidth / 2
      // trilha
      ctx.fillStyle = 'rgba(255,255,255,0.06)'
      ctx.fillRect(gaugeLeft, gaugeY, gaugeWidth, 2)
      // ticks
      for (let c = -50; c <= 50; c += 10) {
        const x = gaugeLeft + ((c + 50) / 100) * gaugeWidth
        const tall = c === 0
        ctx.fillStyle = tall ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.12)'
        ctx.fillRect(x - 0.5, gaugeY - (tall ? 8 : 4), 1, tall ? 18 : 8)
      }
      // indicador
      if (active) {
        const c = clamp(smoothedCents, -50, 50)
        const x = gaugeLeft + ((c + 50) / 100) * gaugeWidth
        ctx.beginPath()
        ctx.arc(x, gaugeY + 1, 7, 0, TAU)
        ctx.fillStyle = colorStr(1)
        ctx.shadowBlur = 16
        ctx.shadowColor = colorStr(0.9)
        ctx.fill()
        ctx.shadowBlur = 0
      }

      animRef.current = requestAnimationFrame(render)
    }

    animRef.current = requestAnimationFrame(render)

    return () => {
      if (animRef.current !== null) cancelAnimationFrame(animRef.current)
      ro.disconnect()
    }
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
}
