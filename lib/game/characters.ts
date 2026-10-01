export interface CharacterPalette {
  helmet: string
  helmetShade: string
  shirt: string
  shirtShade: string
  pants: string
  skin: string
  hair: string
  boots: string
  pick: string
}

export interface CharacterStats {
  digPower: number
  speed: number
  jump: number
  cargo: number
  lampRadius: number
}

export interface Character {
  id: string
  name: string
  title: string
  bio: string
  portrait: string
  beard: boolean
  palette: CharacterPalette
  stats: CharacterStats
}

export const CHARACTERS: Character[] = [
  {
    id: 'rook',
    name: 'Rook',
    title: 'The Veteran',
    bio: 'Twenty years underground. Balanced in every way and never loses his nerve in the dark.',
    portrait: '/characters/rook.png',
    beard: false,
    palette: {
      helmet: '#F2B13B',
      helmetShade: '#B97D1C',
      shirt: '#2D4A7A',
      shirtShade: '#1E3358',
      pants: '#3A3F4B',
      skin: '#E2A67E',
      hair: '#3B2A1E',
      boots: '#4A3324',
      pick: '#B9C2CC',
    },
    stats: { digPower: 1, speed: 1, jump: 1, cargo: 14, lampRadius: 4.6 },
  },
  {
    id: 'vera',
    name: 'Vera',
    title: 'The Engineer',
    bio: 'Fast on her feet with a high-output headlamp that cuts through the deepest caverns.',
    portrait: '/characters/vera.png',
    beard: false,
    palette: {
      helmet: '#2E8C8A',
      helmetShade: '#1C5F5E',
      shirt: '#2F6E6B',
      shirtShade: '#214E4C',
      pants: '#2A2D35',
      skin: '#8D5A3B',
      hair: '#2A1A12',
      boots: '#5A3A22',
      pick: '#9FE7EA',
    },
    stats: { digPower: 0.85, speed: 1.22, jump: 1.08, cargo: 12, lampRadius: 6 },
  },
  {
    id: 'brick',
    name: 'Brick',
    title: 'The Bruiser',
    bio: 'Swings a double-headed pick that shatters stone. Slow, steady, and hauls the most ore.',
    portrait: '/characters/brick.png',
    beard: true,
    palette: {
      helmet: '#C2412D',
      helmetShade: '#842A1C',
      shirt: '#8A3A26',
      shirtShade: '#5E2618',
      pants: '#4A4A50',
      skin: '#E7B08C',
      hair: '#C8642A',
      boots: '#3B2A1E',
      pick: '#8C96A3',
    },
    stats: { digPower: 1.4, speed: 0.86, jump: 0.94, cargo: 18, lampRadius: 4.2 },
  },
]
