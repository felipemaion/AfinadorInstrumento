# Afinador

Afinador cromático multi-instrumento para o navegador, com visualização criativa em Canvas 2D. Detecta a frequência fundamental captada pelo microfone em tempo real, identifica a nota e mostra o desvio em cents em relação à corda alvo do preset selecionado.

Demo local: `npm run dev` → http://localhost:5173

## Instrumentos e afinações

- **Violão / Guitarra**: Padrão (EADGBE), Drop D, DADGAD, Open G
- **Baixo**: 4 cordas (EADG), 5 cordas (BEADG)
- **Ukulele**: Soprano (GCEA)
- **Cavaquinho**: Padrão (DGBD)
- **Cromático**: detecta qualquer nota

## Como funciona

```
microfone → getUserMedia → AnalyserNode (buffer 2048)
   → pitchy (MPM) → frequência fundamental + clarity
   → noteFromFrequency → { nota, oitava, cents }
   → matchToPreset    → corda-alvo mais próxima
   → store + UI (~60 fps)
```

- **Detecção**: [`pitchy`](https://github.com/ianprime0509/pitchy) (McLeod Pitch Method) rodando na main thread via `AnalyserNode.getFloatTimeDomainData` + `requestAnimationFrame`. Custo por frame < 1 ms.
- **Filtros**: RMS mínimo 0,004 e clarity mínimo 0,85 para descartar silêncio e leituras espúrias.
- **Smoothing**: filtro exponencial (α = 0,35) nos cents para eliminar tremor.
- **Hold visual**: a última nota válida fica visível por 1,8 s após o som decair, evitando que o display "pisque" enquanto você afina.
- **Visualização**: anel de onda senoidal em Canvas 2D que pulsa com o RMS, gira mais rápido com frequências mais altas e fica turbulento quando a corda está desafinada. Cor transita de rosa (desafinado) → âmbar → verde menta (afinado).

## Stack

| Camada | Tecnologia |
|---|---|
| Build | Vite |
| UI | React 18 + TypeScript |
| Áudio | Web Audio API + pitchy |
| Estado | Zustand |
| Estilo | Tailwind CSS |
| Testes | Vitest |

## Comandos

```bash
npm install        # instala dependências
npm run dev        # dev server em http://localhost:5173
npm run build      # build de produção em dist/
npm run preview    # serve o build de produção
npm test           # roda os testes unitários
npm run test:watch # modo watch
```

## Estrutura

```
src/
  audio/
    AudioEngine.ts          # captura mic + loop de detecção
    noteFromFrequency.ts    # f0 → { nota, oitava, cents }
    matchToPreset.ts        # corda-alvo mais próxima no preset
  presets/
    tunings.ts              # presets de afinação
  state/
    useTunerStore.ts        # store Zustand (smoothing + hold)
  ui/
    App.tsx
    Tuner.tsx
    InstrumentPicker.tsx
    NoteDisplay.tsx
    StringIndicator.tsx
    visualizations/
      WaveformRing.tsx
  main.tsx
  index.css
```

## Notas

- `getUserMedia` exige contexto seguro (HTTPS ou `localhost`).
- A análise roda na main thread porque o custo é baixo e simplifica o código; um AudioWorklet só faria sentido se houvesse processamento pesado adicional.
- Suporte testado em Chrome desktop / mobile e Safari iOS.
