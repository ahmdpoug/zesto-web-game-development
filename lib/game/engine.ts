import type { Character } from './characters'
import { SPAWN_X, SURFACE, TILE, TILE_INFO, generateWorld, isSolid, tileAt, type World } from './world'

export const PLAYER_W = 0.62
export const PLAYER_H = 0.86
const GRAVITY = 32
const MAX_FALL = 18
const BASE_SPEED = 4.4

export type DigDir = 'side' | 'down' | 'up' | null

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  max: number
  size: number
  color: string
  kind: 'chunk' | 'spark'
}

export interface FloatText {
  x: number
  y: number
  text: string
  color: string
  life: number
}

export interface GameState {
  world: World
  char: Character
  px: number
  py: number
  vx: number
  vy: number
  grounded: boolean
  facing: 1 | -1
  walkPhase: number
  swing: number
  digDir: DigDir
  dig: { x: number; y: number; progress: number } | null
  dustTimer: number
  cargo: number[]
  coins: number
  maxDepth: number
  tilesDug: number
  particles: Particle[]
  texts: FloatText[]
  shake: number
  time: number
  recallFlash: number
  camX: number
  camY: number
  input: { x: number; y: number }
  jumpHeld: boolean
}

export function createGame(char: Character, seed?: number): GameState {
  return {
    world: generateWorld(seed),
    char,
    px: SPAWN_X + 0.5,
    py: SURFACE,
    vx: 0,
    vy: 0,
    grounded: false,
    facing: 1,
    walkPhase: 0,
    swing: 0,
    digDir: null,
    dig: null,
    dustTimer: 0,
    cargo: [],
    coins: 0,
    maxDepth: 0,
    tilesDug: 0,
    particles: [],
    texts: [],
    shake: 0,
    time: 0,
    recallFlash: 0,
    camX: SPAWN_X + 0.5,
    camY: SURFACE - 1,
    input: { x: 0, y: 0 },
    jumpHeld: false,
  }
}

export function depthOf(state: GameState) {
  return Math.max(0, Math.floor(state.py - SURFACE))
}

export function cargoValue(state: GameState) {
  return state.cargo.reduce((sum, t) => sum + TILE_INFO[t].value, 0)
}

export function recall(state: GameState) {
  state.px = SPAWN_X + 0.5
  state.py = SURFACE
  state.vx = 0
  state.vy = 0
  state.dig = null
  state.recallFlash = 1
}

function spawnBurst(state: GameState, tx: number, ty: number, tile: number) {
  const info = TILE_INFO[tile]
  const colors = [info.base, info.light, info.dark]
  for (let i = 0; i < 16; i++) {
    const a = Math.random() * Math.PI * 2
    const s = 2 + Math.random() * 5
    state.particles.push({
      x: tx + 0.5 + (Math.random() - 0.5) * 0.6,
      y: ty + 0.5 + (Math.random() - 0.5) * 0.6,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s - 3,
      life: 0.6 + Math.random() * 0.5,
      max: 1.1,
      size: 0.06 + Math.random() * 0.1,
      color: colors[i % 3],
      kind: 'chunk',
    })
  }
  if (info.ore) {
    for (let i = 0; i < 14; i++) {
      const a = Math.random() * Math.PI * 2
      const s = 1 + Math.random() * 3
      state.particles.push({
        x: tx + 0.5,
        y: ty + 0.5,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 1.5,
        life: 0.7 + Math.random() * 0.6,
        max: 1.3,
        size: 0.04 + Math.random() * 0.06,
        color: info.ore.highlight,
        kind: 'spark',
      })
    }
  }
}

function spawnDust(state: GameState, tx: number, ty: number, tile: number) {
  const info = TILE_INFO[tile]
  for (let i = 0; i < 3; i++) {
    state.particles.push({
      x: tx + 0.5 + (Math.random() - 0.5) * 0.9,
      y: ty + 0.5 + (Math.random() - 0.5) * 0.9,
      vx: (Math.random() - 0.5) * 3,
      vy: -Math.random() * 3,
      life: 0.35 + Math.random() * 0.25,
      max: 0.6,
      size: 0.04 + Math.random() * 0.05,
      color: i % 2 ? info.light : info.base,
      kind: 'chunk',
    })
  }
}

function breakTile(state: GameState, tx: number, ty: number) {
  const { world } = state
  const tile = tileAt(world, tx, ty)
  const info = TILE_INFO[tile]
  world.tiles[ty * world.w + tx] = TILE.AIR
  state.tilesDug++
  spawnBurst(state, tx, ty, tile)
  state.shake = Math.max(state.shake, info.ore ? 0.16 : 0.08)

  if (info.value > 0) {
    if (state.cargo.length < state.char.stats.cargo) {
      state.cargo.push(tile)
      state.texts.push({ x: tx + 0.5, y: ty + 0.2, text: `+1 ${info.name}`, color: info.ore?.highlight ?? '#fff', life: 1.2 })
    } else {
      state.texts.push({ x: tx + 0.5, y: ty + 0.2, text: 'Cargo full', color: '#FFA3AF', life: 1.2 })
    }
  }
}

function overlapsSolid(world: World, left: number, top: number, right: number, bottom: number) {
  const x0 = Math.floor(left)
  const x1 = Math.floor(right - 1e-4)
  const y0 = Math.floor(top)
  const y1 = Math.floor(bottom - 1e-4)
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      if (isSolid(world, x, y)) return { x, y }
    }
  }
  return null
}

function moveX(state: GameState, dx: number) {
  if (dx === 0) return
  state.px += dx
  const half = PLAYER_W / 2
  const hit = overlapsSolid(state.world, state.px - half, state.py - PLAYER_H, state.px + half, state.py)
  if (hit) {
    state.px = dx > 0 ? hit.x - half - 1e-3 : hit.x + 1 + half + 1e-3
    state.vx = 0
  }
}

function moveY(state: GameState, dy: number) {
  state.grounded = false
  if (dy === 0) {
    const below = overlapsSolid(state.world, state.px - PLAYER_W / 2, state.py, state.px + PLAYER_W / 2, state.py + 0.02)
    state.grounded = !!below
    return
  }
  state.py += dy
  const half = PLAYER_W / 2
  const hit = overlapsSolid(state.world, state.px - half, state.py - PLAYER_H, state.px + half, state.py)
  if (hit) {
    if (dy > 0) {
      state.py = hit.y
      state.grounded = true
    } else {
      state.py = hit.y + 1 + PLAYER_H + 1e-3
    }
    state.vy = 0
  }
}

export function update(state: GameState, dt: number) {
  const { world, char } = state
  const stats = char.stats
  state.time += dt
  const ix = state.input.x
  const iy = state.input.y

  const moveInput = Math.abs(ix) > 0.22 ? ix : 0
  const speed = BASE_SPEED * stats.speed
  state.vx += (moveInput * speed - state.vx) * Math.min(1, dt * 14)
  if (moveInput !== 0) state.facing = moveInput > 0 ? 1 : -1

  let dir: DigDir = null
  if (iy > 0.5 && iy > Math.abs(ix)) dir = 'down'
  else if ((iy < -0.5 && -iy > Math.abs(ix)) || state.jumpHeld) dir = 'up'
  else if (Math.abs(ix) > 0.3) dir = 'side'

  let target: { x: number; y: number } | null = null
  if (dir === 'down' && state.grounded) {
    const tx = Math.floor(state.px)
    const ty = Math.floor(state.py + 0.05)
    state.px += (tx + 0.5 - state.px) * Math.min(1, dt * 12)
    state.vx *= 0.5
    if (isSolid(world, tx, ty)) target = { x: tx, y: ty }
  } else if (dir === 'up') {
    const tx = Math.floor(state.px)
    const ty = Math.floor(state.py - PLAYER_H - 0.05)
    if (isSolid(world, tx, ty)) {
      if (state.grounded) target = { x: tx, y: ty }
    } else if (state.grounded) {
      state.vy = -Math.sqrt(2 * GRAVITY * 1.4 * stats.jump)
      state.grounded = false
    }
  } else if (dir === 'side') {
    const tx = Math.floor(state.px + state.facing * (PLAYER_W / 2 + 0.06))
    const ty = Math.floor(state.py - PLAYER_H * 0.5)
    if (isSolid(world, tx, ty)) target = { x: tx, y: ty }
  }

  const targetTile = target ? tileAt(world, target.x, target.y) : TILE.AIR
  if (target && TILE_INFO[targetTile]?.breakable) {
    if (!state.dig || state.dig.x !== target.x || state.dig.y !== target.y) {
      state.dig = { x: target.x, y: target.y, progress: 0 }
    }
    state.dig.progress += (dt * stats.digPower) / TILE_INFO[targetTile].hardness
    state.digDir = dir
    state.dustTimer -= dt
    if (state.dustTimer <= 0) {
      state.dustTimer = 0.09
      spawnDust(state, target.x, target.y, targetTile)
    }
    if (state.dig.progress >= 1) {
      breakTile(state, target.x, target.y)
      state.dig = null
    }
  } else {
    state.dig = null
    state.digDir = null
  }

  if (state.digDir) {
    state.swing += dt * (5.5 + stats.digPower * 2.5)
  } else {
    state.swing = 0
  }

  state.vy = Math.min(MAX_FALL, state.vy + GRAVITY * dt)
  moveX(state, state.vx * dt)
  moveY(state, state.vy * dt)

  if (state.grounded && Math.abs(state.vx) > 0.2) {
    state.walkPhase += dt * Math.abs(state.vx) * 3.4
  } else if (state.grounded) {
    state.walkPhase += (0 - (state.walkPhase % Math.PI)) * Math.min(1, dt * 8)
  }

  const depth = depthOf(state)
  if (depth > state.maxDepth) state.maxDepth = depth

  if (state.grounded && state.py <= SURFACE + 0.01 && state.cargo.length > 0) {
    const value = cargoValue(state)
    state.coins += value
    state.cargo = []
    state.texts.push({ x: state.px, y: state.py - 1.4, text: `+$${value}`, color: '#F2B13B', life: 1.6 })
    for (let i = 0; i < 24; i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 2
      const s = 2 + Math.random() * 4
      state.particles.push({
        x: state.px,
        y: state.py - 0.6,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 0.8 + Math.random() * 0.6,
        max: 1.4,
        size: 0.05 + Math.random() * 0.05,
        color: i % 2 ? '#F2B13B' : '#FFE7A3',
        kind: 'spark',
      })
    }
  }

  for (let i = state.particles.length - 1; i >= 0; i--) {
    const p = state.particles[i]
    p.life -= dt
    if (p.life <= 0) {
      state.particles.splice(i, 1)
      continue
    }
    if (p.kind === 'chunk') p.vy += GRAVITY * 0.7 * dt
    else {
      p.vy += 2 * dt
      p.vx *= 1 - dt * 2
    }
    p.x += p.vx * dt
    p.y += p.vy * dt
  }
  if (state.particles.length > 400) state.particles.splice(0, state.particles.length - 400)

  for (let i = state.texts.length - 1; i >= 0; i--) {
    const t = state.texts[i]
    t.life -= dt
    t.y -= dt * 0.9
    if (t.life <= 0) state.texts.splice(i, 1)
  }

  state.shake = Math.max(0, state.shake - dt)
  state.recallFlash = Math.max(0, state.recallFlash - dt * 1.8)

  const lerp = Math.min(1, dt * 7)
  state.camX += (state.px - state.camX) * lerp
  state.camY += (state.py - 0.5 - state.camY) * lerp
}
