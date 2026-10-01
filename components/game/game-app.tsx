'use client'

import { useState } from 'react'
import { CHARACTERS, type Character } from '@/lib/game/characters'
import { CharacterSelect } from './character-select'
import { GameScreen } from './game-screen'

export function GameApp() {
  const [character, setCharacter] = useState<Character | null>(null)
  const [runId, setRunId] = useState(0)

  if (!character) {
    return (
      <CharacterSelect
        characters={CHARACTERS}
        onStart={(c) => {
          setCharacter(c)
          setRunId((r) => r + 1)
        }}
      />
    )
  }

  return (
    <GameScreen
      key={runId}
      character={character}
      onExit={() => setCharacter(null)}
      onRestart={() => setRunId((r) => r + 1)}
    />
  )
}
