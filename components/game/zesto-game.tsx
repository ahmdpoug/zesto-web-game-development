'use client'

import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { useNow } from '@/hooks/use-now'
import { useBalances, useDig, useLeaderboard, usePlayer, useZestoWallet, type DigResult, type DigStage } from '@/hooks/use-zesto'
import { RARITIES, type CharacterId } from '@/lib/zesto/config'
import { sfx } from '@/lib/zesto/sfx'
import { BeachScene, type Spot } from './beach-scene'
import { CharacterSelect } from './character-select'
import { DigBar, type PanelId } from './dig-bar'
import { GuidePanel } from './guide-panel'
import { LeaderboardPanel } from './leaderboard-panel'
import { ProfilePanel } from './profile-panel'
import { RewardReveal } from './reward-reveal'
import { TopHud } from './top-hud'

const INITIAL_SPOTS: Spot[] = [
  { x: 30, y: 66 },
  { x: 52, y: 61 },
  { x: 72, y: 67 },
  { x: 44, y: 70 },
]

function randomSpots(): Spot[] {
  const columns = [24, 42, 60, 78]
  return columns.map((x) => ({
    x: x + Math.round((Math.random() - 0.5) * 10),
    y: 58 + Math.round(Math.random() * 12),
  }))
}

function friendlyError(err: unknown) {
  const message = err instanceof Error ? err.message : String(err)
  if (/user rejected|denied|rejected the request/i.test(message)) return 'Dig cancelled in wallet'
  if (/insufficient funds|gas/i.test(message)) return 'Not enough testnet ETH for gas'
  if (/exceeds balance|transfer amount/i.test(message)) return 'Not enough $ZESTO for a dig'
  return message.length > 140 ? `${message.slice(0, 140)}…` : message
}

export function ZestoGame() {
  const { authenticated, login, address } = useZestoWallet()
  const { data: balances, mutate: refreshBalances } = useBalances(address)
  const { data: playerData, mutate: refreshPlayer } = usePlayer(address)
  const { mutate: refreshBoard } = useLeaderboard()
  const dig = useDig()
  const now = useNow()

  const [chosenCharacter, setChosenCharacter] = useState<CharacterId | null>(null)
  const [selectingCharacter, setSelectingCharacter] = useState(false)
  const [panel, setPanel] = useState<PanelId | null>(null)
  const [nightOverride, setNightOverride] = useState<boolean | null>(null)
  const [muted, setMuted] = useState(false)
  const [spots, setSpots] = useState<Spot[]>(INITIAL_SPOTS)
  const [selectedSpot, setSelectedSpot] = useState(1)
  const [stage, setStage] = useState<DigStage | null>(null)
  const [result, setResult] = useState<DigResult | null>(null)

  const character = chosenCharacter ?? playerData?.player?.character ?? null
  const hour = now ? new Date(now).getHours() : 12
  const night = nightOverride ?? (hour < 6 || hour >= 19)
  const points = playerData?.player?.totalPoints ?? 0
  const play = useCallback((fn: () => void) => !muted && fn(), [muted])

  const handleDig = useCallback(async () => {
    if (!character || stage) return
    play(sfx.tap)
    try {
      const outcome = await dig(character, (next) => {
        setStage(next)
        if (next === 'confirming') play(sfx.dig)
      })
      play(() => sfx.reveal(RARITIES.findIndex((r) => r.id === outcome.rarity.id)))
      setResult(outcome)
      void refreshBalances()
      void refreshPlayer()
      void refreshBoard()
    } catch (err) {
      play(sfx.error)
      toast.error(friendlyError(err))
    } finally {
      setStage(null)
    }
  }, [character, stage, dig, play, refreshBalances, refreshPlayer, refreshBoard])

  const closeReveal = useCallback(() => {
    setResult(null)
    setSpots(randomSpots())
    setSelectedSpot(Math.floor(Math.random() * 4))
  }, [])

  const closePanel = useCallback(() => setPanel(null), [])

  const openPanel = useCallback((id: PanelId) => {
    if (id === 'characters') {
      setSelectingCharacter(true)
      return
    }
    setPanel(id)
  }, [])

  const showSelect = !character || selectingCharacter

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-background">
      <h1 className="sr-only">Zesto Dig — beach treasure hunt</h1>
      <BeachScene
        night={night}
        spots={spots}
        selected={selectedSpot}
        onSelect={(i) => {
          play(sfx.tap)
          setSelectedSpot(i)
        }}
        character={character}
        digging={stage !== null}
        disabled={stage !== null}
      />

      {!showSelect && character ? (
        <>
          <TopHud
            night={night}
            onToggleNight={() => setNightOverride(!night)}
            muted={muted}
            onToggleMute={() => setMuted((m) => !m)}
            points={authenticated ? points : null}
            onOpenProfile={() => setPanel('profile')}
          />
          <DigBar
            character={character}
            points={points}
            connected={authenticated && !!address}
            balance={balances?.zesto ?? null}
            stage={stage}
            onDig={handleDig}
            onConnect={login}
            onOpenPanel={openPanel}
          />
        </>
      ) : null}

      {showSelect ? (
        <CharacterSelect
          initial={character}
          onConfirm={(id) => {
            play(sfx.tap)
            setChosenCharacter(id)
            setSelectingCharacter(false)
          }}
          onCancel={character ? () => setSelectingCharacter(false) : undefined}
        />
      ) : null}

      {panel === 'leaderboard' ? <LeaderboardPanel onClose={closePanel} address={address} /> : null}
      {panel === 'profile' && character ? <ProfilePanel onClose={closePanel} character={character} /> : null}
      {panel === 'guide' ? <GuidePanel onClose={closePanel} /> : null}

      {result ? (
        <RewardReveal
          result={result}
          onClose={closeReveal}
          onDigAgain={() => {
            closeReveal()
            void handleDig()
          }}
        />
      ) : null}
    </main>
  )
}
