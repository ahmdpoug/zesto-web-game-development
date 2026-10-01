import { TILE, TILE_INFO } from './world'

export interface SpriteSet {
  size: number
  tiles: Record<number, HTMLCanvasElement[]>
  wallShallow: HTMLCanvasElement[]
  wallDeep: HTMLCanvasElement[]
  ao: { top: HTMLCanvasElement; bottom: HTMLCanvasElement; left: HTMLCanvasElement; right: HTMLCanvasElement }
}

function makeCanvas(w: number, h = w) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return c
}

function rngFrom(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pebbles(ctx: CanvasRenderingContext2D, s: number, rng: () => number, color: string, count: number, min: number, max: number) {
  ctx.fillStyle = color
  for (let i = 0; i < count; i++) {
    const w = s * (min + rng() * (max - min))
    const h = w * (0.6 + rng() * 0.5)
    const x = rng() * (s - w)
    const y = rng() * (s - h)
    ctx.beginPath()
    ctx.roundRect(x, y, w, h, w * 0.4)
    ctx.fill()
  }
}

function drawEarth(ctx: CanvasRenderingContext2D, s: number, rng: () => number, base: string, light: string, dark: string) {
  ctx.fillStyle = base
  ctx.fillRect(0, 0, s, s)
  pebbles(ctx, s, rng, dark, 9, 0.06, 0.16)
  pebbles(ctx, s, rng, light, 7, 0.05, 0.12)
  ctx.fillStyle = 'rgba(0,0,0,0.12)'
  for (let i = 0; i < 18; i++) ctx.fillRect(rng() * s, rng() * s, s * 0.03, s * 0.03)
}

function drawStone(ctx: CanvasRenderingContext2D, s: number, rng: () => number, base: string, light: string, dark: string) {
  ctx.fillStyle = base
  ctx.fillRect(0, 0, s, s)
  for (let i = 0; i < 4; i++) {
    const cx = rng() * s
    const cy = rng() * s
    const r = s * (0.18 + rng() * 0.22)
    ctx.fillStyle = i % 2 ? light : dark
    ctx.globalAlpha = 0.55
    ctx.beginPath()
    const pts = 5 + Math.floor(rng() * 3)
    for (let p = 0; p < pts; p++) {
      const a = (p / pts) * Math.PI * 2 + rng() * 0.4
      const rr = r * (0.7 + rng() * 0.4)
      const x = cx + Math.cos(a) * rr
      const y = cy + Math.sin(a) * rr
      if (p === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.fill()
  }
  ctx.globalAlpha = 1
  ctx.strokeStyle = 'rgba(0,0,0,0.35)'
  ctx.lineWidth = Math.max(1, s * 0.025)
  ctx.beginPath()
  let x = rng() * s
  let y = 0
  ctx.moveTo(x, y)
  for (let i = 0; i < 4; i++) {
    x += (rng() - 0.5) * s * 0.4
    y += s * 0.25
    ctx.lineTo(x, y)
  }
  ctx.stroke()
}

function drawCrystal(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, angle: number, color: string, highlight: string) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(angle)
  ctx.fillStyle = 'rgba(0,0,0,0.35)'
  ctx.beginPath()
  ctx.moveTo(0, -r * 1.05)
  ctx.lineTo(r * 0.7, 0)
  ctx.lineTo(0, r * 1.05)
  ctx.lineTo(-r * 0.7, 0)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(0, -r)
  ctx.lineTo(r * 0.6, 0)
  ctx.lineTo(0, r)
  ctx.lineTo(-r * 0.6, 0)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = highlight
  ctx.globalAlpha = 0.85
  ctx.beginPath()
  ctx.moveTo(0, -r)
  ctx.lineTo(r * 0.6, 0)
  ctx.lineTo(0, -r * 0.1)
  ctx.closePath()
  ctx.fill()
  ctx.globalAlpha = 1
  ctx.restore()
}

function drawOre(ctx: CanvasRenderingContext2D, s: number, rng: () => number, tile: number) {
  const info = TILE_INFO[tile]
  const ore = info.ore!
  if (ore.host === 'stone') drawStone(ctx, s, rng, info.base, info.light, info.dark)
  else drawEarth(ctx, s, rng, info.base, info.light, info.dark)

  if (tile === TILE.COAL) {
    for (let i = 0; i < 5; i++) {
      const cx = s * (0.2 + rng() * 0.6)
      const cy = s * (0.2 + rng() * 0.6)
      const r = s * (0.08 + rng() * 0.07)
      ctx.fillStyle = ore.color
      ctx.beginPath()
      ctx.roundRect(cx - r, cy - r, r * 2, r * 1.7, r * 0.5)
      ctx.fill()
      ctx.fillStyle = ore.highlight
      ctx.fillRect(cx - r * 0.5, cy - r * 0.6, r * 0.6, r * 0.25)
    }
    return
  }

  const count = tile === TILE.COPPER ? 6 : 4
  for (let i = 0; i < count; i++) {
    const cx = s * (0.2 + rng() * 0.6)
    const cy = s * (0.2 + rng() * 0.6)
    const r = s * (tile === TILE.COPPER ? 0.08 + rng() * 0.05 : 0.11 + rng() * 0.07)
    drawCrystal(ctx, cx, cy, r, (rng() - 0.5) * 1.2, ore.color, ore.highlight)
  }
}

function drawGrass(ctx: CanvasRenderingContext2D, s: number, rng: () => number) {
  const info = TILE_INFO[TILE.DIRT]
  drawEarth(ctx, s, rng, info.base, info.light, info.dark)
  const band = s * 0.26
  ctx.fillStyle = '#3F6E33'
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(s, 0)
  ctx.lineTo(s, band)
  const steps = 8
  for (let i = steps; i >= 0; i--) {
    const x = (i / steps) * s
    const y = band + (i % 2 ? s * 0.06 : -s * 0.02) + rng() * s * 0.04
    ctx.lineTo(x, y)
  }
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = '#5C9443'
  ctx.fillRect(0, 0, s, s * 0.09)
  ctx.fillStyle = '#7DB85A'
  for (let i = 0; i < 10; i++) ctx.fillRect(rng() * s, s * 0.02, s * 0.03, s * 0.05)
}

function drawPlank(ctx: CanvasRenderingContext2D, s: number, rng: () => number) {
  const info = TILE_INFO[TILE.PLANK]
  ctx.fillStyle = info.base
  ctx.fillRect(0, 0, s, s)
  const rows = 3
  for (let r = 0; r < rows; r++) {
    const y = (r / rows) * s
    ctx.fillStyle = r % 2 ? info.light : info.base
    ctx.fillRect(0, y, s, s / rows)
    ctx.fillStyle = info.dark
    ctx.fillRect(0, y + s / rows - s * 0.03, s, s * 0.03)
    ctx.fillStyle = 'rgba(0,0,0,0.15)'
    for (let g = 0; g < 3; g++) ctx.fillRect(rng() * s, y + s * 0.08 + rng() * s * 0.15, s * 0.3, s * 0.015)
    ctx.fillStyle = '#C9CED6'
    ctx.fillRect(s * 0.08, y + s * 0.13, s * 0.04, s * 0.04)
    ctx.fillRect(s * 0.88, y + s * 0.13, s * 0.04, s * 0.04)
  }
}

function drawBedrock(ctx: CanvasRenderingContext2D, s: number, rng: () => number) {
  const info = TILE_INFO[TILE.BEDROCK]
  drawStone(ctx, s, rng, info.base, info.light, info.dark)
  ctx.strokeStyle = 'rgba(255,255,255,0.05)'
  ctx.lineWidth = Math.max(1, s * 0.03)
  ctx.strokeRect(s * 0.06, s * 0.06, s * 0.88, s * 0.88)
}

function drawWall(ctx: CanvasRenderingContext2D, s: number, rng: () => number, deep: boolean) {
  if (deep) drawStone(ctx, s, rng, '#22252C', '#2B2F37', '#1A1C22')
  else drawEarth(ctx, s, rng, '#33241A', '#3D2C20', '#281B13')
  ctx.fillStyle = 'rgba(0,0,0,0.25)'
  ctx.fillRect(0, 0, s, s)
}

function makeAO(s: number, side: 'top' | 'bottom' | 'left' | 'right') {
  const c = makeCanvas(s)
  const ctx = c.getContext('2d')!
  const d = s * 0.42
  let g: CanvasGradient
  if (side === 'top') g = ctx.createLinearGradient(0, 0, 0, d)
  else if (side === 'bottom') g = ctx.createLinearGradient(0, s, 0, s - d)
  else if (side === 'left') g = ctx.createLinearGradient(0, 0, d, 0)
  else g = ctx.createLinearGradient(s, 0, s - d, 0)
  g.addColorStop(0, 'rgba(0,0,0,0.55)')
  g.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, s, s)
  return c
}

export function createSprites(size: number): SpriteSet {
  const s = Math.max(8, Math.round(size))
  const tiles: Record<number, HTMLCanvasElement[]> = {}
  const ids = Object.keys(TILE_INFO).map(Number)
  for (const id of ids) {
    tiles[id] = []
    for (let v = 0; v < 4; v++) {
      const c = makeCanvas(s)
      const ctx = c.getContext('2d')!
      const rng = rngFrom(id * 97 + v * 13 + 1)
      const info = TILE_INFO[id]
      if (id === TILE.GRASS) drawGrass(ctx, s, rng)
      else if (id === TILE.PLANK) drawPlank(ctx, s, rng)
      else if (id === TILE.BEDROCK) drawBedrock(ctx, s, rng)
      else if (info.ore) drawOre(ctx, s, rng, id)
      else if (id === TILE.STONE) drawStone(ctx, s, rng, info.base, info.light, info.dark)
      else drawEarth(ctx, s, rng, info.base, info.light, info.dark)
      tiles[id].push(c)
    }
  }
  const wallShallow: HTMLCanvasElement[] = []
  const wallDeep: HTMLCanvasElement[] = []
  for (let v = 0; v < 4; v++) {
    const a = makeCanvas(s)
    drawWall(a.getContext('2d')!, s, rngFrom(500 + v), false)
    wallShallow.push(a)
    const b = makeCanvas(s)
    drawWall(b.getContext('2d')!, s, rngFrom(900 + v), true)
    wallDeep.push(b)
  }
  return {
    size: s,
    tiles,
    wallShallow,
    wallDeep,
    ao: { top: makeAO(s, 'top'), bottom: makeAO(s, 'bottom'), left: makeAO(s, 'left'), right: makeAO(s, 'right') },
  }
}
