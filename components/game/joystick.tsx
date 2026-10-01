'use client'

import { useRef, type RefObject } from 'react'
import { cn } from '@/lib/utils'

export function Joystick({
  vector,
  className,
}: {
  vector: RefObject<{ x: number; y: number }>
  className?: string
}) {
  const baseRef = useRef<HTMLDivElement>(null)
  const knobRef = useRef<HTMLDivElement>(null)
  const pointerId = useRef<number | null>(null)

  const update = (clientX: number, clientY: number) => {
    const base = baseRef.current
    const knob = knobRef.current
    if (!base || !knob) return
    const rect = base.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const max = rect.width / 2 - knob.offsetWidth / 4
    let dx = clientX - cx
    let dy = clientY - cy
    const dist = Math.hypot(dx, dy)
    if (dist > max) {
      dx = (dx / dist) * max
      dy = (dy / dist) * max
    }
    knob.style.transform = `translate(${dx}px, ${dy}px)`
    vector.current.x = dx / max
    vector.current.y = dy / max
  }

  const reset = () => {
    pointerId.current = null
    vector.current.x = 0
    vector.current.y = 0
    if (knobRef.current) knobRef.current.style.transform = 'translate(0px, 0px)'
    baseRef.current?.removeAttribute('data-active')
  }

  return (
    <div
      ref={baseRef}
      role="application"
      aria-label="Movement joystick. Push sideways to walk and dig, down to dig down, up to jump."
      className={cn(
        'group relative flex size-36 touch-none select-none items-center justify-center rounded-full border border-foreground/15 bg-background/40 shadow-[inset_0_2px_12px_rgba(0,0,0,0.5)] backdrop-blur-md transition-colors data-[active]:border-primary/50',
        className,
      )}
      onPointerDown={(e) => {
        if (pointerId.current !== null) return
        pointerId.current = e.pointerId
        e.currentTarget.setPointerCapture(e.pointerId)
        e.currentTarget.setAttribute('data-active', '')
        update(e.clientX, e.clientY)
      }}
      onPointerMove={(e) => {
        if (e.pointerId !== pointerId.current) return
        update(e.clientX, e.clientY)
      }}
      onPointerUp={(e) => e.pointerId === pointerId.current && reset()}
      onPointerCancel={(e) => e.pointerId === pointerId.current && reset()}
    >
      <div className="pointer-events-none absolute inset-3 rounded-full border border-dashed border-foreground/10" aria-hidden="true" />
      {(['top-2 left-1/2 -translate-x-1/2 rotate-0', 'bottom-2 left-1/2 -translate-x-1/2 rotate-180', 'left-2 top-1/2 -translate-y-1/2 -rotate-90', 'right-2 top-1/2 -translate-y-1/2 rotate-90'] as const).map((pos) => (
        <span
          key={pos}
          aria-hidden="true"
          className={cn('pointer-events-none absolute size-0 border-x-[5px] border-b-[6px] border-x-transparent border-b-foreground/30', pos)}
        />
      ))}
      <div
        ref={knobRef}
        aria-hidden="true"
        className="pointer-events-none relative size-16 rounded-full border border-primary-foreground/20 bg-primary shadow-[0_6px_20px_-4px] shadow-primary/60 transition-transform duration-75 group-data-[active]:duration-0"
      >
        <div className="absolute inset-2 rounded-full bg-gradient-to-b from-foreground/30 to-transparent" />
      </div>
    </div>
  )
}
