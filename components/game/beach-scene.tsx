'use client'

import Image from 'next/image'
import { Shovel, X } from 'lucide-react'
import { CHARACTER_BY_ID, type CharacterId } from '@/lib/zesto/config'
import { cn } from '@/lib/utils'

export type Spot = { x: number; y: number }

const SPARKLES = Array.from({ length: 22 }, (_, i) => ({
  left: (i * 37.7) % 100,
  top: (i * 13.3) % 46,
  delay: (i * 0.53) % 4,
  size: 2 + (i % 3),
}))

const PARTICLES = Array.from({ length: 14 }, (_, i) => {
  const angle = (i / 14) * Math.PI * 2
  const dist = 40 + (i % 4) * 14
  return {
    dx: `${Math.cos(angle) * dist}px`,
    dy: `${Math.sin(angle) * dist * 0.6 - 30}px`,
    delay: (i % 5) * 0.09,
    size: 4 + (i % 3) * 2,
  }
})

export function BeachScene({
  night,
  spots,
  selected,
  onSelect,
  character,
  digging,
  disabled,
}: {
  night: boolean
  spots: Spot[]
  selected: number
  onSelect: (index: number) => void
  character: CharacterId | null
  digging: boolean
  disabled: boolean
}) {
  const hero = character ? CHARACTER_BY_ID[character] : null
  const active = spots[selected]

  return (
    <div className="absolute inset-0 overflow-hidden" aria-label="Beach dig site">
      <Image
        src="/scenes/beach-sunset.png"
        alt="A sunlit beach at golden hour with a wooden pier and lighthouse"
        fill
        priority
        sizes="100vw"
        className={cn(
          'object-cover object-[62%_50%] transition-opacity duration-1000',
          night ? 'opacity-0' : 'opacity-100',
        )}
      />
      <Image
        src="/scenes/beach-night.png"
        alt="A moonlit beach at night with a glowing lighthouse"
        fill
        sizes="100vw"
        className={cn(
          'object-cover object-[62%_50%] transition-opacity duration-1000',
          night ? 'opacity-100' : 'opacity-0',
        )}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: night
            ? 'radial-gradient(120% 70% at 50% 0%, transparent 40%, rgb(4 8 20 / 0.55) 100%), linear-gradient(to bottom, rgb(5 10 24 / 0.35), transparent 30%, transparent 70%, rgb(5 10 24 / 0.6))'
            : 'radial-gradient(120% 70% at 50% 0%, transparent 45%, rgb(40 16 6 / 0.35) 100%), linear-gradient(to bottom, rgb(20 10 20 / 0.25), transparent 28%, transparent 70%, rgb(30 14 6 / 0.55))',
        }}
      />

      {!night ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-[28%] top-[30%] size-72 -translate-x-1/2 -translate-y-1/2 rounded-full sm:left-[34%] sm:top-[40%]"
          style={{
            background: 'radial-gradient(circle, rgb(255 210 140 / 0.55), transparent 65%)',
            animation: 'sun-breathe 6s ease-in-out infinite',
          }}
        />
      ) : null}

      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {SPARKLES.map((s, i) => (
          <span
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${s.left}%`,
              top: `${s.top}%`,
              width: s.size,
              height: s.size,
              background: night ? '#e8f0ff' : '#fff1d6',
              boxShadow: night ? '0 0 6px #cfe0ff' : '0 0 8px #ffd9a0',
              animation: `twinkle ${3 + (i % 3)}s ease-in-out ${s.delay}s infinite`,
            }}
          />
        ))}
      </div>

      {spots.map((spot, i) => {
        const isSelected = i === selected
        return (
          <button
            key={`${spot.x}-${spot.y}`}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(i)}
            aria-pressed={isSelected}
            aria-label={`Dig spot ${i + 1}${isSelected ? ' (selected)' : ''}`}
            className="group absolute size-16 -translate-x-1/2 -translate-y-1/2 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-default"
            style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
          >
            <span
              aria-hidden="true"
              className="absolute left-1/2 top-1/2 h-5 w-14 rounded-[50%]"
              style={{
                background: 'radial-gradient(ellipse, rgb(90 50 20 / 0.45), transparent 70%)',
                transform: 'translate(-50%, -50%)',
              }}
            />
            <span
              aria-hidden="true"
              className="absolute left-1/2 top-1/2 h-6 w-12 rounded-[50%] border-2"
              style={{
                borderColor: isSelected ? '#ffd28a' : 'rgb(255 236 200 / 0.75)',
                animation: 'ring-out 2.2s ease-out infinite',
              }}
            />
            <span
              aria-hidden="true"
              className="absolute left-1/2 top-1/2"
              style={{
                color: isSelected ? '#fff2d6' : 'rgb(255 236 200 / 0.85)',
                filter: 'drop-shadow(0 0 6px rgb(255 190 110 / 0.9))',
                animation: 'glint 2.2s ease-in-out infinite',
              }}
            >
              <X className="size-6" strokeWidth={3.5} />
            </span>
          </button>
        )
      })}

      {hero && active ? (
        <div
          className="pointer-events-none absolute z-10 transition-[left,top] duration-700 ease-[cubic-bezier(0.3,0.9,0.3,1)]"
          style={{ left: `${active.x}%`, top: `${active.y}%` }}
        >
          <span
            aria-hidden="true"
            className="absolute left-1/2 top-0 h-4 w-16 rounded-[50%] bg-black/50 blur-[3px] sm:w-20"
            style={{ animation: digging ? undefined : 'shadow-pulse 2.6s ease-in-out infinite', transform: 'translateX(-50%)' }}
          />
          <div className={cn('absolute bottom-1 left-1/2 -translate-x-1/2', digging ? '' : 'animate-bob')}>
            <div className={cn('relative', digging && 'animate-dig')}>
              <div
                className="relative size-16 overflow-hidden rounded-full border-[3px] sm:size-20"
                style={{ borderColor: hero.color, boxShadow: `0 10px 24px -8px rgb(0 0 0 / 0.6), 0 0 22px -4px ${hero.color}` }}
              >
                <Image src={hero.image || '/placeholder.svg'} alt={hero.name} fill sizes="160px" className="object-cover object-[50%_35%]" />
              </div>
              <span
                className="absolute -bottom-1 -right-2 grid size-7 place-items-center rounded-full border-2 border-[#fff6ea] bg-primary text-primary-foreground shadow-lg"
                aria-hidden="true"
              >
                <Shovel className="size-3.5" />
              </span>
            </div>
          </div>

          {digging ? (
            <div aria-hidden="true" className="absolute left-0 top-0">
              {PARTICLES.map((p, i) => (
                <span
                  key={i}
                  className="absolute rounded-full"
                  style={
                    {
                      width: p.size,
                      height: p.size,
                      background: i % 2 ? '#e9c896' : '#c99a62',
                      '--dx': p.dx,
                      '--dy': p.dy,
                      animation: `sand-burst 0.7s ease-out ${p.delay}s infinite`,
                    } as React.CSSProperties
                  }
                />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
