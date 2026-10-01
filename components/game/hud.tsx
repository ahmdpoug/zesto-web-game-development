import { Coins, Gauge, Package, Pause } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface HudData {
  coins: number
  depth: number
  maxDepth: number
  layer: string
  cargo: number
  capacity: number
  cargoValue: number
  tilesDug: number
}

export function Hud({ data, onPause }: { data: HudData; onPause: () => void }) {
  const full = data.cargo >= data.capacity
  const pct = (data.cargo / data.capacity) * 100

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-col gap-2 p-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <div className="flex h-10 items-center gap-2 rounded-full border bg-background/70 pl-1.5 pr-4 backdrop-blur-md">
            <span className="flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Coins className="size-4" aria-hidden="true" />
            </span>
            <span className="sr-only">Coins</span>
            <span className="font-display text-lg font-bold tabular-nums">${data.coins.toLocaleString()}</span>
          </div>
          <div className="flex h-10 items-center gap-2 rounded-full border bg-background/70 pl-3 pr-4 backdrop-blur-md">
            <Gauge className="size-4 text-accent" aria-hidden="true" />
            <span className="flex items-baseline gap-1.5">
              <span className="font-display text-lg font-bold tabular-nums">
                {data.depth}
                <span className="text-xs font-semibold text-muted-foreground">m</span>
              </span>
              <span className="hidden font-display text-xs uppercase tracking-wider text-muted-foreground min-[380px]:inline">{data.layer}</span>
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onPause}
          aria-label="Pause game"
          className="pointer-events-auto flex size-10 shrink-0 items-center justify-center rounded-full border bg-background/70 backdrop-blur-md transition-colors hover:bg-background"
        >
          <Pause className="size-4" aria-hidden="true" />
        </button>
      </div>

      <div className="flex w-full max-w-xs items-center gap-3 rounded-xl border bg-background/70 px-3 py-2 backdrop-blur-md">
        <Package className={cn('size-4 shrink-0', full ? 'text-destructive' : 'text-muted-foreground')} aria-hidden="true" />
        <div className="flex flex-1 flex-col gap-1">
          <div className="flex items-baseline justify-between font-display text-xs">
            <span className={cn('uppercase tracking-wider', full ? 'text-destructive' : 'text-muted-foreground')}>
              {full ? 'Cargo full — surface to sell' : 'Cargo'}
            </span>
            <span className="font-semibold tabular-nums">
              {data.cargo}/{data.capacity}
              <span className="text-primary"> · ${data.cargoValue}</span>
            </span>
          </div>
          <div
            className="h-1.5 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-label="Cargo capacity"
            aria-valuemin={0}
            aria-valuemax={data.capacity}
            aria-valuenow={data.cargo}
          >
            <div
              className={cn('h-full rounded-full transition-all duration-300', full ? 'bg-destructive' : 'bg-primary')}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
