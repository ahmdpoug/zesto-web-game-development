import type { GameState } from './engine'
import type { SpriteSet } from './sprites'
import { SPAWN_X, SURFACE, TILE, TILE_INFO, isSolid, tileAt } from './world'

export interface View {
  width: number
  height: number
  font: string
}

const CRACKS: number[][][] = [
  [
    [0.5, 0.5, 0.28, 0.22],
    [0.5, 0.5, 0.74, 0.34],
  ],
  [
    [0.5, 0.5, 0.42, 0.86],
    [0.28, 0.22, 0.1, 0.3],
    [0.74, 0.34, 0.9, 0.16],
  ],
  [
    [0.42, 0.86, 0.2, 0.92],
    [0.5, 0.5, 0.86, 0.7],
    [0.28, 0.22, 0.34, 0.06],
    [0.5, 0.5, 0.14, 0.58],
  ],
]

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function drawSky(ctx: CanvasRenderingContext2D, view: View, surfY: number, tp: number, camX: number, time: number) {
  if (surfY <= 0) return
  const top = Math.min(surfY, view.height)
  const g = ctx.createLinearGradient(0, surfY - tp * 9, 0, surfY)
  g.addColorStop(0, '#121A2B')
  g.addColorStop(0.55, '#2C3A5A')
  g.addColorStop(0.85, '#8A5E4C')
  g.addColorStop(1, '#D9934E')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, view.width, top)

  ctx.fillStyle = '#FFF4DA'
  for (let i = 0; i < 40; i++) {
    const sx = ((i * 9301 + 49297) % 233280) / 233280
    const sy = ((i * 7919 + 1237) % 10007) / 10007
    const y = surfY - tp * 9 + sy * tp * 5
    if (y > top) continue
    ctx.globalAlpha = 0.25 + 0.35 * Math.abs(Math.sin(time * 0.8 + i))
    const x = (sx * view.width * 1.4 - camX * tp * 0.05) % view.width
    ctx.fillRect(x < 0 ? x + view.width : x, y, Math.max(1, tp * 0.03), Math.max(1, tp * 0.03))
  }
  ctx.globalAlpha = 1

  const sunX = view.width * 0.72 - camX * tp * 0.04
  const sun = ctx.createRadialGradient(sunX, surfY - tp * 0.6, 0, sunX, surfY - tp * 0.6, tp * 3.2)
  sun.addColorStop(0, 'rgba(255,214,150,0.9)')
  sun.addColorStop(0.15, 'rgba(255,190,110,0.55)')
  sun.addColorStop(1, 'rgba(255,170,90,0)')
  ctx.fillStyle = sun
  ctx.fillRect(0, surfY - tp * 4, view.width, tp * 4)

  const layers = [
    { color: '#34405E', parallax: 0.15, height: 2.6, f1: 0.0035, f2: 0.009 },
    { color: '#202A40', parallax: 0.35, height: 1.6, f1: 0.006, f2: 0.017 },
  ]
  for (const l of layers) {
    const p = camX * tp * l.parallax
    ctx.fillStyle = l.color
    ctx.beginPath()
    ctx.moveTo(0, surfY + 1)
    for (let x = 0; x <= view.width + 8; x += 8) {
      const wx = (x + p) / (tp / 48)
      const h = tp * (l.height + Math.sin(wx * l.f1) * 0.8 + Math.sin(wx * l.f2 + 1.3) * 0.35)
      ctx.lineTo(x, surfY - h)
    }
    ctx.lineTo(view.width, surfY + 1)
    ctx.closePath()
    ctx.fill()
  }
}

function drawOutpost(ctx: CanvasRenderingContext2D, ox: number, oy: number, tp: number, font: string, time: number) {
  const baseY = oy + SURFACE * tp
  const leftX = ox + (SPAWN_X - 0.9) * tp
  const rightX = ox + (SPAWN_X + 1.9) * tp
  const postW = tp * 0.14
  ctx.fillStyle = '#5E3C22'
  ctx.fillRect(leftX - postW / 2, baseY - tp * 2.4, postW, tp * 2.4)
  ctx.fillRect(rightX - postW / 2, baseY - tp * 2.4, postW, tp * 2.4)

  const boardY = baseY - tp * 2.45
  ctx.fillStyle = '#3B2A1E'
  ctx.beginPath()
  ctx.roundRect(leftX - tp * 0.2, boardY - tp * 0.05, rightX - leftX + tp * 0.4, tp * 0.72, tp * 0.08)
  ctx.fill()
  ctx.fillStyle = '#8A5A33'
  ctx.beginPath()
  ctx.roundRect(leftX - tp * 0.14, boardY, rightX - leftX + tp * 0.28, tp * 0.6, tp * 0.06)
  ctx.fill()
  ctx.fillStyle = '#F2B13B'
  ctx.font = `700 ${Math.round(tp * 0.3)}px ${font}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('TRADE POST', (leftX + rightX) / 2, boardY + tp * 0.31)

  const lx = rightX + tp * 0.28
  const ly = baseY - tp * 1.5
  ctx.strokeStyle = '#2A2D35'
  ctx.lineWidth = Math.max(1, tp * 0.03)
  ctx.beginPath()
  ctx.moveTo(rightX, ly - tp * 0.25)
  ctx.lineTo(lx, ly - tp * 0.25)
  ctx.lineTo(lx, ly - tp * 0.1)
  ctx.stroke()
  const flicker = 0.85 + Math.sin(time * 9) * 0.05 + Math.sin(time * 23) * 0.04
  const glow = ctx.createRadialGradient(lx, ly + tp * 0.1, 0, lx, ly + tp * 0.1, tp * 1.6 * flicker)
  glow.addColorStop(0, 'rgba(255,200,110,0.55)')
  glow.addColorStop(1, 'rgba(255,170,80,0)')
  ctx.fillStyle = glow
  ctx.fillRect(lx - tp * 2, ly - tp * 1.6, tp * 4, tp * 3.4)
  ctx.fillStyle = '#2A2D35'
  ctx.fillRect(lx - tp * 0.12, ly - tp * 0.1, tp * 0.24, tp * 0.36)
  ctx.fillStyle = '#FFD98A'
  ctx.fillRect(lx - tp * 0.08, ly - tp * 0.04, tp * 0.16, tp * 0.24)

  const cx = ox + (SPAWN_X - 0.6) * tp
  ctx.fillStyle = '#5E3C22'
  ctx.fillRect(cx, baseY - tp * 0.5, tp * 0.55, tp * 0.5)
  ctx.strokeStyle = '#3B2A1E'
  ctx.lineWidth = Math.max(1, tp * 0.04)
  ctx.strokeRect(cx, baseY - tp * 0.5, tp * 0.55, tp * 0.5)
  ctx.beginPath()
  ctx.moveTo(cx, baseY - tp * 0.5)
  ctx.lineTo(cx + tp * 0.55, baseY)
  ctx.stroke()
}

function drawLeg(ctx: CanvasRenderingContext2D, angle: number, color: string, boots: string) {
  ctx.save()
  ctx.translate(0, -36)
  ctx.rotate(angle)
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.roundRect(-6, 0, 12, 29, 5)
  ctx.fill()
  ctx.fillStyle = boots
  ctx.beginPath()
  ctx.roundRect(-7, 25, 19, 11, 4)
  ctx.fill()
  ctx.restore()
}

function drawMiner(ctx: CanvasRenderingContext2D, x: number, y: number, tp: number, s: GameState) {
  const c = s.char.palette
  const u = tp / 100
  const speedRatio = Math.min(1, Math.abs(s.vx) / 3)
  const walk = Math.sin(s.walkPhase)

  ctx.save()
  ctx.translate(x, y)
  if (s.grounded) {
    ctx.fillStyle = 'rgba(0,0,0,0.35)'
    ctx.beginPath()
    ctx.ellipse(0, 0, 26 * u, 5 * u, 0, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.scale(s.facing * u, u)

  const legSwing = s.grounded ? walk * 0.6 * speedRatio : 0.4
  let bob = s.grounded ? -Math.abs(Math.cos(s.walkPhase)) * 2.5 * speedRatio : 0
  if (s.digDir === 'down') bob += 3
  ctx.translate(0, bob)

  let armAngle = 1.15 + walk * 0.25 * speedRatio
  if (s.digDir) {
    const k = Math.pow((1 - Math.cos(s.swing)) / 2, 0.6)
    if (s.digDir === 'side') armAngle = lerp(-1.9, 0.35, k)
    else if (s.digDir === 'down') armAngle = lerp(-1.5, 1.45, k)
    else armAngle = lerp(0.9, -1.6, k)
  } else if (!s.grounded) {
    armAngle = -0.4
  }

  drawLeg(ctx, -legSwing, c.pants, c.boots)

  ctx.save()
  ctx.translate(-4, -60)
  ctx.rotate(1.5 - walk * 0.45 * speedRatio)
  ctx.fillStyle = c.shirtShade
  ctx.beginPath()
  ctx.roundRect(0, -4, 20, 8, 4)
  ctx.fill()
  ctx.fillStyle = c.skin
  ctx.beginPath()
  ctx.arc(21, 0, 4.5, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  ctx.fillStyle = c.shirtShade
  ctx.beginPath()
  ctx.roundRect(-15, -65, 30, 31, 9)
  ctx.fill()
  ctx.fillStyle = c.shirt
  ctx.beginPath()
  ctx.roundRect(-9, -65, 24, 31, 8)
  ctx.fill()
  ctx.strokeStyle = '#3B2A1E'
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.moveTo(-9, -64)
  ctx.lineTo(11, -40)
  ctx.stroke()
  ctx.fillStyle = '#3B2A1E'
  ctx.fillRect(-15, -41, 30, 6)
  ctx.fillStyle = '#F2B13B'
  ctx.fillRect(5, -41, 6, 6)

  drawLeg(ctx, legSwing, c.pants, c.boots)

  ctx.fillStyle = c.skin
  ctx.beginPath()
  ctx.arc(3, -74, 13, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = c.hair
  ctx.beginPath()
  ctx.arc(-6, -74, 7, Math.PI * 0.5, Math.PI * 1.5)
  ctx.fill()
  ctx.fillStyle = 'rgba(0,0,0,0.15)'
  ctx.beginPath()
  ctx.arc(-2, -72, 3.2, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = c.skin
  ctx.beginPath()
  ctx.arc(15, -71, 3.4, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#1A1206'
  ctx.beginPath()
  ctx.arc(9.5, -75, 2.2, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#FFFFFF'
  ctx.beginPath()
  ctx.arc(10.2, -75.8, 0.8, 0, Math.PI * 2)
  ctx.fill()

  if (s.char.beard) {
    ctx.fillStyle = c.hair
    ctx.beginPath()
    ctx.moveTo(-6, -73)
    ctx.quadraticCurveTo(-6, -58, 4, -55)
    ctx.quadraticCurveTo(14, -56, 17, -66)
    ctx.quadraticCurveTo(10, -63, 4, -66)
    ctx.closePath()
    ctx.fill()
  } else {
    ctx.strokeStyle = 'rgba(26,18,6,0.7)'
    ctx.lineWidth = 1.6
    ctx.beginPath()
    ctx.moveTo(8, -66)
    ctx.quadraticCurveTo(11, -64.5, 14, -66)
    ctx.stroke()
  }

  ctx.fillStyle = c.helmet
  ctx.beginPath()
  ctx.ellipse(3, -80, 16, 13, 0, Math.PI, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = 'rgba(255,255,255,0.25)'
  ctx.beginPath()
  ctx.ellipse(-1, -87, 7, 3, -0.3, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = c.helmetShade
  ctx.fillRect(1, -93, 4, 13)
  ctx.beginPath()
  ctx.roundRect(-15, -81, 37, 5, 2.5)
  ctx.fill()
  ctx.fillStyle = '#2A2D35'
  ctx.beginPath()
  ctx.roundRect(13, -91, 8, 8, 2)
  ctx.fill()
  ctx.fillStyle = '#FFF2C2'
  ctx.beginPath()
  ctx.arc(19.5, -87, 3.2, 0, Math.PI * 2)
  ctx.fill()

  ctx.save()
  ctx.translate(5, -60)
  ctx.rotate(armAngle)
  ctx.fillStyle = '#6B4423'
  ctx.beginPath()
  ctx.roundRect(12, -2.5, 44, 5, 2.5)
  ctx.fill()
  ctx.fillStyle = '#3A3F4B'
  ctx.fillRect(51, -5, 8, 10)
  ctx.fillStyle = c.pick
  ctx.strokeStyle = 'rgba(0,0,0,0.45)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(49, -24)
  ctx.quadraticCurveTo(63, -9, 61, 0)
  ctx.quadraticCurveTo(63, 9, 49, 24)
  ctx.quadraticCurveTo(57, 9, 55, 0)
  ctx.quadraticCurveTo(57, -9, 49, -24)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = c.shirt
  ctx.beginPath()
  ctx.roundRect(0, -4.5, 20, 9, 4.5)
  ctx.fill()
  ctx.fillStyle = c.skin
  ctx.beginPath()
  ctx.arc(20, 0, 5.2, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  ctx.restore()
}

function drawSparkle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, alpha: number) {
  ctx.globalAlpha = alpha
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(x, y - r)
  ctx.lineTo(x + r * 0.22, y - r * 0.22)
  ctx.lineTo(x + r, y)
  ctx.lineTo(x + r * 0.22, y + r * 0.22)
  ctx.lineTo(x, y + r)
  ctx.lineTo(x - r * 0.22, y + r * 0.22)
  ctx.lineTo(x - r, y)
  ctx.lineTo(x - r * 0.22, y - r * 0.22)
  ctx.closePath()
  ctx.fill()
  ctx.globalAlpha = 1
}

export function render(
  ctx: CanvasRenderingContext2D,
  light: HTMLCanvasElement,
  s: GameState,
  sprites: SpriteSet,
  view: View,
) {
  const { world } = s
  const tp = sprites.size
  const halfW = view.width / 2 / tp
  const halfH = view.height / 2 / tp
  const camX = world.w > halfW * 2 ? Math.min(world.w - halfW, Math.max(halfW, s.camX)) : world.w / 2
  const camY = Math.min(world.h - halfH, Math.max(SURFACE - halfH * 1.1, s.camY))
  const shake = s.shake > 0 ? s.shake * tp * 0.25 : 0
  const ox = Math.round(view.width / 2 - camX * tp + (Math.random() - 0.5) * shake)
  const oy = Math.round(view.height / 2 - camY * tp + (Math.random() - 0.5) * shake)
  const surfY = oy + SURFACE * tp

  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.fillStyle = '#140F0C'
  ctx.fillRect(0, 0, view.width, view.height)
  drawSky(ctx, view, surfY, tp, camX, s.time)

  const x0 = Math.max(0, Math.floor(-ox / tp))
  const x1 = Math.min(world.w - 1, Math.ceil((view.width - ox) / tp))
  const y0 = Math.max(0, Math.floor(-oy / tp))
  const y1 = Math.min(world.h - 1, Math.ceil((view.height - oy) / tp))
  const edge = Math.max(1, Math.round(tp * 0.07))

  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const t = world.tiles[y * world.w + x]
      const sx = ox + x * tp
      const sy = oy + y * tp
      const v = world.variant[y * world.w + x]
      if (t === TILE.AIR) {
        if (y < SURFACE) continue
        const wall = y - SURFACE > 32 ? sprites.wallDeep : sprites.wallShallow
        ctx.drawImage(wall[v], sx, sy)
        if (isSolid(world, x, y - 1) && y > SURFACE) ctx.drawImage(sprites.ao.top, sx, sy)
        if (isSolid(world, x, y + 1)) ctx.drawImage(sprites.ao.bottom, sx, sy)
        if (isSolid(world, x - 1, y)) ctx.drawImage(sprites.ao.left, sx, sy)
        if (isSolid(world, x + 1, y)) ctx.drawImage(sprites.ao.right, sx, sy)
        continue
      }
      let ox2 = 0
      let oy2 = 0
      if (s.dig && s.dig.x === x && s.dig.y === y) {
        const j = tp * 0.035 * s.dig.progress
        ox2 = (Math.random() - 0.5) * j
        oy2 = (Math.random() - 0.5) * j
      }
      ctx.drawImage(sprites.tiles[t][v], sx + ox2, sy + oy2)
      if (y >= SURFACE) {
        if (!isSolid(world, x, y - 1) && t !== TILE.GRASS) {
          ctx.fillStyle = 'rgba(255,240,210,0.14)'
          ctx.fillRect(sx, sy, tp, edge)
        }
        if (!isSolid(world, x, y + 1)) {
          ctx.fillStyle = 'rgba(0,0,0,0.4)'
          ctx.fillRect(sx, sy + tp - edge * 1.5, tp, edge * 1.5)
        }
        if (!isSolid(world, x - 1, y)) {
          ctx.fillStyle = 'rgba(0,0,0,0.22)'
          ctx.fillRect(sx, sy, edge, tp)
        }
        if (!isSolid(world, x + 1, y)) {
          ctx.fillStyle = 'rgba(0,0,0,0.22)'
          ctx.fillRect(sx + tp - edge, sy, edge, tp)
        }
      }
    }
  }

  if (s.dig) {
    const sx = ox + s.dig.x * tp
    const sy = oy + s.dig.y * tp
    ctx.fillStyle = `rgba(0,0,0,${0.25 * s.dig.progress})`
    ctx.fillRect(sx, sy, tp, tp)
    const stages = Math.min(CRACKS.length, Math.floor(s.dig.progress * (CRACKS.length + 1)))
    ctx.strokeStyle = 'rgba(10,8,6,0.75)'
    ctx.lineWidth = Math.max(1.5, tp * 0.045)
    ctx.lineCap = 'round'
    ctx.beginPath()
    for (let i = 0; i < stages; i++) {
      for (const [ax, ay, bx, by] of CRACKS[i]) {
        ctx.moveTo(sx + ax * tp, sy + ay * tp)
        ctx.lineTo(sx + bx * tp, sy + by * tp)
      }
    }
    ctx.stroke()
  }

  drawOutpost(ctx, ox, oy, tp, view.font, s.time)

  for (const p of s.particles) {
    if (p.kind !== 'chunk') continue
    ctx.globalAlpha = Math.min(1, p.life / 0.3)
    ctx.fillStyle = p.color
    const size = p.size * tp
    ctx.fillRect(ox + p.x * tp - size / 2, oy + p.y * tp - size / 2, size, size)
  }
  ctx.globalAlpha = 1

  const playerX = ox + s.px * tp
  const playerY = oy + s.py * tp
  drawMiner(ctx, playerX, playerY, tp, s)

  const lctx = light.getContext('2d')!
  if (light.width !== view.width || light.height !== view.height) {
    light.width = view.width
    light.height = view.height
  }
  lctx.globalCompositeOperation = 'source-over'
  lctx.clearRect(0, 0, view.width, view.height)
  const dg = lctx.createLinearGradient(0, surfY + tp, 0, surfY + tp * 22)
  dg.addColorStop(0, 'rgba(6,7,12,0)')
  dg.addColorStop(0.3, 'rgba(6,7,12,0.6)')
  dg.addColorStop(1, 'rgba(6,7,12,0.95)')
  lctx.fillStyle = dg
  lctx.fillRect(0, 0, view.width, view.height)

  const headX = playerX + s.facing * tp * 0.18
  const headY = playerY - tp * 0.8
  const flicker = 1 + Math.sin(s.time * 11) * 0.015 + Math.sin(s.time * 27) * 0.01
  const r = s.char.stats.lampRadius * tp * flicker
  lctx.globalCompositeOperation = 'destination-out'
  const lg = lctx.createRadialGradient(headX, headY, 0, headX, headY, r)
  lg.addColorStop(0, 'rgba(0,0,0,1)')
  lg.addColorStop(0.45, 'rgba(0,0,0,0.85)')
  lg.addColorStop(1, 'rgba(0,0,0,0)')
  lctx.fillStyle = lg
  lctx.fillRect(headX - r, headY - r, r * 2, r * 2)
  const coneX = headX + s.facing * r * 0.45
  const cg = lctx.createRadialGradient(coneX, headY, 0, coneX, headY, r * 0.75)
  cg.addColorStop(0, 'rgba(0,0,0,0.9)')
  cg.addColorStop(1, 'rgba(0,0,0,0)')
  lctx.fillStyle = cg
  lctx.fillRect(coneX - r, headY - r, r * 2, r * 2)
  ctx.drawImage(light, 0, 0)

  ctx.globalCompositeOperation = 'lighter'
  const warm = ctx.createRadialGradient(headX, headY, 0, headX, headY, r * 0.8)
  warm.addColorStop(0, 'rgba(255,190,100,0.12)')
  warm.addColorStop(1, 'rgba(255,190,100,0)')
  ctx.fillStyle = warm
  ctx.fillRect(headX - r, headY - r, r * 2, r * 2)

  const gx0 = Math.max(x0, Math.floor(s.px - 9))
  const gx1 = Math.min(x1, Math.ceil(s.px + 9))
  const gy0 = Math.max(y0, Math.floor(s.py - 9))
  const gy1 = Math.min(y1, Math.ceil(s.py + 9))
  for (let y = gy0; y <= gy1; y++) {
    for (let x = gx0; x <= gx1; x++) {
      const t = tileAt(world, x, y)
      if (t < TILE.GOLD || t > TILE.DIAMOND) continue
      const tw = Math.sin(s.time * 2.4 + x * 7.1 + y * 3.3)
      if (tw < 0.55) continue
      const info = TILE_INFO[t]
      drawSparkle(ctx, ox + (x + 0.35 + (y % 3) * 0.12) * tp, oy + (y + 0.38) * tp, tp * 0.16 * tw, info.ore!.highlight, (tw - 0.55) * 1.8)
    }
  }

  for (const p of s.particles) {
    if (p.kind !== 'spark') continue
    const a = Math.min(1, p.life / 0.4)
    drawSparkle(ctx, ox + p.x * tp, oy + p.y * tp, p.size * tp * 1.6, p.color, a)
  }
  ctx.globalCompositeOperation = 'source-over'

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `700 ${Math.round(tp * 0.34)}px ${view.font}`
  ctx.lineWidth = Math.max(2, tp * 0.07)
  ctx.strokeStyle = 'rgba(10,10,14,0.85)'
  for (const t of s.texts) {
    ctx.globalAlpha = Math.min(1, t.life / 0.4)
    const tx = ox + t.x * tp
    const ty = oy + t.y * tp
    ctx.strokeText(t.text, tx, ty)
    ctx.fillStyle = t.color
    ctx.fillText(t.text, tx, ty)
  }
  ctx.globalAlpha = 1

  if (s.recallFlash > 0) {
    ctx.fillStyle = `rgba(255,226,170,${s.recallFlash * 0.55})`
    ctx.fillRect(0, 0, view.width, view.height)
  }
}
