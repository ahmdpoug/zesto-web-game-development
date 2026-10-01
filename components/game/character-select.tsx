'use client'

import Image from 'next/image'
import { Check, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { CHARACTERS, POINTS_POOL_PERCENT, type CharacterId } from '@/lib/zesto/config'
import { cn } from '@/lib/utils'

export function CharacterSelect({
  initial,
  onConfirm,
  onCancel,
}: {
  initial: CharacterId | null
  onConfirm: (id: CharacterId) => void
  onCancel?: () => void
}) {
  const [picked, setPicked] = useState<CharacterId>(initial ?? 'blu')
  const hero = CHARACTERS.find((c) => c.id === picked)!

  return (
    <div className="absolute inset-0 z-40 overflow-y-auto bg-[radial-gradient(120%_80%_at_50%_0%,rgb(13_21_36/0.55),rgb(8_12_22/0.92))] backdrop-blur-[3px]">
      <div className="mx-auto flex min-h-full w-full max-w-4xl flex-col px-4 pb-6 pt-6 sm:px-6 sm:pt-12">
        <div className="text-center">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-primary">
            <Sparkles className="size-3.5" aria-hidden="true" />
            {`${POINTS_POOL_PERCENT}% of supply to diggers at TGE`}
          </p>
          <h1 className="mt-3 font-display text-4xl font-bold leading-none tracking-tight sm:text-6xl">
            <span className="bg-gradient-to-b from-[#ffe1b0] to-[#ff9a3c] bg-clip-text text-transparent">ZESTO</span>{' '}
            <span>DIG</span>
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground text-pretty sm:text-base">
            Choose your Zesto. Each one has a lucky perk that boosts the points you earn from the shore.
          </p>
        </div>

        <ul className="mt-5 grid grid-cols-3 gap-2 sm:mt-8 sm:gap-4" role="radiogroup" aria-label="Characters">
          {CHARACTERS.map((c) => {
            const selected = c.id === picked
            return (
              <li key={c.id}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setPicked(c.id)}
                  className={cn(
                    'group relative block w-full overflow-hidden rounded-2xl border-2 text-left transition duration-300',
                    selected ? 'scale-[1.02] border-primary' : 'border-transparent opacity-80 hover:opacity-100',
                  )}
                  style={{ boxShadow: selected ? `0 16px 40px -12px ${c.color}` : undefined }}
                >
                  <span className="relative block aspect-[4/5]">
                    <Image
                      src={c.image || '/placeholder.svg'}
                      alt={`${c.name}, ${c.title}`}
                      fill
                      sizes="(min-width: 640px) 280px, 33vw"
                      className="object-cover transition duration-500 group-hover:scale-105"
                    />
                    <span className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent" />
                    <span className="absolute inset-x-0 bottom-0 p-2 sm:p-3">
                      <span className="block font-display text-sm font-semibold sm:text-xl">{c.name}</span>
                      <span className="hidden text-xs text-white/75 sm:block">{c.title}</span>
                    </span>
                    {selected ? (
                      <span className="absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-full bg-primary text-primary-foreground">
                        <Check className="size-3.5" aria-hidden="true" />
                      </span>
                    ) : null}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>

        <div className="glass sticky bottom-0 mt-5 flex flex-col gap-3 rounded-3xl p-3 sm:mt-8 sm:flex-row sm:items-center sm:p-4">
          <div className="min-w-0 flex-1 px-1">
            <p className="font-display text-lg font-semibold leading-tight">
              {hero.name} <span className="text-sm font-medium text-muted-foreground">{hero.title}</span>
            </p>
            <p className="mt-0.5 text-sm" style={{ color: hero.color }}>
              {hero.perkLabel}
            </p>
          </div>
          <div className="flex gap-2">
            {onCancel ? (
              <button
                type="button"
                onClick={onCancel}
                className="h-12 rounded-2xl bg-secondary px-4 text-sm font-semibold transition hover:bg-secondary/80"
              >
                Cancel
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => onConfirm(picked)}
              className="h-12 flex-1 rounded-2xl bg-gradient-to-b from-[#ffc069] to-[#ff8a2a] px-6 font-display text-base font-bold text-primary-foreground shadow-[0_10px_28px_-8px_#ff8a2a] transition hover:brightness-105 active:scale-95 sm:flex-none"
            >
              {`Hit the beach with ${hero.name}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
