'use client'

import Image from 'next/image'
import { useState } from 'react'
import { ChevronLeft, ChevronRight, Pickaxe } from 'lucide-react'
import type { Character } from '@/lib/game/characters'
import { cn } from '@/lib/utils'

const STAT_ROWS: { key: 'digPower' | 'speed' | 'cargo' | 'lampRadius'; label: string; max: number }[] = [
  { key: 'digPower', label: 'Dig power', max: 1.5 },
  { key: 'speed', label: 'Speed', max: 1.3 },
  { key: 'cargo', label: 'Cargo', max: 20 },
  { key: 'lampRadius', label: 'Lamp', max: 6.5 },
]

export function CharacterSelect({
  characters,
  onStart,
}: {
  characters: Character[]
  onStart: (c: Character) => void
}) {
  const [index, setIndex] = useState(0)
  const selected = characters[index]
  const step = (d: number) => setIndex((i) => (i + d + characters.length) % characters.length)

  return (
    <main className="relative min-h-dvh overflow-hidden bg-background">
      <Image
        src="/backdrop-mine.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover opacity-30"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/85 to-background" aria-hidden="true" />

      <div className="relative mx-auto flex min-h-dvh w-full max-w-5xl flex-col gap-5 px-4 py-5 md:justify-center md:gap-8 md:px-8">
        <header className="flex items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <p className="font-display text-xs font-semibold uppercase tracking-[0.3em] text-primary">Zesto</p>
            <h1 className="font-display text-3xl font-bold leading-none tracking-tight text-balance md:text-5xl">Deep Dig</h1>
          </div>
          <p className="font-display text-xs uppercase tracking-widest text-muted-foreground">Choose your miner</p>
        </header>

        <div className="flex flex-col gap-5 md:flex-row md:items-stretch md:gap-8">
          <section aria-label={`${selected.name}, ${selected.title}`} className="relative overflow-hidden rounded-2xl border bg-card md:w-1/2">
            <div className="relative aspect-[4/3] md:aspect-square">
              {characters.map((c, i) => (
                <Image
                  key={c.id}
                  src={c.portrait || '/placeholder.svg'}
                  alt={`${c.name}, ${c.title}`}
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  priority={i === 0}
                  className={cn(
                    'object-cover object-top transition-all duration-500',
                    i === index ? 'scale-100 opacity-100' : 'scale-105 opacity-0',
                  )}
                />
              ))}
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-card via-card/70 to-transparent" aria-hidden="true" />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
                <div className="flex flex-col">
                  <span className="font-display text-xs font-semibold uppercase tracking-[0.25em] text-primary">{selected.title}</span>
                  <span className="font-display text-3xl font-bold leading-tight">{selected.name}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => step(-1)}
                    aria-label="Previous miner"
                    className="flex size-10 items-center justify-center rounded-full border bg-background/60 backdrop-blur transition-colors hover:bg-background"
                  >
                    <ChevronLeft className="size-5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => step(1)}
                    aria-label="Next miner"
                    className="flex size-10 items-center justify-center rounded-full border bg-background/60 backdrop-blur transition-colors hover:bg-background"
                  >
                    <ChevronRight className="size-5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          </section>

          <div className="flex flex-col gap-5 md:w-1/2 md:justify-between">
            <div role="radiogroup" aria-label="Miners" className="grid grid-cols-3 gap-3">
              {characters.map((c, i) => (
                <button
                  key={c.id}
                  type="button"
                  role="radio"
                  aria-checked={i === index}
                  onClick={() => setIndex(i)}
                  className={cn(
                    'group flex flex-col items-center gap-2 rounded-xl border bg-card/70 p-2 transition-all',
                    i === index ? 'border-primary ring-2 ring-primary/30' : 'opacity-70 hover:opacity-100',
                  )}
                >
                  <span className="relative block aspect-square w-full overflow-hidden rounded-lg">
                    <Image src={c.portrait || '/placeholder.svg'} alt="" fill sizes="120px" className="object-cover object-top" />
                  </span>
                  <span className="font-display text-sm font-semibold">{c.name}</span>
                </button>
              ))}
            </div>

            <p className="text-sm leading-relaxed text-muted-foreground text-pretty">{selected.bio}</p>

            <dl className="grid grid-cols-2 gap-x-5 gap-y-3">
              {STAT_ROWS.map((row) => {
                const value = selected.stats[row.key]
                const pct = Math.min(100, (value / row.max) * 100)
                return (
                  <div key={row.key} className="flex flex-col gap-1.5">
                    <div className="flex items-baseline justify-between">
                      <dt className="font-display text-xs uppercase tracking-wider text-muted-foreground">{row.label}</dt>
                      <dd className="font-display text-sm font-semibold tabular-nums">
                        {row.key === 'cargo' ? value : Math.round(pct)}
                      </dd>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                      <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </dl>

            <button
              type="button"
              onClick={() => onStart(selected)}
              className="flex h-14 items-center justify-center gap-3 rounded-xl bg-primary font-display text-lg font-bold uppercase tracking-wider text-primary-foreground shadow-[0_8px_30px_-8px] shadow-primary/60 transition-transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Pickaxe className="size-5" aria-hidden="true" />
              Start digging
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
