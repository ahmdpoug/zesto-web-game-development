'use client'

import { BookOpen, Coins, LoaderCircle, Shovel, Trophy, User, Users } from 'lucide-react'
import type { DigStage } from '@/hooks/use-zesto'
import { BUY_URL, CHARACTER_BY_ID, DIG_COST, getLevel, type CharacterId } from '@/lib/zesto/config'
import { cn } from '@/lib/utils'
import { CharacterAvatar } from './character-avatar'

export type PanelId = 'leaderboard' | 'profile' | 'characters' | 'guide'

const STAGE_COPY: Record<DigStage, string> = {
  paying: 'Approve 100 $ZESTO in your wallet…',
  confirming: 'Confirming on Robinhood Chain…',
  revealing: 'Brushing away the sand…',
}

export function DigBar({
  character,
  points,
  connected,
  balance,
  stage,
  onDig,
  onConnect,
  onOpenPanel,
}: {
  character: CharacterId
  points: number
  connected: boolean
  balance: number | null
  stage: DigStage | null
  onDig: () => void
  onConnect: () => void
  onOpenPanel: (panel: PanelId) => void
}) {
  const hero = CHARACTER_BY_ID[character]
  const level = getLevel(points)
  const busy = stage !== null
  const insufficient = connected && balance !== null && balance < DIG_COST

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col items-center gap-2 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-5">
      {stage ? (
        <div role="status" className="glass flex items-center gap-2 rounded-full px-4 py-2 text-sm animate-in fade-in slide-in-from-bottom-2">
          <LoaderCircle className="size-4 animate-spin text-primary" aria-hidden="true" />
          {STAGE_COPY[stage]}
        </div>
      ) : null}

      <nav aria-label="Game menu" className="pointer-events-auto flex items-center gap-1.5">
        <NavChip icon={<Trophy className="size-4" />} label="Ranks" onClick={() => onOpenPanel('leaderboard')} />
        <NavChip icon={<User className="size-4" />} label="Profile" onClick={() => onOpenPanel('profile')} />
        <NavChip icon={<Users className="size-4" />} label="Zestos" onClick={() => onOpenPanel('characters')} />
        <NavChip icon={<BookOpen className="size-4" />} label="Guide" onClick={() => onOpenPanel('guide')} />
      </nav>

      <div className="glass pointer-events-auto flex w-full max-w-xl items-center gap-3 rounded-3xl p-2 pl-2.5">
        <button
          type="button"
          onClick={() => onOpenPanel('profile')}
          className="flex min-w-0 flex-1 items-center gap-2.5 rounded-2xl text-left"
        >
          <CharacterAvatar id={character} size={44} />
          <span className="min-w-0 flex-1">
            <span className="flex items-baseline gap-1.5">
              <span className="truncate font-display text-base font-semibold">{hero.name}</span>
              <span className="shrink-0 text-[11px] font-medium text-primary">Lv {level.level}</span>
            </span>
            <span className="mt-1 block h-1.5 w-full overflow-hidden rounded-full bg-secondary" aria-hidden="true">
              <span
                className="block h-full rounded-full bg-gradient-to-r from-accent to-primary transition-[width] duration-700"
                style={{ width: `${Math.round(level.progress * 100)}%` }}
              />
            </span>
            <span className="mt-1 block truncate text-[10px] text-muted-foreground">
              {level.title}
              {level.next !== null ? ` · ${(level.next - points).toLocaleString()} pts to Lv ${level.level + 1}` : ' · Max level'}
            </span>
          </span>
        </button>

        {!connected ? (
          <DigButton onClick={onConnect} label="Connect" sub="to start digging" />
        ) : insufficient ? (
          <a
            href={BUY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-accent px-4 text-accent-foreground shadow-[0_10px_28px_-10px_#3cc6b8] transition hover:brightness-105 active:scale-95"
          >
            <span className="flex items-center gap-1.5 font-display text-base font-bold">
              <Coins className="size-4" aria-hidden="true" />
              Get $ZESTO
            </span>
            <span className="text-[10px] font-medium opacity-80">{`Need ${DIG_COST} to dig`}</span>
          </a>
        ) : (
          <DigButton onClick={onDig} disabled={busy} busy={busy} label="Dig" sub={`${DIG_COST} $ZESTO`} />
        )}
      </div>
    </div>
  )
}

function DigButton({
  onClick,
  label,
  sub,
  disabled,
  busy,
}: {
  onClick: () => void
  label: string
  sub: string
  disabled?: boolean
  busy?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'relative flex h-14 shrink-0 flex-col items-center justify-center overflow-hidden rounded-2xl px-5 text-primary-foreground transition active:scale-95 disabled:cursor-wait disabled:opacity-80',
        'bg-gradient-to-b from-[#ffc069] to-[#ff8a2a] shadow-[0_10px_28px_-8px_#ff8a2a,inset_0_1px_0_rgb(255_255_255/0.5)] hover:brightness-105',
      )}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 animate-shimmer bg-[linear-gradient(110deg,transparent_35%,rgb(255_255_255/0.35)_50%,transparent_65%)]"
      />
      <span className="relative flex items-center gap-1.5 font-display text-lg font-bold uppercase tracking-wide">
        {busy ? <LoaderCircle className="size-5 animate-spin" aria-hidden="true" /> : <Shovel className="size-5" aria-hidden="true" />}
        {label}
      </span>
      <span className="relative text-[10px] font-semibold opacity-80">{sub}</span>
    </button>
  )
}

function NavChip({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="glass flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition hover:brightness-125 active:scale-95"
    >
      <span aria-hidden="true" className="text-primary">
        {icon}
      </span>
      {label}
    </button>
  )
}
