'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowUpToLine } from 'lucide-react'
import type { Character } from '@/lib/game/characters'
import { cargoValue, createGame, depthOf, recall, update, type GameState } from '@/lib/game/engine'
import { render, type View } from '@/lib/game/render'
import { createSprites, type SpriteSet } from '@/lib/game/sprites'
import { layerName } from '@/lib/game/world'
import { Hud, type HudData } from './hud'
import { Joystick } from './joystick'
import { PauseMenu } from './pause-menu'

const KEY_MAP: Record<string, [number, number]> = {
  ArrowLeft: [-1, 0],
  KeyA: [-1, 0],
  ArrowRight: [1, 0],
  KeyD: [1, 0],
  ArrowDown: [0, 1],
  KeyS: [0, 1],
  ArrowUp: [0, -1],
  KeyW: [0, -1],
}

function readHud(s: GameState): HudData {
  const depth = depthOf(s)
  return {
    coins: s.coins,
    depth,
    maxDepth: s.maxDepth,
    layer: layerName(depth),
    cargo: s.cargo.length,
    capacity: s.char.stats.cargo,
    cargoValue: cargoValue(s),
    tilesDug: s.tilesDug,
  }
}

export function GameScreen({
  character,
  onExit,
  onRestart,
}: {
  character: Character
  onExit: () => void
  onRestart: () => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<GameState | null>(null)
  const joystick = useRef({ x: 0, y: 0 })
  const pausedRef = useRef(false)
  const [paused, setPaused] = useState(false)
  const [hint, setHint] = useState(true)
  const [hud, setHud] = useState<HudData>({
    coins: 0,
    depth: 0,
    maxDepth: 0,
    layer: 'Surface',
    cargo: 0,
    capacity: character.stats.cargo,
    cargoValue: 0,
    tilesDug: 0,
  })

  const setPausedBoth = (p: boolean) => {
    pausedRef.current = p
    setPaused(p)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const state = createGame(character)
    stateRef.current = state
    const light = document.createElement('canvas')
    const keys = new Set<string>()
    const font = getComputedStyle(canvas).fontFamily || 'sans-serif'
    let sprites: SpriteSet | null = null
    let view: View = { width: 0, height: 0, font }
    let lastHud = ''
    let hudTimer = 0
    let raf = 0
    let last = performance.now()

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.max(1, Math.round(rect.width * dpr))
      canvas.height = Math.max(1, Math.round(rect.height * dpr))
      const tileCss = Math.min(64, Math.max(40, Math.min(rect.width / 8, rect.height / 10)))
      const size = Math.round(tileCss * dpr)
      if (!sprites || sprites.size !== size) sprites = createSprites(size)
      view = { width: canvas.width, height: canvas.height, font }
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        setPausedBoth(!pausedRef.current)
        return
      }
      if (KEY_MAP[e.code] || e.code === 'Space') {
        e.preventDefault()
        keys.add(e.code)
      }
      if (e.code === 'KeyR' && !pausedRef.current) recall(state)
    }
    const onKeyUp = (e: KeyboardEvent) => keys.delete(e.code)
    const onBlur = () => keys.clear()
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)

    const frame = (now: number) => {
      const dt = Math.min(1 / 30, (now - last) / 1000)
      last = now
      if (!pausedRef.current) {
        let kx = 0
        let ky = 0
        for (const k of keys) {
          const m = KEY_MAP[k]
          if (m) {
            kx += m[0]
            ky += m[1]
          }
        }
        if (kx !== 0 || ky !== 0) {
          state.input.x = Math.max(-1, Math.min(1, kx))
          state.input.y = Math.max(-1, Math.min(1, ky))
        } else {
          state.input.x = joystick.current.x
          state.input.y = joystick.current.y
        }
        state.jumpHeld = keys.has('Space')
        update(state, dt)

        hudTimer -= dt
        if (hudTimer <= 0) {
          hudTimer = 0.1
          const next = readHud(state)
          const key = JSON.stringify(next)
          if (key !== lastHud) {
            lastHud = key
            setHud(next)
            if (next.tilesDug > 0) setHint(false)
          }
        }
      }
      if (sprites) render(ctx, light, state, sprites, view)
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
    }
  }, [character])

  return (
    <main className="relative h-dvh w-full touch-none select-none overflow-hidden bg-background">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 size-full font-display"
        role="img"
        aria-label={`${character.name} digging underground. ${hud.depth} meters deep with ${hud.cargo} of ${hud.capacity} cargo slots filled.`}
      />

      <Hud data={hud} onPause={() => setPausedBoth(true)} />

      {hint && (
        <div className="pointer-events-none absolute inset-x-0 top-32 flex justify-center px-6 animate-in fade-in duration-500">
          <p className="rounded-full border bg-background/75 px-4 py-2 text-center font-display text-sm backdrop-blur-md text-pretty">
            Push the stick <span className="text-primary">down</span> to dig. Bring ore back to the Trade Post.
            <span className="hidden md:inline"> Keys: WASD / Arrows, Space jump, R recall.</span>
          </p>
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <Joystick vector={joystick} className="pointer-events-auto" />
        <button
          type="button"
          onClick={() => stateRef.current && recall(stateRef.current)}
          className="group pointer-events-auto flex size-20 flex-col items-center justify-center gap-1 rounded-full border border-foreground/15 bg-background/50 font-display text-[11px] font-semibold uppercase tracking-wider shadow-[inset_0_2px_12px_rgba(0,0,0,0.5)] backdrop-blur-md transition-colors hover:border-primary/50 active:bg-primary active:text-primary-foreground"
        >
          <ArrowUpToLine className="size-5 text-primary group-active:text-primary-foreground" aria-hidden="true" />
          Surface
        </button>
      </div>

      {paused && (
        <PauseMenu
          character={character}
          data={hud}
          onResume={() => setPausedBoth(false)}
          onRestart={onRestart}
          onExit={onExit}
        />
      )}
    </main>
  )
}
