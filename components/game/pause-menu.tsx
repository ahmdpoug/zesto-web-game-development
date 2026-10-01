import Image from 'next/image'
import { Play, RotateCcw, Users } from 'lucide-react'
import type { Character } from '@/lib/game/characters'
import type { HudData } from './hud'

export function PauseMenu({
  character,
  data,
  onResume,
  onRestart,
  onExit,
}: {
  character: Character
  data: HudData
  onResume: () => void
  onRestart: () => void
  onExit: () => void
}) {
  const stats = [
    { label: 'Coins', value: `$${data.coins.toLocaleString()}` },
    { label: 'Deepest', value: `${data.maxDepth}m` },
    { label: 'Tiles dug', value: data.tilesDug.toLocaleString() },
  ]

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pause-title"
      className="absolute inset-0 z-20 flex items-center justify-center bg-background/70 p-4 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="flex w-full max-w-sm flex-col gap-5 rounded-2xl border bg-card p-5 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3">
          <span className="relative size-14 overflow-hidden rounded-xl border">
            <Image src={character.portrait || '/placeholder.svg'} alt="" fill sizes="56px" className="object-cover object-top" />
          </span>
          <div className="flex flex-col">
            <h2 id="pause-title" className="font-display text-2xl font-bold leading-tight">
              Paused
            </h2>
            <p className="text-sm text-muted-foreground">
              {character.name}, {character.title}
            </p>
          </div>
        </div>

        <dl className="grid grid-cols-3 gap-2">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col gap-0.5 rounded-xl bg-background/60 p-3">
              <dt className="font-display text-[11px] uppercase tracking-wider text-muted-foreground">{s.label}</dt>
              <dd className="font-display text-lg font-bold tabular-nums">{s.value}</dd>
            </div>
          ))}
        </dl>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            autoFocus
            onClick={onResume}
            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-primary font-display font-bold uppercase tracking-wider text-primary-foreground transition-transform hover:-translate-y-0.5"
          >
            <Play className="size-4" aria-hidden="true" />
            Resume
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onRestart}
              className="flex h-11 items-center justify-center gap-2 rounded-xl border bg-background/60 font-display text-sm font-semibold uppercase tracking-wider transition-colors hover:bg-background"
            >
              <RotateCcw className="size-4" aria-hidden="true" />
              New world
            </button>
            <button
              type="button"
              onClick={onExit}
              className="flex h-11 items-center justify-center gap-2 rounded-xl border bg-background/60 font-display text-sm font-semibold uppercase tracking-wider transition-colors hover:bg-background"
            >
              <Users className="size-4" aria-hidden="true" />
              Miners
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
