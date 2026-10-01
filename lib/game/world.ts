export const TILE = {
  AIR: 0,
  GRASS: 1,
  DIRT: 2,
  CLAY: 3,
  STONE: 4,
  BEDROCK: 5,
  COAL: 6,
  COPPER: 7,
  GOLD: 8,
  EMERALD: 9,
  RUBY: 10,
  DIAMOND: 11,
  PLANK: 12,
} as const

export interface TileInfo {
  name: string
  hardness: number
  value: number
  base: string
  light: string
  dark: string
  breakable: boolean
  ore?: { color: string; highlight: string; host: 'dirt' | 'stone' }
}

export const TILE_INFO: Record<number, TileInfo> = {
  [TILE.GRASS]: { name: 'Grass', hardness: 0.35, value: 0, base: '#6B4A2E', light: '#86603D', dark: '#4E3520', breakable: true },
  [TILE.DIRT]: { name: 'Dirt', hardness: 0.4, value: 0, base: '#6B4A2E', light: '#86603D', dark: '#4E3520', breakable: true },
  [TILE.CLAY]: { name: 'Clay', hardness: 0.6, value: 0, base: '#7A4E36', light: '#956449', dark: '#5A3826', breakable: true },
  [TILE.STONE]: { name: 'Stone', hardness: 0.95, value: 0, base: '#4F5560', light: '#676E7A', dark: '#383C45', breakable: true },
  [TILE.BEDROCK]: { name: 'Bedrock', hardness: 999, value: 0, base: '#1F2229', light: '#2C3039', dark: '#14161B', breakable: false },
  [TILE.PLANK]: { name: 'Plank', hardness: 999, value: 0, base: '#8A5A33', light: '#A9764A', dark: '#5E3C22', breakable: false },
  [TILE.COAL]: { name: 'Coal', hardness: 0.55, value: 5, base: '#6B4A2E', light: '#86603D', dark: '#4E3520', breakable: true, ore: { color: '#22232A', highlight: '#5A5D68', host: 'dirt' } },
  [TILE.COPPER]: { name: 'Copper', hardness: 0.7, value: 12, base: '#7A4E36', light: '#956449', dark: '#5A3826', breakable: true, ore: { color: '#D9783A', highlight: '#F6B07A', host: 'dirt' } },
  [TILE.GOLD]: { name: 'Gold', hardness: 1.0, value: 30, base: '#4F5560', light: '#676E7A', dark: '#383C45', breakable: true, ore: { color: '#F2B13B', highlight: '#FFE7A3', host: 'stone' } },
  [TILE.EMERALD]: { name: 'Emerald', hardness: 1.15, value: 70, base: '#4F5560', light: '#676E7A', dark: '#383C45', breakable: true, ore: { color: '#2FBF71', highlight: '#A8F5C8', host: 'stone' } },
  [TILE.RUBY]: { name: 'Ruby', hardness: 1.3, value: 140, base: '#4F5560', light: '#676E7A', dark: '#383C45', breakable: true, ore: { color: '#E0344B', highlight: '#FFA3AF', host: 'stone' } },
  [TILE.DIAMOND]: { name: 'Diamond', hardness: 1.5, value: 300, base: '#4F5560', light: '#676E7A', dark: '#383C45', breakable: true, ore: { color: '#4FD1C5', highlight: '#E6FFFC', host: 'stone' } },
}

export const ORE_TILES = [TILE.COAL, TILE.COPPER, TILE.GOLD, TILE.EMERALD, TILE.RUBY, TILE.DIAMOND]

export const WORLD_W = 34
export const WORLD_H = 170
export const SURFACE = 8
export const SPAWN_X = Math.floor(WORLD_W / 2)

export interface World {
  w: number
  h: number
  tiles: Uint8Array
  variant: Uint8Array
}

export const LAYERS = [
  { from: 0, name: 'Topsoil' },
  { from: 14, name: 'Clay Beds' },
  { from: 32, name: 'Stone Halls' },
  { from: 60, name: 'Gem Caverns' },
  { from: 100, name: 'The Abyss' },
]

export function layerName(depth: number) {
  let name = 'Surface'
  if (depth <= 0) return name
  for (const l of LAYERS) if (depth >= l.from) name = l.name
  return name
}

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hash2(x: number, y: number, seed: number) {
  let h = (x * 374761393 + y * 668265263 + seed * 2147483647) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

function valueNoise(x: number, y: number, seed: number) {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const xf = x - xi
  const yf = y - yi
  const s = (t: number) => t * t * (3 - 2 * t)
  const a = hash2(xi, yi, seed)
  const b = hash2(xi + 1, yi, seed)
  const c = hash2(xi, yi + 1, seed)
  const d = hash2(xi + 1, yi + 1, seed)
  const u = s(xf)
  const v = s(yf)
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}

export function generateWorld(seed = Math.floor(Math.random() * 1e9)): World {
  const w = WORLD_W
  const h = WORLD_H
  const tiles = new Uint8Array(w * h)
  const variant = new Uint8Array(w * h)
  const rng = mulberry32(seed)

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x
      variant[i] = Math.floor(rng() * 4)
      if (x === 0 || x === w - 1 || y === h - 1) {
        tiles[i] = TILE.BEDROCK
        continue
      }
      if (y < SURFACE) {
        tiles[i] = TILE.AIR
        continue
      }
      if (y === SURFACE) {
        tiles[i] = TILE.GRASS
        continue
      }
      const depth = y - SURFACE
      const n = valueNoise(x * 0.35, y * 0.35, seed + 7)
      const stoneChance = Math.min(1, Math.max(0, (depth - 18) / 30))
      const clayChance = depth > 8 ? Math.min(0.7, (depth - 8) / 20) : 0
      let t: number = TILE.DIRT
      if (n < stoneChance) t = TILE.STONE
      else if (n < stoneChance + clayChance * (1 - stoneChance)) t = TILE.CLAY
      tiles[i] = t

      const r = rng()
      if (depth >= 100 && r < 0.012) tiles[i] = TILE.DIAMOND
      else if (depth >= 70 && r < 0.028) tiles[i] = TILE.RUBY
      else if (depth >= 45 && r < 0.048) tiles[i] = TILE.EMERALD
      else if (depth >= 22 && r < 0.075) tiles[i] = TILE.GOLD
      else if (depth >= 6 && r < 0.11) tiles[i] = TILE.COPPER
      else if (depth >= 2 && r < 0.16) tiles[i] = TILE.COAL

      if (depth > 10) {
        const cave = valueNoise(x * 0.16, y * 0.11, seed + 99)
        const cave2 = valueNoise(x * 0.3, y * 0.3, seed + 3)
        if (cave * 0.75 + cave2 * 0.25 > 0.7) tiles[i] = TILE.AIR
      }
    }
  }

  for (let dx = -1; dx <= 1; dx++) {
    tiles[SURFACE * w + SPAWN_X + dx] = TILE.PLANK
  }

  return { w, h, tiles, variant }
}

export function tileAt(world: World, x: number, y: number) {
  if (x < 0 || x >= world.w || y >= world.h) return TILE.BEDROCK
  if (y < 0) return TILE.AIR
  return world.tiles[y * world.w + x]
}

export function isSolid(world: World, x: number, y: number) {
  return tileAt(world, x, y) !== TILE.AIR
}
