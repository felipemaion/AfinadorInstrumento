export type StringTarget = {
  name: string
  frequency: number
}

export type Tuning = {
  id: string
  instrument: string
  label: string
  strings: StringTarget[]
}

const note = (name: string, frequency: number): StringTarget => ({ name, frequency })

export const TUNINGS: Tuning[] = [
  {
    id: 'guitar-standard',
    instrument: 'Violão / Guitarra',
    label: 'Padrão (EADGBE)',
    strings: [
      note('E2', 82.41),
      note('A2', 110.0),
      note('D3', 146.83),
      note('G3', 196.0),
      note('B3', 246.94),
      note('E4', 329.63),
    ],
  },
  {
    id: 'guitar-drop-d',
    instrument: 'Violão / Guitarra',
    label: 'Drop D (DADGBE)',
    strings: [
      note('D2', 73.42),
      note('A2', 110.0),
      note('D3', 146.83),
      note('G3', 196.0),
      note('B3', 246.94),
      note('E4', 329.63),
    ],
  },
  {
    id: 'guitar-dadgad',
    instrument: 'Violão / Guitarra',
    label: 'DADGAD',
    strings: [
      note('D2', 73.42),
      note('A2', 110.0),
      note('D3', 146.83),
      note('G3', 196.0),
      note('A3', 220.0),
      note('D4', 293.66),
    ],
  },
  {
    id: 'guitar-open-g',
    instrument: 'Violão / Guitarra',
    label: 'Open G (DGDGBD)',
    strings: [
      note('D2', 73.42),
      note('G2', 98.0),
      note('D3', 146.83),
      note('G3', 196.0),
      note('B3', 246.94),
      note('D4', 293.66),
    ],
  },
  {
    id: 'bass-4',
    instrument: 'Baixo',
    label: '4 cordas (EADG)',
    strings: [
      note('E1', 41.2),
      note('A1', 55.0),
      note('D2', 73.42),
      note('G2', 98.0),
    ],
  },
  {
    id: 'bass-5',
    instrument: 'Baixo',
    label: '5 cordas (BEADG)',
    strings: [
      note('B0', 30.87),
      note('E1', 41.2),
      note('A1', 55.0),
      note('D2', 73.42),
      note('G2', 98.0),
    ],
  },
  {
    id: 'ukulele-soprano',
    instrument: 'Ukulele',
    label: 'Soprano (GCEA)',
    strings: [
      note('G4', 392.0),
      note('C4', 261.63),
      note('E4', 329.63),
      note('A4', 440.0),
    ],
  },
  {
    id: 'cavaco-padrao',
    instrument: 'Cavaquinho',
    label: 'Padrão (DGBD)',
    strings: [
      note('D4', 293.66),
      note('G4', 392.0),
      note('B4', 493.88),
      note('D5', 587.33),
    ],
  },
  {
    id: 'chromatic',
    instrument: 'Cromático',
    label: 'Todas as notas',
    strings: [],
  },
]

export const DEFAULT_TUNING_ID = 'guitar-standard'

export function getTuning(id: string): Tuning {
  return TUNINGS.find((t) => t.id === id) ?? TUNINGS[0]
}
